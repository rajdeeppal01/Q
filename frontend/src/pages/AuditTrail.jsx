import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { API_URL } from '../api/config';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const RISK_CFG = {
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  high:     { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)' },
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.5)' },
};

const TYPE_ICONS = {
  tool_call:   '🔧',
  llm_invoke:  '🤖',
  data_access: '🗄️',
  error:       '❌',
  heartbeat:   '💓',
  decision:    '🧠',
};

const RISK_LEVELS  = ['low', 'medium', 'high', 'critical'];
const EVENT_TYPES  = ['tool_call', 'llm_invoke', 'data_access', 'error', 'heartbeat', 'decision'];
const DAY_OPTIONS  = [1, 7, 30, 90];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function RiskBadge({ level, small }) {
  const c = RISK_CFG[level] || RISK_CFG.low;
  return (
    <span style={{
      padding: small ? '1px 6px' : '2px 9px',
      borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: small ? '0.65rem' : '0.7rem',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      border: `1px solid ${c.border}`,
    }}>{level}</span>
  );
}

function PolicyBadge({ passed }) {
  if (passed === null || passed === undefined) return <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
      color: passed ? '#10B981' : '#EF4444',
    }}>
      {passed ? '✓ PASS' : '✗ BLOCK'}
    </span>
  );
}

