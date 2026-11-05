import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ArrowLeft, Lock, Mail, User, AlertCircle } from 'lucide-react';

export function AuthPage({ onBack, onComplete }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onComplete?.();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexora-darkest flex flex-col justify-center items-center px-4 relative selection:bg-nexora-accent/30 selection:text-white">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-xs text-nexora-muted hover:text-white flex items-center gap-2 p-2 rounded-lg bg-nexora-card border border-nexora-border transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-md bg-nexora-dark border border-nexora-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo className="w-10 h-10" textClassName="text-2xl font-bold" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {isLogin ? 'Sign in to NEXORA AI' : 'Create your NEXORA Account'}
          </h2>
          <p className="text-xs text-nexora-muted">
            {isLogin
              ? 'Access your private conversations, workspaces, and keys.'
              : 'Start your unified AI journey with private cloud persistence.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-nexora-muted block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-nexora-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full pl-9 pr-3 py-2.5 bg-nexora-card border border-nexora-border rounded-xl text-sm text-white focus:outline-none focus:border-nexora-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-nexora-muted block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-nexora-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@quantfirm.com"
                className="w-full pl-9 pr-3 py-2.5 bg-nexora-card border border-nexora-border rounded-xl text-sm text-white focus:outline-none focus:border-nexora-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-nexora-muted block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-nexora-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-3 py-2.5 bg-nexora-card border border-nexora-border rounded-xl text-sm text-white focus:outline-none focus:border-nexora-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-nexora-accent to-nexora-violet hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-nexora-accent/20 transition-all"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-nexora-muted hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
