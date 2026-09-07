import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/NotificationContext';
import api from '../../services/api';
import { Building2, Plus, X } from 'lucide-react';

export default function AdminDepartments() {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', head_name: '', head_email: '', sla_hours: 48 });

  useEffect(() => { loadDepts(); }, []);
  const loadDepts = () => api.get('/admin/departments').then(r => setDepartments(r.data));

  const create = async () => {
    try {
      await api.post('/admin/departments', form);
      addToast('Department created', 'success');
      setShowModal(false);
      loadDepts();
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error'); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Department</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <div key={d.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-civic-50 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-civic-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{d.name}</h3>
                  <p className="text-xs text-gray-500">{d.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-lg font-bold text-gray-900">{d.total_complaints || 0}</p><p className="text-xs text-gray-500">Total</p></div>
                <div className="text-center p-2 bg-green-50 rounded-lg"><p className="text-lg font-bold text-green-600">{d.resolved_complaints || 0}</p><p className="text-xs text-gray-500">Resolved</p></div>
                <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="text-lg font-bold text-blue-600">{d.officer_count || 0}</p><p className="text-xs text-gray-500">Officers</p></div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {d.head_name && <p>Head: {d.head_name}</p>}
                <p>SLA: {d.sla_hours}h</p>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Add Department</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className="input-field" placeholder="Code (e.g., ROADS)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                <textarea className="input-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <input className="input-field" placeholder="Head Name" value={form.head_name} onChange={e => setForm({ ...form, head_name: e.target.value })} />
                <input className="input-field" placeholder="Head Email" value={form.head_email} onChange={e => setForm({ ...form, head_email: e.target.value })} />
                <input className="input-field" type="number" placeholder="SLA Hours" value={form.sla_hours} onChange={e => setForm({ ...form, sla_hours: parseInt(e.target.value) })} />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={create} className="btn-primary flex-1">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

