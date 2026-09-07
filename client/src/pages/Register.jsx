import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/NotificationContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '', city: 'Chennai', area: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form);
      addToast('Account created successfully!', 'success');
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-civic-700 to-civic-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Link to="/" className="flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-2xl">CivicConnect</span>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Join CivicConnect</h2>
          <p className="text-blue-200 leading-relaxed mb-8">Create your account to start reporting civic issues, track resolutions, and make your community better.</p>
          <div className="space-y-4">
            {['Report issues with photos & GPS location', 'AI automatically categorizes your complaint', 'Track real-time resolution progress', 'Rate and provide feedback'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center space-x-2 mb-8">
            <div className="w-9 h-9 bg-civic-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-bold text-xl">CivicConnect</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 mb-6">Join the CivicConnect community</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Full Name *</label>
              <input type="text" className="input-field" placeholder="Enter your full name"
                value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
            </div>
            <div>
              <label className="label-text">Email *</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <div>
              <label className="label-text">Phone Number</label>
              <input type="tel" className="input-field" placeholder="91XXXXXXXXXX"
                value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">City</label>
                <input type="text" className="input-field" value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div>
                <label className="label-text">Area</label>
                <select className="input-field" value={form.area} onChange={e => update('area', e.target.value)}>
                  <option value="">Select area</option>
                  {['Anna Nagar', 'T. Nagar', 'Adyar', 'Mylapore', 'Velachery', 'Guindy', 'Tambaram', 'Porur'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label-text">Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" placeholder="Min 6 characters"
                  value={form.password} onChange={e => update('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label-text">Confirm Password *</label>
              <input type="password" className="input-field" placeholder="Confirm your password"
                value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} required />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-civic-600 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

