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
    <div className="min-h-screen flex items-center justify-center bg-q-bg p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-q-glow/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-q-panel border border-q-border rounded-2xl shadow-2xl relative z-10 animate-fade-in overflow-hidden">
        <div className="p-8 text-center border-b border-q-border/50 bg-q-base/50">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-q-glow to-purple-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,255,157,0.3)]">
            <span className="text-3xl font-black text-black">Q</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Agent Governance</h2>
          <p className="text-q-muted mt-2 text-sm">Secure authorization required</p>
        </div>

        <div className="p-8">
          <div className="flex rounded-lg bg-q-base p-1 mb-8 border border-q-border">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-q-panel text-white shadow-sm border border-q-border' : 'text-q-muted hover:text-white'}`}
              onClick={() => { setIsLogin(true); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-q-panel text-white shadow-sm border border-q-border' : 'text-q-muted hover:text-white'}`}
              onClick={() => { setIsLogin(false); setError(null); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-q-muted uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-q-muted">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-q-base border border-q-border rounded-lg text-white placeholder-q-muted focus:outline-none focus:border-q-glow focus:ring-1 focus:ring-q-glow transition-all"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-q-muted uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-q-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-q-base border border-q-border rounded-lg text-white placeholder-q-muted focus:outline-none focus:border-q-glow focus:ring-1 focus:ring-q-glow transition-all"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-q-muted uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-q-muted">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-q-base border border-q-border rounded-lg text-white placeholder-q-muted focus:outline-none focus:border-q-glow focus:ring-1 focus:ring-q-glow transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <Shield size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-q-glow hover:bg-q-glow/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-q-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Lock size={16} className="animate-pulse" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
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
