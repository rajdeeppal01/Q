import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';


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
      <Routes>
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
