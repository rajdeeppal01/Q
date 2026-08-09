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
        <div>platform for autonomous AI agents.</div>
      </div>

      {view === 'home' && (
        <>
          <div style={{ color: 'var(--accent)', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '2.5rem' }}>
            <span className="term-link" onClick={() => setView('meet_q')}>meet_q/</span>
            <span className="term-link" onClick={() => setView('features')}>features/</span>
            <span className="term-link" onClick={() => setView('docs')}>docs/</span>
            <br />
            <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>&gt; ./login</span>
            <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>&gt; ./signup</span>
          </div>
        </>
      )}

      {view === 'meet_q' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/Q/agents &gt;</span> cat meet_q.md
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '600px', color: '#a1a1aa' }}>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>HOW Q CAME TO BE:</div>
            <div style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
              We unleashed autonomous AI agents, but quickly realized they had no brakes. 
              Q was built to change that. It is the ultimate kill switch and governance layer—giving you the power to intercept rogue actions, enforce programmatic guardrails, and audit every move your agents make in real-time.
            </div>
            <div style={{ color: '#d4d4d8', fontStyle: 'italic', marginBottom: '1rem' }}>
              Total autonomy, with total control.
            </div>
            <br />
            <span className="term-link" onClick={() => setView('home')}>&lt; cd ..</span>
          </div>
        </>
      )}

      {view === 'features' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/Q/agents &gt;</span> cat features.md
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '600px' }}>
            <div className="feature-item">
              <span className="feature-title">Human-in-the-Loop</span><br />
              Pause autonomous agents before critical actions for manual human approval.
            </div>
            <div className="feature-item">
              <span className="feature-title">Anomaly Detection</span><br />
              Instantly detect prompt injections, data exfiltration, and tool abuse.
            </div>
            <div className="feature-item">
              <span className="feature-title">Policy Engine</span><br />
              Enforce strict, programmatic guardrails and rate limits over LLM tool usage.
            </div>
            <div className="feature-item">
              <span className="feature-title">Compliance Tracking</span><br />
              Real-time auditing mapped to NIST AI RMF & OWASP Agentic Top 10 standards.
            </div>
            <br />
            <span className="term-link" onClick={() => setView('home')}>&lt; cd ..</span>
          </div>
        </>
      )}

      {view === 'docs' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/Q/agents &gt;</span> cat how_it_works.md
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '600px', color: '#a1a1aa' }}>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>HOW Q WORKS:</div>
            <div style={{ marginBottom: '0.25rem', lineHeight: 1.5 }}>1. <span style={{ color: '#d4d4d8' }}>Install SDK:</span> Import the Q SDK into your agent's codebase.</div>
            <div style={{ marginBottom: '0.25rem', lineHeight: 1.5 }}>2. <span style={{ color: '#d4d4d8' }}>Initialize:</span> Authenticate with your Q API Key.</div>
            <div style={{ marginBottom: '0.25rem', lineHeight: 1.5 }}>3. <span style={{ color: '#d4d4d8' }}>Intercept:</span> Q evaluates all LLM tool calls against active policies.</div>
            <div style={{ marginBottom: '0.25rem', lineHeight: 1.5 }}>4. <span style={{ color: '#d4d4d8' }}>Govern:</span> If a policy is violated (e.g., executing a dangerous command), Q pauses the agent and sends a Human-in-the-Loop alert.</div>
            <div style={{ marginBottom: '0.25rem', lineHeight: 1.5 }}>5. <span style={{ color: '#d4d4d8' }}>Monitor:</span> All agent telemetry is streamed to the dashboard for real-time compliance auditing.</div>
            <br />
            <span className="term-link" onClick={() => setView('home')}>&lt; cd ..</span>
          </div>
        </>
      )}

    </div>
  );
}
