import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#18181a',
      backgroundImage: 'radial-gradient(circle at 80% -10%, rgba(93, 117, 108, 0.3) 0%, rgba(55, 78, 80, 0.15) 40%, transparent 70%)',
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
          color: #e67657;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .term-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>

      <div style={{ lineHeight: '1.6', marginBottom: '2.5rem' }}>
        <div>
          We built <strong style={{ color: '#ffffff', fontWeight: 600 }}>Q</strong>,
        </div>
        <div>the next-gen operating</div>
        <div>system for AI agents.</div>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ color: '#8b8b99' }}>/dev/agents &gt;</span> ls
      </div>

      <div style={{ color: '#e67657', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '2.5rem' }}>
        <span className="term-link">about</span>
        <span className="term-link">jobs</span>
        <span className="term-link">who</span>
        <br />
        <span className="term-link" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>&gt; login</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#8b8b99' }}>/dev/agents &gt;</span>
        <span style={{ 
          display: 'inline-block', 
          width: '14px', 
          height: '22px', 
          border: '2px solid #e67657',
          borderRadius: '2px 10px 10px 10px',
          animation: 'blink 1s step-end infinite'
        }} />
      </div>
    </div>
  );
}
