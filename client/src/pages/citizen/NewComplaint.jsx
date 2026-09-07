import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LocationPicker from '../../components/maps/LocationPicker';
import { useToast } from '../../context/NotificationContext';
import api from '../../services/api';
import {
  FileText, Camera, MapPin, Bot, Send, Upload, X, AlertTriangle,
  CheckCircle2, Building2, Clock, Shield, ChevronRight, Eye
} from 'lucide-react';

export default function NewComplaint() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1); // 1: form, 2: ai-analysis, 3: preview
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', subcategory_id: '',
    latitude: null, longitude: null, address: '', landmark: '', city: 'Chennai', area: ''
  });
  const [files, setFiles] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    api.get('/complaints/meta/categories').then(res => setCategories(res.data));
  }, []);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedCategory = categories.find(c => c.id === parseInt(form.category_id));

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 10 - files.length);
    setFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const runAIAnalysis = async () => {
    if (!form.title || !form.description) {
      addToast('Please fill in title and description first', 'warning');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await api.post('/complaints/analyze', {
        title: form.title, description: form.description,
        category_id: form.category_id, latitude: form.latitude, longitude: form.longitude
      });
      setAiAnalysis(res.data.analysis);
      setDuplicates(res.data.duplicates);
      setStep(2);
    } catch (e) {
      addToast('AI analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => { if (val !== null && val !== '') formData.append(key, val); });
      files.forEach(f => formData.append('images', f));

      const res = await api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast(`Complaint submitted! ID: ${res.data.complaint_id}`, 'success');
      navigate(`/citizen/complaints/${res.data.id}`);
    } catch (e) {
      addToast(e.response?.data?.error || 'Failed to submit complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'AI Analysis' },
            { num: 3, label: 'Preview & Submit' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-emerald-700' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s.num ? 'bg-emerald-600 text-white shadow-sm' : step === s.num ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400' : 'bg-slate-100'}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="card p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-civic-600" /> Report a Civic Issue
            </h2>

            <div>
              <label className="label-text">Complaint Title *</label>
              <input type="text" className="input-field" placeholder="E.g., Large pothole on main road"
                value={form.title} onChange={e => update('title', e.target.value)} />
            </div>

            <div>
              <label className="label-text">Description *</label>
              <textarea className="input-field h-32 resize-none" placeholder="Describe the issue in detail..."
                value={form.description} onChange={e => update('description', e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Category *</label>
                <select className="input-field" value={form.category_id} onChange={e => { update('category_id', e.target.value); update('subcategory_id', ''); }}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Sub-category</label>
                <select className="input-field" value={form.subcategory_id} onChange={e => update('subcategory_id', e.target.value)} disabled={!selectedCategory?.subcategories?.length}>
                  <option value="">Select sub-category</option>
                  {selectedCategory?.subcategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="label-text flex items-center gap-2"><Camera className="w-4 h-4" /> Photos / Video</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  dragging ? 'border-civic-500 bg-civic-50' : 'border-gray-300 hover:border-civic-400'}`}
                onClick={() => document.getElementById('file-input').click()}>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Drag & drop images/videos here or <span className="text-civic-600 font-medium">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">Max 10 files, 50MB each (JPEG, PNG, MP4)</p>
                <input id="file-input" type="file" multiple accept="image/*,video/*" className="hidden"
                  onChange={e => handleFiles(e.target.files)} />
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {files.map((f, i) => (
                    <div key={i} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        {f.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Video</div>
                        )}
                      </div>
                      <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="label-text flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</label>
              <LocationPicker
                latitude={form.latitude} longitude={form.longitude}
                onLocationSelect={(lat, lng) => { update('latitude', lat); update('longitude', lng); }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Address</label>
                <input type="text" className="input-field" placeholder="Street address"
                  value={form.address} onChange={e => update('address', e.target.value)} />
              </div>
              <div>
                <label className="label-text">Landmark</label>
                <input type="text" className="input-field" placeholder="Nearby landmark"
                  value={form.landmark} onChange={e => update('landmark', e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">City</label>
                <input type="text" className="input-field" value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div>
                <label className="label-text">Area</label>
                <select className="input-field" value={form.area} onChange={e => update('area', e.target.value)}>
                  <option value="">Select area</option>
                  {['Anna Nagar', 'T. Nagar', 'Adyar', 'Mylapore', 'Velachery', 'Guindy', 'Tambaram', 'Porur'].map(a =>
                    <option key={a} value={a}>{a}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={runAIAnalysis} disabled={analyzing || !form.title || !form.description}
                className="btn-primary flex items-center gap-2">
                {analyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bot className="w-5 h-5" />}
                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {step === 2 && aiAnalysis && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <Bot className="w-5 h-5 text-purple-600" /> AI Analysis Results
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs text-purple-600 font-medium mb-1">Detected Category</p>
                  <p className="font-semibold text-gray-900">{aiAnalysis.category}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs text-orange-600 font-medium mb-1">Severity</p>
                  <p className="font-semibold text-gray-900">{aiAnalysis.severity} ({aiAnalysis.severityScore}/10)</p>
                </div>
                <div className={`p-4 rounded-xl ${aiAnalysis.priority === 'critical' ? 'bg-red-50' : aiAnalysis.priority === 'high' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                  <p className="text-xs font-medium mb-1 capitalize text-gray-600">Priority</p>
                  <p className="font-semibold text-gray-900 uppercase">{aiAnalysis.priority}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600 font-medium mb-1">Recommended Department</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1"><Building2 className="w-4 h-4" /> {aiAnalysis.department}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600 font-medium mb-1">Safety Risk</p>
                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-1"><Shield className="w-4 h-4" /> {aiAnalysis.safetyRisk?.split(' - ')[0]}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-green-600 font-medium mb-1">Est. Resolution Time</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1"><Clock className="w-4 h-4" /> {aiAnalysis.resolutionTime}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium mb-1">AI Summary</p>
                <p className="text-sm text-gray-700">{aiAnalysis.summary}</p>
                <p className="text-xs text-gray-400 mt-2">Confidence: {Math.round(aiAnalysis.confidence * 100)}%</p>
              </div>
            </div>

            {/* Duplicates */}
            {duplicates.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /> Similar Complaints Found Nearby
                </h3>
                <div className="space-y-3">
                  {duplicates.map(d => (
                    <div key={d.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{d.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{d.complaintId} | {d.category} | {d.status}</p>
                        </div>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">{d.distance}m away</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500">You can still submit your complaint if the issue is different.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">Back to Edit</button>
              <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                <Eye className="w-5 h-5" /> Preview & Submit
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-civic-600" /> Complaint Preview
              </h2>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Title</p><p className="font-medium">{form.title}</p></div>
                  <div><p className="text-xs text-gray-500">Category</p><p className="font-medium">{selectedCategory?.icon} {selectedCategory?.name || 'Auto-detected'}</p></div>
                </div>
                <div><p className="text-xs text-gray-500">Description</p><p className="text-sm text-gray-700">{form.description}</p></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><p className="text-xs text-gray-500">AI Priority</p><p className="font-medium uppercase">{aiAnalysis?.priority}</p></div>
                  <div><p className="text-xs text-gray-500">Department</p><p className="font-medium">{aiAnalysis?.department}</p></div>
                  <div><p className="text-xs text-gray-500">Location</p><p className="font-medium">{form.address || form.area || 'On map'}</p></div>
                </div>
                {files.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Attached Files ({files.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          {f.type.startsWith('image/') && <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