// Detail drawer
function EventDrawer({ event, onClose }) {
  const risk = RISK_CFG[event?.risk_level] || RISK_CFG.low;
  if (!event) return null;
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--bg-surface)', borderLeft: `1px solid ${risk.color}40`,
        zIndex: 300, display: 'flex', flexDirection: 'column',
        boxShadow: `-8px 0 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem', borderBottom: `1px solid ${risk.color}30`,
        background: risk.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: risk.color }}>
            {TYPE_ICONS[event.event_type] || '📡'} {event.tool_name || event.event_type}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>
            {event.id}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: 0 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {[
            { label: 'Agent',       value: event.agent_name, mono: false },
            { label: 'Risk',        value: event.risk_level, color: risk.color },
            { label: 'Type',        value: event.event_type, mono: true },
            { label: 'Policy',      value: event.policy_passed === true ? 'PASS' : event.policy_passed === false ? 'BLOCKED' : 'Not Checked', color: event.policy_passed === true ? '#10B981' : event.policy_passed === false ? '#EF4444' : 'var(--text-muted)' },
            { label: 'Latency',     value: event.latency_ms ? `${Math.round(event.latency_ms)}ms` : '—', mono: true },
            { label: 'Trace ID',    value: event.trace_id || '—', mono: true },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--bg-deep)', borderRadius: 6, padding: '0.6rem 0.75rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: f.color || 'var(--text-primary)', fontFamily: f.mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Timestamp</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}
          </div>
        </div>

        {/* Error */}
        {event.error_message && (
          <div>
            <div style={{ fontSize: '0.65rem', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Error</div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem', color: '#F87171', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              {event.error_message}
            </div>
          </div>
        )}

        {/* Raw JSON */}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Raw Event</div>
          <pre style={{
            background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: '0.75rem', fontSize: '0.72rem', color: 'var(--accent)',
            fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'pre-wrap',
            wordBreak: 'break-all', margin: 0, lineHeight: 1.6,
          }}>
            {JSON.stringify(event, null, 2)}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

// Trace row — groups events by trace_id
function TraceGroup({ traceId, events, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const maxRisk = events.reduce((worst, e) => {
    const order = ['low','medium','high','critical'];
    return order.indexOf(e.risk_level) > order.indexOf(worst) ? e.risk_level : worst;
  }, 'low');
  const risk = RISK_CFG[maxRisk];
  const blocked = events.filter(e => e.policy_passed === false).length;

  return (
    <div style={{ borderLeft: `3px solid ${risk.color}60`, marginBottom: 2 }}>
      {/* Group header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'grid', gridTemplateColumns: '20px 1fr 100px 80px 60px 80px',
          gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0.75rem 0.5rem 0.5rem',
          cursor: 'pointer', background: open ? risk.bg : 'transparent',
          fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
        onMouseOut={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)' }}>{traceId}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 8 }}>{events.length} events</span>
        </div>
        <RiskBadge level={maxRisk} small />
        <span style={{ color: blocked > 0 ? '#EF4444' : '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>
          {blocked > 0 ? `${blocked} blocked` : 'all passed'}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
          {events[0]?.created_at ? new Date(events[0].created_at).toLocaleTimeString('en-US', { hour12: false }) : '—'}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {events[0]?.agent_name?.slice(0, 14)}
        </span>
      </div>

      {/* Expanded events */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            {events.map(ev => (
              <EventRow key={ev.id} event={ev} selected={selectedId === ev.id} onSelect={onSelect} indented />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventRow({ event, selected, onSelect, indented }) {
  const risk = RISK_CFG[event.risk_level] || RISK_CFG.low;
  const time = event.created_at ? new Date(event.created_at).toLocaleTimeString('en-US', { hour12: false }) : '—';
  return (
    <div
      onClick={() => onSelect(event)}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px 70px 80px',
        gap: '0.75rem', alignItems: 'center',
        padding: `0.45rem ${indented ? '0.75rem 0.45rem 2rem' : '0.75rem'}`,
        cursor: 'pointer', fontSize: '0.78rem',
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: selected ? `3px solid ${risk.color}` : indented ? '3px solid transparent' : 'none',
        background: selected ? risk.bg : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseOver={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
      onMouseOut={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div>
        <span style={{ color: risk.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {TYPE_ICONS[event.event_type] || '📡'} {event.tool_name || event.event_type}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 8 }}>{event.agent_name}</span>
      </div>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{event.event_type}</span>
      <RiskBadge level={event.risk_level} small />
      <PolicyBadge passed={event.policy_passed} />
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textAlign: 'right' }}>
        {event.latency_ms ? `${Math.round(event.latency_ms)}ms` : '—'}
      </span>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textAlign: 'right' }}>{time}</span>
    </div>
  );
}

function Pagination({ page, pages, total, pageSize, onPage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', flexShrink: 0 }}>
      <span style={{ color: 'var(--text-muted)' }}>{total.toLocaleString()} events total</span>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <button onClick={() => onPage(1)} disabled={page === 1} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }}>«</button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }}>‹</button>
        <span style={{ color: 'var(--text-secondary)', padding: '0 0.5rem' }}>Page {page} of {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }}>›</button>
        <button onClick={() => onPage(pages)} disabled={page === pages} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }}>»</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AuditTrail() {
  const [data, setData]           = useState({ events: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [days, setDays]           = useState(7);
  const [filterRisk, setFilterRisk]     = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterPolicy, setFilterPolicy] = useState('');
  const [traceSearch, setTraceSearch]   = useState('');
  const [agentSearch, setAgentSearch]   = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [groupByTrace, setGroupByTrace]   = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: 50, days });
      if (filterRisk)   params.set('risk_level', filterRisk);
      if (filterType)   params.set('event_type', filterType);
      if (traceSearch)  params.set('trace_id', traceSearch);
      if (filterPolicy === 'passed')  params.set('policy_passed', 'true');
      if (filterPolicy === 'blocked') params.set('policy_passed', 'false');
      const result = await api.qFetch(`/audit/events?${params}`);
      setData(result);
    } catch {
      setData({ events: [], total: 0, page: 1, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, days, filterRisk, filterType, filterPolicy, traceSearch]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [days, filterRisk, filterType, filterPolicy, traceSearch]);

  const handleExport = () => {
    const token = localStorage.getItem('q_access_token');
    const params = new URLSearchParams({ days });
    if (filterRisk) params.set('risk_level', filterRisk);
    window.open(`${API_URL}/audit/export?${params}&token=${token}`, '_blank');
  };

  // Group by trace_id for trace view
  const traceGroups = groupByTrace
    ? data.events.reduce((acc, ev) => {
        const key = ev.trace_id || `no-trace-${ev.id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(ev);
        return acc;
      }, {})
    : null;

  const stats = {
    total: data.total,
    blocked: data.events.filter(e => e.policy_passed === false).length,
    critical: data.events.filter(e => e.risk_level === 'critical').length,
    traces: traceGroups ? Object.keys(traceGroups).length : new Set(data.events.map(e => e.trace_id).filter(Boolean)).size,
  };

  const ColHeader = ({ children, style }) => (
    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, ...style }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2.5rem)' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Audit <span className="text-gradient">Trail</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Immutable, paginated event history across all governed agents
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExport} className="btn btn-ghost btn-sm" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
            ⬇ Export CSV
          </button>
          <button onClick={fetchEvents} className="btn btn-ghost btn-sm" style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexShrink: 0 }}>
        {[
          { label: 'Total Events (page)', value: data.events.length, color: 'var(--accent)' },
          { label: 'Traces', value: stats.traces, color: '#A855F7' },
          { label: 'Blocked (page)', value: stats.blocked, color: '#EF4444' },
          { label: 'Critical (page)', value: stats.critical, color: '#F97316' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-sm)', flexShrink: 0 }}>
        {/* Days */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {DAY_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${days === d ? 'var(--accent)' : 'var(--border-default)'}`,
              background: days === d ? 'var(--accent-glow)' : 'transparent',
              color: days === d ? 'var(--accent)' : 'var(--text-secondary)', transition: 'all 0.15s',
            }}>{d}d</button>
          ))}
        </div>

        {/* Risk */}
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="input" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}>
          <option value="">All Risk</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>

        {/* Event type */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}>
          <option value="">All Types</option>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Policy result */}
        <select value={filterPolicy} onChange={e => setFilterPolicy(e.target.value)} className="input" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}>
          <option value="">All Policy</option>
          <option value="passed">Passed</option>
          <option value="blocked">Blocked</option>
        </select>

        {/* Trace search */}
        <input
          value={traceSearch}
          onChange={e => setTraceSearch(e.target.value)}
          placeholder="Search trace ID..."
          className="input"
          style={{ width: 180, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
        />

        {/* Group toggle */}
        <button
          onClick={() => setGroupByTrace(g => !g)}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${groupByTrace ? '#A855F7' : 'var(--border-default)'}`,
            background: groupByTrace ? 'rgba(168,85,247,0.1)' : 'transparent',
            color: groupByTrace ? '#A855F7' : 'var(--text-secondary)', transition: 'all 0.15s',
          }}
        >
          {groupByTrace ? '📦 Trace View' : '📋 Flat View'}
        </button>

        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {data.total.toLocaleString()} total
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        {/* Column headers */}
        {!groupByTrace && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px 70px 80px',
            gap: '0.75rem', padding: '0.5rem 0.75rem',
            borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0,
          }}>
            <ColHeader>Tool / Agent</ColHeader>
            <ColHeader>Type</ColHeader>
            <ColHeader>Risk</ColHeader>
            <ColHeader>Policy</ColHeader>
            <ColHeader style={{ textAlign: 'right' }}>Latency</ColHeader>
            <ColHeader style={{ textAlign: 'right' }}>Time</ColHeader>
          </div>
        )}

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span> Loading audit events...
            </div>
          ) : data.events.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              <span>No events found for this filter combination</span>
            </div>
          ) : groupByTrace ? (
            Object.entries(traceGroups).map(([traceId, evs]) => (
              <TraceGroup key={traceId} traceId={traceId} events={evs} selectedId={selectedEvent?.id} onSelect={setSelectedEvent} />
            ))
          ) : (
            data.events.map(ev => (
              <EventRow key={ev.id} event={ev} selected={selectedEvent?.id === ev.id} onSelect={setSelectedEvent} />
            ))
          )}
        </div>

        {/* Pagination */}
        <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={50} onPage={setPage} />
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedEvent && <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
