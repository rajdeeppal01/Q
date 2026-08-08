import { API_URL } from './config';

// Base fetch with dummy auth headers for MVP
const qFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Get real token from localStorage
  const token = localStorage.getItem('q_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

export const api = {
  qFetch,  // expose for ad-hoc calls
  // Auth
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    return response.json();
  },
  
  register: (userData) => qFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  getMe: () => qFetch('/auth/me'),

  // Agents
  getAgents: () => qFetch('/agents/'),
  getAgent: (id) => qFetch(`/agents/${id}`),
  registerAgent: (agentData) => qFetch('/agents/register', {
    method: 'POST',
    body: JSON.stringify(agentData)
  }),
  updateAgentStatus: (id, status) => qFetch(`/agents/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  rotateAgentKey: (id) => qFetch(`/agents/${id}/keys/rotate`, { method: 'POST' }),
  
  // Alerts
  getAlerts: () => qFetch('/alerts/'),
  
  // Approvals
  getApprovals: () => qFetch('/approvals/'),
  reviewApproval: (id, action) => qFetch(`/approvals/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
  
  // Policies
  getPolicies: () => qFetch('/policies/'),
  createPolicy: (policyData) => qFetch('/policies/', {
    method: 'POST',
    body: JSON.stringify(policyData)
  }),
  deletePolicy: (id) => qFetch(`/policies/${id}`, {
    method: 'DELETE'
  }),
  // Compliance
  getComplianceSummary: (days = 30) => qFetch(`/audit/compliance/summary?days=${days}`),
  getAuditReport: (agentId) => qFetch(`/audit/report/${agentId}`),
  togglePolicy: (id) => qFetch(`/policies/${id}/toggle`, { method: 'PATCH' }),
};
