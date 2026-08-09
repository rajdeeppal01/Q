import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '../hooks/useAnalytics';
import ActivityChart from '../components/charts/ActivityChart';
import RiskDonut from '../components/charts/RiskDonut';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

const RISK_COLORS = {
  low: 'var(--risk-low)',
  medium: 'var(--risk-medium)',
  high: 'var(--risk-high)',
  critical: 'var(--risk-critical)',
};

function KpiCard({ label, value, sub, color, icon, trend }) {
  return (
    <motion.div variants={item} className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 'var(--space-xs)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}

function ComplianceBar({ label, score, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
          {score}%
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-deep)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color}, var(--accent))`,
            borderRadius: 'var(--radius-pill)',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const colors = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };
  const c = colors[level] || '#55556A';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '0px',
      background: `${c}20`, color: c,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.05em', border: `1px solid ${c}40`,
    }}>
      {level}
    </span>
  );
}

function LiveEventRow({ ev }) {
  const time = new Date(ev.created_at).toLocaleTimeString('en-US', { hour12: false });
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-deep)',
        fontSize: '0.8125rem',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{ev.tool_name}</span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>· {ev.agent_name}</span>
      </div>
      <RiskBadge level={ev.risk_level} />
      <span style={{ color: ev.policy_passed ? 'var(--status-active)' : 'var(--risk-high)', fontSize: '0.75rem' }}>
        {ev.policy_passed ? '✓ PASS' : '✗ BLOCK'}
      </span>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{time}</span>
    </motion.div>
  );
}

function AgentRiskBar({ agent, maxScore }) {
  const pct = maxScore > 0 ? (agent.score / maxScore) * 100 : 0;
  const color = pct > 70 ? '#EF4444' : pct > 40 ? '#F97316' : pct > 20 ? '#F59E0B' : '#10B981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 0, flexShrink: 0,
        background: `${color}20`, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 800, color,
      }}>
        {agent.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.name}
          </span>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color, flexShrink: 0, marginLeft: 8 }}>
            {agent.score}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-deep)', borderRadius: '0px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.4 + Math.random() * 0.3, duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: color, borderRadius: '0px', boxShadow: `0 0 6px ${color}80` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { events, activityHistory, riskCounts, complianceScores, topAgentsByRisk, kpis, wsConnected } = useAnalytics();
  const maxScore = topAgentsByRisk[0]?.score || 1;

  const complianceConfig = [
    { label: 'NIST AI RMF', score: complianceScores.nist, color: '#A855F7' },
    { label: 'OWASP Agentic Top 10', score: complianceScores.owasp, color: '#F97316' },
    { label: 'ISO 42001', score: complianceScores.iso, color: '#00E5FF' },
  ];

  const kpiCards = [
    { label: 'Events Tracked', value: kpis.totalEvents, icon: '', color: 'var(--accent)', sub: 'Last 50 events' },
    { label: 'Actions Blocked', value: kpis.blockedActions, icon: '', color: 'var(--status-revoked)', sub: 'Policy violations' },
    { label: 'High Risk Events', value: kpis.highRiskEvents, icon: '', color: 'var(--risk-high)', sub: 'High + Critical' },
    { label: 'Avg Latency', value: `${kpis.avgLatency}ms`, icon: '', color: 'var(--status-active)', sub: 'Tool call latency' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Mission <span className="text-gradient">Control</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
            Real-time analytics & telemetry for all governed AI agents
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '0%',
            background: wsConnected ? 'var(--status-active)' : 'var(--risk-medium)',
            boxShadow: wsConnected ? '0 0 8px var(--status-active)' : 'none',
          }} />
          <span style={{ color: 'var(--accent)' }}>
            {wsConnected ? 'Live WebSocket' : 'Simulated Feed'}
          </span>
        </div>
      </div>

      {/* Zone 1 — KPI Strip */}
      <motion.div className="grid grid-4 gap-md" variants={container} initial="hidden" animate="show">
        {kpiCards.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </motion.div>

      {/* Zone 2 — Charts Row */}
      <motion.div
        className="grid grid-2 gap-md"
        style={{ marginTop: 'var(--space-md)' }}
        variants={container} initial="hidden" animate="show"
      >
        {/* Activity Chart */}
        <motion.div variants={item} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Event Activity</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              events / sec
            </span>
          </div>
          <ActivityChart data={activityHistory} />
          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {[['Low','#00E5FF'],['Medium','#F59E0B'],['High','#F97316'],['Critical','#EF4444']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Donut */}
        <motion.div variants={item} className="glass-card">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Risk Distribution</h3>
          </div>
          <RiskDonut riskCounts={riskCounts} />
        </motion.div>
      </motion.div>

      {/* Zone 3 — Bottom Panel */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}
        variants={container} initial="hidden" animate="show"
      >
        {/* Live Event Feed */}
        <motion.div variants={item} className="glass-card" style={{ minHeight: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Live Event Feed</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {events.length} events
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', maxHeight: 280, overflowY: 'auto' }}>
            <AnimatePresence initial={false}>
              {events.slice(0, 8).map((ev) => (
                <LiveEventRow key={ev.id} ev={ev} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Compliance Scorecard */}
        <motion.div variants={item} className="glass-card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Compliance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {complianceConfig.map((c) => (
              <ComplianceBar key={c.label} {...c} />
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-sm)', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              {Math.round((complianceScores.nist + complianceScores.owasp + complianceScores.iso) / 3)}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Overall Score</div>
          </div>
        </motion.div>

        {/* Top Agents by Risk */}
        <motion.div variants={item} className="glass-card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Risk by Agent</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {topAgentsByRisk.map((agent) => (
              <AgentRiskBar key={agent.id} agent={agent} maxScore={maxScore} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
