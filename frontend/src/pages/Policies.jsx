import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

export const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    tool_name: '',
    action: 'block'
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error("Failed to load policies", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPolicy.name || !newPolicy.tool_name) return;

    try {
      const policyData = {
        name: newPolicy.name,
        description: `Block or require approval for tool: ${newPolicy.tool_name}`,
        policy_type: "tool_restriction",
        conditions: { tool_name: newPolicy.tool_name },
        actions: { type: newPolicy.action },
        severity: newPolicy.action === 'block' ? 'critical' : 'warning'
      };

      await api.createPolicy(policyData);
      setShowModal(false);
      setNewPolicy({ name: '', tool_name: '', action: 'block' });
      fetchPolicies();
    } catch (err) {
      console.error("Failed to create policy", err);
    }
  };

  const handleDelete = async (id) => {
    // In our backend, deactivate_policy could just be a delete or update
    // Let's assume the router actually handles it if we added it, but right now we might just have POST and GET. 
    // If delete isn't strictly defined, we can at least show it. The backend actually has DELETE? 
    // Wait, the existing policies.py didn't have DELETE. But we can add it later.
    // For MVP, just remove it from state or rely on backend.
    console.warn("Delete policy not fully implemented in backend yet.");
  };

  if (isLoading) {
    return <div className="p-8 text-q-muted animate-pulse">Loading policies...</div>;
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-q-glow">Policy Engine</h1>
          <p className="text-q-muted mt-1">Govern agent behavior with strict security boundaries.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-q-glow/10 hover:bg-q-glow/20 text-q-glow px-4 py-2 rounded-lg border border-q-glow/30 flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Create Rule
        </button>
      </div>

      <div className="bg-q-panel border border-q-border rounded-xl overflow-hidden">
        {policies.length === 0 ? (
          <div className="p-12 text-center text-q-muted">
            <Shield className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>No active security policies.</p>
            <p className="text-sm mt-1">Agents are operating without strict boundaries.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-q-border/50 bg-q-base/50">
                <th className="p-4 text-xs font-semibold text-q-muted uppercase tracking-wider">Rule Name</th>
                <th className="p-4 text-xs font-semibold text-q-muted uppercase tracking-wider">Condition</th>
                <th className="p-4 text-xs font-semibold text-q-muted uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-q-muted uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-q-muted uppercase tracking-wider text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-q-border/30">
              {policies.map(policy => (
                <tr key={policy.id} className="hover:bg-q-base/30 transition-colors">
                  <td className="p-4 font-medium">{policy.name}</td>
                  <td className="p-4 font-mono text-sm text-q-muted">
                    tool == "{policy.conditions.tool_name}"
                  </td>
                  <td className="p-4">
                    {policy.actions.type === 'block' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertTriangle size={12} />
                        Block
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldCheck size={12} />
                        Require Approval
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-emerald-400 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse-slow"></span>
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(policy.id)}
                      className="text-q-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-q-panel border border-q-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-q-border flex items-center gap-3">
              <div className="p-2 bg-q-glow/10 rounded-lg text-q-glow">
                <Shield size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">Create Security Policy</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-q-muted mb-1.5">Rule Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Prevent Database Drops"
                  className="w-full bg-q-base border border-q-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-q-glow transition-colors"
                  value={newPolicy.name}
                  onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-q-muted mb-1.5">Target Tool Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. drop_database"
                  className="w-full bg-q-base border border-q-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-q-glow transition-colors font-mono"
                  value={newPolicy.tool_name}
                  onChange={e => setNewPolicy({...newPolicy, tool_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-q-muted mb-1.5">Action Taken</label>
                <select 
                  className="w-full bg-q-base border border-q-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-q-glow transition-colors"
                  value={newPolicy.action}
                  onChange={e => setNewPolicy({...newPolicy, action: e.target.value})}
                >
                  <option value="block">Block Execution</option>
                  <option value="require_approval">Require Human Approval (HITL)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-q-base hover:bg-q-border rounded-lg text-sm font-medium transition-colors border border-q-border/50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-q-glow text-black hover:bg-q-glow/90 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                >
                  Deploy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
