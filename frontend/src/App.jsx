import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-void)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--accent), #A855F7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Q
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<Placeholder title="Agent Registry" />} />
          <Route path="/monitor" element={<Placeholder title="Live Monitor" />} />
          <Route path="/policies" element={<Placeholder title="Policy Manager" />} />
          <Route path="/approvals" element={<Placeholder title="Approvals" />} />
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
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
