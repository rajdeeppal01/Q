import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import { Policies } from './pages/Policies';
import { Approvals } from './pages/Approvals';
import { Auth } from './pages/Auth';
import AgentRegistry from './pages/AgentRegistry';
import AgentDetail from './pages/AgentDetail';
import LiveMonitor from './pages/LiveMonitor';
import Compliance from './pages/Compliance';
import AuditTrail from './pages/AuditTrail';
import Alerts from './pages/Alerts';
import SetupGuide from './pages/SetupGuide';
import { api } from './api/client';
import DecryptedText from './components/DecryptedText';


function AppLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>[Q]</div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/guide" element={<SetupGuide />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/agents" element={<AgentRegistry />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/monitor" element={<LiveMonitor />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </main>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
        {title}
      </h1>
      <div className="glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}>
        Under construction — Phase 7
      </div>
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();
  if (!isAuthenticated) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a valid token on load
    const verifyToken = async () => {
      const token = localStorage.getItem('q_access_token');
      if (token) {
        try {
          await api.getMe();
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('q_access_token');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    verifyToken();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#260404',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '1.5rem',
        color: '#FF5722'
      }}>
        <DecryptedText
          text="Loading Q..."
          speed={60}
          maxIterations={20}
          characters="Q01X!@#$%^&*"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />

        {/* Login always shows the Auth form — no auto-redirect */}
        <Route 
          path="/login" 
          element={
            <Auth onLogin={() => {
              setIsAuthenticated(true);
            }} />
          } 
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AppLayout onLogout={() => {
                localStorage.removeItem('q_access_token');
                setIsAuthenticated(false);
              }} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
