import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

// ─── Badge pill ───────────────────────────────────────────────────────────────
function Badge({ count, color }) {
  if (!count || count === 0) return null;
  return (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      style={{
        marginLeft: 'auto',
        minWidth: 18, height: 18,
        borderRadius: 999,
        background: color,
        color: '#fff',
        fontSize: '0.65rem',
        fontWeight: 800,
        fontFamily: 'var(--font-mono)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 5px',
        boxShadow: `0 0 8px ${color}80`,
        flexShrink: 0,
      }}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const navItems = [
  {
    label: 'Mission Control',
    path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Agent Registry',
    path: '/agents',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Live Monitor',
    path: '/monitor',
    liveIndicator: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: 'Policies',
    path: '/policies',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'Approvals',
    path: '/approvals',
    badgeKey: 'approvals',
    badgeColor: '#F59E0B',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: 'Audit Trail',
    path: '/audit',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Compliance',
    path: '/compliance',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    path: '/alerts',
    badgeKey: 'alerts',
    badgeColor: '#EF4444',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const [counts, setCounts] = useState({ alerts: 0, approvals: 0 });

  const fetchCounts = useCallback(async () => {
    try {
      const [alertsData, approvalsData] = await Promise.all([
        api.getAlerts().catch(() => []),
        api.getApprovals().catch(() => []),
      ]);
      setCounts({
        alerts:    Array.isArray(alertsData)    ? alertsData.filter(a => a.status === 'open').length : 0,
        approvals: Array.isArray(approvalsData) ? approvalsData.length : 0,
      });
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return (
    <nav className="sidebar">
      {/* Logo */}
      <NavLink to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
          <div className="flex items-center gap-sm">
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent), #A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem',
              color: 'var(--bg-void)', boxShadow: 'var(--shadow-glow)',
            }}>
              Q
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>Q</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Agent Governance
              </div>
            </div>
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && item.path !== '/' && location.pathname.startsWith(item.path));
          const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                  padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.855rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 229, 255, 0.15)' : '1px solid transparent',
                  transition: 'all 200ms ease', cursor: 'pointer',
                }}
              >
                {/* Live indicator dot for monitor */}
                {item.liveIndicator ? (
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#10B981', boxShadow: '0 0 6px #10B981',
                      animation: 'livePulse 2s ease-in-out infinite',
                    }} />
                  </span>
                ) : (
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                )}

                <span style={{ flex: 1 }}>{item.label}</span>

                <AnimatePresence>
                  {badgeCount > 0 && (
                    <Badge count={badgeCount} color={item.badgeColor} />
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </div>

      {/* Status strip */}
      <div style={{ padding: '0.625rem var(--space-md)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {counts.alerts > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: '#EF4444' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 5px #EF4444', animation: 'livePulse 1.5s ease-in-out infinite', display: 'inline-block' }} />
            {counts.alerts} alert{counts.alerts > 1 ? 's' : ''}
          </div>
        )}
        {counts.approvals > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: '#F59E0B' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 5px #F59E0B', animation: 'livePulse 1.5s ease-in-out infinite', display: 'inline-block' }} />
            {counts.approvals} pending
          </div>
        )}
        {counts.alerts === 0 && counts.approvals === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: '#10B981' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981', display: 'inline-block' }} />
            All clear
          </div>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
        <motion.div
          whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
            fontSize: '0.855rem', fontWeight: 500, color: 'var(--text-secondary)',
            background: 'transparent', border: '1px solid transparent',
            transition: 'all 200ms ease', cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </motion.div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
    </nav>
  );
}
