import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [view, setView] = useState('home');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#18181a',
      backgroundImage: 'radial-gradient(circle at 80% -10%, rgba(0, 229, 255, 0.5) 0%, rgba(168, 85, 247, 0.3) 40%, transparent 70%)',
      color: '#d4d4d8',
      fontFamily: 'var(--font-mono)',
      fontSize: '1.2rem',
      padding: '25vh 20vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start'
    }}>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .term-link {
          color: var(--accent);
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .term-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        .feature-item {
          margin-bottom: 1rem;
          color: #a1a1aa;
          line-height: 1.5;
        }
        .feature-title {
          color: #ffffff;
          font-weight: 600;
        }
      `}</style>

      <div style={{ lineHeight: '1.6', marginBottom: '2.5rem' }}>
        <div>
          I built <strong style={{ color: '#ffffff', fontWeight: 600 }}>Q</strong>,
        </div>
        <div>the governance and security</div>
        <div>platform for autonomous AI.</div>
      </div>

      {view === 'home' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/dev/agents &gt;</span> ls
          </div>

          <div style={{ color: 'var(--accent)', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '2.5rem' }}>
            <span className="term-link" onClick={() => setView('features')}>features/</span>
            <span className="term-link">policies/</span>
            <span className="term-link">docs/</span>
            <br />
            <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>&gt; ./login</span>
            <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>&gt; ./signup</span>
          </div>
        </>
      )}

      {view === 'features' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/dev/agents &gt;</span> cat features.md
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '600px' }}>
            <div className="feature-item">
              <span className="feature-title">[🛡] Human-in-the-Loop</span><br />
              Pause autonomous agents before critical actions for manual human approval.
            </div>
            <div className="feature-item">
              <span className="feature-title">[🔬] Anomaly Detection</span><br />
              Instantly detect prompt injections, data exfiltration, and tool abuse.
            </div>
            <div className="feature-item">
              <span className="feature-title">[⚙] Policy Engine</span><br />
              Enforce strict, programmatic guardrails and rate limits over LLM tool usage.
            </div>
            <div className="feature-item">
              <span className="feature-title">[📋] Compliance Tracking</span><br />
              Real-time auditing mapped to NIST AI RMF & OWASP Agentic Top 10 standards.
            </div>
            <br />
            <span className="term-link" onClick={() => setView('home')}>&lt; cd ..</span>
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#8b8b99' }}>/dev/agents &gt;</span>
        <span style={{ 
          display: 'inline-block', 
          width: '12px', 
          height: '22px', 
          backgroundColor: 'var(--accent)',
          animation: 'blink 1s step-end infinite'
        }} />
      </div>
    </div>
  );
}
