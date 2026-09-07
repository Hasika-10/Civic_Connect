import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchComplaints();
  }, [user, token, navigate]);
  
  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints/user/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComplaints(response.data.complaints);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };
  
  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    ai_analyzed: 'bg-purple-100 text-purple-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    verified: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800'
  };
  
  const priorityColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name}!</h1>
            <p className="text-gray-600 text-sm mt-1">Track and manage your reported issues</p>
          </div>
          
          <div className="flex gap-3">
            <Link
              to="/citizen/report-issue"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FiPlus /> Report Issue
            </Link>
            <Link
              to="/profile"
              className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
            >
              {user?.full_name?.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Complaints</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Resolved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Complaints</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center">
              <FiMapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No complaints yet</p>
              <p className="text-gray-500 text-sm mt-1">Start by reporting your first issue</p>
              <Link
                to="/citizen/report-issue"
                className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Report Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Complaint ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.slice(0, 10).map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm text-blue-600 font-semibold">{complaint.complaintId}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{complaint.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{complaint.category.main}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-semibold uppercase text-xs ${priorityColors[complaint.priority]}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[complaint.status]}`}>
                          {complaint.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={`/citizen/complaint/${complaint.complaintId}`}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
