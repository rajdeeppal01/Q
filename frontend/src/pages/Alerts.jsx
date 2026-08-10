import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

// ─── Config ─────────────────────────────────────────────────────────────────

const SEV = {
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', glow: '0 0 12px rgba(16,185,129,0.2)' },
  medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)', glow: '0 0 12px rgba(245,158,11,0.2)' },
  high:     { color: '#F97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)', glow: '0 0 12px rgba(249,115,22,0.2)' },
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.4)',   glow: '0 0 18px rgba(239,68,68,0.3)' },
};

const TYPE_ICONS = {
  anomaly_detected:    { icon: '', label: 'Anomaly' },
  policy_violation:    { icon: '', label: 'Policy Violation' },
  rogue_behavior:      { icon: '', label: 'Rogue Behavior' },
  credential_expiry:   { icon: '', label: 'Credential Expiry' },
  rate_limit_exceeded: { icon: '', label: 'Rate Limit' },
  exfiltration:        { icon: '', label: 'Data Exfiltration' },
};

const STATUS_CFG = {
  open:           { color: '#EF4444', label: 'Open',           dot: '#EF4444' },
  investigating:  { color: '#F59E0B', label: 'Investigating',  dot: '#F59E0B' },
  resolved:       { color: '#10B981', label: 'Resolved',       dot: '#10B981' },
  false_positive: { color: '#6B7280', label: 'False Positive', dot: '#6B7280' },
};

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES   = ['open', 'investigating', 'resolved', 'false_positive'];

// ─── Sub-components ─────────────────────────────────────────────────────────

function SeverityBadge({ sev }) {
  const c = SEV[sev] || SEV.low;
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{sev}</span>
  );
}

function StatusDot({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.open;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: c.color, fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block', boxShadow: `0 0 6px ${c.dot}` }} />
      {c.label}
    </span>
  );
}

