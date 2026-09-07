import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/NotificationContext';
import api from '../../services/api';
import { Users, Plus, Search, UserCheck, UserX, X } from 'lucide-react';

export default function AdminUsers() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState({ role: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', phone: '', role: 'authority', department_id: '', password: 'password123', city: 'Chennai', area: '' });

  useEffect(() => { loadUsers(); loadDepts(); }, [filter]);

  const loadUsers = () => {
    const params = new URLSearchParams();
    if (filter.role) params.append('role', filter.role);
    if (filter.search) params.append('search', filter.search);
    api.get(`/admin/users?${params}`).then(r => setUsers(r.data));
  };
  const loadDepts = () => api.get('/admin/departments').then(r => setDepartments(r.data));

  const toggleUser = async (id) => {
    await api.put(`/admin/users/${id}/toggle`);
    addToast('User status updated', 'success');
    loadUsers();
  };

  const createUser = async () => {
    try {
      await api.post('/admin/users', newUser);
      addToast('User created', 'success');
      setShowModal(false);
      setNewUser({ full_name: '', email: '', phone: '', role: 'authority', department_id: '', password: 'password123', city: 'Chennai', area: '' });
      loadUsers();
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error'); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-10" placeholder="Search users..." value={filter.search}
              onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </div>
          <select className="input-field sm:w-40" value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="authority">Authority</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Department', 'Area', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className="badge bg-civic-100 text-civic-800 capitalize">{u.role}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.department_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.area || '-'}</td>
                  <td className="px-4 py-3"><span className={`badge ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleUser(u.id)} className={`text-sm font-medium ${u.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Create User</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input className="input-field" placeholder="Full Name" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} />
                <input className="input-field" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                <input className="input-field" placeholder="Phone" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="citizen">Citizen</option>
                  <option value="authority">Authority</option>
                  <option value="admin">Admin</option>
                </select>
                {newUser.role === 'authority' && (
                  <select className="input-field" value={newUser.department_id} onChange={e => setNewUser({ ...newUser, department_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                <input className="input-field" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={createUser} className="btn-primary flex-1">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

