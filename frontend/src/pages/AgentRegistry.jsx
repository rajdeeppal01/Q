import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Bot, Plus, RefreshCw, Key, Pause, Play, Ban, Shield,
  ChevronDown, X, Copy, Check, AlertTriangle, Zap, Clock
} from 'lucide-react';

// --- Helpers ---
const RISK_CONFIG = {
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Low' },
  medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'Medium' },
  high:     { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  label: 'High' },
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Critical' },
};

const STATUS_CONFIG = {
  active:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  icon: '●', label: 'Active' },
  paused:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: '', label: 'Paused' },
  revoked:     { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: '✕', label: 'Revoked' },
  quarantined: { color: '#A855F7', bg: 'rgba(168,85,247,0.1)',  icon: '', label: 'Quarantined' },
};

const FRAMEWORKS = ['LangChain', 'AutoGen', 'CrewAI', 'Custom', 'OpenAI Assistants', 'LlamaIndex'];
const AGENT_TYPES = ['general', 'research', 'data-analysis', 'code-review', 'customer-support', 'financial'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };

// --- Badge ---
function Badge({ type, value }) {
  const cfg = type === 'status' ? STATUS_CONFIG[value] : RISK_CONFIG[value];
  if (!cfg) return null;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase', border: `1px solid ${cfg.color}40`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {type === 'status' && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: cfg.color,
          boxShadow: value === 'active' ? `0 0 6px ${cfg.color}` : 'none',
          animation: value === 'active' ? 'pulse-quarantine 2s infinite' : 'none',
        }} />
      )}
      {cfg.label}
    </span>
  );
}

