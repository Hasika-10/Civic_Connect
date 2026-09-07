import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/NotificationContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import { User, Mail, Phone, MapPin, Globe, Bell, Lock, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { language, changeLanguage, languages } = useLanguage();
  const { addToast } = useToast();
  const [form, setForm] = useState({ full_name: '', phone: '', city: '', area: '', notification_email: 1, notification_sms: 1, notification_push: 1 });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, phone: user.phone || '', city: user.city || '', area: user.area || '', notification_email: user.notification_email ?? 1, notification_sms: user.notification_sms ?? 1, notification_push: user.notification_push ?? 1 });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { ...form, language });
      updateUser(res.data);
      addToast('Profile updated', 'success');
    } catch (e) { addToast('Failed to update', 'error'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm) { addToast('Passwords do not match', 'error'); return; }
    try {
      await api.put('/auth/password', { current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setPasswordForm({ current_password: '', new_password: '', confirm: '' });
      addToast('Password changed', 'success');
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error'); }
  };

  const langLabels = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी' };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>

        {/* Profile */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><User className="w-5 h-5 text-civic-600" /> Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label-text">Full Name</label><input className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><label className="label-text">Email</label><input className="input-field bg-gray-50" value={user?.email} disabled /></div>
            <div><label className="label-text">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label-text">City</label><input className="input-field" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="label-text">Area</label>
              <select className="input-field" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}>
                <option value="">Select</option>
                {['Anna Nagar', 'T. Nagar', 'Adyar', 'Mylapore', 'Velachery', 'Guindy', 'Tambaram', 'Porur'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Language */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-civic-600" /> Language</h3>
          <div className="flex gap-3">
            {languages.map(l => (
              <button key={l} onClick={() => changeLanguage(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${language === l ? 'bg-civic-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {langLabels[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-civic-600" /> Notification Preferences</h3>
          {[
            { key: 'notification_email', label: 'Email Notifications' },
            { key: 'notification_sms', label: 'SMS Notifications' },
            { key: 'notification_push', label: 'Push Notifications' }
          ].map(n => (
            <label key={n.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">{n.label}</span>
              <input type="checkbox" className="rounded border-gray-300 text-civic-600 w-5 h-5"
                checked={!!form[n.key]} onChange={e => setForm({ ...form, [n.key]: e.target.checked ? 1 : 0 })} />
            </label>
          ))}
        </div>

        {/* Password */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-civic-600" /> Change Password</h3>
          <div className="space-y-3">
            <input type="password" className="input-field" placeholder="Current password" value={passwordForm.current_password}
              onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
            <input type="password" className="input-field" placeholder="New password" value={passwordForm.new_password}
              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            <input type="password" className="input-field" placeholder="Confirm new password" value={passwordForm.confirm}
              onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          </div>
          <button onClick={changePassword} className="btn-secondary flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</button>
        </div>
      </div>
    </DashboardLayout>
  );
}

