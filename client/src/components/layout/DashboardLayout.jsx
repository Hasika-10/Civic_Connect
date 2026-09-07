import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  LayoutDashboard, FileText, PlusCircle, User, Settings, LogOut,
  Bell, Menu, X, ChevronRight, Shield, Users, Building2, BarChart3,
  MapPin, Globe, Sparkles, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {}
  };

  const quickSwitchRole = async (targetEmail) => {
    setSwitchingRole(true);
    try {
      await login(targetEmail, 'password123');
      if (targetEmail.includes('admin')) navigate('/admin/dashboard');
      else if (targetEmail.includes('roads')) navigate('/authority/dashboard');
      else navigate('/citizen/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const citizenNav = [
    { path: '/citizen/dashboard', icon: LayoutDashboard, label: 'Citizen Portal' },
    { path: '/citizen/new-complaint', icon: PlusCircle, label: 'Report Issue', highlight: true },
    { path: '/citizen/complaints', icon: FileText, label: 'My Submissions' },
    { path: '/map', icon: MapPin, label: 'Live City Map' },
    { path: '/transparency', icon: Globe, label: 'Public Transparency' },
    { path: '/citizen/profile', icon: User, label: 'My Profile' }
  ];

  const authorityNav = [
    { path: '/authority/dashboard', icon: LayoutDashboard, label: 'Officer Dashboard' },
    { path: '/authority/complaints', icon: FileText, label: 'Complaint Queue' },
    { path: '/map', icon: MapPin, label: 'City Map (Triage)' },
    { path: '/transparency', icon: Globe, label: 'Public Portal' }
  ];

  const adminNav = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Command' },
    { path: '/authority/complaints', icon: FileText, label: 'All City Complaints' },
    { path: '/admin/users', icon: Users, label: 'Personnel & Citizens' },
    { path: '/admin/departments', icon: Building2, label: 'Municipal Departments' },
    { path: '/map', icon: MapPin, label: 'Geographic Map' },
    { path: '/transparency', icon: Globe, label: 'Transparency Portal' }
  ];

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'authority' ? authorityNav : citizenNav;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 border-r border-slate-800/80 transform transition-transform duration-300 lg:translate-x-0 flex flex-col justify-between ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-slate-950/80">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Building2 className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">Civic<span className="text-emerald-400">Connect</span></span>
                <span className="block text-[9px] uppercase tracking-widest text-emerald-400/80 font-bold">Enterprise</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                user?.role === 'admin'
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-500'
                  : user?.role === 'authority'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                  : 'bg-gradient-to-tr from-amber-600 to-orange-500'
              }`}>
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-white truncate">{user?.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    user?.role === 'admin' ? 'bg-indigo-400' : user?.role === 'authority' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {user?.role === 'authority' ? 'Officer' : user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-l-2 border-emerald-400 shadow-sm'
                        : item.highlight
                        ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Role Switcher & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          {/* Quick Demo Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1">Switch Role Demo</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => quickSwitchRole('rajesh@roads.gov')}
                disabled={switchingRole}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border text-center transition ${
                  user?.email === 'rajesh@roads.gov'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                }`}
              >
                Officer
              </button>

              <button
                type="button"
                onClick={() => quickSwitchRole('admin@civicconnect.gov')}
                disabled={switchingRole}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border text-center transition ${
                  user?.email === 'admin@civicconnect.gov'
                    ? 'bg-indigo-500 text-white border-indigo-400'
                    : 'border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-900'
                }`}
              >
                Admin
              </button>

              <button
                type="button"
                onClick={() => quickSwitchRole('arun@citizen.com')}
                disabled={switchingRole}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border text-center transition ${
                  user?.email === 'arun@citizen.com'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                }`}
              >
                Citizen
              </button>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center space-x-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Container */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-slate-600 capitalize font-semibold">{user?.role}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-semibold">{location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            <Link
              to="/map"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Live Map
            </Link>

            {user?.role === 'citizen' && (
              <Link
                to="/citizen/new-complaint"
                className="btn-emerald text-xs !py-1.5 !px-3"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" /> New Report
              </Link>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-600"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 animate-slide-up max-h-[28rem] flex flex-col z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">{unreadCount} unread</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Mark read</button>
                    )}
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No notifications at this time</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition cursor-pointer ${!n.is_read ? 'bg-emerald-50/30' : ''}`}
                          onClick={() => {
                            if (n.complaint_id) navigate(`/${user.role === 'citizen' ? 'citizen' : 'authority'}/complaints/${n.complaint_id}`);
                            setNotifOpen(false);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
