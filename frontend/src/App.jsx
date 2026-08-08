import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import { Policies } from './pages/Policies';
import { Approvals } from './pages/Approvals';
import { Auth } from './pages/Auth';
import { api } from './api/client';


function AppLayout({ onLogout }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/agents" element={<Placeholder title="Agent Registry" />} />
          <Route path="/monitor" element={<Placeholder title="Live Monitor" />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/audit" element={<Placeholder title="Audit Trail" />} />
          <Route path="/compliance" element={<Placeholder title="Compliance" />} />
          <Route path="/alerts" element={<Placeholder title="Alerts" />} />
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
    return <div className="min-h-screen bg-q-bg flex items-center justify-center text-q-glow animate-pulse">Loading Q Platform...</div>;
  }

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/*" element={<AppLayout onLogout={() => {
          localStorage.removeItem('q_access_token');
          setIsAuthenticated(false);
        }} />} />
      </Routes>
    </BrowserRouter>
  );
}
