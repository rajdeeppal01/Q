import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThemeToggleButton } from '../components/ThemeToggle';
import { DemoVideoPlayer } from '../components/VideoPlayer';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 4rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5, 5, 8, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, var(--accent), #A855F7)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: 'var(--bg-void)'
          }}>
            Q
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Q Platform
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Features</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Resources</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Community</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Enterprise</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Security</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggleButton variant="circle" start="top-right" blur={true} />
          <button 
            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            onClick={() => navigate('/dashboard')}
          >
            Log in
          </button>
          <button 
            className="btn btn-primary" 
            style={{ borderRadius: '20px', padding: '0.5rem 1.25rem', fontWeight: 600, color: 'var(--bg-void)', background: 'white' }}
            onClick={() => navigate('/dashboard')}
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main style={{ padding: '4rem 6rem', maxWidth: '1400px', margin: '0 auto' }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '4rem', letterSpacing: '-0.03em' }}
        >
          Meet Q
        </motion.h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6rem', alignItems: 'center' }}>
          
          {/* Left Column: Glowing Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              background: 'linear-gradient(180deg, #1A1A24 0%, #0A0A0F 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 80px rgba(0, 229, 255, 0.15), 0 0 40px rgba(168, 85, 247, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              overflow: 'hidden'
            }}
          >
            {/* Top Bar of the fake window */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }}></div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }}></div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }}></div>
            </div>
            
            {/* Inner Glowing Content */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.8), rgba(168, 85, 247, 0.8))',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Fake UI prompt */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                zIndex: 1
              }}></div>
              
              <h2 style={{ position: 'relative', zIndex: 2, fontSize: '2rem', fontWeight: 600, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                What's your agent's objective?
              </h2>

              {/* Video Player Demo */}
              <div style={{ position: 'relative', zIndex: 10 }}>
                <DemoVideoPlayer />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Features */}
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.3 }
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
          >
            
            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Govern with confidence
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.6 }}>
                Enforce guardrails and manage API keys for your autonomous AI agents before they interact with your production data.
              </p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Intercept rogue actions
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.6 }}>
                Automatically pause agent execution when high-risk tools are called, enabling Human-in-the-Loop approvals.
              </p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Iterate and scale
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.6 }}>
                Run your agents on Q, streaming live telemetry to ensure compliance with NIST AI RMF and OWASP standards.
              </p>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
