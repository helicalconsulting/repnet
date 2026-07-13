/**
 * Repnex API Service — Real backend integration
 * Handles auth, connections, queries, templates, and organizations
 *
 * Token strategy:
 *   • access_token  – 15 min TTL, stored in memory (window.__repnex_token)
 *   • refresh_token – 7 day TTL, stored in localStorage
 *   • On every 401 we transparently refresh once and retry.
 *   • A background interval re-fetches 2 min before expiry so the user
 *     never hits a 401 during normal usage.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'https://repnex-production.up.railway.app/v1';

const REFRESH_KEY = 'repnex-refresh-token';
// Access token lives only in memory — not localStorage — for XSS safety.
// We fall back to localStorage key for backward-compat with older builds.
const LEGACY_ACCESS_KEY = 'repnex-auth-token';

// ── In-memory token store ─────────────────────────────────────────────

let _accessToken = null;          // in-memory
let _accessExpiresAt = 0;         // unix ms
let _refreshPromise = null;       // dedup concurrent refresh calls

const memGetAccess   = ()      => _accessToken;
const memSetAccess   = (t, exp) => { _accessToken = t; _accessExpiresAt = exp || (Date.now() + 14 * 60 * 1000); };
const memClearAccess = ()      => { _accessToken = null; _accessExpiresAt = 0; };

// ── localStorage helpers ──────────────────────────────────────────────

const ls = () => (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;

const getRefreshToken  = ()  => ls()?.getItem(REFRESH_KEY) ?? null;
const setRefreshToken  = (t) => ls()?.setItem(REFRESH_KEY, t);
const clearRefreshToken= ()  => ls()?.removeItem(REFRESH_KEY);

/** Expose access token to legacy code (e.g., gateway command copy in UI). */
export const getToken = () => _accessToken ?? ls()?.getItem(LEGACY_ACCESS_KEY) ?? null;

const persistLegacy = (t) => ls()?.setItem(LEGACY_ACCESS_KEY, t);
const clearLegacy   = ()  => ls()?.removeItem(LEGACY_ACCESS_KEY);

const clearAll = () => {
  memClearAccess();
  clearRefreshToken();
  clearLegacy();
};

// ── Silent token refresh ──────────────────────────────────────────────

async function silentRefresh() {
  const rt = getRefreshToken();
  if (!rt) return false;

  // Deduplicate: if a refresh is already in flight, wait for it
  if (_refreshPromise) {
    await _refreshPromise;
    return !!_accessToken;
  }

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      const at = data.access_token || data.tokens?.access_token;
      const newRt = data.refresh_token || data.tokens?.refresh_token;
      if (!at) throw new Error('No access token in refresh response');
      // exp: decode from JWT or default to 14 min from now
      const expMs = _jwtExp(at) || (Date.now() + 14 * 60 * 1000);
      memSetAccess(at, expMs);
      persistLegacy(at);
      if (newRt) setRefreshToken(newRt);
      return true;
    } catch {
      // Refresh failed — full logout
      clearAll();
      return false;
    }
  })();

  const result = await _refreshPromise;
  _refreshPromise = null;
  return result;
}

