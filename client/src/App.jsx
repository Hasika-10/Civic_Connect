import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/citizen/Dashboard';
import NewComplaint from './pages/citizen/NewComplaint';
import ComplaintDetail from './pages/citizen/ComplaintDetail';
import MyComplaints from './pages/citizen/MyComplaints';
import CitizenProfile from './pages/citizen/Profile';
import AuthorityDashboard from './pages/authority/Dashboard';
import AuthorityComplaints from './pages/authority/Complaints';
import AuthorityComplaintDetail from './pages/authority/ComplaintDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDepartments from './pages/admin/Departments';
import PublicPortal from './pages/public/TransparencyPortal';
import MapView from './pages/public/MapView';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-civic-200 border-t-civic-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading CivicConnect...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/transparency" element={<PublicPortal />} />
      <Route path="/map" element={<MapView />} />

      {/* Citizen Routes */}
      <Route path="/citizen/dashboard" element={<ProtectedRoute roles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
      <Route path="/citizen/new-complaint" element={<ProtectedRoute roles={['citizen']}><NewComplaint /></ProtectedRoute>} />
      <Route path="/citizen/complaints" element={<ProtectedRoute roles={['citizen']}><MyComplaints /></ProtectedRoute>} />
      <Route path="/citizen/complaints/:id" element={<ProtectedRoute roles={['citizen']}><ComplaintDetail /></ProtectedRoute>} />
      <Route path="/citizen/profile" element={<ProtectedRoute roles={['citizen']}><CitizenProfile /></ProtectedRoute>} />

      {/* Authority Routes */}
      <Route path="/authority/dashboard" element={<ProtectedRoute roles={['authority', 'admin']}><AuthorityDashboard /></ProtectedRoute>} />
      <Route path="/authority/complaints" element={<ProtectedRoute roles={['authority', 'admin']}><AuthorityComplaints /></ProtectedRoute>} />
      <Route path="/authority/complaints/:id" element={<ProtectedRoute roles={['authority', 'admin']}><AuthorityComplaintDetail /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/departments" element={<ProtectedRoute roles={['admin']}><AdminDepartments /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

