import { request } from './api';

const adminRequest = async (path, options = {}) => {
  return request(path, options);
};

// ── Platform Stats ────────────────────────────────────────────────────

export const adminApi = {
  // Overview
  async getStats() {
    return adminRequest('/admin/stats');
  },

  // Organizations
  async getOrganizations({ search = '', plan = '', suspended = '', skip = 0, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (plan) params.set('plan', plan);
    if (suspended) params.set('suspended', suspended);
    params.set('skip', skip);
    params.set('limit', limit);
    return adminRequest(`/admin/organizations?${params}`);
  },

  async getOrganization(id) {
    return adminRequest(`/admin/organizations/${id}`);
  },

  async updateOrganization(id, data) {
    return adminRequest(`/admin/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteOrganization(id) {
    return adminRequest(`/admin/organizations/${id}`, { method: 'DELETE' });
  },

  // Users
  async getAllUsers({ search = '', role = '', status = '', org_id = '', skip = 0, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (org_id) params.set('org_id', org_id);
    params.set('skip', skip);
    params.set('limit', limit);
    return adminRequest(`/admin/users?${params}`);
  },

  async updateUserStatus(userId, status) {
    return adminRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async forceLogoutUser(userId) {
    return adminRequest(`/admin/users/${userId}/force-logout`, { method: 'POST' });
  },

  // Query History
  async getQueryHistory({
    search = '', org_id = '', user_id = '', status = '',
    db_type = '', from_date = '', to_date = '', min_ms = 0,
    skip = 0, limit = 100,
  } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (org_id) params.set('org_id', org_id);
    if (user_id) params.set('user_id', user_id);
    if (status) params.set('status', status);
    if (db_type) params.set('db_type', db_type);
    if (from_date) params.set('from_date', from_date);
    if (to_date) params.set('to_date', to_date);
    if (min_ms > 0) params.set('min_ms', min_ms);
    params.set('skip', skip);
    params.set('limit', limit);
    return adminRequest(`/admin/query-history?${params}`);
  },

  // Gateway Agents
  async getGatewayAgents() {
    return adminRequest('/admin/gateway-agents');
  },

  // LLM Usage
  async getLLMUsage(days = 30) {
    return adminRequest(`/admin/llm-usage?days=${days}`);
  },

  // System Health
  async getSystemHealth() {
    return adminRequest('/admin/system-health');
  },

  // Waitlist
  async getWaitlist({ skip = 0, limit = 100 } = {}) {
    return adminRequest(`/admin/waitlist?skip=${skip}&limit=${limit}`);
  },
};
