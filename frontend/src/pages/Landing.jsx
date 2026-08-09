import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [view, setView] = useState('home');

  return (
    <div style={{
      minHeight: '100vh',
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
          <div style={{ color: 'var(--accent)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '2.5rem' }}>
            <span className="term-link" onClick={() => setView('meet_q')}>meet_q/</span>
            <span className="term-link" onClick={() => setView('features')}>features/</span>
            <span className="term-link" onClick={() => setView('how_to')}>how_to/</span>
            <br />
            <span className="term-link" onClick={() => navigate('/login', { state: { isSignup: true } })} style={{ fontWeight: 600 }}>&gt; ./create_account</span>
            <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>&gt; ./login</span>
          </div>
        </>
      )}

      {view === 'meet_q' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/Q/agents &gt;</span> cat meet_q.md
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '600px', color: '#a1a1aa' }}>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>THE PROBLEM:</div>
            <div style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
              We unleashed autonomous AI agents, but quickly realized they have no brakes. When an LLM is connected to your database, your Stripe account, or your AWS infrastructure, a single prompt injection or hallucination can cause catastrophic damage. Agents can exfiltrate data, delete databases, and run up massive cloud bills in seconds.
            </div>
            
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem', marginTop: '1rem' }}>THE SOLUTION:</div>
            <div style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
              Q was built to change that. It is the ultimate kill switch and governance layer. It acts as a security middleware (like Datadog, but for AI actions)—giving you the power to intercept rogue actions, enforce programmatic guardrails, and audit every move your agents make in real-time.
            </div>
            <div style={{ color: '#d4d4d8', fontStyle: 'italic', marginBottom: '1rem', marginTop: '0.5rem' }}>
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

      {view === 'how_to' && (
        <>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ color: '#8b8b99' }}>/Q/agents &gt;</span> cat how_to.md
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '700px', color: '#a1a1aa' }}>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>HOW Q WORKS (3-STEP SETUP):</div>
            
            <div style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#d4d4d8' }}>Step 1: Define your Policies</strong><br/>
              Sign up and go to your <strong>Policy Engine</strong>. Tell Q what you want to regulate—for example, require human approval for "refund_customer" or outright block "drop_database".
            </div>
            
            <div style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#d4d4d8' }}>Step 2: Install & Initialize</strong><br/>
              Run <span style={{ color: '#8b8b99', fontFamily: 'var(--font-mono)' }}>pip install q-agent-sdk</span> and initialize Q in your codebase with your API key.
            </div>

            <div style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#d4d4d8' }}>Step 3: Start Regulating</strong><br/>
              Run your agents as normal! Q will instantly enforce your policies, pause dangerous actions locally, and stream real-time alerts to your dashboard.
            </div>
            
            <div style={{ background: 'var(--bg-deep)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#a1a1aa', margin: '0.5rem 0 1rem 0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              <div style={{ color: '#8b8b99', marginBottom: '1rem' }}># 1. Install SDK via terminal: pip install q-agent-sdk</div>
              <div style={{ color: '#8b8b99', marginBottom: '0.5rem' }}># 2. Save this as test.py and run it:</div>
              <div><span style={{ color: '#c678dd' }}>from</span> q_sdk <span style={{ color: '#c678dd' }}>import</span> QAgent, require_approval</div>
              <br />
              <div><span style={{ color: '#56b6c2' }}>agent</span> = QAgent(</div>
              <div>    name=<span style={{ color: '#98c379' }}>"demo-agent"</span>, </div>
              <div>    api_key=<span style={{ color: '#98c379' }}>"&lt;YOUR_API_KEY&gt;"</span>,</div>
              <div>    q_url=<span style={{ color: '#98c379' }}>"https://q-f8z0.onrender.com"</span></div>
              <div>)</div>
              <br />
              <div><span style={{ color: '#e5c07b' }}>@agent.tool</span>(risk_level=<span style={{ color: '#98c379' }}>"high"</span>)</div>
              <div><span style={{ color: '#e5c07b' }}>@require_approval</span>(reason=<span style={{ color: '#98c379' }}>"Deleting files requires review"</span>)</div>
              <div><span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#61afef' }}>delete_system_files</span>(path):</div>
              <div>    <span style={{ color: '#56b6c2' }}>print</span>(<span style={{ color: '#98c379' }}>f"Deleting files at {'{path}'}..."</span>)</div>
              <div>    <span style={{ color: '#c678dd' }}>return</span> <span style={{ color: '#d19a66' }}>True</span></div>
              <br />
              <div><span style={{ color: '#8b8b99' }}># 3. Call it! Q will intercept and pause execution</span></div>
              <div>delete_system_files(<span style={{ color: '#98c379' }}>"/var/www/html"</span>)</div>
            </div>
            
            <br />
            <span className="term-link" onClick={() => setView('home')}>&lt; cd ..</span>
          </div>
        </>
      )}

    </div>
  );
}
