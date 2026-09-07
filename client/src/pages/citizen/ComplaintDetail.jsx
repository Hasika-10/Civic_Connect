import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import StatusTimeline from '../../components/common/StatusTimeline';
import ComplaintMap from '../../components/maps/ComplaintMap';
import { useToast } from '../../context/NotificationContext';
import api from '../../services/api';
import {
  MapPin, Clock, Building2, User, Bot, Shield, MessageSquare,
  Star, ThumbsUp, Send, ArrowLeft, Image as ImageIcon, AlertTriangle
} from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, satisfaction: 'satisfied', comment: '', is_resolved: true, reopen_reason: '' });
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => { loadComplaint(); }, [id]);

  const loadComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (e) {
      addToast('Failed to load complaint', 'error');
    } finally { setLoading(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/complaints/${id}/comment`, { comment });
    setComment('');
    loadComplaint();
    addToast('Comment added', 'success');
  };

  const upvote = async () => {
    try {
      await api.post(`/complaints/${id}/upvote`);
      loadComplaint();
      addToast('Upvoted!', 'success');
    } catch { addToast('Already upvoted', 'warning'); }
  };

  const submitFeedback = async () => {
    try {
      await api.post(`/complaints/${id}/feedback`, feedbackForm);
      addToast('Feedback submitted!', 'success');
      loadComplaint();
      setShowFeedback(false);
    } catch (e) { addToast('Failed to submit feedback', 'error'); }
  };

  if (loading) return <DashboardLayout><div className="text-center py-12 text-gray-500">Loading...</div></DashboardLayout>;
  if (!complaint) return <DashboardLayout><div className="text-center py-12 text-gray-500">Complaint not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <Link to="/citizen/complaints" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to complaints
        </Link>

        {/* Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-gray-400">{complaint.complaint_id}</span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(complaint.created_at).toLocaleDateString()}</span>
                {complaint.department_name && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {complaint.department_name}</span>}
                {complaint.officer_name && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {complaint.officer_name}</span>}
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {complaint.area || complaint.address}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={upvote} className={`btn-secondary text-sm flex items-center gap-1 ${complaint.hasUpvoted ? 'bg-civic-50 text-civic-600' : ''}`}>
                <ThumbsUp className="w-4 h-4" /> {complaint.upvotes || 1}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{complaint.description}</p>

              {/* Images */}
              {complaint.images?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Attached Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.images.map(img => (
                      <a key={img.id} href={img.image_path} target="_blank" rel="noopener noreferrer"
                        className="aspect-video rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition">
                        <img src={img.image_path} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" /> AI Analysis
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 rounded-lg"><p className="text-xs text-purple-600 mb-0.5">Category</p><p className="text-sm font-medium">{complaint.ai_category}</p></div>
                <div className="p-3 bg-orange-50 rounded-lg"><p className="text-xs text-orange-600 mb-0.5">Severity</p><p className="text-sm font-medium">{complaint.ai_severity}</p></div>
                <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-blue-600 mb-0.5">Department</p><p className="text-sm font-medium">{complaint.ai_department}</p></div>
                <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-red-600 mb-0.5">Safety Risk</p><p className="text-sm font-medium">{complaint.ai_safety_risk?.split(' - ')[0]}</p></div>
              </div>
              {complaint.ai_summary && <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{complaint.ai_summary}</p>}
            </div>

            {/* Comments */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-civic-600" /> Comments
              </h3>
              <div className="space-y-3 mb-4">
                {complaint.comments?.length === 0 ? (
                  <p className="text-sm text-gray-500">No comments yet</p>
                ) : complaint.comments?.map(c => (
                  <div key={c.id} className={`p-3 rounded-lg ${c.user_role === 'citizen' ? 'bg-blue-50' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.user_name}</span>
                      <span className="text-xs text-gray-400 capitalize">{c.user_role}</span>
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.comment}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" className="input-field flex-1" placeholder="Add a comment..."
                  value={comment} onChange={e => setComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && addComment()} />
                <button onClick={addComment} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Feedback (for resolved complaints) */}
            {complaint.status === 'resolved' && !complaint.feedback && (
              <div className="card p-6 border-green-200 bg-green-50/50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" /> Rate this Resolution
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Rating</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => setFeedbackForm(prev => ({ ...prev, rating: r }))}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${feedbackForm.rating >= r ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400 hover:bg-yellow-100'}`}>
                          <Star className="w-5 h-5" fill={feedbackForm.rating >= r ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Is the issue actually resolved?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setFeedbackForm(prev => ({ ...prev, is_resolved: true }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${feedbackForm.is_resolved ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Yes</button>
                      <button onClick={() => setFeedbackForm(prev => ({ ...prev, is_resolved: false }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${!feedbackForm.is_resolved ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>No</button>
                    </div>
                  </div>
                  {!feedbackForm.is_resolved && (
                    <div>
                      <label className="label-text">Reason for reopening</label>
                      <textarea className="input-field h-20 resize-none" value={feedbackForm.reopen_reason}
                        onChange={e => setFeedbackForm(prev => ({ ...prev, reopen_reason: e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <label className="label-text">Feedback Comment</label>
                    <textarea className="input-field h-20 resize-none" placeholder="Your feedback..."
                      value={feedbackForm.comment} onChange={e => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))} />
                  </div>
                  <button onClick={submitFeedback} className="btn-primary">Submit Feedback</button>
                </div>
              </div>
            )}

            {complaint.feedback && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Your Feedback</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(r => <Star key={r} className={`w-5 h-5 ${r <= complaint.feedback.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill={r <= complaint.feedback.rating ? 'currentColor' : 'none'} />)}
                  <span className="ml-2 text-sm text-gray-600">{complaint.feedback.rating}/5</span>
                </div>
                {complaint.feedback.comment && <p className="text-sm text-gray-600">{complaint.feedback.comment}</p>}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status Timeline</h3>
              <StatusTimeline currentStatus={complaint.status} statusHistory={complaint.statusHistory} />
            </div>

            {/* Map */}
            {complaint.latitude && complaint.longitude && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Location</h3>
                <ComplaintMap complaints={[complaint]} height="200px" zoom={15} />
                <p className="text-xs text-gray-500 mt-2">{complaint.address || `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`}</p>
              </div>
            )}

            {/* Details */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-mono text-xs">{complaint.complaint_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{complaint.category_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Priority</span><PriorityBadge priority={complaint.priority} /></div>
                <div className="flex justify-between"><span className="text-gray-500">Upvotes</span><span>{complaint.upvotes || 1}</span></div>
                {complaint.sla_deadline && <div className="flex justify-between"><span className="text-gray-500">SLA Deadline</span><span className="text-xs">{new Date(complaint.sla_deadline).toLocaleDateString()}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

