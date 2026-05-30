/**
 * Repnex API Service — Real backend integration
 * Handles auth, connections, queries, templates, and organizations
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'https://repnex-backend.onrender.com/v1';
const AUTH_TOKEN_KEY = 'repnex-auth-token';

// ── Storage helpers ───────────────────────────────────────────────────

const ensureStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('Browser storage is unavailable.');
  }
  return window.localStorage;
};

const getToken = () => {
  try {
    return ensureStorage().getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = (token) => {
  ensureStorage().setItem(AUTH_TOKEN_KEY, token);
};

const clearToken = () => {
  try {
    ensureStorage().removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
};

// ── Base request helper ───────────────────────────────────────────────

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('/') ? `${API_BASE}${path}` : path;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    const errMsg = payload?.error?.message || payload?.error || payload?.detail || 'Request failed.';
    throw new Error(errMsg);
  }

  return payload;
};

// ── Auth API ──────────────────────────────────────────────────────────

export const authApi = {
  async getSession() {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await request('/auth/session');
      return response.user || response;
    } catch (error) {
      clearToken();
      return null;
    }
  },

  async signIn({ email, password }) {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = response.token || response.tokens?.access_token;
    if (token) setToken(token);
    return response.user || response;
  },

  async signUp({ name, company, email, password }) {
    const response = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, company: company || name || email.split('@')[0], email, password }),
    });
    const token = response.token || response.tokens?.access_token;
    if (token) setToken(token);
    return response.user || response;
  },

  async signOut() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Backend logout failed:', e);
    } finally {
      clearToken();
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
    if (response.token) setToken(response.token);
    return response.user || response;
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
    const token = response.token || response.tokens?.access_token;
    if (token) setToken(token);
    return response.user || response;
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

  async completeOnboarding(payload) {
    return request('/organizations/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async inviteUser({ email, role }) {
    return request('/organizations/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  async listMembers() {
    const response = await request('/users');
    return response.users || response;
  },
};

// ── Database Connection API ───────────────────────────────────────────

export const databaseApi = {
  async getConnections() {
    const response = await request('/connections');
    return Array.isArray(response) ? response : response.connections || [];
  },

  async testConnection(connectionData) {
    return request('/connections/test', {
      method: 'POST',
      body: JSON.stringify(connectionData),
    });
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
};

// ── Query / Chat API (Intent Engine) ──────────────────────────────────

export const queryApi = {
  /**
   * Unified chat endpoint: classify intent → retrieve template → execute
   * Returns ChatResponse with type: conversational | executable | params_needed | error
   */
  async chat({ naturalLanguage, connectionId, sessionId }) {
    return request('/query/chat', {
      method: 'POST',
      body: JSON.stringify({
        natural_language: naturalLanguage,
        connection_id: connectionId || null,
        session_id: sessionId || null,
      }),
    });
  },

  /**
   * Execute a template with explicit params (after params_needed)
   */
  async execute({ templateId, params, connectionId, sessionId }) {
    return request('/query/execute', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        params,
        connection_id: connectionId,
        session_id: sessionId || null,
      }),
    });
  },

  /**
   * Legacy: run query in one shot
   */
  async run({ sessionId, naturalLanguage }) {
    return request('/query/run', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        natural_language: naturalLanguage,
      }),
    });
  },

  async getTemplates() {
    return request('/query/templates');
  },
};

// ── Template API (Pinecone) ───────────────────────────────────────────

export const templateApi = {
  async getStatus() {
    return request('/templates/status');
  },

  async ingest() {
    return request('/templates/ingest', { method: 'POST' });
  },

  async search(query, topK = 5) {
    return request('/templates/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    });
  },
};

// ── Report API ────────────────────────────────────────────────────────

export const reportApi = {
  async getReports() {
    const response = await request('/reports');
    return Array.isArray(response) ? response : response.reports || [];
  },

  async getReport(id) {
    return request(`/reports/${id}`);
  },

  async togglePin(id) {
    return request(`/reports/${id}/pin`, { method: 'PATCH' });
  },

  async updateReport(id, updates) {
    return request(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteReport(id) {
    return request(`/reports/${id}`, { method: 'DELETE' });
  },

  async saveReport(reportData) {
    return request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  async runReport(id, connectionId) {
    return request(`/reports/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ connection_id: connectionId }),
    });
  },

  async searchReports(query) {
    const response = await request(`/reports?search=${encodeURIComponent(query)}`);
    return Array.isArray(response) ? response : response.reports || [];
  },
};

// ── AI API (still wraps some mock functions for demo) ─────────────────

export const aiApi = {
  async generateReport(prompt) {
    // Use the real query/chat endpoint
    try {
      const result = await queryApi.chat({ naturalLanguage: prompt });
      return {
        success: true,
        tables: [],
        sql: result.sql,
        data: result.rows || [],
        insights: result.summary,
        reportId: `rep-${Date.now()}`,
        chartType: 'bar',
        chartConfig: {
          xAxis: result.rows?.[0] ? Object.keys(result.rows[0])[0] : '',
          yAxis: result.rows?.[0] ? [Object.keys(result.rows[0])[1]] : [],
          colors: ['#2563eb', '#60a5fa'],
          showLegend: true,
          showGrid: true,
        },
      };
    } catch {
      return { success: false, error: 'Query failed' };
    }
  },

  async getChatHistory() {
    return [];
  },

  async getSuggestions() {
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

  async create(data) {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(sessionId) {
    return request(`/sessions/${sessionId}`);
  },

  async delete(sessionId) {
    return request(`/sessions/${sessionId}`, { method: 'DELETE' });
  },
};

// ── Export API ─────────────────────────────────────────────────────────

export const exportApi = {
  async exportCSV(data, filename = 'export.csv') {
    if (!data?.length) return null;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');
    return { filename, content: csvContent, mimeType: 'text/csv' };
  },
};
