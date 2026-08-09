import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Bot, Code } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

export default function SetupGuide() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Setup <span className="text-gradient">Guide</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
          Follow these 3 steps to bring your AI agents under Q governance.
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Step 1 */}
        <motion.div variants={item} className="glass-card" style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(245,158,11,0.3)' }}>
            <Bot size={24} color="#F59E0B" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F59E0B', marginBottom: '0.5rem' }}>1. Register Agent & Get API Key</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Create an identity for your agent so Q can track its activity. Once registered, you will receive a secure API Key.
            </p>
            <Link to="/agents" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              Go to Agent Registry →
            </Link>
          </div>
        </motion.div>

        {/* Step 2 */}
        <motion.div variants={item} className="glass-card" style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-accent)' }}>
            <Code size={24} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>2. Decorate & Govern</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              In your Python code, initialize Q by creating an agent instance and add our <code style={{color:'var(--accent)',fontFamily:'var(--font-mono)'}}>@require_approval</code> decorator above any dangerous tool. When you run your agent, it will send telemetry to your Live Monitor.
            </p>
            
            <div style={{ background: '#09090b', padding: '1rem', borderRadius: 8, border: '1px solid #27272a', overflowX: 'auto', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
              <pre style={{ margin: 0, color: '#a1a1aa' }}>
<span style={{ color: '#8b8b99', fontStyle: 'italic' }}># 1. Install the SDK in your terminal: pip install q_sdk</span><br/>
<span style={{ color: '#8b8b99', fontStyle: 'italic' }}># 2. Save this code as test_agent.py and run it: python test_agent.py</span><br/><br/>
<span style={{ color: '#c678dd' }}>from</span> q_sdk <span style={{ color: '#c678dd' }}>import</span> QAgent, require_approval<br/><br/>
<span style={{ color: '#5c6370', fontStyle: 'italic' }}># Initialize with your API key from Step 1</span><br/>
agent = QAgent(api_key=<span style={{ color: '#98c379' }}>"q-sk-..."</span>)<br/><br/>
<span style={{ color: '#5c6370', fontStyle: 'italic' }}># Add the decorator to govern any tool/function</span><br/>
<span style={{ color: '#61afef' }}>@require_approval</span>(agent)<br/>
<span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#e5c07b' }}>refund_user</span>(user_id, amount):<br/>
    <span style={{ color: '#c678dd' }}>return</span> <span style={{ color: '#98c379' }}>f"Refunded ${amount}"</span><br/><br/>
<span style={{ color: '#5c6370', fontStyle: 'italic' }}># Call the function (Q will intercept it and send it to your Live Monitor!)</span><br/>
refund_user(<span style={{ color: '#98c379' }}>"usr_123"</span>, <span style={{ color: '#d19a66' }}>50.00</span>)
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Step 3 */}
        <motion.div variants={item} className="glass-card" style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(16,185,129,0.3)' }}>
            <Shield size={24} color="#10B981" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10B981', marginBottom: '0.5rem' }}>3. Define your Policies</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Now that your agent is connected and you can see its exact tools in the Live Monitor, tell Q what you want to regulate. For example, block any agent from dropping a database.
            </p>
            <Link to="/policies" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              Go to Policies →
            </Link>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
