import React, { useState } from 'react';
import axios from 'axios';
import { 
  Shield, 
  Key, 
  User, 
  ArrowRight, 
  Bot, 
  Terminal, 
  GitBranch, 
  Layers, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Login({ onLoginSuccess, theme, setTheme }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username,
        password,
      });

      if (isRegister) {
        setSuccess(true);
        setUsername('');
        setPassword('');
        // Automatically switch to login tab after 1.5 seconds
        setTimeout(() => {
          setIsRegister(false);
          setSuccess(false);
        }, 1500);
      } else {
        const { access_token, username: loggedUsername } = response.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('username', loggedUsername);
        onLoginSuccess(access_token, loggedUsername);
      }
    } catch (err) {
      setError(err.response?.data?.detail || `${isRegister ? 'Registration' : 'Authentication'} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b15] relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Premium Floating Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/0 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-purple-500/10 to-indigo-500/0 blur-[120px] pointer-events-none" />

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 bg-slate-900/60 border border-slate-800/80 text-indigo-400 hover:text-indigo-300 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      {/* Floating Animated Tech Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Bot className="absolute top-[15%] left-[8%] w-8 h-8 text-indigo-500/20 animate-float-1" />
        <Shield className="absolute top-[60%] left-[5%] w-10 h-10 text-purple-500/20 animate-float-2" />
        <Terminal className="absolute top-[75%] left-[20%] w-7 h-7 text-indigo-500/15 animate-float-3" />
        <GitBranch className="absolute top-[12%] right-[10%] w-9 h-9 text-purple-500/20 animate-float-2" />
        <Layers className="absolute top-[50%] right-[7%] w-8 h-8 text-indigo-500/25 animate-float-1" />
        <Globe className="absolute bottom-[15%] right-[22%] w-6 h-6 text-purple-500/15 animate-float-3" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Product Info / Description */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:rotate-6 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-200 via-slate-100 to-purple-200 bg-clip-text text-transparent tracking-tight">
                  SecureFlow AI
                </h1>
                <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Agentic DevSecOps Pipeline Auditor</p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-none mb-6">
              Secure your code, packages, and CI/CD pipelines in one go.
            </h2>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed mb-8">
              SecureFlow AI integrates static analysis, dependency scanning, and advanced agentic decision making to audit your repository, provide visual git diff patches, and push secure branch remediations.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">LangGraph Orchestration</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    AI planning nodes review repository architecture to engineer secure, hardened setups.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                <Terminal className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Integrated SAST Scanning</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Scans Dockerfiles and pipelines via Gitleaks, Hadolint, Actionlint, and Semgrep.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Aggregated SCA Audits</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Groups package CVE vulnerabilities and resolves outdated libraries in single upgrades.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                <GitBranch className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">GitHub Pull Request Fixes</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Pushes patches to unique feature branches and creates Pull Requests automatically via API.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Auth Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#0f172a]/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20">
              
              {/* Tab Selector */}
              <div className="flex bg-slate-950/50 p-1 border border-slate-800/60 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); setSuccess(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none ${!isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); setSuccess(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none ${isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Create Account
                </button>
              </div>

              {/* Status Alerts */}
              {error && (
                <div className="bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl p-3.5 mb-5 leading-relaxed">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-xs rounded-xl p-3.5 mb-5 leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Account created successfully! Redirecting to Sign In...
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                      placeholder="developer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer focus:outline-none"
                >
                  <span>{loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
