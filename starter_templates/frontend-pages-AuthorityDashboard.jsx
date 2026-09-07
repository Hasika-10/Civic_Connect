import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiFilter } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  useEffect(() => {
    if (!user || user.user_type !== 'authority') {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
  }, [user, token, navigate]);
  
  const fetchDashboardData = async () => {
    try {
      const [statsRes, complaintsRes, insightsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/authority`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/complaints/authority/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/insights/ai`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints);
      setInsights(insightsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
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
  
  // Mock chart data
  const chartData = {
    resolutionTime: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Avg Resolution Time (hours)',
          data: [72, 68, 65, 62],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    },
    byStatus: {
      labels: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      datasets: [
        {
          label: 'Complaints',
          data: [stats?.pending || 0, stats?.inProgress || 0, stats?.resolved || 0, 5],
          backgroundColor: ['#fbbf24', '#f97316', '#22c55e', '#ef4444']
        }
      ]
    },
    byPriority: {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [
        {
          label: 'Count',
          data: [15, 35, 42, stats?.critical || 8],
          backgroundColor: ['#60a5fa', '#fbbf24', '#f97316', '#ef4444']
        }
      ]
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Authority Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Manage and track complaints efficiently</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">New Complaints</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.new || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.inProgress || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FiClock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats?.resolved || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats?.overdue || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Resolution Time Trend</h3>
            <Line data={chartData.resolutionTime} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Complaints by Priority</h3>
            <Bar data={chartData.byPriority} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>
        
        {/* AI Insights */}
        {insights && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-8 border border-blue-200">
            <h3 className="font-bold text-lg mb-4 text-gray-900">🤖 AI Insights</h3>
            
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                <ul className="space-y-2">
                  {insights.recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-blue-600">✓</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.slaConcerns && insights.slaConcerns.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">SLA Concerns:</h4>
                <p className="text-sm text-red-700">{insights.slaConcerns[0]}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Complaint List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Complaints</h2>
            <div className="flex gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.slice(0, 15).map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-sm text-blue-600 font-semibold">{complaint.complaintId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{complaint.title}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[complaint.priority]}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[complaint.status]}`}>
                        {complaint.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{complaint.location?.area || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-medium transition">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
