import React, { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export const Auth = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const data = await api.login(formData.email, formData.password);
        localStorage.setItem('q_access_token', data.access_token);
        onLogin(data.user);
        navigate('/dashboard');
      } else {
        const data = await api.register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
        localStorage.setItem('q_access_token', data.access_token);
        onLogin(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
        .term-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 1.2rem;
          outline: none;
          width: 100%;
          padding: 0.2rem 0;
          transition: border-color 0.2s;
        }
        .term-input:focus {
          border-bottom: 1px solid var(--accent);
        }
        .term-input::placeholder {
          color: #555566;
        }
        .term-btn {
          background: transparent;
          border: none;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
        .term-btn:hover {
          opacity: 0.8;
        }
        .term-label {
          width: 130px;
          color: #a1a1aa;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
      `}</style>

      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ color: '#8b8b99' }}>/Q/agents &gt;</span> {isLogin ? './login' : './signup'}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', width: '100%', maxWidth: '450px' }}>
        {!isLogin && (
          <div style={{ display: 'flex' }}>
            <span className="term-label">Name:</span>
            <input 
              type="text" 
              className="term-input" 
              placeholder="Jane Doe" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              autoFocus={!isLogin}
            />
          </div>
        )}
        <div style={{ display: 'flex' }}>
          <span className="term-label">Email:</span>
          <input 
            type="email" 
            className="term-input" 
            placeholder="admin@company.com" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            autoFocus={isLogin}
          />
        </div>
        <div style={{ display: 'flex' }}>
          <span className="term-label">Password:</span>
          <input 
            type="password" 
            className="term-input" 
            placeholder="********" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        {error && (
          <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>
            [ERROR] {error}
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
          <button type="submit" disabled={isLoading} className="term-btn">
            {isLoading ? '[ Authenticating... ]' : '[ Enter ]'}
          </button>
          
          <button 
            type="button" 
            className="term-btn" 
            style={{ color: '#8b8b99', textDecoration: 'none' }}
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
          >
            {isLogin ? 'Switch to signup' : 'Switch to login'}
          </button>
        </div>
      </form>


    </div>
  );
};
