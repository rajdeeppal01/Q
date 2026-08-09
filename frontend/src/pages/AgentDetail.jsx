import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)', label: 'Active' },
  paused:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)', label: 'Paused' },
  quarantined: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  label: 'Quarantined', pulse: true },
  revoked:     { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)',label: 'Revoked' },
};

const RISK_CFG = {
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
  medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)' },
  high:     { color: '#F97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)' },
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.4)'   },
};

const TYPE_ICONS = {
  tool_call:   { icon: '🔧', color: '#00F0FF' },
  llm_invoke:  { icon: '🤖', color: '#A855F7' },
  data_access: { icon: '🗄️', color: '#F59E0B' },
  error:       { icon: '❌', color: '#EF4444' },
  heartbeat:   { icon: '💓', color: '#10B981' },
  decision:    { icon: '🧠', color: '#6366F1' },
};

const RISK_ORDER = ['critical', 'high', 'medium', 'low'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RiskBadge({ level }) {
  const c = RISK_CFG[level] || RISK_CFG.low;
  return (
    <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {level}
    </span>
  );
}

function StatCard({ value, label, color, sublabel }) {
  return (
    <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value ?? '—'}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      {sublabel && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sublabel}</span>}
    </div>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

function TimelineEvent({ event }) {
  const type = TYPE_ICONS[event.event_type] || { icon: '📡', color: 'var(--accent)' };
  const risk = RISK_CFG[event.risk_level] || RISK_CFG.low;
  const time = event.created_at ? new Date(event.created_at).toLocaleTimeString('en-US', { hour12: false }) : '—';
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: risk.bg, border: `1px solid ${risk.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
          {type.icon}
        </div>
        <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', margin: '3px 0' }} />
      </div>
      <div style={{ flex: 1, paddingBottom: '0.5rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: type.color }}>{event.tool_name || event.event_type}</span>
          <RiskBadge level={event.risk_level} />
          {event.policy_passed === false && (
            <span style={{ fontSize: '0.68rem', color: '#EF4444', fontWeight: 700 }}>✗ BLOCKED</span>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
          <span>{time}</span>
          {event.latency_ms && <span>{Math.round(event.latency_ms)}ms</span>}
          {event.trace_id && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.68rem' }}>{event.trace_id.slice(0, 12)}…</span>}
        </div>
        {event.error_message && (
          <div style={{ fontSize: '0.72rem', color: '#F87171', fontFamily: 'var(--font-mono)', marginTop: 4, background: 'rgba(239,68,68,0.06)', borderRadius: 4, padding: '2px 6px', wordBreak: 'break-all' }}>
            {event.error_message.slice(0, 120)}{event.error_message.length > 120 ? '…' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tool Usage Bar ───────────────────────────────────────────────────────────

function ToolBar({ tool, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{tool}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-deep)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), #A855F7)', borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

// ─── Risk Donut ───────────────────────────────────────────────────────────────

function RiskDonut({ breakdown }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0', textAlign: 'center' }}>No events yet</div>;
  let offset = 0;
  const R = 40, CX = 55, CY = 55, CIRC = 2 * Math.PI * R;

  const segments = RISK_ORDER.filter(r => breakdown[r] > 0).map(r => {
    const pct = breakdown[r] / total;
    const dash = pct * CIRC;
    const seg = { risk: r, pct, dash, offset, color: RISK_CFG[r].color };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--bg-deep)" strokeWidth={12} />
        {segments.map(seg => (
          <circle key={seg.risk} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color} strokeWidth={12}
            strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
            strokeDashoffset={-seg.offset + CIRC / 4}
            strokeLinecap="butt" style={{ transition: 'stroke-dasharray 0.5s' }}
          />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="800" fontFamily="var(--font-mono)">{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="9">events</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {RISK_ORDER.filter(r => breakdown[r] > 0).map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: RISK_CFG[r].color }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{r}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{breakdown[r]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent]     = useState(null);
  const [stats, setStats]     = useState(null);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [keyResult, setKeyResult] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [a, s, e] = await Promise.all([
          api.qFetch(`/agents/${id}`),
          api.qFetch(`/agents/${id}/stats`),
          api.qFetch(`/agents/${id}/events?limit=80`),
        ]);
        setAgent(a);
        setStats(s);
        setEvents(Array.isArray(e) ? e : []);
      } catch { navigate('/agents'); }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleStatus = async (newStatus) => {
    if (confirmAction !== newStatus) { setConfirmAction(newStatus); return; }
    setActioning(true);
    try {
      await api.updateAgentStatus(id, newStatus);
      setAgent(prev => ({ ...prev, status: newStatus }));
    } catch { /* ignore */ }
    setActioning(false);
    setConfirmAction(null);
  };

  const handleRotateKey = async () => {
    setActioning(true);
    try {
      const res = await api.rotateAgentKey(id);
      setKeyResult(res.new_api_key);
    } catch { /* ignore */ }
    setActioning(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)', gap: 8 }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '1.5rem' }}>↻</span>
        Loading agent...
      </div>
    );
  }

  if (!agent) return null;
  const sc = STATUS_CFG[agent.status] || STATUS_CFG.active;
  const rc = RISK_CFG[agent.risk_level] || RISK_CFG.low;
  const maxTool = stats?.tool_usage?.[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <button onClick={() => navigate('/agents')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>
          ← Agent Registry
        </button>
        <span>/</span>
        <span>{agent.name}</span>
      </div>

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '1.5rem', border: `1px solid ${sc.border}`, background: sc.bg }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: sc.bg, border: `2px solid ${sc.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
              boxShadow: `0 0 20px ${sc.color}30`,
            }}>
              🤖
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{agent.name}</h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                  {sc.label}
                </span>
                <RiskBadge level={agent.risk_level} />
                {agent.framework && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 999 }}>
                    {agent.framework}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{agent.agent_type}</span>
              </div>
              {agent.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6 }}>{agent.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {agent.status !== 'paused' && (
              <button
                disabled={actioning}
                onClick={() => handleStatus('paused')}
                style={{ padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: '#F59E0B', transition: 'all 0.15s' }}
              >
                {confirmAction === 'paused' ? '⚠ Confirm Pause?' : '⏸ Pause'}
              </button>
            )}
            {agent.status === 'paused' && (
              <button
                disabled={actioning}
                onClick={() => handleStatus('active')}
                style={{ padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#10B981', transition: 'all 0.15s' }}
              >
                ▶ Activate
              </button>
            )}
            {agent.status !== 'quarantined' && (
              <button
                disabled={actioning}
                onClick={() => handleStatus('quarantined')}
                style={{ padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', transition: 'all 0.15s' }}
              >
                {confirmAction === 'quarantined' ? '⚠ Confirm Quarantine?' : '🔒 Quarantine'}
              </button>
            )}
            <button
              disabled={actioning}
              onClick={handleRotateKey}
              style={{ padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
            >
              🔑 Rotate Key
            </button>
          </div>
        </div>

        {/* Agent ID */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Agent ID:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', background: 'var(--bg-deep)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>{agent.id}</span>
        </div>

        {/* New key display */}
        <AnimatePresence>
          {keyResult && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginTop: 12, background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>⚠ NEW API KEY — Copy now, it won't be shown again:</div>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{keyResult}</code>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(keyResult); setKeyResult(null); }}
                style={{ padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'var(--accent)', color: '#000', border: 'none', flexShrink: 0 }}>
                Copy & Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KPI Strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-sm)' }}>
          <StatCard value={stats.total_events} label="Total Events" color="var(--accent)" />
          <StatCard value={stats.blocked_events} label="Blocked" color="#EF4444" />
          <StatCard value={stats.critical_events} label="Critical Events" color="#F97316" />
          <StatCard value={stats.open_alerts} label="Open Alerts" color="#F59E0B" />
          <StatCard value={stats.avg_latency_ms ? `${stats.avg_latency_ms}ms` : null} label="Avg Latency" color="#A855F7" />
        </div>
      )}

      {/* Main two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)', alignItems: 'start' }}>
        {/* Activity Timeline */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⏱ Activity Timeline</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{events.length} events shown</span>
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>No events yet. Run a demo agent to see activity here.</div>
            ) : events.map(e => <TimelineEvent key={e.id} event={e} />)}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Risk Breakdown */}
          {stats && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>📊 Risk Breakdown</div>
              <RiskDonut breakdown={stats.risk_breakdown || {}} />
            </div>
          )}

          {/* Tool Usage */}
          {stats?.tool_usage?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>🔧 Top Tool Calls</div>
              {stats.tool_usage.map(t => (
                <ToolBar key={t.tool} tool={t.tool} count={t.count} max={maxTool} />
              ))}
            </div>
          )}

          {/* Permissions */}
          {agent.permissions && Object.keys(agent.permissions).length > 0 && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>🔐 Permissions Scope</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {JSON.stringify(agent.permissions, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {agent.metadata_ && Object.keys(agent.metadata_).length > 0 && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>🏷 Metadata</div>
              {Object.entries(agent.metadata_).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
