// ── Central API Client ────────────────────────────────────────────────
// All API calls go through here. Never call fetch directly.

const API_BASE = '';

const getToken = () => localStorage.getItem('token') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(error || `HTTP ${res.status}`);
  }
  // Handle empty responses (204 No Content etc)
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const api = {
  get: (path: string) =>
    fetch(`${API_BASE}${path}`, {
      headers: authHeaders(),
    }).then(handleResponse),

  post: (path: string, body?: any) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  put: (path: string, body?: any) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  del: (path: string) =>
    fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handleResponse),
};

export default api;

// ── Typed API helpers ─────────────────────────────────────────────────

export const authApi = {
  login: (body: { username: string; cif: string; role: string }) =>
    api.post('/api/auth/login', body),
};

export const customersApi = {
  list: () => api.get('/api/customers'),
  get: (cif: string) => api.get(`/api/customers/${cif}`),
  getGuardian: (cif: string) => api.get(`/api/customers/${cif}/guardian`),
  setGuardian: (cif: string, body: any) => api.post(`/api/customers/${cif}/guardian`, body),
};

export const transactionsApi = {
  list: (cif?: string) => api.get(`/api/transactions${cif ? `?cif=${cif}` : ''}`),
  submit: (body: any) => api.post('/api/transactions', body),
  approve: (id: string) => api.post(`/api/transactions/${id}/approve`),
  reject: (id: string) => api.post(`/api/transactions/${id}/reject`),
};

export const kycApi = {
  list: () => api.get('/api/kyc-applications'),
  submit: (body: any) => api.post('/api/kyc-applications', body),
};

export const recoveryApi = {
  attempt: (body: any) => api.post('/api/security/recovery-attempt', body),
};

export const employeeApi = {
  logs: () => api.get('/api/employee/logs'),
  submitLog: (body: any) => api.post('/api/employee/logs', body),
  approveLog: (id: string) => api.post(`/api/employee/logs/${id}/approve`),
  tokens: () => api.get('/api/privilege-tokens'),
  grantToken: (body: any) => api.post('/api/privilege-tokens', body),
  revokeToken: (id: string) => api.post(`/api/privilege-tokens/${id}/revoke`),
};

export const analyticsApi = {
  overview: () => api.get('/api/analytics/overview'),
};

export const auditApi = {
  list: () => api.get('/api/audit-logs'),
};

export const delayApi = {
  activate: (body: any) => api.post('/api/delay-layer/activate', body),
};

export const socApi = {
  getSummary: () => api.get('/api/soc/summary'),
  getLiveSessions: () => api.get('/api/soc/live-sessions'),
  getIncidents: () => api.get('/api/soc/incidents'),
  getSystemHealth: () => api.get('/api/soc/system-health'),
  getModelHealth: () => api.get('/api/soc/model-health'),
  getCustomerTelemetry: (cif: string) => api.get(`/api/soc/customer/${cif}`),
  getRiskNarrative: (body: any) => api.post('/api/risk/narrative', body),
  takeAction: (body: { id: string; cif: string; action: string; reason: string }) => api.post('/api/soc/action', body),
};

