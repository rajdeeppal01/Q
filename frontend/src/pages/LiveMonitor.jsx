import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WS_URL } from '../api/config';
import { api } from '../api/client';

// --- Config ---
const RISK_COLORS = {
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  glow: 'rgba(16,185,129,0.3)' },
  medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  glow: 'rgba(245,158,11,0.3)' },
  high:     { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  glow: 'rgba(249,115,22,0.3)' },
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   glow: 'rgba(239,68,68,0.5)' },
};

const EVENT_TYPE_ICONS = {
  tool_call:   '🔧',
  llm_invoke:  '🤖',
  data_access: '🗄️',
  error:       '❌',
  heartbeat:   '💓',
  decision:    '🧠',
  default:     '📡',
};

const MOCK_AGENTS = [
  { id: 'ag-001', name: 'gpt-4-researcher' },
  { id: 'ag-002', name: 'claude-analyst' },
  { id: 'ag-003', name: 'data-pipeline-bot' },
  { id: 'ag-004', name: 'code-reviewer' },
  { id: 'ag-005', name: 'financial-advisor' },
  { id: 'ag-006', name: 'support-router' },
];

const MOCK_TOOLS = ['web_search','read_file','write_file','query_database','send_email','api_call','execute_code','access_pii','llm_plan','memory_update'];
const RISK_WEIGHTS = ['low','low','low','low','medium','medium','high','critical'];

function generateMockEvent(i) {
  const agent = MOCK_AGENTS[i % MOCK_AGENTS.length];
  const risk = RISK_WEIGHTS[Math.floor(Math.random() * RISK_WEIGHTS.length)];
  const types = ['tool_call','llm_invoke','data_access','decision','error'];
  const etype = types[Math.floor(Math.random() * (risk === 'critical' ? types.length : 3))];
  return {
    id: `ev-${Date.now()}-${i}`,
    agent_id: agent.id,
    agent_name: agent.name,
    tool_name: MOCK_TOOLS[Math.floor(Math.random() * MOCK_TOOLS.length)],
    event_type: etype,
    risk_level: risk,
    latency_ms: Math.floor(Math.random() * 900) + 30,
    policy_passed: risk !== 'critical' ? Math.random() > 0.15 : Math.random() > 0.6,
    trace_id: `tr-${Math.floor(Math.random() * 999).toString().padStart(3,'0')}`,
    input_data: { query: `sample_input_${i}` },
    output_data: { result: `sample_output_${i}` },
    created_at: new Date().toISOString(),
  };
}

// --- Event Row ---
function EventRow({ event, onClick, isSelected }) {
  const risk = RISK_COLORS[event.risk_level] || RISK_COLORS.low;
  const icon = EVENT_TYPE_ICONS[event.event_type] || EVENT_TYPE_ICONS.default;
  const time = new Date(event.created_at).toLocaleTimeString('en-US', { hour12: false });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(event)}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 120px 80px 80px 70px 60px',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderLeft: `3px solid ${isSelected ? risk.color : 'transparent'}`,
        background: isSelected ? risk.bg : 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.15s',
        fontSize: '0.8rem',
      }}
      onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
      onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Icon */}
      <span style={{ fontSize: '0.9rem', textAlign: 'center' }}>{icon}</span>

      {/* Agent + Tool */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: risk.color, fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            {event.tool_name || event.event_type}
          </span>
          {event.trace_id && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-deep)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              {event.trace_id}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 1 }}>
          {event.agent_name || event.agent_id?.slice(0, 14)}
        </div>
      </div>

      {/* Event Type */}
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
        {event.event_type}
      </span>

      {/* Risk Badge */}
      <span style={{
        padding: '2px 8px', borderRadius: 999, textAlign: 'center',
        background: risk.bg, color: risk.color, fontSize: '0.68rem',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        border: `1px solid ${risk.color}40`,
      }}>
        {event.risk_level}
      </span>

      {/* Policy */}
      <span style={{
        color: event.policy_passed ? '#10B981' : '#EF4444',
        fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
      }}>
        {event.policy_passed ? '✓ PASS' : '✗ BLOCK'}
      </span>

      {/* Latency */}
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'right' }}>
        {event.latency_ms ? `${Math.round(event.latency_ms)}ms` : '—'}
      </span>

      {/* Time */}
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textAlign: 'right' }}>
        {time}
      </span>
    </motion.div>
  );
}

