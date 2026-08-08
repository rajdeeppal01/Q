import React, { useState } from 'react';
import { api } from '../api/client';
import { Lock, Mail, Key, User as UserIcon, Shield } from 'lucide-react';

export const Auth = ({ onLogin }) => {
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
      } else {
        const data = await api.register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
        localStorage.setItem('q_access_token', data.access_token);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Background glow effects - handled via inline styles for specific positioning without Tailwind */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', 
        borderRadius: '50%', background: 'rgba(0, 229, 255, 0.05)', filter: 'blur(120px)', pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', 
        borderRadius: '50%', background: 'rgba(168, 85, 247, 0.05)', filter: 'blur(120px)', pointerEvents: 'none'
      }}></div>

      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <span>Q</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Agent Governance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Secure authorization required</p>
        </div>

        <div className="auth-body">
          <div className="auth-tabs">
            <div 
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(null); }}
            >
              Sign In
            </div>
            <div 
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(null); }}
            >
              Create Account
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-form-group">
                <label className="auth-label">Full Name</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="auth-input"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="auth-input"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <Shield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="auth-btn"
            >
              {isLoading ? (
                <span className="flex items-center gap-sm">
                  <Lock size={16} style={{ animation: 'pulse-quarantine 2s infinite' }} />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-sm">
                  <Lock size={16} />
                  {isLogin ? 'Sign In to Mission Control' : 'Create Admin Account'}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
