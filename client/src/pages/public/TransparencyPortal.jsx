import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { CategoryChart, StatusDonut, TrendLine } from '../../components/charts/DashboardCharts';
import api from '../../services/api';
import { FileText, CheckCircle2, Clock, Star, BarChart3, Building2, MapPin } from 'lucide-react';

export default function TransparencyPortal() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-civic-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Public Transparency Portal</h1>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Real-time civic complaint data and department performance. No private citizen information is exposed.</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Total Complaints', value: stats?.totalComplaints || 0, color: 'bg-slate-100 text-slate-800' },
            { icon: CheckCircle2, label: 'Resolved', value: stats?.resolvedComplaints || 0, color: 'bg-green-50 text-green-600' },
            { icon: Clock, label: 'Pending', value: stats?.pendingComplaints || 0, color: 'bg-yellow-50 text-yellow-600' },
            { icon: BarChart3, label: 'Resolution Rate', value: `${stats?.resolutionRate || 0}%`, color: 'bg-purple-50 text-purple-600' },
            { icon: Star, label: 'Avg Satisfaction', value: `${stats?.avgSatisfaction || 0}/5`, color: 'bg-orange-50 text-orange-600' }
          ].map((s, i) => (
            <div key={i} className="card p-5 text-center">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Complaints by Category</h3>
            <div className="h-64"><CategoryChart data={stats?.byCategory} /></div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <div className="h-64"><StatusDonut data={stats?.byStatus} /></div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Trend</h3>
            <div className="h-64"><TrendLine data={stats?.monthlyTrend} /></div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Most Affected Areas</h3>
            <div className="space-y-3">
              {stats?.byArea?.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{a.area}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-civic-500 rounded-full" style={{ width: `${(a.count / (stats?.totalComplaints || 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{a.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-civic-600" /> Department Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Department', 'Total', 'Resolved', 'Resolution Rate', 'Avg Resolution Time'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats?.departmentPerformance?.map(d => (
                  <tr key={d.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-sm">{d.total}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{d.resolved}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${d.total > 0 ? (d.resolved / d.total) * 100 : 0}%` }} />
                        </div>
                        <span className="text-sm">{d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{d.avg_days ? `${d.avg_days} days` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Resolved */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recently Resolved</h3>
          <div className="divide-y">
            {stats?.recentResolved?.map((c, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.category} • {c.area}</p>
                </div>
                <span className="text-xs text-gray-400">{c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

