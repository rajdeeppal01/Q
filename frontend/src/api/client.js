import { API_URL } from './config';

// Base fetch with dummy auth headers for MVP
const qFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Dummy auth token to bypass the Depends(get_current_user) in FastAPI
  // since we haven't wired up full JWT login on the frontend yet.
  // The backend will mock this to the first admin user.
  headers['Authorization'] = 'Bearer dummy_token_for_mvp';

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
  // Agents
  getAgents: () => qFetch('/agents/'),
  getAgent: (id) => qFetch(`/agents/${id}`),
  updateAgentStatus: (id, status) => qFetch(`/agents/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  
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
  
  // Compliance
  getAuditReport: (agentId) => qFetch(`/audit/report/${agentId}`)
};
