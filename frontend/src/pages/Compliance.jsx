import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api/client';

// --- Static mock data removed ---

const STATUS_CFG = {
  compliant:  { color: '#10B981', label: 'Compliant',  bg: 'rgba(16,185,129,0.1)' },
  monitored:  { color: '#00E5FF', label: 'Monitored',  bg: 'rgba(0,229,255,0.1)' },
  enforced:   { color: '#A855F7', label: 'Enforced',   bg: 'rgba(168,85,247,0.1)' },
  partial:    { color: '#F59E0B', label: 'Partial',    bg: 'rgba(245,158,11,0.1)' },
  failing:    { color: '#EF4444', label: 'Failing',    bg: 'rgba(239,68,68,0.1)' },
};

const FRAMEWORKS = {
  nist:  { label: 'NIST AI RMF',         color: '#A855F7', gradient: ['#A855F7','#7C3AED'] },
  owasp: { label: 'OWASP Agentic Top 10',color: '#F97316', gradient: ['#F97316','#EA580C'] },
  iso:   { label: 'ISO 42001',           color: '#00E5FF', gradient: ['#00E5FF','#0891B2'] },
};

// -- Helpers ---
function scoreColor(s) {
  if (s >= 90) return '#10B981';
  if (s >= 75) return '#00E5FF';
  if (s >= 55) return '#F59E0B';
  return '#EF4444';
}

function scoreLabel(s) {
  if (s >= 90) return 'Excellent';
  if (s >= 75) return 'Good';
  if (s >= 55) return 'Fair';
  return 'At Risk';
}

// --- Animated Score Ring ---
function ScoreRing({ score, size = 120, stroke = 10, color, label, sub }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-deep)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: size > 100 ? '1.75rem' : '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>{score}</span>
        {label && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

// --- Animated Score Bar ---
function ScoreBar({ name, score, id, status, description, delay = 0 }) {
  const c = scoreColor(score);
  const s = STATUS_CFG[status] || STATUS_CFG.partial;
  return (
    <div style={{ padding: '0.75rem', background: 'var(--bg-deep)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: 6 }}>{id}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status && (
            <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}40`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {s.label}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: c }}>{score}%</span>
        </div>
      </div>
      {description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>{description}</div>}
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay, duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${c}aa, ${c})`, borderRadius: 999, boxShadow: `0 0 6px ${c}60` }}
        />
      </div>
    </div>
  );
}

