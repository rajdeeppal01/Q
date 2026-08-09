import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      color: '#d4d4d8',
      fontFamily: 'var(--font-mono)',
      fontSize: '1.1rem',
      padding: '10vh 15vw 15vh 15vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start'
    }}>
      <style>{`
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
        .section-title {
          color: #ffffff;
          font-weight: 700;
          margin-bottom: 0.75rem;
          margin-top: 3rem;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .section-title::before {
          content: '>';
          color: var(--accent);
        }
      `}</style>

      {/* Hero Header */}
      <div style={{ lineHeight: '1.4', marginBottom: '1rem', fontSize: '1.5rem' }}>
        <div>
          <strong style={{ color: '#ffffff', fontWeight: 800 }}>Q</strong> — The Governance and Security Platform
        </div>
        <div>for Autonomous AI Agents.</div>
      </div>
      <div style={{ color: '#a1a1aa', fontStyle: 'italic', marginBottom: '2rem' }}>
        Total autonomy, with total control.
      </div>

      {/* The Problem */}
      <div className="section-title">THE_PROBLEM.md</div>
      <div style={{ lineHeight: '1.6', color: '#a1a1aa', maxWidth: '700px' }}>
        We unleashed autonomous AI agents, but quickly realized they have no brakes. When an LLM is connected to your database, your Stripe account, or your AWS infrastructure, a single prompt injection or hallucination can cause catastrophic damage. Agents can exfiltrate data, delete databases, and run up massive cloud bills in seconds.
      </div>

      {/* The Solution */}
      <div className="section-title">THE_SOLUTION.md</div>
      <div style={{ lineHeight: '1.6', color: '#a1a1aa', maxWidth: '700px' }}>
        Q is the ultimate kill switch and governance layer. It acts as a security middleware (like Datadog, but for AI actions). You simply drop our lightweight Python SDK into your agent's codebase, and Q automatically intercepts every tool call and LLM decision, enforcing your security policies <em>before</em> the action is ever executed.
      </div>

      {/* How it Works */}
      <div className="section-title">HOW_IT_WORKS.py</div>
      <div style={{ lineHeight: '1.6', color: '#a1a1aa', maxWidth: '700px', width: '100%' }}>
        <div style={{ background: 'var(--bg-deep)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#a1a1aa', marginTop: '1rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          <div style={{ color: '#8b8b99', marginBottom: '1rem' }}># 1. Install the SDK via pip: $ pip install q-agent-sdk</div>
          <div><span style={{ color: '#c678dd' }}>from</span> q_sdk <span style={{ color: '#c678dd' }}>import</span> QAgent, require_approval</div>
          <br />
          <div style={{ color: '#8b8b99', marginBottom: '0.25rem' }}># 2. Initialize with your API Key</div>
          <div><span style={{ color: '#56b6c2' }}>agent</span> = QAgent(name=<span style={{ color: '#98c379' }}>"support-bot"</span>, api_key=<span style={{ color: '#98c379' }}>"q_sk_..."</span>)</div>
          <br />
          <div style={{ color: '#8b8b99', marginBottom: '0.25rem' }}># 3. Decorate your dangerous tools</div>
          <div><span style={{ color: '#e5c07b' }}>@agent.tool</span>(risk_level=<span style={{ color: '#98c379' }}>"critical"</span>)</div>
          <div><span style={{ color: '#e5c07b' }}>@require_approval</span>(reason=<span style={{ color: '#98c379' }}>"Refunding money"</span>)</div>
          <div><span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#61afef' }}>refund_customer</span>(amount):</div>
          <div>    <span style={{ color: '#c678dd' }}>return</span> stripe.refund(amount)</div>
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          When your agent runs and tries to call <span style={{ color: 'var(--accent)' }}>refund_customer</span>, the Q SDK immediately pauses the python script on your server and sends a real-time <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Human-in-the-Loop</span> alert to your Q Mission Control dashboard. The agent is frozen indefinitely until you click "Approve".
        </div>
      </div>

      {/* Features */}
      <div className="section-title">FEATURES.txt</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
        <div>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>[+] Human-in-the-Loop:</span><br />
          <span style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Pause autonomous agents before critical actions for manual human approval.</span>
        </div>
        <div>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>[+] Anomaly Detection:</span><br />
          <span style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Instantly detect prompt injections, data exfiltration, and tool abuse.</span>
        </div>
        <div>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>[+] Policy Engine:</span><br />
          <span style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Enforce strict, programmatic guardrails and rate limits over LLM tool usage.</span>
        </div>
        <div>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>[+] Compliance Tracking:</span><br />
          <span style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Real-time auditing mapped to NIST AI RMF & OWASP Agentic Top 10 standards.</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: '4rem', padding: '1.5rem', border: '1px solid var(--accent)', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.05)', width: '100%', maxWidth: '700px' }}>
        <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '1rem' }}>SYSTEM_READY // Awaiting command:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span className="term-link" onClick={() => navigate('/login', { state: { isSignup: true } })} style={{ fontWeight: 600, fontSize: '1.1rem' }}>&gt; ./create_account</span>
          <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600, fontSize: '1.1rem' }}>&gt; ./login</span>
        </div>
      </div>

    </div>
  );
}
