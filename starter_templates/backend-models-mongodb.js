const mongoose = require('mongoose');

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, required: true }, // e.g., CC-2026-001
  citizenId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Category & Classification
  category: {
    main: { type: String, enum: ['Pothole/Road Damage', 'Garbage/Waste', 'Streetlight', 'Water Leakage', 'Drainage/Sewage', 'Traffic/Safety', 'Public Property Damage', 'Electricity', 'Parks/Public Spaces', 'Illegal Dumping', 'Road Signs', 'Other'], required: true },
    sub: { type: String }
  },
  
  // Location
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    landmark: { type: String },
    city: { type: String },
    area: { type: String }
  },
  
  // Priority & Status
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: {
    type: String,
    enum: ['submitted', 'ai_analyzed', 'assigned', 'under_review', 'in_progress', 'resolved', 'verified', 'closed', 'rejected'],
    default: 'submitted'
  },
  
  // AI Analysis
  aiAnalysis: {
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    suggestedCategory: String,
    suggestedDepartment: String,
    safetyRisks: [String],
    summary: String,
    confidence: { type: Number, min: 0, max: 1 },
    analyzedAt: Date,
    model: String
  },
  
  // Assignment
  assignedDepartment: String,
  assignedOfficer: String,
  assignmentHistory: [{
    department: String,
    officer: String,
    assignedAt: { type: Date, default: Date.now },
    reassignedAt: Date,
    reason: String
  }],
  
  // Media
  images: [{
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    aiAnalyzedUrl: String // AI-generated annotated version
  }],
  videos: [String], // URLs
  
  // Timeline
  submittedAt: { type: Date, default: Date.now },
  aiAnalyzedAt: Date,
  assignedAt: Date,
  estimatedResolutionDate: Date,
  resolvedAt: Date,
  closedAt: Date,
  
  // SLA Tracking
  slaDeadline: Date,
  isOverdue: Boolean,
  resolutionTimeHours: Number,
  
  // Communication
  authorityComments: [{
    officer: String,
    comment: String,
    timestamp: { type: Date, default: Date.now },
    attachments: [String]
  }],
  citizenResponses: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    attachments: [String]
  }],
  
  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    isResolved: Boolean,
    comment: String,
    proofImages: [String],
    submittedAt: Date
  },
  
  // Duplicate Detection
  isDuplicate: Boolean,
  duplicateOf: String, // Complaint ID
  linkedComplaints: [String], // Array of complaint IDs
  upvotes: { type: Number, default: 0 },
  supporters: [String], // Array of citizen IDs
  
  // Metadata
  reasonForRejection: String,
  rejectedAt: Date,
  additionalInfoRequested: String,
  infoRequestedAt: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'complaints' });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true }, // User ID
  type: { type: String, enum: ['status_change', 'assignment', 'feedback_request', 'info_request', 'escalation', 'closure'], required: true },
  title: String,
  message: String,
  relatedComplaintId: String,
  actionUrl: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now, index: true }
}, { collection: 'notifications' });

// Status History Schema
const statusHistorySchema = new mongoose.Schema({
  complaintId: String,
  fromStatus: String,
  toStatus: String,
  changedBy: String, // User ID
  reason: String,
  timestamp: { type: Date, default: Date.now }
}, { collection: 'status_history' });

// Complaint Image Analysis Cache
const imageAnalysisSchema = new mongoose.Schema({
  imageUrl: String,
  complaintId: String,
  analysis: {
    detectedObjects: [String],
    severity: String,
    suggestedCategory: String,
    confidence: Number
  },
  analyzedAt: { type: Date, default: Date.now },
  ttl: { type: Date, index: { expires: 2592000 } } // 30 days
}, { collection: 'image_analysis_cache' });

// Analytics & Metrics
const analyticsSchema = new mongoose.Schema({
  date: Date,
  category: String,
  department: String,
  area: String,
  totalComplaints: Number,
  resolvedComplaints: Number,
  pendingComplaints: Number,
  avgResolutionTime: Number,
  slaComplianceRate: Number,
  criticalIssues: Number,
  overduedComplaints: Number
}, { collection: 'analytics' });

module.exports = {
  Complaint: mongoose.model('Complaint', complaintSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  StatusHistory: mongoose.model('StatusHistory', statusHistorySchema),
  ImageAnalysis: mongoose.model('ImageAnalysis', imageAnalysisSchema),
  Analytics: mongoose.model('Analytics', analyticsSchema)
};
