import { useState, useEffect, useCallback } from 'react';
import { WS_URL } from '../api/config';

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

  if (events.length === 0) {
    return { nist: 100, owasp: 100, iso: 100 };
  }

  return {
    nist: Math.round(Math.min(95, (policyRate * 60 + riskRate * 40) * 100)),
    owasp: Math.round(Math.min(92, (policyRate * 50 + riskRate * 50) * 100)),
    iso: Math.round(Math.min(89, (policyRate * 55 + riskRate * 45) * 100)),
  };
}

function computeAgentRisk(events) {
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

export function useAnalytics() {
  const [events, setEvents] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

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
  const topAgentsByRisk = computeAgentRisk(events);

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
