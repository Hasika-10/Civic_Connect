import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { CategoryChart, StatusDonut, TrendLine, PriorityChart } from '../../components/charts/DashboardCharts';
import api from '../../services/api';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp,
  BarChart3, Zap, ChevronRight, Bot, Shield, ArrowUpRight, Sparkles,
  MapPin, CheckSquare, Layers
} from 'lucide-react';

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/authority/dashboard'),
      api.get('/analytics/insights')
    ]).then(([statsRes, insightsRes]) => {
      setStats(statsRes.data);
      setInsights(insightsRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Synchronizing Department Telemetry...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Executive Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" /> {user?.department?.name || 'Municipal Roads & Infrastructure'} Authority
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Officer Dispatch & Operations Center
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl">
                Real-time incident triaging, active SLA countdowns, and automated departmental routing for municipal jurisdiction.
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:self-center">
              <Link to="/authority/complaints" className="btn-emerald text-xs !py-2.5 !px-4">
                <Layers className="w-4 h-4 mr-1.5" /> Complaint Queue ({stats?.total || 0})
              </Link>
              <Link to="/map" className="btn-secondary text-xs !py-2.5 !px-4 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-400" /> Geographic Triage
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Metric Counters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Department Status Overview</h2>
            <span className="text-xs text-emerald-600 font-semibold">Live System Data</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard icon={FileText} label="Total Queue" value={stats?.total || 0} color="civic" />
            <StatCard icon={Clock} label="Pending Review" value={(stats?.submitted || 0) + (stats?.assigned || 0)} color="yellow" />
            <StatCard icon={TrendingUp} label="In Resolution" value={(stats?.inProgress || 0) + (stats?.underReview || 0)} color="orange" />
            <StatCard icon={CheckCircle2} label="Resolved Cases" value={stats?.resolved || 0} color="emerald" />
            <StatCard icon={AlertOctagon} label="Critical Alerts" value={stats?.critical || 0} color="red" />
          </div>
        </div>

        {/* Secondary Efficiency Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard icon={AlertTriangle} label="High Priority" value={stats?.high || 0} color="orange" />
          <StatCard icon={Clock} label="SLA Overdue" value={stats?.overdue || 0} color="red" />
          <StatCard icon={BarChart3} label="Avg Resolution" value={`${stats?.avgResolutionDays || 0} Days`} color="purple" />
          <StatCard icon={CheckSquare} label="Resolution Rate" value={`${Math.round(((stats?.resolved || 0) / (stats?.total || 1)) * 100)}%`} color="emerald" />
        </div>

        {/* AI Predictive Intelligence Section */}
        {insights.length > 0 && (
          <div className="card p-6 border-l-4 border-l-violet-600 bg-gradient-to-r from-violet-50/40 via-white to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">AI Municipal Insights & Predictive Alerts</h3>
                  <p className="text-xs text-slate-500">Autonomous pattern recognition & geographic clustering</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> GROQ Engine
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                    insight.severity === 'critical'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : insight.severity === 'high'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <p className="text-xs font-semibold leading-relaxed">
                    <span className="mr-1.5 text-base">{insight.icon}</span> {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytical Visualizations */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Complaints by Category</h3>
              <span className="text-xs text-slate-400 font-medium">Departmental Split</span>
            </div>
            <div className="h-64"><CategoryChart data={stats?.byCategory} /></div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Resolution Status Breakdown</h3>
              <span className="text-xs text-slate-400 font-medium">Live Telemetry</span>
            </div>
            <div className="h-64"><StatusDonut data={stats?.byStatus} /></div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Monthly Resolution Trajectory</h3>
              <span className="text-xs text-slate-400 font-medium">Historical Pace</span>
            </div>
            <div className="h-64"><TrendLine data={stats?.monthlyTrend} /></div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Severity & Priority Spread</h3>
              <span className="text-xs text-slate-400 font-medium">Resource Allocation</span>
            </div>
            <div className="h-64"><PriorityChart data={stats?.byPriority} /></div>
          </div>
        </div>

        {/* Priority Action Queue */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Incident Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most recent citizen reports requiring officer response</p>
            </div>
            <Link to="/authority/complaints" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View Full Queue ({stats?.total || 0}) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentComplaints?.slice(0, 6).map(c => (
              <Link
                key={c.id}
                to={`/authority/complaints/${c.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-all group"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span className="text-xs text-slate-400">• {c.area || 'Zone'}</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reported by <span className="font-medium text-slate-700">{c.reporter_name}</span> on {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-slate-900 flex-shrink-0">
                  <span className="hidden sm:inline">Inspect & Update</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