function AlertCard({ alert, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const sev  = SEV[alert.severity] || SEV.low;
  const type = TYPE_ICONS[alert.alert_type] || { icon: '', label: alert.alert_type };
  const time = alert.created_at ? new Date(alert.created_at).toLocaleString() : '—';

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await api.qFetch(`/alerts/${alert.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate(alert.id, newStatus);
    } catch { /* ignore */ }
    setUpdating(false);
  };

  const nextActions = {
    open:           [{ label: ' Investigate', status: 'investigating', style: 'amber' }, { label: '✓ Resolve', status: 'resolved', style: 'green' }, { label: ' False Positive', status: 'false_positive', style: 'ghost' }],
    investigating:  [{ label: '✓ Resolve', status: 'resolved', style: 'green' }, { label: ' False Positive', status: 'false_positive', style: 'ghost' }],
    resolved:       [{ label: '↺ Reopen', status: 'open', style: 'ghost' }],
    false_positive: [{ label: '↺ Reopen', status: 'open', style: 'ghost' }],
  };
  const actions = nextActions[alert.status] || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        background: alert.status === 'open' ? sev.bg : 'var(--bg-card)',
        border: `1px solid ${alert.status === 'open' ? sev.border : 'var(--border-subtle)'}`,
        boxShadow: alert.status === 'open' ? sev.glow : 'none',
        borderRadius: 'var(--radius-lg)', marginBottom: 8, overflow: 'hidden',
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr auto auto auto',
          gap: '0.75rem', alignItems: 'center',
          padding: '0.875rem 1rem', cursor: 'pointer',
        }}
      >
        {/* Type icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: sev.bg, border: `1px solid ${sev.border}`, fontSize: '1rem', flexShrink: 0,
        }}>
          {type.icon}
        </div>

        {/* Message */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {alert.message || alert.title || type.label}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {type.label} · {alert.agent_id?.slice(0, 8) || 'Unknown agent'} · {time}
          </div>
        </div>

        <SeverityBadge sev={alert.severity} />
        <StatusDot status={alert.status} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }}></span>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: `1px solid ${sev.border}`, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Evidence / context */}
              {alert.context && (
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Evidence</div>
                  <pre style={{
                    background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, padding: '0.75rem', fontSize: '0.72rem', color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all', margin: 0, maxHeight: 200,
                  }}>
                    {JSON.stringify(alert.context, null, 2)}
                  </pre>
                </div>
              )}

              {/* Action buttons */}
              {actions.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {actions.map(a => (
                    <button
                      key={a.status}
                      disabled={updating}
                      onClick={e => { e.stopPropagation(); handleStatus(a.status); }}
                      style={{
                        padding: '0.4rem 0.875rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                        cursor: updating ? 'not-allowed' : 'pointer', border: '1px solid',
                        opacity: updating ? 0.5 : 1, transition: 'all 0.15s',
                        ...(a.style === 'green'  ? { background: 'rgba(16,185,129,0.12)',  borderColor: 'rgba(16,185,129,0.4)',  color: '#10B981' } :
                           a.style === 'amber'  ? { background: 'rgba(245,158,11,0.12)',  borderColor: 'rgba(245,158,11,0.4)',  color: '#F59E0B' } :
                                                  { background: 'transparent',            borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }),
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stats Strip ─────────────────────────────────────────────────────────────

function StatCard({ value, label, color }) {
  return (
    <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Alerts() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterSev, setFilterSev]     = useState('');
  const [filterStatus, setFilterStatus] = useState('open');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts();
      setAllAlerts(Array.isArray(data) ? data : []);
    } catch { setAllAlerts([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Optimistic update on status change
  const handleUpdate = (id, newStatus) => {
    setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const filtered = allAlerts.filter(a => {
    if (filterSev    && a.severity !== filterSev)   return false;
    if (filterStatus && a.status   !== filterStatus) return false;
    return true;
  });

  // Stats
  const open     = allAlerts.filter(a => a.status === 'open').length;
  const critical = allAlerts.filter(a => a.severity === 'critical').length;
  const inv      = allAlerts.filter(a => a.status === 'investigating').length;
  const resolved = allAlerts.filter(a => a.status === 'resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2.5rem)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Security <span className="text-gradient">Alerts</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Anomalies, policy violations, and rogue behavior detected by Q
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ↺ Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexShrink: 0 }}>
        <StatCard value={open}     label="Open Alerts"    color="#EF4444" />
        <StatCard value={critical} label="Critical"       color="#F97316" />
        <StatCard value={inv}      label="Investigating"  color="#F59E0B" />
        <StatCard value={resolved} label="Resolved"       color="#10B981" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
        {/* Status filters */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {[{ v: '', l: 'All' }, ...STATUSES.map(s => ({ v: s, l: STATUS_CFG[s]?.label }))].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              style={{
                padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', border: `1px solid ${filterStatus === v ? 'var(--accent)' : 'var(--border-default)'}`,
                background: filterStatus === v ? 'var(--accent-glow)' : 'transparent',
                color: filterStatus === v ? 'var(--accent)' : 'var(--text-secondary)', transition: 'all 0.15s',
              }}
            >{l}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

        {/* Severity filters */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {[{ v: '', l: 'All Severity' }, ...SEVERITIES.map(s => ({ v: s, l: s.charAt(0).toUpperCase() + s.slice(1) }))].map(({ v, l }) => {
            const c = SEV[v];
            return (
              <button
                key={v}
                onClick={() => setFilterSev(v)}
                style={{
                  padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: filterSev === v ? `1px solid ${c?.color || 'var(--accent)'}` : '1px solid var(--border-default)',
                  background: filterSev === v ? (c?.bg || 'var(--accent-glow)') : 'transparent',
                  color: filterSev === v ? (c?.color || 'var(--accent)') : 'var(--text-secondary)',
                }}
              >{l}</button>
            );
          })}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} / {allAlerts.length} alerts
        </span>
      </div>

      {/* Alert List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span> Loading alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, gap: 12 }}>
            <span style={{ fontSize: '3rem' }}></span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No alerts found</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filterStatus === 'open' ? 'All clear — no open alerts right now.' : 'Try adjusting your filters.'}
            </span>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(alert => (
              <AlertCard key={alert.id} alert={alert} onUpdate={handleUpdate} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
