import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText, Bot, Building2, CheckCircle2, MessageSquare, Shield,
  MapPin, Clock, BarChart3, Users, Zap, Eye, ArrowRight, Star,
  ChevronRight, Globe, Phone, Mail, Sparkles, ShieldCheck, Compass,
  Layers, ArrowUpRight, Activity
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    api.get('/public/stats').then(res => setStats(res.data)).catch(() => {});
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent={!scrolled} />

      {/* Hero Section: Rich Multi-Tone Executive Aesthetics */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 overflow-hidden text-white pt-20">
        {/* Ambient light glow rings */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" /> AI-Powered Municipal Resolution Engine
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Report. Track. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  Resolve Seamlessly.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Connect directly with city authorities. Autonomous AI analyzes public complaints, detects duplicate hazards, routes to assigned field engineers, and tracks live SLA resolution.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to={user ? (user.role === 'citizen' ? '/citizen/new-complaint' : `/${user.role}/dashboard`) : '/login'}
                  className="btn-emerald text-sm !py-3.5 !px-6 shadow-xl shadow-emerald-600/30 font-semibold"
                >
                  <FileText className="w-4 h-4 mr-2" /> Report Public Issue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <Link
                  to="/map"
                  className="btn-secondary text-sm !py-3.5 !px-6 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20 font-semibold backdrop-blur-md"
                >
                  <MapPin className="w-4 h-4 mr-2 text-emerald-400" /> Live Complaint Map
                </Link>

                <Link
                  to="/login"
                  className="btn-amber text-sm !py-3.5 !px-5 font-semibold"
                >
                  <Shield className="w-4 h-4 mr-1.5" /> Demo Logins
                </Link>
              </div>

              {/* Fast live counter strip */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span><strong>{stats?.totalComplaints || 25}</strong> Incidents Triaged</span>
                </div>
                <div>
                  <span>Avg Resolution: <strong className="text-amber-300">{stats?.avgResolutionDays || 2.1} Days</strong></span>
                </div>
                <div>
                  <span>Citizen Satisfaction: <strong className="text-emerald-300">{stats?.avgSatisfaction || 4.2} / 5.0</strong></span>
                </div>
              </div>
            </div>

            {/* Right Card: Multi-Role Quick Access Portal */}
            <div className="lg:col-span-5 space-y-3.5 animate-slide-up">
              <div className="glass-dark p-6 border border-white/10 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">Three Portals. One Platform.</h3>
                    <p className="text-xs text-slate-400">Choose a direct portal to evaluate</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    Instant Access
                  </span>
                </div>

                {/* Citizen Card */}
                <Link
                  to="/login"
                  className="block p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">Citizen Hub</h4>
                        <p className="text-[11px] text-slate-400">Submit geo-photos, AI preview & status tracker</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition" />
                  </div>
                </Link>

                {/* Authority Card */}
                <Link
                  to="/login"
                  className="block p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">Authority Dispatch</h4>
                        <p className="text-[11px] text-slate-400">Manage complaint queues, officer SLA & updates</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-300 transition" />
                  </div>
                </Link>

                {/* Admin Card */}
                <Link
                  to="/login"
                  className="block p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/50 hover:bg-white/10 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">Municipal Command</h4>
                        <p className="text-[11px] text-slate-400">Department scorecards, citywide GIS & telemetry</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Metric Banner */}
      <section className="py-10 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="card p-5 bg-white border-l-4 border-l-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Cases</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalComplaints || 25}</p>
              <p className="text-xs text-slate-500 mt-1">Logged across municipal zones</p>
            </div>

            <div className="card p-5 bg-white border-l-4 border-l-emerald-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolved</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats?.resolvedComplaints || 5}</p>
              <p className="text-xs text-emerald-700 mt-1 font-semibold">20% Immediate Turnaround</p>
            </div>

            <div className="card p-5 bg-white border-l-4 border-l-amber-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Queue</span>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{stats?.pendingComplaints || 20}</p>
              <p className="text-xs text-slate-500 mt-1">Under investigation / work</p>
            </div>

            <div className="card p-5 bg-white border-l-4 border-l-violet-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Performance</span>
              <p className="text-3xl font-extrabold text-violet-600 mt-1">{stats?.avgResolutionDays || 2.3}d</p>
              <p className="text-xs text-slate-500 mt-1">Average resolution pace</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 4 Phase Lifecycle */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Resolution Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              How CivicConnect Resolves Public Issues
            </h2>
            <p className="text-slate-500 text-sm">
              End-to-end transparency from the moment an issue is photographed to field officer sign-off.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6 border-t-4 border-t-amber-500 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Citizen Snap & Submit</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Capture the hazard on your phone. GPS automatically pinpoints street coordinates and landmarks.
              </p>
            </div>

            <div className="card p-6 border-t-4 border-t-violet-500 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg mb-4">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">AI Triaging & Routing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                GROQ AI evaluates severity, tags hazard level, flags duplicates, and auto-assigns the relevant municipal agency.
              </p>
            </div>

            <div className="card p-6 border-t-4 border-t-emerald-500 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Officer Action & SLA</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Designated municipal engineers receive live push notifications, update progress, and attach work photos.
              </p>
            </div>

            <div className="card p-6 border-t-4 border-t-teal-500 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg mb-4">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Citizen Verification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Citizens verify the repair in person, score the response quality (1-5 stars), and close the audit ticket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              C
            </div>
            <span className="font-bold text-lg text-white">CivicConnect</span>
          </div>

          <div className="flex items-center space-x-6 text-xs font-semibold">
            <Link to="/map" className="hover:text-emerald-400 transition">City Map</Link>
            <Link to="/transparency" className="hover:text-emerald-400 transition">Transparency Portal</Link>
            <Link to="/login" className="hover:text-emerald-400 transition">Sign In</Link>
          </div>

          <p className="text-xs text-slate-500">
            © 2026 CivicConnect Municipal Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
