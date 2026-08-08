import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../api/config';

// --- Simulated Data Seed ---
const MOCK_AGENTS = [
  { id: 'ag-001', name: 'gpt-4-researcher', framework: 'LangChain', risk_level: 'low' },
  { id: 'ag-002', name: 'claude-analyst', framework: 'AutoGen', risk_level: 'medium' },
  { id: 'ag-003', name: 'data-pipeline-bot', framework: 'Custom', risk_level: 'high' },
  { id: 'ag-004', name: 'code-reviewer', framework: 'CrewAI', risk_level: 'low' },
  { id: 'ag-005', name: 'financial-advisor', framework: 'LangChain', risk_level: 'critical' },
  { id: 'ag-006', name: 'support-router', framework: 'Custom', risk_level: 'low' },
];

const MOCK_TOOLS = [
  'web_search', 'read_file', 'write_file', 'query_database',
  'send_email', 'api_call', 'execute_code', 'access_pii',
];

const RISK_LEVELS = ['low', 'low', 'low', 'medium', 'medium', 'high', 'critical'];

function generateMockEvent(i) {
  const agent = MOCK_AGENTS[i % MOCK_AGENTS.length];
  const risk = RISK_LEVELS[Math.floor(Math.random() * RISK_LEVELS.length)];
  return {
    id: `ev-${Date.now()}-${i}`,
    agent_id: agent.id,
    agent_name: agent.name,
    tool_name: MOCK_TOOLS[Math.floor(Math.random() * MOCK_TOOLS.length)],
    event_type: 'tool_call',
    risk_level: risk,
    latency_ms: Math.floor(Math.random() * 800) + 50,
    policy_passed: risk !== 'critical' ? Math.random() > 0.15 : Math.random() > 0.5,
    created_at: new Date(Date.now() - i * 3000).toISOString(),
  };
}

function buildInitialHistory() {
  // 60 ticks of simulated activity (last 60 seconds)
  return Array.from({ length: 60 }, (_, i) => {
    const base = Math.floor(Math.random() * 8) + 2;
    return {
      time: new Date(Date.now() - (59 - i) * 1000).toLocaleTimeString('en-US', { hour12: false }),
      total: base,
      low: Math.max(0, base - Math.floor(Math.random() * 3)),
      medium: Math.floor(Math.random() * 2),
      high: Math.random() > 0.7 ? 1 : 0,
      critical: Math.random() > 0.9 ? 1 : 0,
    };
  });
}

function buildInitialEvents(count = 15) {
  return Array.from({ length: count }, (_, i) => generateMockEvent(i));
}

function computeRiskCounts(events) {
  return events.reduce((acc, ev) => {
    acc[ev.risk_level] = (acc[ev.risk_level] || 0) + 1;
    return acc;
  }, { low: 0, medium: 0, high: 0, critical: 0 });
}

function computeComplianceScores(events) {
  const total = events.length || 1;
  const passed = events.filter(e => e.policy_passed).length;
  const highRisk = events.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length;
  const policyRate = passed / total;
  const riskRate = 1 - (highRisk / total);

  return {
    nist: Math.round(Math.min(95, (policyRate * 60 + riskRate * 40) * 100)),
    owasp: Math.round(Math.min(92, (policyRate * 50 + riskRate * 50) * 100)),
    iso: Math.round(Math.min(89, (policyRate * 55 + riskRate * 45) * 100)),
  };
}

function computeAgentRisk(events, agents) {
  const riskMap = { low: 1, medium: 3, high: 7, critical: 15 };
  const agentScores = {};

  events.forEach(ev => {
    if (!agentScores[ev.agent_id]) {
      agentScores[ev.agent_id] = { id: ev.agent_id, name: ev.agent_name, score: 0, count: 0 };
    }
    agentScores[ev.agent_id].score += riskMap[ev.risk_level] || 1;
    agentScores[ev.agent_id].count += 1;
  });

  return Object.values(agentScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// --- Hook ---
export function useAnalytics() {
  const [events, setEvents] = useState(() => buildInitialEvents(15));
  const [activityHistory, setActivityHistory] = useState(() => buildInitialHistory());
  const [wsConnected, setWsConnected] = useState(false);
  const tickRef = useRef(null);

  // Append incoming WebSocket event and update history
  const handleIncomingEvent = useCallback((ev) => {
    const enriched = {
      ...ev,
      agent_name: ev.agent_name || ev.agent_id?.slice(0, 12) || 'unknown',
      created_at: ev.created_at || new Date().toISOString(),
    };

    setEvents(prev => [enriched, ...prev].slice(0, 50));

    setActivityHistory(prev => {
      const last = prev[prev.length - 1];
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const risk = ev.risk_level || 'low';
      if (last && last.time === now) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          total: last.total + 1,
          [risk]: (last[risk] || 0) + 1,
        };
        return updated;
      }
      return [...prev.slice(-59), {
        time: now,
        total: 1,
        low: risk === 'low' ? 1 : 0,
        medium: risk === 'medium' ? 1 : 0,
        high: risk === 'high' ? 1 : 0,
        critical: risk === 'critical' ? 1 : 0,
      }];
    });
  }, []);

  // Simulate live ticks when no real WebSocket data
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (!wsConnected) {
        const mockEv = generateMockEvent(Math.floor(Math.random() * 100));
        handleIncomingEvent(mockEv);
      }
    }, 2500);
    return () => clearInterval(tickRef.current);
  }, [wsConnected, handleIncomingEvent]);

  // WebSocket connection
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
          if (msg.type === 'event' && msg.data) handleIncomingEvent(msg.data);
        } catch {}
      };
    } catch {}
    return () => ws?.close();
  }, [handleIncomingEvent]);

  const riskCounts = computeRiskCounts(events);
  const complianceScores = computeComplianceScores(events);
  const topAgentsByRisk = computeAgentRisk(events, MOCK_AGENTS);

  const kpis = {
    totalEvents: events.length,
    blockedActions: events.filter(e => !e.policy_passed).length,
    highRiskEvents: events.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length,
    avgLatency: events.length > 0
      ? Math.round(events.slice(0, 20).reduce((s, e) => s + (e.latency_ms || 0), 0) / Math.min(events.length, 20))
      : 0,
  };

  return { events, activityHistory, riskCounts, complianceScores, topAgentsByRisk, kpis, wsConnected };
}
