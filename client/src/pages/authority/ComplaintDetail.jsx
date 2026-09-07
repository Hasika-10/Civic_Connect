import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import StatusTimeline from '../../components/common/StatusTimeline';
import ComplaintMap from '../../components/maps/ComplaintMap';
import { useToast } from '../../context/NotificationContext';
import api from '../../services/api';
import {
  ArrowLeft, MapPin, Clock, Building2, User, Bot, MessageSquare,
  Send, CheckCircle2, XCircle, AlertTriangle, Upload
} from 'lucide-react';

export default function AuthorityComplaintDetail() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [complaint, setComplaint] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/complaints/${id}`),
      api.get('/authority/officers'),
      api.get('/admin/departments')
    ]).then(([cRes, oRes, dRes]) => {
      setComplaint(cRes.data);
      setOfficers(oRes.data);
      setDepartments(dRes.data);
    }).catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  }, [id]);

  const reload = () => api.get(`/complaints/${id}`).then(r => setComplaint(r.data));

  const updateStatus = async (status, commentText) => {
    await api.put(`/authority/complaints/${id}/status`, { status, comment: commentText || `Status updated to ${status}` });
    addToast(`Status updated to ${status}`, 'success');
    reload();
  };

  const updatePriority = async (priority) => {
    await api.put(`/authority/complaints/${id}/priority`, { priority });
    addToast('Priority updated', 'success');
    reload();
  };

  const assignOfficer = async (officerId) => {
    await api.put(`/authority/complaints/${id}/assign`, { officer_id: officerId });
    addToast('Officer assigned', 'success');
    reload();
  };

  const rejectComplaint = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    await api.put(`/authority/complaints/${id}/reject`, { reason });
    addToast('Complaint rejected', 'success');
    reload();
  };

  const addComment_ = async () => {
    if (!comment.trim()) return;
    await api.post(`/complaints/${id}/comment`, { comment, is_internal: isInternal });
    setComment('');
    addToast('Comment added', 'success');
    reload();
  };

  if (loading) return <DashboardLayout><div className="text-center py-12">Loading...</div></DashboardLayout>;
  if (!complaint) return <DashboardLayout><div className="text-center py-12">Not found</div></DashboardLayout>;

  const statusActions = {
    submitted: ['assigned', 'rejected'],
    ai_analyzed: ['assigned', 'rejected'],
    assigned: ['under_review', 'in_progress'],
    under_review: ['in_progress', 'assigned'],
    in_progress: ['resolved', 'assigned'],
  };

  const nextStatuses = statusActions[complaint.status] || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <Link to="/authority/complaints" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to complaints
        </Link>

        {/* Header */}
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-gray-400">{complaint.complaint_id}</span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.severity >= 8 && <span className="badge bg-red-100 text-red-800">Severity: {complaint.severity}/10</span>}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {complaint.reporter_name}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(complaint.created_at).toLocaleString()}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {complaint.area || complaint.address}</span>
                {complaint.upvotes > 1 && <span className="badge bg-civic-100 text-civic-700">{complaint.upvotes} reports</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(status => (
                <button key={status} onClick={() => updateStatus(status)}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
                    status === 'resolved' ? 'bg-green-500 text-white hover:bg-green-600' :
                    status === 'rejected' ? 'bg-red-500 text-white hover:bg-red-600' :
                    'bg-civic-500 text-white hover:bg-civic-600'
                  }`}>
                  {status === 'resolved' && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  {status === 'rejected' && <XCircle className="w-4 h-4 inline mr-1" />}
                  {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
              {!['resolved', 'closed', 'rejected'].includes(complaint.status) && (
                <button onClick={rejectComplaint} className="text-sm px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200">
                  <XCircle className="w-4 h-4 inline mr-1" /> Reject
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Description</h3>
              <p className="text-gray-700">{complaint.description}</p>
              {complaint.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {complaint.images.map(img => (
                    <a key={img.id} href={img.image_path} target="_blank" rel="noopener noreferrer"
                      className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img src={img.image_path} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-purple-600" /> AI Analysis</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 bg-purple-50 rounded-lg"><p className="text-xs text-purple-600">Category</p><p className="text-sm font-medium">{complaint.ai_category}</p></div>
                <div className="p-3 bg-orange-50 rounded-lg"><p className="text-xs text-orange-600">Severity</p><p className="text-sm font-medium">{complaint.ai_severity} ({complaint.severity}/10)</p></div>
                <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-red-600">Safety Risk</p><p className="text-sm font-medium">{complaint.ai_safety_risk?.split(' - ')[0]}</p></div>
              </div>
              {complaint.ai_summary && <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{complaint.ai_summary}</p>}
            </div>

            {/* Comments */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Comments</h3>
              <div className="space-y-3 mb-4">
                {complaint.comments?.map(c => (
                  <div key={c.id} className={`p-3 rounded-lg ${c.is_internal ? 'bg-yellow-50 border border-yellow-200' : c.user_role === 'citizen' ? 'bg-blue-50' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.user_name}</span>
                      {c.is_internal && <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">Internal</span>}
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.comment}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" className="input-field flex-1" placeholder="Add a comment..."
                    value={comment} onChange={e => setComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && addComment_()} />
                  <button onClick={addComment_} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                  Internal note (not visible to citizen)
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Management */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Manage</h3>
              <div className="space-y-4">
                <div>
                  <label className="label-text">Priority</label>
                  <select className="input-field" value={complaint.priority} onChange={e => updatePriority(e.target.value)}>
                    {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Assign Officer</label>
                  <select className="input-field" value={complaint.assigned_officer_id || ''} onChange={e => assignOfficer(e.target.value)}>
                    <option value="">Unassigned</option>
                    {officers.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Department</label>
                  <p className="text-sm font-medium text-gray-900">{complaint.department_name}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Status Timeline</h3>
              <StatusTimeline currentStatus={complaint.status} statusHistory={complaint.statusHistory} />
            </div>

            {/* Map */}
            {complaint.latitude && complaint.longitude && (
              <div className="card p-4">
                <h3 className="font-semibold mb-3 text-sm">Location</h3>
                <ComplaintMap complaints={[complaint]} height="200px" zoom={15} />
              </div>
            )}

            {/* Feedback */}
            {complaint.feedback && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Citizen Feedback</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(r => <span key={r} className={`text-lg ${r <= complaint.feedback.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>)}
                </div>
                {complaint.feedback.comment && <p className="text-sm text-gray-600">{complaint.feedback.comment}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

