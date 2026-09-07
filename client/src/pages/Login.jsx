import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/NotificationContext';
import {
  Eye, EyeOff, LogIn, Shield, Users, Sparkles, Building2,
  CheckCircle2, ArrowRight, ShieldCheck, Compass
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);
  const [error, setError] = useState('');

  const executeLogin = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      const user = await login(cleanEmail, cleanPassword);
      addToast(`Welcome back, ${user.full_name}!`, 'success');
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'authority') {
        navigate('/authority/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check credentials or use one of the Demo Accounts.');
    } finally {
      setLoading(false);
      setActiveDemoRole(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(form.email, form.password);
  };

  const handleDemoLogin = (email, roleKey) => {
    setActiveDemoRole(roleKey);
    setForm({ email, password: 'password123' });
    executeLogin(email, 'password123');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side: Premium Executive Civic Tech Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-12 flex-col justify-between overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Brand */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">Civic<span className="text-emerald-400">Connect</span></span>
              <span className="block text-[10px] tracking-widest uppercase text-emerald-400/80 font-semibold">Municipal Intelligence Portal</span>
            </div>
          </Link>
        </div>

        {/* Central Feature Banner */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI Automated Routing & SLA Telemetry
          </div>

          <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
            Next-Gen Public Infrastructure <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Management Platform</span>
          </h2>

          <p className="text-slate-300 text-base leading-relaxed">
            Empowering municipal departments, field officers, and citizens with real-time complaint triaging, automated GIS mapping, and transparent resolution tracking.
          </p>

          {/* Value highlights */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" /> Real-time SLA
              </div>
              <p className="text-xs text-slate-400">Dynamic countdowns and departmental escalations</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
                <Compass className="w-4 h-4" /> Live GIS Heatmaps
              </div>
              <p className="text-xs text-slate-400">Location clustering and public transparency portal</p>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Systems Operational
          </span>
          <span>v2.5 Enterprise Edition</span>
        </div>
      </div>

      {/* Right side: Modern Sleek Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">C</div>
              <span className="font-bold text-xl text-slate-900">CivicConnect</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Access Portal</h1>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your account or launch a one-click role demo</p>
          </div>

          {/* ONE-CLICK DEMO LOGIN SELECTOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1-Click Role Logins (Instant)</span>
              <span className="text-[11px] text-emerald-600 font-medium">Click to Sign In</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Authority button */}
              <button
                type="button"
                onClick={() => handleDemoLogin('rajesh@roads.gov', 'authority')}
                disabled={loading}
                className="group relative flex flex-col p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-md transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800">Officer</span>
                </div>
                <span className="font-semibold text-slate-900 text-xs">Authority</span>
                <span className="text-[11px] text-slate-500 truncate">rajesh@roads.gov</span>
              </button>

              {/* Admin button */}
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@civicconnect.gov', 'admin')}
                disabled={loading}
                className="group relative flex flex-col p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-md transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-800">Admin</span>
                </div>
                <span className="font-semibold text-slate-900 text-xs">Super Admin</span>
                <span className="text-[11px] text-slate-500 truncate">admin@civic...</span>
              </button>

              {/* Citizen button */}
              <button
                type="button"
                onClick={() => handleDemoLogin('arun@citizen.com', 'citizen')}
                disabled={loading}
                className="group relative flex flex-col p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-md transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800">Citizen</span>
                </div>
                <span className="font-semibold text-slate-900 text-xs">Citizen</span>
                <span className="text-[11px] text-slate-500 truncate">arun@citizen.com</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium uppercase tracking-wider">or sign in with email</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-slide-up">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Sign In Failed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Email Address</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. rajesh@roads.gov or admin@civicconnect.gov"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-text !mb-0">Password</label>
                <span className="text-xs text-slate-400">Demo: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">password123</code></span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter account password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-semibold mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Portal
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition flex items-center gap-1">
              ← Back to Homepage
            </Link>
            <p>
              New Citizen? <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
