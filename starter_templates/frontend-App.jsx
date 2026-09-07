import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssuePage from './pages/ReportIssuePage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AdminPanel from './pages/AdminPanel';
import PublicPortal from './pages/PublicPortal';
import UserProfile from './pages/UserProfile';

// Store
import useAuthStore from './store/authStore';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.user_type !== requiredRole && user.user_type !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/public-portal" element={<PublicPortal />} />
        
        {/* Citizen Routes */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute requiredRole="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/report-issue"
          element={
            <ProtectedRoute requiredRole="citizen">
              <ReportIssuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/complaint/:complaintId"
          element={
            <ProtectedRoute requiredRole="citizen">
              <ComplaintDetailsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Authority Routes */}
        <Route
          path="/authority/dashboard"
          element={
            <ProtectedRoute requiredRole="authority">
              <AuthorityDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin/panel"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        
        {/* User Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
