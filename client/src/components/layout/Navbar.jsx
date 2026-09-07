import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Menu, X, Globe, User, LogOut, ChevronDown, Building2,
  MapPin, BarChart3, PlusCircle, Shield, ShieldCheck
} from 'lucide-react';

export default function Navbar({ transparent = false }) {
  const { user, logout } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'authority') return '/authority/dashboard';
    return '/citizen/dashboard';
  };

  const langLabels = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी' };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      transparent
        ? 'bg-slate-950/70 backdrop-blur-xl border-b border-white/10'
        : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm shadow-slate-900/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-slate-900 flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className={`font-bold text-xl tracking-tight ${transparent ? 'text-white' : 'text-slate-900'}`}>
                Civic<span className="text-emerald-500">Connect</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/map"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                transparent ? 'text-slate-200 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-500" /> City Map
            </Link>

            <Link
              to="/transparency"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                transparent ? 'text-slate-200 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-500" /> Transparency
            </Link>

            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`p-2 rounded-xl transition flex items-center gap-1 text-sm ${
                  transparent ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Select Language"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs uppercase font-semibold">{language}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl py-1.5 border border-slate-200 animate-slide-up">
                  {Object.entries(langLabels).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => { changeLanguage(code); setLangOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition ${
                        language === code ? 'text-emerald-600 bg-emerald-50/50 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition ${
                    transparent
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    user.role === 'admin' ? 'bg-indigo-600 text-white' : user.role === 'authority' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold leading-tight">{user.full_name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl py-2 border border-slate-200/80 animate-slide-up">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-sm text-slate-900">{user.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : user.role === 'authority'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {user.role === 'authority' ? 'Officer / Authority' : user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <User className="w-4 h-4 mr-2.5 text-slate-400" /> Dashboard
                      </Link>

                      {user.role === 'citizen' && (
                        <Link
                          to="/citizen/new-complaint"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50/60 font-medium"
                        >
                          <PlusCircle className="w-4 h-4 mr-2.5" /> Report an Issue
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium transition"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2.5 ml-3">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    transparent
                      ? 'text-white hover:bg-white/10 border border-white/20'
                      : 'text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="btn-emerald text-sm !py-2 !px-4"
                >
                  Live Demos
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-xl ${transparent ? 'text-white' : 'text-slate-900'}`}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-2xl border-t border-slate-200 p-4 shadow-xl animate-slide-up space-y-3">
          <Link to="/map" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 p-2.5 rounded-xl text-slate-700 font-medium hover:bg-slate-100">
            <MapPin className="w-4 h-4 text-emerald-500" /> City Complaint Map
          </Link>
          <Link to="/transparency" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 p-2.5 rounded-xl text-slate-700 font-medium hover:bg-slate-100">
            <BarChart3 className="w-4 h-4 text-amber-500" /> Public Transparency Portal
          </Link>
          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)} className="block w-full text-center py-2.5 rounded-xl bg-slate-900 text-white font-semibold">
                Go to Dashboard
              </Link>
              <button onClick={handleLogout} className="block w-full text-center py-2 text-rose-600 font-semibold">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold">
                Sign In
              </Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">
                Demo Accounts
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