// --- Detail Panel ---
function EventDetail({ event, onClose }) {
  const risk = RISK_COLORS[event.risk_level] || RISK_COLORS.low;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{
        width: 360,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderLeft: `1px solid ${risk.color}40`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: `1px solid ${risk.color}30`,
        background: risk.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: risk.color }}>
            {EVENT_TYPE_ICONS[event.event_type]} {event.tool_name || event.event_type}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {event.id?.slice(0, 20)}...
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Agent', value: event.agent_name || event.agent_id?.slice(0, 14) },
            { label: 'Risk Level', value: event.risk_level, color: risk.color },
            { label: 'Event Type', value: event.event_type },
            { label: 'Policy', value: event.policy_passed ? 'PASSED' : 'BLOCKED', color: event.policy_passed ? '#10B981' : '#EF4444' },
            { label: 'Latency', value: event.latency_ms ? `${Math.round(event.latency_ms)}ms` : '—' },
            { label: 'Trace ID', value: event.trace_id || '—', mono: true },
          ].map(field => (
            <div key={field.label} style={{ background: 'var(--bg-deep)', borderRadius: 6, padding: '0.6rem 0.75rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{field.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: field.color || 'var(--text-primary)', fontFamily: field.mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>
                {field.value}
              </div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Timestamp</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {new Date(event.created_at).toLocaleString()}
          </div>
        </div>

        {/* Input Data */}
        {event.input_data && Object.keys(event.input_data).length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Input Data</div>
            <pre style={{
              background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem',
              color: 'var(--accent)', fontFamily: 'var(--font-mono)',
              overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              margin: 0,
            }}>
              {JSON.stringify(event.input_data, null, 2)}
            </pre>
          </div>
        )}

        {/* Output / Error */}
        {event.error_message ? (
          <div>
            <div style={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Error</div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: '#F87171', fontFamily: 'var(--font-mono)' }}>
              {event.error_message}
            </div>
          </div>
        ) : event.output_data && Object.keys(event.output_data).length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Output Data</div>
            <pre style={{
              background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem',
              color: '#10B981', fontFamily: 'var(--font-mono)',
              overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              margin: 0,
            }}>
              {JSON.stringify(event.output_data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Stats bar ---
function StatsBar({ events, wsConnected, paused }) {
  const counts = events.reduce((acc, e) => { acc[e.risk_level] = (acc[e.risk_level] || 0) + 1; return acc; }, {});
  const blocked = events.filter(e => !e.policy_passed).length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1.5rem',
      padding: '0.6rem 1rem',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: '0.78rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: wsConnected ? '#10B981' : '#F59E0B', boxShadow: wsConnected ? '0 0 6px #10B981' : 'none', animation: wsConnected && !paused ? 'pulse-quarantine 1.5s infinite' : 'none' }} />
        <span style={{ color: 'var(--text-muted)' }}>{wsConnected ? 'Live' : 'Simulated'}</span>
      </div>
      <span style={{ color: 'var(--text-muted)' }}>Total: <strong style={{ color: 'var(--text-primary)' }}>{events.length}</strong></span>
      {[['low','#10B981'],['medium','#F59E0B'],['high','#F97316'],['critical','#EF4444']].map(([r, c]) => (
        <span key={r} style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: c, fontWeight: 700 }}>{counts[r] || 0}</span> {r}
        </span>
      ))}
      <span style={{ color: '#EF4444' }}>
        <strong>{blocked}</strong> blocked
      </span>
      {paused && (
        <span style={{ marginLeft: 'auto', color: '#F59E0B', fontWeight: 700, fontSize: '0.72rem', background: 'rgba(245,158,11,0.1)', padding: '2px 10px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.3)' }}>
          ⏸ PAUSED
        </span>
      )}
    </div>
  );
}

// --- Main Page ---
export default function LiveMonitor() {
  const [events, setEvents] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [maxEvents, setMaxEvents] = useState(200);
  const feedRef = useRef(null);
  const pausedRef = useRef(false);
  const tickRef = useRef(null);
  const counterRef = useRef(0);

  pausedRef.current = paused;

  const addEvent = useCallback((ev) => {
    if (pausedRef.current) return;
    const enriched = {
      ...ev,
      agent_name: ev.agent_name || MOCK_AGENTS.find(a => a.id === ev.agent_id)?.name || ev.agent_id?.slice(0, 14) || 'unknown',
      created_at: ev.created_at || new Date().toISOString(),
    };
    setEvents(prev => [enriched, ...prev].slice(0, maxEvents));
  }, [maxEvents]);

  // Simulated events ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (!wsConnected) {
        addEvent(generateMockEvent(counterRef.current++));
      }
    }, 1200);
    return () => clearInterval(tickRef.current);
  }, [wsConnected, addEvent]);

  // WebSocket
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(`${WS_URL}/ws/monitor`);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'event' && msg.data) addEvent(msg.data);
        } catch {}
      };
    } catch {}
    return () => ws?.close();
  }, [addEvent]);

  // Seed initial events
  useEffect(() => {
    const seed = Array.from({ length: 30 }, (_, i) => generateMockEvent(i));
    setEvents(seed);
  }, []);

  const agentOptions = [...new Set(events.map(e => e.agent_name || e.agent_id).filter(Boolean))];
  const typeOptions  = [...new Set(events.map(e => e.event_type).filter(Boolean))];

  const filtered = events.filter(e => {
    if (filterRisk !== 'all' && e.risk_level !== filterRisk) return false;
    if (filterAgent !== 'all' && (e.agent_name || e.agent_id) !== filterAgent) return false;
    if (filterType !== 'all' && e.event_type !== filterType) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2.5rem)', gap: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 1rem 0', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Live <span className="text-gradient">Monitor</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time event stream from all governed AI agents
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setPaused(p => !p)}
            className={paused ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            style={{ gap: 6, display: 'flex', alignItems: 'center' }}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={() => setEvents([])}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
          >
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '0.5rem',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Filter:</span>

        {/* Risk filter */}
        <select
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="input"
          style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}
        >
          <option value="all">All Risk</option>
          {['low','medium','high','critical'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>

        {/* Agent filter */}
        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          className="input"
          style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}
        >
          <option value="all">All Agents</option>
          {agentOptions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Event type filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="input"
          style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}
        >
          <option value="all">All Types</option>
          {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {filtered.length} / {events.length} events
        </span>
      </div>

      {/* Main area: table + detail panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>

        {/* Event table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Stats bar */}
          <StatsBar events={events} wsConnected={wsConnected} paused={paused} />

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 120px 80px 80px 70px 60px',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            <span />
            <span>Tool / Agent</span>
            <span>Type</span>
            <span>Risk</span>
            <span>Policy</span>
            <span style={{ textAlign: 'right' }}>Latency</span>
            <span style={{ textAlign: 'right' }}>Time</span>
          </div>

          {/* Scrollable event list */}
          <div ref={feedRef} style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: '0.875rem', gap: '0.5rem' }}>
                📡 Waiting for events...
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((ev) => (
                  <EventRow
                    key={ev.id}
                    event={ev}
                    onClick={setSelectedEvent}
                    isSelected={selectedEvent?.id === ev.id}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Detail side panel */}
        <AnimatePresence>
          {selectedEvent && (
            <EventDetail
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
