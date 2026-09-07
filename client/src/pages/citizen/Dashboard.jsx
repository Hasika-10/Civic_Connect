import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import ComplaintMap from '../../components/maps/ComplaintMap';
import api from '../../services/api';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, XCircle,
  PlusCircle, MapPin, TrendingUp, Sparkles, ChevronRight,
  ShieldCheck, HeartHandshake, ArrowUpRight
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints/my').then(res => {
      setComplaints(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ['submitted', 'ai_analyzed'].includes(c.status)).length,
    inProgress: complaints.filter(c => ['assigned', 'under_review', 'in_progress'].includes(c.status)).length,
    resolved: complaints.filter(c => ['resolved', 'closed', 'verified'].includes(c.status)).length,
    rejected: complaints.filter(c => c.status === 'rejected').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Citizen Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
                <HeartHandshake className="w-3.5 h-3.5" /> Citizen Engagement Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {user?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl">
                Report infrastructure issues, track live municipal progress, and verify resolutions in your neighborhood.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link to="/citizen/new-complaint" className="btn-emerald text-xs !py-3 !px-5 shadow-lg shadow-emerald-600/30">
                <PlusCircle className="w-4 h-4 mr-2" /> Report Public Issue
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Counters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">My Complaint Portfolio</h2>
            <span className="text-xs text-emerald-600 font-semibold">{stats.total} Total Submissions</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard icon={FileText} label="Total Reports" value={stats.total} color="civic" />
            <StatCard icon={Clock} label="Under Review" value={stats.pending} color="yellow" />
            <StatCard icon={TrendingUp} label="In Progress" value={stats.inProgress} color="orange" />
            <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="emerald" />
            <StatCard icon={XCircle} label="Declined" value={stats.rejected} color="red" />
          </div>
        </div>

        {/* Map Section */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">My Geo-Tagged Reports Map</h3>
                <p className="text-xs text-slate-500">Location pins for your filed complaints across the city</p>
              </div>
            </div>
            <Link to="/map" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Explore Citywide Map <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            <ComplaintMap complaints={complaints} height="360px" onMarkerClick={c => navigate(`/citizen/complaints/${c.id}`)} />
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Complaints Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status updates directly from responding departments</p>
            </div>
            <Link to="/citizen/complaints" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All Submissions <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium">Fetching complaint data...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">No Active Complaints</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">Spot a pothole, broken streetlight, or garbage backlog? File a report in seconds.</p>
              <Link to="/citizen/new-complaint" className="btn-emerald text-xs !py-2.5 !px-4">
                <PlusCircle className="w-4 h-4 mr-1.5" /> Report an Issue Now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.slice(0, 5).map(c => (
                <Link
                  key={c.id}
                  to={`/citizen/complaints/${c.id}`}
                  className="block p-4 hover:bg-slate-50/80 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{c.complaint_id}</span>
                        <span className="text-xs">{c.category_icon || '📋'}</span>
                        <StatusBadge status={c.status} />
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <p className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {c.area || c.address || 'Chennai'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 sm:self-center">
                      <span className="font-medium">{new Date(c.created_at).toLocaleDateString()}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
