import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { WS_URL } from '../api/config';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch initial data
    Promise.all([
      api.getAgents(),
      api.getAlerts(),
      api.getApprovals()
    ]).then(([agentsData, alertsData, approvalsData]) => {
      setAgents(agentsData);
      setAlerts(alertsData.filter(a => a.status === 'open'));
      setApprovals(approvalsData);
    }).catch(console.error);

    // Setup WebSocket for live telemetry
    const ws = new WebSocket(`${WS_URL}/ws/monitor`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'event') {
          setEvents(prev => [msg.data, ...prev].slice(0, 10)); // Keep last 10
        } else if (msg.type === 'alert') {
          api.getAlerts().then(data => setAlerts(data.filter(a => a.status === 'open')));
        } else if (msg.type === 'approval_request') {
          api.getApprovals().then(setApprovals);
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  const stats = [
    { label: 'Total Agents', value: agents.length.toString(), color: 'var(--accent)', icon: '🤖' },
    { label: 'Active Agents', value: agents.filter(a => a.status === 'active').length.toString(), color: 'var(--status-active)', icon: '⚡' },
    { label: 'Open Alerts', value: alerts.length.toString(), color: 'var(--risk-high)', icon: '🔔' },
    { label: 'Pending Approvals', value: approvals.length.toString(), color: 'var(--status-paused)', icon: '⏳' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Mission <span className="text-gradient">Control</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
          Real-time overview of all governed AI agents
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-4 gap-md"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="glass-card"
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: stat.color,
              lineHeight: 1,
            }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Placeholder panels */}
      <motion.div
        className="grid grid-2 gap-md"
        style={{ marginTop: 'var(--space-xl)' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Events Feed */}
        <motion.div variants={item} className="glass-card" style={{ minHeight: 300 }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>
            📡 Live Event Feed
          </h3>
          {events.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200,
              color: 'var(--text-muted)', fontSize: '0.875rem', borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-default)'
            }}>
              Waiting for agent telemetry...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {events.map((ev, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{
                    padding: 'var(--space-sm)', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between'
                  }}>
                  <span><strong style={{color: 'var(--accent)'}}>{ev.tool_name || ev.event_type}</strong></span>
                  <span style={{color: ev.risk_level === 'high' ? 'var(--risk-high)' : 'var(--text-secondary)'}}>{ev.risk_level.toUpperCase()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Compliance Overview */}
        <motion.div variants={item} className="glass-card" style={{ minHeight: 300 }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>
            🛡️ Compliance Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {['NIST AI RMF', 'OWASP Agentic Top 10', 'ISO 42001'].map((framework) => (
              <div key={framework}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{framework}</span>
                  <span className="text-mono" style={{ color: 'var(--text-muted)' }}>—</span>
                </div>
                <div style={{
                  height: 6,
                  background: 'var(--bg-deep)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '0%' }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent), #A855F7)',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Alerts */}
      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        className="glass-card"
        style={{ marginTop: 'var(--space-md)', minHeight: 200 }}
      >
        <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>
          🚨 Recent Alerts
        </h3>
        {alerts.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120,
            color: 'var(--text-muted)', fontSize: '0.875rem', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-default)',
          }}>
            No alerts — all agents operating within policy boundaries
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {alerts.slice(0, 3).map(alert => (
              <div key={alert.id} style={{
                padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--risk-high)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.875rem'
              }}>
                <div style={{fontWeight: 700, color: 'var(--risk-high)', marginBottom: '4px'}}>{alert.message}</div>
                <div style={{color: 'var(--text-secondary)'}}>Agent: {alert.agent_id}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
