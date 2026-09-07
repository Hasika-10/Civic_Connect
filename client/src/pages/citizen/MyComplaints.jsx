import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import api from '../../services/api';
import { Search, Filter, PlusCircle, FileText, ChevronRight } from 'lucide-react';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints/my').then(res => {
      setComplaints(res.data);
      setFiltered(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = complaints;
    if (search) result = result.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.complaint_id.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) result = result.filter(c => c.status === statusFilter);
    setFiltered(result);
  }, [search, statusFilter, complaints]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <Link to="/citizen/new-complaint" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> New Complaint
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search complaints..." className="input-field pl-10"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['submitted', 'ai_analyzed', 'assigned', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {/* Complaints List */}
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-civic-600 rounded-full animate-spin mx-auto mb-3" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{complaints.length === 0 ? 'No complaints yet' : 'No complaints match your filters'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(c => (
                <Link key={c.id} to={`/citizen/complaints/${c.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-mono">{c.complaint_id}</span>
                      <span className="text-xs">{c.category_icon}</span>
                      <span className="text-xs text-gray-400">{c.category_name}</span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{c.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{c.area}</span>
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                      {c.department_name && <span className="text-xs text-gray-400">{c.department_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
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

