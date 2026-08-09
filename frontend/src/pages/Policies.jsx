import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash2, AlertTriangle, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

function EmptyState({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 360, textAlign: 'center', gap: '1.5rem',
      }}
    >

      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome to Q! Let's get started.</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 400 }}>
          Before your agents run wild, let's establish some ground rules. What tool or action do you want to regulate first?
        </p>
      </div>
      <button className="btn btn-primary" onClick={onCreate} style={{ gap: '0.5rem' }}>
        <Plus size={16} /> Create Your First Policy
      </button>
    </motion.div>
  );
}

function CreatePolicyModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', tool_name: '', action: 'block' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.tool_name) return;
    
    setLoading(true);
    setError(null);
    try {
      const policyData = {
        name: form.name,
        description: `Block or require approval for tool: ${form.tool_name}`,
        policy_type: "tool_restriction",
        conditions: { tool_name: form.tool_name },
        actions: { type: form.action },
        severity: form.action === 'block' ? 'critical' : 'warning'
      };

      await api.createPolicy(policyData);
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(12px)',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 500, width: '90%',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontWeight: 700 }}>Create Security Policy</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Define a new governance policy</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Rule Name *
            </label>
            <input
              required
              className="input"
              placeholder="e.g. Prevent Database Drops"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Target Tool Name *
            </label>
            <input
              required
              className="input"
              style={{ fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. drop_database"
              value={form.tool_name}
              onChange={e => setForm({ ...form, tool_name: e.target.value })}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent)' }}>💡 Tip:</span> Check the Live Monitor feed to discover the exact names of tools your agents are executing.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Action Taken *
            </label>
            <select
              className="input"
              value={form.action}
              onChange={e => setForm({ ...form, action: e.target.value })}
              style={{ cursor: 'pointer' }}
            >
              <option value="block">Block Execution</option>
              <option value="require_approval">Require Human Approval (HITL)</option>
            </select>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#F87171', fontSize: '0.8rem', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Deploying...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Deploy Policy
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreated = () => {
    setShowModal(false);
    fetchPolicies();
  };

  const handleDelete = async (id) => {
    console.warn("Delete policy not fully implemented in backend yet.");
    // For now we will just assume deletion works or isn't supported yet in demo
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--text-muted)' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Loading policies...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Policy <span className="text-gradient">Engine</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
            Govern agent behavior with strict security boundaries.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ gap: '0.5rem' }}>
          <Plus size={16} /> Create Policy
        </button>
      </div>

      {policies.length === 0 ? (
        <EmptyState onCreate={() => setShowModal(true)} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Rule Name</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Condition</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(policy => (
                <tr key={policy.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8125rem', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{policy.name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    tool == "{policy.conditions.tool_name}"
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {policy.actions.type === 'block' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle size={12} /> Block
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <ShieldCheck size={12} /> Require Approval
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} /> Active
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(policy.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <CreatePolicyModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>
    </div>
  );
};
