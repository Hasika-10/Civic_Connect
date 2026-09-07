import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import { CategoryChart, TrendLine } from '../../components/charts/DashboardCharts';
import api from '../../services/api';
import {
  Users, Building2, FileText, CheckCircle2, Clock, AlertTriangle,
  Star, Shield, BarChart3, ShieldCheck, ArrowUpRight, Activity,
  SlidersHorizontal, CheckSquare
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aggregating Municipal Intelligence...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Executive Command Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Municipal Administration Command Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Citywide Civic Operations & Oversight
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl">
                Global monitoring across all municipal agencies, SLA enforcement, officer performance scorecards, and civic telemetry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/admin/departments" className="btn-secondary text-xs !py-2.5 !px-4 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                <Building2 className="w-4 h-4 mr-1.5 text-indigo-300" /> Departments
              </Link>
              <Link to="/admin/users" className="btn-emerald text-xs !py-2.5 !px-4">
                <Users className="w-4 h-4 mr-1.5" /> Personnel & Citizens
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Operational Counters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Global Incident Statistics</h2>
            <span className="text-xs text-indigo-600 font-semibold">Live Realtime Sync</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard icon={FileText} label="Total Complaints" value={stats?.totalComplaints || 0} color="civic" />
            <StatCard icon={CheckCircle2} label="Resolved" value={stats?.resolvedComplaints || 0} color="emerald" />
            <StatCard icon={Clock} label="Pending Review" value={stats?.pendingComplaints || 0} color="yellow" />
            <StatCard icon={AlertTriangle} label="Critical Hazards" value={stats?.criticalComplaints || 0} color="red" />
            <StatCard icon={Clock} label="Overdue SLA" value={stats?.overdueComplaints || 0} color="orange" />
          </div>
        </div>

        {/* Municipal Reach Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard icon={Users} label="Registered Citizens" value={stats?.totalUsers || 0} color="emerald" />
          <StatCard icon={Shield} label="Active Officers" value={stats?.totalAuthorities || 0} color="purple" />
          <StatCard icon={Building2} label="Departments" value={stats?.totalDepartments || 0} color="indigo" />
          <StatCard icon={Star} label="Citizen Satisfaction" value={`${Math.round((stats?.avgSatisfaction || 0) * 10) / 10} / 5.0`} color="yellow" />
        </div>

        {/* Department Performance Scorecard */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Department Performance Scorecard</h3>
              <p className="text-xs text-slate-500 mt-0.5">Efficiency breakdown and resolution rates across city divisions</p>
            </div>
            <Link to="/admin/departments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Configure Departments <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  {['Department Name', 'Total Cases', 'Resolved', 'Resolution Ratio', 'Avg Duration'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.departmentPerformance?.map(d => {
                  const rate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
                  return (
                    <tr key={d.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {d.code?.substring(0, 2) || 'DP'}
                        </div>
                        {d.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 font-medium">{d.total}</td>
                      <td className="px-5 py-4 text-sm text-emerald-600 font-semibold">{d.resolved}</td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-2.5 max-w-xs">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-9">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                        {d.avg_days ? `${Math.round(d.avg_days * 10) / 10} Days` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA Compliance & Officer Performance */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Activity className="w-4 h-4" /> Service Level Agreement
              </div>
              <h3 className="text-xl font-bold">Citywide SLA Compliance</h3>
              <p className="text-slate-300 text-xs mt-1">Percentage of public incidents resolved within scheduled timeline.</p>
            </div>

            <div className="my-6">
              <div className="text-5xl font-extrabold tracking-tight text-white">
                {stats?.slaCompliance || 84}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${stats?.slaCompliance || 84}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-4">
              <span>Standard SLA: 48–72h</span>
              <span className="text-emerald-400 font-semibold">Target Met</span>
            </div>
          </div>

          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Active Field Officer Roster</h3>
              <span className="text-xs text-slate-400 font-medium">Resolution Throughput</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Officer Name', 'Division', 'Assigned', 'Resolved', 'Avg Pace'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stats?.officerPerformance?.filter(o => o.total > 0).slice(0, 5).map(o => (
                    <tr key={o.full_name} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{o.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{o.department_name}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{o.total}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">{o.resolved}</td>
                      <td className="px-4 py-3 text-slate-500">{o.avg_days ? `${Math.round(o.avg_days * 10) / 10}d` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
