import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import ComplaintMap from '../../components/maps/ComplaintMap';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import api from '../../services/api';
import { Filter, MapPin, X } from 'lucide-react';

export default function MapView() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', priority: '' });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints/meta/categories').then(r => setCategories(r.data)).catch(() => {});
    loadMap();
  }, [filters]);

  const loadMap = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('civicconnect_token');
      const params = new URLSearchParams(); Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); }); const res = await api.get('/complaints/map/all?' + params.toString());
      setComplaints(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r flex flex-col overflow-hidden hidden lg:flex">
            <div className="p-4 border-b">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> City Complaint Map
              </h2>
              <p className="text-xs text-slate-500 mt-1">{complaints.length} geolocated incidents plotted</p>
            </div>

            <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
              <select className="input-field text-xs !py-2" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input-field text-xs !py-2" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Statuses</option>
                {['submitted', 'assigned', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <select className="input-field text-xs !py-2" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
                <option value="">All Priorities</option>
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Selected complaint */}
            {selected && (
              <div className="p-3.5 m-2 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-sm animate-slide-up">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded">{selected.complaint_id}</span>
                    <p className="font-semibold text-sm mt-1 text-slate-900">{selected.title}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2"><StatusBadge status={selected.status} /><PriorityBadge priority={selected.priority} /></div>
                    <p className="text-xs text-slate-600 mt-2 font-medium">{selected.category_name} • {selected.area}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {complaints.map(c => (
                <div key={c.id} onClick={() => setSelected(c)}
                  className={`p-3 cursor-pointer hover:bg-slate-50 transition ${selected?.id === c.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.category_name} • {c.area}</p>
                    </div>
                    <PriorityBadge priority={c.priority} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1">
            <ComplaintMap
              complaints={complaints}
              height="100%"
              onMarkerClick={setSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