/** Decode JWT exp claim without a library. */
function _jwtExp(jwt) {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Called once on boot to hydrate in-memory token from localStorage. */
function _hydrateFromStorage() {
  const legacy = ls()?.getItem(LEGACY_ACCESS_KEY);
  if (legacy && !_accessToken) {
    const exp = _jwtExp(legacy);
    if (exp && exp > Date.now()) {
      memSetAccess(legacy, exp);
    } else {
      // Expired — clear it so we trigger refresh on next request
      clearLegacy();
    }
  }
}
_hydrateFromStorage();

/** Proactive refresh: 2 min before expiry — keeps session alive indefinitely. */
let _proactiveTimer = null;
function _scheduleProactiveRefresh() {
  if (_proactiveTimer) clearTimeout(_proactiveTimer);
  if (!_accessExpiresAt || !getRefreshToken()) return;
  const msUntilRefresh = _accessExpiresAt - Date.now() - 2 * 60 * 1000; // 2 min early
  if (msUntilRefresh < 0) {
    // Already within the window — refresh now
    silentRefresh().then(_scheduleProactiveRefresh);
    return;
  }
  _proactiveTimer = setTimeout(async () => {
    await silentRefresh();
    _scheduleProactiveRefresh(); // schedule next cycle
  }, msUntilRefresh);
}

// ── Base request helper ───────────────────────────────────────────────

const request = async (path, options = {}, _isRetry = false) => {
  // If access token is expired, proactively refresh before sending
  if (_accessExpiresAt && _accessExpiresAt - Date.now() < 30_000 && !_isRetry) {
    await silentRefresh();
  }

  const headers = new Headers(options.headers || {});
  const token = memGetAccess() ?? ls()?.getItem(LEGACY_ACCESS_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('/') ? `${API_BASE}${path}` : path;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) return { success: true };

  // ── Transparent 401 retry with refresh ───────────────────────────────
  if (response.status === 401 && !_isRetry) {
    const isAuthPath = ['/auth/login', '/auth/register', '/auth/signup', '/auth/accept-invite', '/auth/reset-password', '/auth/mfa/verify', '/auth/google'].includes(path);
    if (!isAuthPath) {
      const refreshed = await silentRefresh();
      if (refreshed) {
        // Retry the original request once with the new token
        return request(path, options, true);
      }
      // Refresh also failed — user must log in again
      clearAll();
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.detail || errData?.error?.message || 'Session expired. Please log in again.');
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errMsg = payload?.error?.message || payload?.error || payload?.detail || 'Request failed.';
    const error = new Error(errMsg);
    if (payload?.history_id) {
      error.historyId = payload.history_id;
    }
    throw error;
  }
  return payload;
};

// ── Helpers to store tokens after login/register ───────────────────────

function _storeTokenPair(data) {
  const at = data.token || data.tokens?.access_token || data.access_token;
  const rt = data.refresh_token || data.tokens?.refresh_token;
  if (at) {
    const exp = _jwtExp(at) || (Date.now() + 14 * 60 * 1000);
    memSetAccess(at, exp);
    persistLegacy(at);
    _scheduleProactiveRefresh();
  }
  if (rt) setRefreshToken(rt);
  return data.user || data;
}

// ── Auth API ──────────────────────────────────────────────────────────

export const authApi = {
  async getSession() {
    if (!memGetAccess() && !ls()?.getItem(LEGACY_ACCESS_KEY)) {
      // No access token — try silent refresh from stored refresh token
      const ok = await silentRefresh();
      if (!ok) return null;
      _scheduleProactiveRefresh();
    }
    try {
      const response = await request('/auth/session');
      _scheduleProactiveRefresh();
      return response.user || response;
    } catch {
      clearAll();
      return null;
    }
  },

  async signIn({ email, password }) {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return _storeTokenPair(response);
  },

  async signUp({ name, company, email, password, otp }) {
    const response = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, company: company || name || email.split('@')[0], email, password, otp }),
    });
    return _storeTokenPair(response);
  },

  async sendOtp({ email }) {
    return request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },


  async getInvite(token) {
    return request(`/auth/invite?token=${encodeURIComponent(token)}`);
  },

  async signOut() {
    try {
      const rt = getRefreshToken();
      if (rt) await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Backend logout failed:', e);
    } finally {
      clearAll();
      if (_proactiveTimer) { clearTimeout(_proactiveTimer); _proactiveTimer = null; }
    }
    return { success: true };
  },

  async signInWithSso({ provider, email }) {
    return request('/auth/sso', {
      method: 'POST',
      body: JSON.stringify({ provider, email }),
    });
  },

  async verifyMfa({ challengeId, code }) {
    const response = await request('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code }),
    });
    return _storeTokenPair(response);
  },

  async resendMfaCode({ challengeId }) {
    return request('/auth/mfa/resend', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId }),
    });
  },

  async signInWithGoogle(idToken) {
    const response = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
    return _storeTokenPair(response);
  },

  /**
   * Accept an organization invitation and activate the account.
   * Token comes from the invite email link (?token=…).
   * On success, the user is automatically signed in (tokens stored).
   */
  async acceptInvite({ token, password }) {
    const response = await request('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return _storeTokenPair(response);
  },

  async forgotPassword({ email }) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword({ token, password }) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async changePassword({ currentPassword, newPassword }) {
    return request('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  getSsoProviders() {
    return [
      { id: 'microsoft-entra', label: 'Microsoft Entra' },
      { id: 'okta', label: 'Okta' },
      { id: 'google', label: 'Google Workspace' },
    ];
  },
};

// ── Organization API ──────────────────────────────────────────────────

export const organizationApi = {
  async getOrganization() {
    const response = await request('/organizations/me');
    return response.organization || response;
  },
  async updateOrganization(payload) {
    return request('/organizations/me', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  async completeOnboarding(payload) {
    return request('/organizations/onboarding', { method: 'POST', body: JSON.stringify(payload) });
  },
  async inviteUser({ email, role }) {
    return request('/organizations/invite', { method: 'POST', body: JSON.stringify({ email, role }) });
  },
  async listMembers() {
    const response = await request('/users');
    return response.users || response;
  },
  async updatePermissions(userId, permissions) {
    return request(`/users/${userId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ module_permissions: permissions }),
    });
  },
  async requestPermission(moduleKey) {
    return request('/users/request-permission', {
      method: 'POST',
      body: JSON.stringify({ module_key: moduleKey }),
    });
  },
  async listPermissionRequests() {
    return request('/users/permission-requests');
  },
  async actOnPermissionRequest(requestId, action) {
    return request(`/users/permission-requests/${requestId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};

// ── Database Connection API ───────────────────────────────────────────

export const databaseApi = {
  async getConnections() {
    const response = await request('/connections');
    return Array.isArray(response) ? response : response.connections || [];
  },
  async listDatabases({ db_type, host, port, username, password, ssl_enabled = false }) {
    const response = await request('/connections/list-databases', {
      method: 'POST',
      body: JSON.stringify({ db_type, host, port: parseInt(port) || 1433, username, password, ssl_enabled }),
    });
    return response.databases || [];
  },
  async testConnection(connectionData) {
    const raw = await request('/connections/test', {
      method: 'POST',
      body: JSON.stringify(connectionData),
    });
    return {
      ok: raw.ok,
      success: raw.ok,
      message: raw.ok
        ? `Connected successfully! Latency: ${raw.latency_ms ?? '?'}ms`
        : raw.error || 'Connection failed',
      latency: raw.latency_ms,
    };
  },
  async addConnection(connectionData) {
    const response = await request('/connections', {
      method: 'POST',
      body: JSON.stringify(connectionData),
    });
    return response.connection || response;
  },
  async deleteConnection(id) {
    return request(`/connections/${id}`, { method: 'DELETE' });
  },
  async syncConnection(id) {
    return request(`/connections/${id}/test`, { method: 'POST' });
  },
  async syncSchema(id) {
    return request(`/connections/${id}/sync-schema`, { method: 'POST' });
  },
  async getTables(id) {
    return request(`/connections/${id}/tables`);
  },
  async getTableColumns(id, tableName) {
    return request(`/connections/${id}/tables/${tableName}`);
  },
  async listGatewayAgents() {
    try {
      const res = await request('/connections/gateway-agents');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  async getAgentToken() {
    const res = await request('/agent/token', { method: 'POST' });
    return res.token;
  },
};

// ── Query / Chat API ──────────────────────────────────────────────────

export const queryApi = {
  async chat({ naturalLanguage, connectionId, sessionId, personalization }) {
    return request('/query/chat', {
      method: 'POST',
      body: JSON.stringify({
        natural_language: naturalLanguage,
        connection_id: connectionId || null,
        session_id: sessionId || null,
        personalization: personalization || null,
      }),
    });
  },
  async execute({ templateId, params, connectionId, sessionId }) {
    return request('/query/execute', {
      method: 'POST',
      body: JSON.stringify({ template_id: templateId, params, connection_id: connectionId, session_id: sessionId || null }),
    });
  },
  async run({ sessionId, naturalLanguage }) {
    return request('/query/run', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, natural_language: naturalLanguage }),
    });
  },
  async getSuggestions(connectionId = null) {
    const url = connectionId ? `/query/suggestions?connection_id=${connectionId}` : '/query/suggestions';
    return request(url);
  },
  async submitFeedback(historyId, { isPositive, category = null, comment = null }) {
    return request(`/query/history/${historyId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        is_positive: isPositive,
        category: category,
        comment: comment,
      }),
    });
  },
};

// ── Report API ────────────────────────────────────────────────────────

export const reportApi = {
  async getReports() {
    const response = await request('/reports');
    return Array.isArray(response) ? response : response.reports || [];
  },
  async getReport(id)         { return request(`/reports/${id}`); },
  async togglePin(id)         { return request(`/reports/${id}/pin`, { method: 'PATCH' }); },
  async updateReport(id, upd) { return request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(upd) }); },
  async deleteReport(id)      { return request(`/reports/${id}`, { method: 'DELETE' }); },
  async saveReport(data)      { return request('/reports', { method: 'POST', body: JSON.stringify(data) }); },
  async runReport(id, cid)    { return request(`/reports/${id}/run`, { method: 'POST', body: JSON.stringify({ connection_id: cid }) }); },
  async searchReports(query)  {
    const response = await request(`/reports?search=${encodeURIComponent(query)}`);
    return Array.isArray(response) ? response : response.reports || [];
  },

  async setSchedule(id, { intervalDays, intervalMinutes, connectionId }) {
    return request(`/reports/${id}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({
        interval_days: intervalDays ?? null,
        interval_minutes: intervalMinutes ?? null,
        connection_id: connectionId ?? null,
      }),
    });
  },

  /** Manually trigger a refresh, save result as a snapshot. Returns SnapshotDetailRead */
  async refreshReport(id, connectionId) {
    return request(`/reports/${id}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ connection_id: connectionId }),
    });
  },

  /** List past snapshots (metadata only, no row data). Returns SnapshotRead[] */
  async getSnapshots(id, limit = 20) {
    const res = await request(`/reports/${id}/snapshots?limit=${limit}`);
    return Array.isArray(res) ? res : [];
  },

  /** Get a single snapshot including full row data. Returns SnapshotDetailRead */
  async getSnapshotDetail(reportId, snapshotId) {
    return request(`/reports/${reportId}/snapshots/${snapshotId}`);
  },
};

// ── AI API ────────────────────────────────────────────────────────────

export const aiApi = {
  async generateReport(prompt) {
    try {
      const result = await queryApi.chat({ naturalLanguage: prompt });
      return {
        success: true, tables: [], sql: result.sql, data: result.rows || [],
        insights: result.summary, reportId: `rep-${Date.now()}`, chartType: 'bar',
        chartConfig: {
          xAxis: result.rows?.[0] ? Object.keys(result.rows[0])[0] : '',
          yAxis: result.rows?.[0] ? [Object.keys(result.rows[0])[1]] : [],
          colors: ['#2563eb', '#60a5fa'], showLegend: true, showGrid: true,
        },
      };
    } catch {
      return { success: false, error: 'Query failed' };
    }
  },
  async getChatHistory()  { return []; },
  async getSuggestions()  {
    return [
      { text: 'Show AP ageing report', icon: '📊' },
      { text: 'List overdue invoices', icon: '⚠️' },
      { text: 'Top customers by revenue', icon: '💰' },
      { text: 'Stock on hand summary', icon: '📦' },
    ];
  },
};

// ── Session API ───────────────────────────────────────────────────────

export const sessionsApi = {
  async list() {
    const response = await request('/sessions');
    return Array.isArray(response) ? response : response.sessions || [];
  },
  async create(data)      { return request('/sessions', { method: 'POST', body: JSON.stringify(data) }); },
  async get(sessionId)    { return request(`/sessions/${sessionId}`); },
  async delete(sessionId) { return request(`/sessions/${sessionId}`, { method: 'DELETE' }); },
  async editTurn(sessionId, turnIndex) {
    return request(`/sessions/${sessionId}/turns/${turnIndex}/edit`, { method: 'POST' });
  },
};

// ── Export API ────────────────────────────────────────────────────────

export const exportApi = {
  async exportCSV(data, filename = 'export.csv') {
    if (!data?.length) return null;
    const headers = Object.keys(data[0]).filter(k => k !== '__rowId');
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');
    return { filename, content: csvContent, mimeType: 'text/csv' };
  },

  async exportExcel({ title, headers, rows, summary, kpis }, filename = 'report.xlsx') {
    const token = getToken();
    const response = await fetch(`${API_BASE}/reports/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title, headers, rows, summary, kpis }),
    });
    if (!response.ok) throw new Error('Failed to export to Excel');
    const blob = await response.blob();
    return { filename, content: blob, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  },

  async exportPDF({ title, headers, rows, summary, chart_image, kpis }, filename = 'report.pdf') {
    const token = getToken();
    const response = await fetch(`${API_BASE}/reports/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title, headers, rows, summary, chart_image, kpis }),
    });
    if (!response.ok) throw new Error('Failed to export to PDF');
    const blob = await response.blob();
    return { filename, content: blob, mimeType: 'application/pdf' };
  },

  async exportBulk({ reportIds, format, connectionId }, filename = 'bulk_export.zip') {
    const token = getToken();
    const response = await fetch(`${API_BASE}/reports/export/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ report_ids: reportIds, format, connection_id: connectionId }),
    });
    if (!response.ok) throw new Error('Failed to perform bulk export');
    const blob = await response.blob();
    
    let mimeType = 'application/zip';
    let fileExt = 'zip';
    if (format === 'excel') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExt = 'xlsx';
    } else if (format === 'pdf') {
      mimeType = 'application/pdf';
      fileExt = 'pdf';
    }
    
    return { filename: `bulk_export_${Date.now()}.${fileExt}`, content: blob, mimeType };
  },
};