// --- Framework Card ---
function FrameworkCard({ fwKey, data, selected, onClick }) {
  const fw = FRAMEWORKS[fwKey];
  const c = fw.color;
  const overall = data?.overall || 0;
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: `0 8px 32px ${c}20` }}
      style={{
        cursor: 'pointer',
        background: selected ? `linear-gradient(135deg, ${c}15, ${c}05)` : 'var(--bg-card)',
        border: `1px solid ${selected ? c : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '1.25rem',
        transition: 'all 0.2s',
        boxShadow: selected ? `0 0 20px ${c}20` : 'none',
      }}
    >
      <ScoreRing score={overall} size={88} stroke={8} color={c} label="score" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Framework</div>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{fw.label}</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: c, fontWeight: 700 }}>{scoreLabel(overall)}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· {(data?.controls || []).length} controls</span>
        </div>
      </div>
    </motion.div>
  );
}

// --- Radar chart custom tooltip ---
const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-muted)' }}>{d.name}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d.score}%</div>
    </div>
  );
};

// --- Stats chip ---
function StatChip({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.75rem 1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// --- Main Page ---
export default function Compliance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('nist');

  useEffect(() => {
    setLoading(true);
    api.qFetch(`/audit/compliance/summary?days=${days}`)
      .then(d => { if (d?.overall != null) setData(d); else setData(null); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading real-time compliance data...</div>;
  }

  const d = data;
  if (!d) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No compliance data available. Connect an agent to begin auditing.</div>;
  }

  const fw = FRAMEWORKS[activeTab];
  const fwData = d[activeTab];
  const controls = fwData?.controls || [];

  // Radar data from nist controls or owasp top 5
  const radarData = activeTab === 'nist'
    ? controls.map(c => ({ name: c.name, score: c.score }))
    : controls.slice(0, 8).map(c => ({ name: c.id, score: c.score }));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Compliance <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            NIST AI RMF · OWASP Agentic Top 10 · ISO 42001 — real-time gap analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 30, 90].map(n => (
            <button
              key={n}
              onClick={() => setDays(n)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${days === n ? 'var(--accent)' : 'var(--border-default)'}`,
                background: days === n ? 'var(--accent-glow)' : 'transparent',
                color: days === n ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >{n}d</button>
          ))}
        </div>
      </div>

      {/* Overall hero row */}
      <motion.div
        className="grid grid-4 gap-md"
        style={{ marginBottom: 'var(--space-lg)' }}
        variants={container} initial="hidden" animate="show"
      >
        {/* Master score ring */}
        <motion.div variants={item} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', gridColumn: 'span 1' }}>
          <ScoreRing score={d.overall} size={100} stroke={10} color={scoreColor(d.overall)} label="overall" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Health</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor(d.overall), marginTop: 4 }}>{scoreLabel(d.overall)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Last {d.timeframe_days} days</div>
          </div>
        </motion.div>

        {/* Stats */}
        {[
          { label: 'Events Tracked',     value: d.summary.total_events,      color: 'var(--accent)' },
          { label: 'Policy Violations',  value: d.summary.total_violations,   color: '#F97316' },
          { label: 'Events Blocked',     value: d.summary.blocked_events,     color: '#EF4444' },
        ].map(s => (
          <motion.div key={s.label} variants={item} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StatChip {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* Framework cards */}
      <div className="grid grid-3 gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
        {['nist', 'owasp', 'iso'].map(fw => (
          <FrameworkCard key={fw} fwKey={fw} data={d[fw]} selected={activeTab === fw} onClick={() => setActiveTab(fw)} />
        ))}
      </div>

      {/* Detail panel */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="compliance-detail-grid"
      >
        {/* Controls list */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              <span style={{ color: fw.color }}>●</span> {fw.label} — Control Breakdown
            </h3>
            <span style={{ fontSize: '0.75rem', color: fw.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {fwData?.overall}% overall
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {controls.map((c, i) => (
              <ScoreBar
                key={c.id}
                id={c.id}
                name={c.name}
                score={c.score}
                status={c.status}
                description={c.description}
                delay={i * 0.06}
              />
            ))}
          </div>
        </div>

        {/* Right panel: radar + summary chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Radar chart */}
          <div className="glass-card" style={{ flex: '0 0 auto' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-md)' }}> Radar Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#55556A', fontSize: 10 }} />
                <Radar
                  dataKey="score"
                  stroke={fw.color}
                  fill={fw.color}
                  fillOpacity={0.18}
                  strokeWidth={2}
                  dot={{ r: 3, fill: fw.color }}
                />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Agent compliance chips */}
          <div className="glass-card">
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-md)' }}> Agent Health</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <StatChip label="Total Agents"    value={d.summary.total_agents}      color="var(--accent)" />
              <StatChip label="Active"          value={d.summary.active_agents}      color="#10B981" />
              <StatChip label="Quarantined"     value={d.summary.quarantined_agents} color="#A855F7" />
              <StatChip label="High Risk Events" value={d.summary.high_risk_events}  color="#F97316" />
            </div>
          </div>

          {/* Status legend */}
          <div className="glass-card">
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-md)' }}> Status Legend</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}80`, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {key === 'compliant' && 'Control fully met'}
                    {key === 'monitored' && 'Under active watch'}
                    {key === 'enforced'  && 'Policy-enforced'}
                    {key === 'partial'   && 'Partially implemented'}
                    {key === 'failing'   && 'Gap identified'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
