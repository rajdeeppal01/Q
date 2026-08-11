import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

// ─── Config ───────────────────────────────────────────────────────────────────

const RISK_ICONS = {
  tool_call:   '',
  data_access: '',
  api_call:    '',
  file_write:  '',
  execute:     '',
  transfer:    '',
};

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
  if (diff <= 0) return 'Expired';
  if (diff < 60) return `${diff}s left`;
  return `${Math.floor(diff / 60)}m left`;
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({ approval, onReview }) {
  const [acting, setActing] = useState(null); // 'approve' | 'reject'
  const [notes, setNotes]   = useState('');
  const [showContext, setShowContext] = useState(false);
  const remaining = timeLeft(approval.expires_at);
  const isExpiring = remaining && remaining.includes('s') && !remaining.includes('m');

  const handle = async (action) => {
    setActing(action);
    try {
      await api.reviewApproval(approval.id, action);
      onReview(approval.id);
    } catch { setActing(null); }
  };

  const icon = RISK_ICONS[approval.context?.tool_name?.split('_')[0]] || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isExpiring ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)'}`,
        borderLeft: `4px solid ${isExpiring ? '#EF4444' : '#F59E0B'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: `0 0 20px ${isExpiring ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)'}`,
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>
            {icon}
          </div>

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                 Pending Approval
              </span>
              {remaining && (
                <span style={{ fontSize: '0.7rem', color: isExpiring ? '#EF4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                   {remaining}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, wordBreak: 'break-word' }}>
              {approval.action_description || 'Unnamed Action'}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>Agent: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{approval.agent_id?.slice(0, 10)}…</code></span>
              <span>Requested {timeAgo(approval.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
          <button
            disabled={!!acting}
            onClick={() => handle('reject')}
            style={{
              padding: '0.5rem 1.125rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
              cursor: acting ? 'not-allowed' : 'pointer', opacity: acting === 'approve' ? 0.4 : 1,
              background: acting === 'reject' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {acting === 'reject' ? (
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
            ) : '✕'}
            Deny
          </button>
          <button
            disabled={!!acting}
            onClick={() => handle('approve')}
            style={{
              padding: '0.5rem 1.125rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
              cursor: acting ? 'not-allowed' : 'pointer', opacity: acting === 'reject' ? 0.4 : 1,
              background: acting === 'approve' ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.4)', color: '#10B981',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 0 12px rgba(16,185,129,0.15)',
            }}
          >
            {acting === 'approve' ? (
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
            ) : '✓'}
            Approve
          </button>
        </div>
      </div>

      {/* Reason + context */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.875rem 1.5rem', background: 'var(--bg-surface)' }}>
        {/* Reason */}
        <div style={{ marginBottom: approval.context && Object.keys(approval.context).length > 0 ? '0.75rem' : 0 }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Justification</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{approval.reason || '—'}</p>
        </div>

        {/* Context toggle */}
        {approval.context && Object.keys(approval.context).length > 0 && (
          <div>
            <button
              onClick={() => setShowContext(s => !s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showContext ? 'rotate(90deg)' : 'none' }}></span>
              {showContext ? 'Hide' : 'Show'} Execution Context
            </button>
            <AnimatePresence>
              {showContext && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{
                    marginTop: 8,
                    padding: '0.75rem',
                    background: 'var(--bg-deep)',
                    border: '1px solid #EF4444',
                    borderLeft: '4px solid #EF4444',
                    borderRadius: 8,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      background: 'repeating-linear-gradient(45deg, #EF4444, #EF4444 10px, transparent 10px, transparent 20px)',
                      height: '4px',
                      opacity: 0.2
                    }} />
                    <div style={{
                      fontSize: '0.65rem',
                      color: '#EF4444',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span>⚠</span> AGENT-PROVIDED DATA — DO NOT TRUST
                    </div>
                    <pre style={{
                      margin: 0,
                      fontSize: '0.72rem', color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      maxHeight: 220, overflow: 'auto',
                    }}>
                      {JSON.stringify(approval.context, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, textAlign: 'center' }}>
      <div>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, color: '#10B981' }}>Inbox Zero</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 340, lineHeight: 1.5 }}>
          No agents are currently paused waiting for approval. The HITL gateway will notify you here when action is needed.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block', animation: 'livePulse 2s ease-in-out infinite' }} />
        Auto-polling every 3 seconds
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [history, setHistory]     = useState([]); // recently actioned

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await api.getApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  const handleReview = (id) => {
    const approval = approvals.find(a => a.id === id);
    if (approval) setHistory(h => [approval, ...h].slice(0, 20));
    setApprovals(prev => prev.filter(a => a.id !== id));
  };

  const slaAvg = approvals.length === 0 ? null : Math.floor(
    approvals.reduce((sum, a) => {
      const age = a.created_at ? (Date.now() - new Date(a.created_at)) / 1000 : 0;
      return sum + age;
    }, 0) / approvals.length
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2.5rem)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            HITL <span className="text-gradient">Gateway</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Human-in-the-Loop approvals — agents are paused, waiting for your decision
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.4rem 0.875rem', borderRadius: 999, border: '1px solid var(--border-subtle)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block', animation: 'livePulse 2s ease-in-out infinite' }} />
          Auto-refreshing
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexShrink: 0 }}>
        {[
          { label: 'Pending', value: approvals.length, color: '#F59E0B', emoji: '' },
          { label: 'Avg Wait',  value: slaAvg ? (slaAvg < 60 ? `${slaAvg}s` : `${Math.floor(slaAvg/60)}m`) : '—', color: 'var(--accent)', emoji: '' },
          { label: 'Actioned Today', value: history.length, color: '#10B981', emoji: '✓' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span> Loading HITL inbox...
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout">
            {approvals.map(approval => (
              <ApprovalCard key={approval.id} approval={approval} onReview={handleReview} />
            ))}
          </AnimatePresence>
        )}

        {/* History section */}
        {history.length > 0 && (
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>
              Recently Actioned
            </div>
            {history.slice(0, 5).map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.875rem', background: 'var(--bg-card)', borderRadius: 8,
                border: '1px solid var(--border-subtle)', marginBottom: 4, fontSize: '0.8rem',
              }}>
                <span style={{ fontSize: '0.9rem' }}>✓</span>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{a.action_description}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
