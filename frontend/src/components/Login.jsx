import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Key, User, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess, toggleRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password,
      });
      const { access_token, username: loggedUsername } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('username', loggedUsername);
      onLoginSuccess(access_token, loggedUsername);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b15] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,#0f172a,transparent_50%)]" />
      
      <div className="relative w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 transform hover:rotate-6 transition-transform">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 via-slate-100 to-purple-200 bg-clip-text text-transparent">
            SecureFlow AI
          </h1>
          <p className="text-sm text-slate-400 mt-1">Agentic DevSecOps Pipeline Auditor</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="developer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-sm text-slate-400">
            New to SecureFlow?{' '}
            <button
              onClick={toggleRegister}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus:outline-none"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
