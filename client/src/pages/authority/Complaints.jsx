import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import api from '../../services/api';
import { Search, Filter, ChevronRight, Download, ChevronLeft } from 'lucide-react';

export default function AuthorityComplaints() {
  const [data, setData] = useState({ complaints: [], total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadComplaints(); }, [filters]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/authority/complaints?${params}`);
      setData(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/analytics/export?format=csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'complaints_report.csv'; a.click();
    } catch (e) {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Complaints</h1>
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by ID, title, name, location..." className="input-field pl-10"
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} />
          </div>
          <select className="input-field sm:w-40" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {['submitted', 'ai_analyzed', 'assigned', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'].map(s =>
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            )}
          </select>
          <select className="input-field sm:w-36" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value, page: 1 })}>
            <option value="">All Priorities</option>
            {['low', 'medium', 'high', 'critical'].map(p =>
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            )}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Title', 'Category', 'Area', 'Priority', 'Status', 'Reporter', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : data.complaints.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">No complaints found</td></tr>
                ) : data.complaints.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.complaint_id}</td>
                    <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{c.title}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.category_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.area}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.reporter_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/authority/complaints/${c.id}`} className="text-civic-600 hover:text-civic-700 text-sm font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">Showing {data.complaints.length} of {data.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={filters.page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm">Page {data.page} of {data.totalPages}</span>
                <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={filters.page >= data.totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