// --- API Key display ---
function ApiKeyDisplay({ apiKey, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(12px)',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 520, width: '90%',
          boxShadow: '0 0 40px rgba(0,229,255,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={20} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Agent API Key Generated</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Save this now — it will never be shown again</p>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)',
          padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid var(--border-default)', marginBottom: '1rem',
        }}>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)', wordBreak: 'break-all' }}>
            {apiKey}
          </code>
          <button
            onClick={copy}
            style={{
              marginLeft: '1rem', flexShrink: 0, padding: '0.4rem 0.75rem',
              background: copied ? 'rgba(16,185,129,0.15)' : 'var(--accent-glow)',
              border: `1px solid ${copied ? '#10B981' : 'var(--border-accent)'}`,
              borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              color: copied ? '#10B981' : 'var(--accent)', fontSize: '0.8rem',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: '1.5rem' }}>
          <AlertTriangle size={14} color="#F59E0B" />
          <p style={{ fontSize: '0.78rem', color: '#F59E0B' }}>
            Copy and store this key securely. Pass it as <code style={{ fontFamily: 'var(--font-mono)' }}>x-q-api-key</code> in your SDK configuration.
          </p>
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
          Done — I've saved the key
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Register Agent Modal ---
function RegisterModal({ onClose, onRegistered }) {
  const [form, setForm] = useState({ name: '', description: '', agent_type: 'general', framework: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.registerAgent(form);
      onRegistered(data);
    } catch (err) {
      setError(err.message || 'Failed to register agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(12px)',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 500, width: '90%',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-accent)' }}>
              <Bot size={20} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700 }}>Register New Agent</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enroll an AI agent in Q governance</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Agent Name *
            </label>
            <input
              required
              className="input"
              placeholder="e.g. gpt-4-researcher"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="What does this agent do?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ resize: 'vertical', minHeight: 64 }}
            />
          </div>

          {/* Agent Type + Framework */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Agent Type
              </label>
              <select
                className="input"
                value={form.agent_type}
                onChange={e => setForm({ ...form, agent_type: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                {AGENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Framework
              </label>
              <select
                className="input"
                value={form.framework}
                onChange={e => setForm({ ...form, framework: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select framework...</option>
                {FRAMEWORKS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)' }}>Tip:</span> This is just for your organization. If unsure, choose "Custom".
              </p>
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#F87171', fontSize: '0.8rem', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Registering...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Register Agent
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// --- Agent Card ---
function AgentCard({ agent, onStatusChange, onRotateKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const status = STATUS_CONFIG[agent.status] || STATUS_CONFIG.active;
  const risk = RISK_CONFIG[agent.risk_level] || RISK_CONFIG.low;

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    setMenuOpen(false);
    try {
      await api.updateAgentStatus(agent.id, newStatus);
      onStatusChange(agent.id, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRotate = async () => {
    setMenuOpen(false);
    try {
      const data = await api.rotateAgentKey(agent.id);
      onRotateKey(data.new_api_key);
    } catch (err) {
      console.error(err);
    }
  };

  const initials = agent.name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      variants={card}
      className="glass-card"
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', opacity: updating ? 0.6 : 1, cursor: 'pointer' }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px rgba(0,229,255,0.12)` }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/agents/${agent.id}`)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${risk.color}30, ${risk.color}10)`,
            border: `1px solid ${risk.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: risk.color,
            fontFamily: 'var(--font-mono)',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {agent.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {agent.id?.slice(0, 12)}...
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 6, padding: '0.3rem 0.5rem', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 180,
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {agent.status !== 'active' && (
                  <MenuItem icon={<Play size={14} />} label="Activate" onClick={() => handleStatus('active')} color="var(--status-active)" />
                )}
                {agent.status === 'active' && (
                  <MenuItem icon={<Pause size={14} />} label="Pause" onClick={() => handleStatus('paused')} color="var(--status-paused)" />
                )}
                {agent.status !== 'revoked' && (
                  <MenuItem icon={<Ban size={14} />} label="Revoke" onClick={() => handleStatus('revoked')} color="var(--status-revoked)" />
                )}
                {agent.status !== 'quarantined' && (
                  <MenuItem icon={<Shield size={14} />} label="Quarantine" onClick={() => handleStatus('quarantined')} color="var(--status-quarantined)" />
                )}
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                <MenuItem icon={<Key size={14} />} label="Rotate API Key" onClick={handleRotate} color="var(--accent)" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {agent.description}
        </p>
      )}

      {/* Badges row */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge type="status" value={agent.status} />
        <Badge type="risk" value={agent.risk_level} />
        {agent.framework && (
          <span style={{
            padding: '3px 10px', borderRadius: 999,
            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--border-subtle)',
          }}>
            {agent.framework}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={11} color="var(--text-muted)" />
          {agent.agent_type}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} color="var(--text-muted)" />
          {agent.last_heartbeat
            ? `Seen ${new Date(agent.last_heartbeat).toLocaleTimeString()}`
            : 'No heartbeat'}
        </div>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        width: '100%', padding: '0.6rem 1rem', background: 'none', border: 'none',
        cursor: 'pointer', fontSize: '0.8125rem', color: color || 'var(--text-secondary)',
        textAlign: 'left', transition: 'background 0.15s',
      }}
      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseOut={e => e.currentTarget.style.background = 'none'}
    >
      {icon} {label}
    </button>
  );
}

// --- Empty State ---
function EmptyState({ onRegister }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 360, textAlign: 'center', gap: '1.5rem',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
      </div>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Agents Registered</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 360 }}>
          Enroll your first AI agent to bring it under Q governance. You'll get an API key to use with the Q SDK.
        </p>
      </div>
      <button className="btn btn-primary" onClick={onRegister} style={{ gap: '0.5rem' }}>
        <Plus size={16} /> Register Your First Agent
      </button>
    </motion.div>
  );
}

// --- Filters Bar ---
const FILTER_OPTIONS = {
  status: ['all', 'active', 'paused', 'revoked', 'quarantined'],
  risk: ['all', 'low', 'medium', 'high', 'critical'],
};

// --- Main Page ---
export default function AgentRegistry() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [search, setSearch] = useState('');

  const fetchAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleRegistered = (agentData) => {
    setShowRegister(false);
    if (agentData.api_key) setNewApiKey(agentData.api_key);
    fetchAgents();
  };

  const handleStatusChange = (id, newStatus) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const filtered = agents.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterRisk !== 'all' && a.risk_level !== filterRisk) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    quarantined: agents.filter(a => a.status === 'quarantined').length,
    highRisk: agents.filter(a => a.risk_level === 'high' || a.risk_level === 'critical').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Agent <span className="text-gradient">Registry</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
            Enroll, manage and govern all AI agents in your environment
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRegister(true)} style={{ gap: '0.5rem' }}>
          <Plus size={16} /> Register Agent
        </button>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total Agents', value: stats.total, color: 'var(--accent)', icon: <Bot size={18} /> },
          { label: 'Active', value: stats.active, color: '#10B981', icon: <Zap size={18} /> },
          { label: 'Quarantined', value: stats.quarantined, color: '#A855F7', icon: <Shield size={18} /> },
          { label: 'High Risk', value: stats.highRisk, color: '#F97316', icon: <AlertTriangle size={18} /> },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {FILTER_OPTIONS.status.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${filterStatus === s ? 'var(--accent)' : 'var(--border-default)'}`,
                background: filterStatus === s ? 'var(--accent-glow)' : 'transparent',
                color: filterStatus === s ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {FILTER_OPTIONS.risk.map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${filterRisk === r ? RISK_CONFIG[r]?.color || 'var(--accent)' : 'var(--border-default)'}`,
                background: filterRisk === r ? `${RISK_CONFIG[r]?.color}18` || 'var(--accent-glow)' : 'transparent',
                color: filterRisk === r ? RISK_CONFIG[r]?.color || 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {r === 'all' ? 'All Risk' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={fetchAgents} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--text-muted)' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Loading agents...
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--risk-high)', gap: 8 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState onRegister={() => setShowRegister(true)} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No agents match your filters
        </div>
      ) : (
        <motion.div
          className="grid grid-3 gap-md"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStatusChange={handleStatusChange}
              onRotateKey={setNewApiKey}
            />
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onRegistered={handleRegistered}
          />
        )}
        {newApiKey && (
          <ApiKeyDisplay apiKey={newApiKey} onClose={() => setNewApiKey(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
