const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('pulseops_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || `HTTP error ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getDemoUsers() {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return handleResponse(res);
  },

  async switchDemo(userId) {
    const res = await fetch(`${API_BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return handleResponse(res);
  },

  // Incidents
  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/incidents?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getIncident(id) {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createIncident(payload) {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateIncidentStatus(id, status, rootCause) {
    const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, rootCause })
    });
    return handleResponse(res);
  },

  async assignIncident(id, assigneeId) {
    const res = await fetch(`${API_BASE}/incidents/${id}/assign`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ assigneeId })
    });
    return handleResponse(res);
  },

  async triggerChaos(serviceId, drillType) {
    const res = await fetch(`${API_BASE}/incidents/simulate-chaos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ serviceId, drillType })
    });
    return handleResponse(res);
  },

  // Services
  async getServices() {
    const res = await fetch(`${API_BASE}/services`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getTopology() {
    const res = await fetch(`${API_BASE}/services/topology`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async updateServiceHealth(id, status) {
    const res = await fetch(`${API_BASE}/services/${id}/health`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Runbooks
  async getRunbooks() {
    const res = await fetch(`${API_BASE}/runbooks`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getRunbook(id) {
    const res = await fetch(`${API_BASE}/runbooks/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async executeRunbook(id, incidentId, autoResolve = true) {
    const res = await fetch(`${API_BASE}/runbooks/${id}/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ incidentId, autoResolve })
    });
    return handleResponse(res);
  },

  async getRecentExecutions() {
    const res = await fetch(`${API_BASE}/runbooks/executions/recent`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // War Room
  async getWarRoomFeed(incidentId) {
    const res = await fetch(`${API_BASE}/war-room/${incidentId}/feed`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async sendWarRoomMessage(incidentId, content, type = 'message') {
    const res = await fetch(`${API_BASE}/war-room/${incidentId}/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, type })
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getPostMortems() {
    const res = await fetch(`${API_BASE}/analytics/post-mortems`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async generatePostMortem(incidentId) {
    const res = await fetch(`${API_BASE}/analytics/post-mortems/generate/${incidentId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async resetDemoData() {
    const res = await fetch(`${API_BASE}/analytics/reset-demo`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
