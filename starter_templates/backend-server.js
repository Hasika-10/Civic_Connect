require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const pgPromise = require('pg-promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Models
const { Complaint, Notification, StatusHistory, Analytics } = require('./backend-models-mongodb');
const AIService = require('./backend-services-ai');

// Initialize Express App
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Database Configuration
const pgp = pgPromise();
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'civicconnect_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

const db = pgp(pgConfig);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ==================== AUTHENTICATION ====================

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based Access Control
const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.user_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Citizen Registration
app.post('/api/auth/register/citizen', async (req, res) => {
  try {
    const { full_name, email, phone, password, city, area } = req.body;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create user in PostgreSQL
    const user = await db.one(
      'INSERT INTO users(uuid, full_name, email, phone, password_hash, user_type, city, area) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [uuidv4(), full_name, email, phone, password_hash, 'citizen', city, area]
    );
    
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, uuid: user.uuid, user_type: 'citizen', email },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    res.status(201).json({
      message: 'Citizen registered successfully',
      user: { id: user.id, uuid: user.uuid, email, full_name, user_type: 'citizen' },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Citizen Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Create token
    const token = jwt.sign(
      { id: user.id, uuid: user.uuid, user_type: user.user_type, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    res.json({
      message: 'Login successful',
      user: { id: user.id, uuid: user.uuid, email, full_name: user.full_name, user_type: user.user_type },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPLAINTS ====================

// Get next complaint ID
const getNextComplaintId = async () => {
  const lastComplaint = await Complaint.findOne().sort({ complaintId: -1 });
  const lastId = lastComplaint?.complaintId ? parseInt(lastComplaint.complaintId.split('-')[2]) : 0;
  return `CC-${new Date().getFullYear()}-${String(lastId + 1).padStart(5, '0')}`;
};

// Submit New Complaint
app.post('/api/complaints/submit', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, category, sub_category, address, landmark, latitude, longitude, city, area } = req.body;
    
    // Generate complaint ID
    const complaintId = await getNextComplaintId();
    
    // Process uploaded images
    const images = req.files?.map(file => ({
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    })) || [];
    
    // Perform AI Analysis
    const aiAnalysis = await AIService.analyzeComplaint({
      title,
      description,
      category,
      location: { city, area }
    });
    
    // Check for duplicates
    const nearbyComplaints = await Complaint.find({
      'location.area': area,
      'category.main': category,
      status: { $ne: 'closed' }
    }).limit(10);
    
    const duplicates = await AIService.detectDuplicates(
      { title, description, category, location: { area } },
      nearbyComplaints
    );
    
    // Create complaint in MongoDB
    const complaint = new Complaint({
      complaintId,
      citizenId: req.user.uuid,
      title,
      description,
      category: { main: category, sub: sub_category },
      location: { latitude, longitude, address, landmark, city, area },
      priority: aiAnalysis.priority,
      aiAnalysis: {
        ...aiAnalysis,
        analyzedAt: new Date()
      },
      images,
      assignedDepartment: aiAnalysis.suggestedDepartment,
      slaDeadline: new Date(Date.now() + aiAnalysis.estimatedResolutionHours * 60 * 60 * 1000),
      linkedComplaints: duplicates.map(d => d.complaintId)
    });
    
    await complaint.save();
    
    // Create notification for citizen
    await Notification.create({
      recipientId: req.user.uuid,
      type: 'status_change',
      title: 'Complaint Submitted Successfully',
      message: `Your complaint has been registered with ID: ${complaintId}`,
      relatedComplaintId: complaintId
    });
    
    // Create audit log
    await db.none(
      'INSERT INTO audit_logs(user_id, action, entity_type, entity_id, details) VALUES($1, $2, $3, $4, $5)',
      [req.user.id, 'complaint_created', 'complaint', complaintId, `Category: ${category}, Priority: ${aiAnalysis.priority}`]
    );
    
    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: {
        complaintId,
        status: complaint.status,
        priority: aiAnalysis.priority,
        aiAnalysis,
        duplicates: duplicates.length > 0 ? duplicates : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Complaint Details
app.get('/api/complaints/:complaintId', verifyToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.complaintId });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    // Check authorization
    if (req.user.user_type === 'citizen' && complaint.citizenId !== req.user.uuid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User's Complaints (Citizen)
app.get('/api/complaints/user/list', verifyToken, authorizeRole('citizen'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizenId: req.user.uuid })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => ['submitted', 'ai_analyzed', 'assigned'].includes(c.status)).length,
      inProgress: complaints.filter(c => c.status === 'in_progress').length,
      resolved: complaints.filter(c => ['resolved', 'verified', 'closed'].includes(c.status)).length,
      rejected: complaints.filter(c => c.status === 'rejected').length
    };
    
    res.json({ complaints, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Complaints for Authority Dashboard
app.get('/api/complaints/authority/list', verifyToken, authorizeRole('authority'), async (req, res) => {
  try {
    const { priority, status, page = 1, limit = 20 } = req.query;
    
    // Get user's department
    const staff = await db.oneOrNone(
      'SELECT d.name FROM department_staff ds JOIN departments d ON ds.department_id = d.id WHERE ds.user_id = $1',
      [req.user.id]
    );
    
    if (!staff) return res.status(403).json({ error: 'Not assigned to a department' });
    
    // Build query
    let query = { assignedDepartment: staff.name };
    if (priority) query.priority = priority;
    if (status) query.status = status;
    
    const complaints = await Complaint.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Complaint.countDocuments(query);
    
    res.json({
      complaints,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Complaint Status (Authority)
app.patch('/api/complaints/:complaintId/status', verifyToken, authorizeRole('authority', 'admin'), async (req, res) => {
  try {
    const { status, comment } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.complaintId },
      {
        status,
        updatedAt: new Date(),
        $push: {
          authorityComments: {
            officer: req.user.uuid,
            comment,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    // Create status history record
    await StatusHistory.create({
      complaintId: req.params.complaintId,
      fromStatus: complaint.status,
      toStatus: status,
      changedBy: req.user.uuid,
      timestamp: new Date()
    });
    
    // Notify citizen
    await Notification.create({
      recipientId: complaint.citizenId,
      type: 'status_change',
      title: `Complaint Status Updated`,
      message: `Your complaint status is now: ${status}`,
      relatedComplaintId: req.params.complaintId
    });
    
    res.json({ message: 'Status updated successfully', complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign Complaint to Officer (Authority)
app.post('/api/complaints/:complaintId/assign', verifyToken, authorizeRole('authority', 'admin'), async (req, res) => {
  try {
    const { officer_id } = req.body;
    
    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.complaintId },
      {
        assignedOfficer: officer_id,
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date(),
        $push: {
          assignmentHistory: {
            officer: officer_id,
            assignedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    res.json({ message: 'Complaint assigned', complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Resolution (Authority)
app.post('/api/complaints/:complaintId/resolve', verifyToken, authorizeRole('authority'), upload.array('resolutionImages', 3), async (req, res) => {
  try {
    const { resolution_comment } = req.body;
    
    const resolutionImages = req.files?.map(file => `/uploads/${file.filename}`) || [];
    
    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.complaintId },
      {
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date(),
        $push: {
          authorityComments: {
            officer: req.user.uuid,
            comment: resolution_comment,
            attachments: resolutionImages,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    // Notify citizen for feedback
    await Notification.create({
      recipientId: complaint.citizenId,
      type: 'feedback_request',
      title: 'Please Verify Resolution',
      message: 'Your complaint has been resolved. Please verify and provide feedback.',
      relatedComplaintId: req.params.complaintId
    });
    
    res.json({ message: 'Complaint resolved', complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Feedback (Citizen)
app.post('/api/complaints/:complaintId/feedback', verifyToken, authorizeRole('citizen'), upload.array('proofImages', 3), async (req, res) => {
  try {
    const { rating, is_resolved, comment } = req.body;
    const proofImages = req.files?.map(file => `/uploads/${file.filename}`) || [];
    
    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.complaintId },
      {
        feedback: {
          rating: parseInt(rating),
          isResolved: is_resolved === 'true',
          comment,
          proofImages,
          submittedAt: new Date()
        },
        status: is_resolved === 'true' ? 'verified' : 'reopened',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    res.json({ message: 'Feedback submitted', complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTHORITY DASHBOARD ====================

// Get Dashboard Statistics
app.get('/api/dashboard/authority', verifyToken, authorizeRole('authority', 'admin'), async (req, res) => {
  try {
    const staff = await db.oneOrNone(
      'SELECT d.name FROM department_staff ds JOIN departments d ON ds.department_id = d.id WHERE ds.user_id = $1',
      [req.user.id]
    );
    
    const query = staff ? { assignedDepartment: staff.name } : {};
    
    const [total, newComplaints, pending, inProgress, highPriority, critical, resolved, overdue] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.countDocuments({ ...query, status: 'submitted' }),
      Complaint.countDocuments({ ...query, status: { $in: ['ai_analyzed', 'assigned', 'under_review'] } }),
      Complaint.countDocuments({ ...query, status: 'in_progress' }),
      Complaint.countDocuments({ ...query, priority: 'high' }),
      Complaint.countDocuments({ ...query, priority: 'critical' }),
      Complaint.countDocuments({ ...query, status: { $in: ['resolved', 'verified', 'closed'] } }),
      Complaint.countDocuments({ ...query, isOverdue: true })
    ]);
    
    const avgResolutionTime = await Complaint.aggregate([
      { $match: { ...query, resolvedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$resolvedAt', '$submittedAt'] } }
        }
      }
    ]);
    
    res.json({
      stats: {
        total,
        new: newComplaints,
        pending,
        inProgress,
        highPriority,
        critical,
        resolved,
        overdue,
        avgResolutionTimeHours: Math.round((avgResolutionTime[0]?.avgTime || 0) / (1000 * 60 * 60))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI INSIGHTS ====================

app.get('/api/insights/ai', verifyToken, authorizeRole('authority', 'admin'), async (req, res) => {
  try {
    const staff = await db.oneOrNone(
      'SELECT d.name FROM department_staff ds JOIN departments d ON ds.department_id = d.id WHERE ds.user_id = $1',
      [req.user.id]
    );
    
    const complaints = await Complaint.find(staff ? { assignedDepartment: staff.name } : {});
    
    // Prepare analytics data
    const analyticsData = {
      totalComplaints: complaints.length,
      byArea: complaints.reduce((acc, c) => {
        const area = c.location.area || 'Unknown';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {}),
      byCategory: complaints.reduce((acc, c) => {
        const cat = c.category.main;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
      byStatus: complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
      critical: complaints.filter(c => c.priority === 'critical').length
    };
    
    const insights = await AIService.generateInsights(analyticsData);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.uuid })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER PROFILE ====================

app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await db.one('SELECT * FROM users WHERE id = $1', [req.user.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CivicConnect Backend running on port ${PORT}`);
});

module.exports = app;
