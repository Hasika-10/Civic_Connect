const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const storageService = require('../services/storageService');
const { analyzeComplaint, findDuplicates } = require('../services/aiService');
const { autoAssignComplaint, calculateSLA } = require('../services/assignmentService');
const { createNotification, notifyStatusChange, notifyAssignment } = require('../services/notificationService');

const router = express.Router();

// Get all complaints for current user (citizen)
router.get('/my', authenticateToken, async (req, res) => {
  const db = getDb();
  const complaints = await db.prepare(`
    SELECT c.*, cc.name as category_name, cc.icon as category_icon, d.name as department_name,
    u.full_name as officer_name
    FROM complaints c
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.assigned_officer_id = u.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);

  // Get images for each complaint
  for (const c of complaints) {
    c.images = await db.prepare('SELECT * FROM complaint_images WHERE complaint_id = ?').all(c.id);
  }

  res.json(complaints);
});

// Get single complaint detail
router.get('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const complaint = await db.prepare(`
    SELECT c.*, cc.name as category_name, cc.icon as category_icon,
    csc.name as subcategory_name, d.name as department_name,
    u.full_name as officer_name, u.phone as officer_phone,
    cr.full_name as reporter_name
    FROM complaints c
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    LEFT JOIN complaint_subcategories csc ON c.subcategory_id = csc.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.assigned_officer_id = u.id
    LEFT JOIN users cr ON c.user_id = cr.id
    WHERE c.id = ? OR c.complaint_id = ?
  `).get(req.params.id, req.params.id);

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Access control
  if (req.user.role === 'citizen' && complaint.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get images
  complaint.images = await db.prepare('SELECT * FROM complaint_images WHERE complaint_id = ?').all(complaint.id);

  // Get status history
  complaint.statusHistory = await db.prepare(`
    SELECT csh.*, u.full_name as changed_by_name
    FROM complaint_status_history csh
    LEFT JOIN users u ON csh.changed_by = u.id
    WHERE csh.complaint_id = ?
    ORDER BY csh.created_at ASC
  `).all(complaint.id);

  // Get comments
  complaint.comments = await db.prepare(`
    SELECT cc.*, u.full_name as user_name, u.role as user_role
    FROM complaint_comments cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.complaint_id = ?
    ${req.user.role === 'citizen' ? 'AND cc.is_internal = 0' : ''}
    ORDER BY cc.created_at ASC
  `).all(complaint.id);

  // Get feedback
  complaint.feedback = await db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(complaint.id);

  // Get upvote count and if current user has upvoted
  const upvoteRow = await db.prepare('SELECT COUNT(*) as count FROM complaint_upvotes WHERE complaint_id = ?').get(complaint.id);
  complaint.upvotes = (upvoteRow?.count || 0) + 1;
  const userUpvote = await db.prepare('SELECT id FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?').get(complaint.id, req.user.id);
  complaint.hasUpvoted = !!userUpvote;

  res.json(complaint);
});

// Create new complaint
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const db = getDb();
    const { title, description, category_id, subcategory_id, latitude, longitude, address, landmark, city, area } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Get category name for AI analysis
    let categoryName = null;
    if (category_id) {
      const cat = await db.prepare('SELECT name FROM complaint_categories WHERE id = ?').get(category_id);
      if (cat) categoryName = cat.name;
    }

    // AI Analysis
    const aiResult = await analyzeComplaint(title, description, categoryName);

    // Find duplicates
    const duplicates = await findDuplicates(db, parseFloat(latitude), parseFloat(longitude), parseInt(category_id) || aiResult.departmentId, description);

    // Generate unique complaint ID
    const year = new Date().getFullYear();
    const lastComplaint = await db.prepare("SELECT complaint_id FROM complaints WHERE complaint_id LIKE ? ORDER BY id DESC LIMIT 1").get(`CC-${year}-%`);
    let nextNum = 1;
    if (lastComplaint) {
      const parts = lastComplaint.complaint_id.split('-');
      nextNum = parseInt(parts[2]) + 1;
    }
    const complaintIdStr = `CC-${year}-${String(nextNum).padStart(5, '0')}`;

    // Calculate SLA
    const slaHours = calculateSLA(aiResult.priority);
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Determine department
    let deptId = aiResult.departmentId;
    if (parseInt(category_id)) {
      const catRow = await db.prepare('SELECT department_id FROM complaint_categories WHERE id = ?').get(parseInt(category_id));
      if (catRow?.department_id) deptId = catRow.department_id;
    }

    const result = await db.prepare(`
      INSERT INTO complaints (complaint_id, user_id, title, description, category_id, subcategory_id,
        latitude, longitude, address, landmark, city, area, status, priority, severity,
        department_id, ai_category, ai_severity, ai_priority, ai_summary, ai_department,
        ai_safety_risk, ai_resolution_time, ai_confidence, sla_deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai_analyzed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      complaintIdStr, req.user.id, title, description,
      parseInt(category_id) || null, parseInt(subcategory_id) || null,
      parseFloat(latitude) || null, parseFloat(longitude) || null,
      address || null, landmark || null, city || req.user.city, area || req.user.area,
      aiResult.priority, aiResult.severityScore, deptId,
      aiResult.category, aiResult.severity, aiResult.priority,
      aiResult.summary, aiResult.department, aiResult.safetyRisk,
      aiResult.resolutionTime, aiResult.confidence, slaDeadline
    );

    const complaintId = result.lastInsertRowid;

    // Save images via storage service (cloud on Vercel, disk locally)
    if (req.files && req.files.length > 0) {
      const insertImage = db.prepare('INSERT INTO complaint_images (complaint_id, image_path, uploaded_by) VALUES (?, ?, ?)');
      for (const file of req.files) {
        const imagePath = await storageService.saveFile(file);
        await insertImage.run(complaintId, imagePath, req.user.id);
      }
    }

    // Status history
    await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
      .run(complaintId, null, 'submitted', req.user.id, 'Complaint submitted by citizen');
    await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
      .run(complaintId, 'submitted', 'ai_analyzed', null, `AI analysis complete: ${aiResult.category} (${aiResult.priority} priority)`);

    // Auto-assign to department
    const assignedOfficer = await autoAssignComplaint(complaintId, deptId);

    // Notifications
    await createNotification(req.user.id, 'Complaint Submitted',
      `Your complaint "${title}" has been submitted. ID: ${complaintIdStr}`, 'success', complaintId);

    if (assignedOfficer) {
      await notifyAssignment(complaintId, assignedOfficer.id);
    }

    // SLA record
    await db.prepare('INSERT INTO sla_records (complaint_id, priority, sla_hours, deadline) VALUES (?, ?, ?, ?)')
      .run(complaintId, aiResult.priority, slaHours, slaDeadline);

    // Audit log
    await db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'COMPLAINT_CREATE', 'complaint', complaintId, complaintIdStr);

    // Fetch the full complaint to return
    const complaint = await db.prepare(`
      SELECT c.*, cc.name as category_name, d.name as department_name
      FROM complaints c
      LEFT JOIN complaint_categories cc ON c.category_id = cc.id
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.id = ?
    `).get(complaintId);

    complaint.images = await db.prepare('SELECT * FROM complaint_images WHERE complaint_id = ?').all(complaintId);
    complaint.aiAnalysis = aiResult;
    complaint.duplicates = duplicates;

    res.status(201).json(complaint);
  } catch (err) {
    console.error('Complaint creation error:', err);
    res.status(500).json({ error: 'Failed to create complaint', message: err.message });
  }
});

// AI Analysis preview (before submission)
router.post('/analyze', authenticateToken, async (req, res) => {
  const { title, description, category_id, latitude, longitude } = req.body;
  const db = getDb();

  let categoryName = null;
  if (category_id) {
    const cat = await db.prepare('SELECT name FROM complaint_categories WHERE id = ?').get(parseInt(category_id));
    if (cat) categoryName = cat.name;
  }

  const aiResult = await analyzeComplaint(title || '', description || '', categoryName);
  const duplicates = await findDuplicates(db, parseFloat(latitude), parseFloat(longitude), parseInt(category_id), description);

  res.json({ analysis: aiResult, duplicates });
});

// Add comment
router.post('/:id/comment', authenticateToken, async (req, res) => {
  const db = getDb();
  const { comment, is_internal } = req.body;

  await db.prepare('INSERT INTO complaint_comments (complaint_id, user_id, comment, is_internal) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.user.id, comment, is_internal ? 1 : 0);

  res.json({ message: 'Comment added' });
});

// Upvote complaint
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  const db = getDb();

  try {
    await db.prepare('INSERT INTO complaint_upvotes (complaint_id, user_id) VALUES (?, ?)')
      .run(req.params.id, req.user.id);
    await db.prepare('UPDATE complaints SET upvote_count = upvote_count + 1 WHERE id = ?')
      .run(req.params.id);
    res.json({ message: 'Upvoted' });
  } catch (e) {
    res.status(400).json({ error: 'Already upvoted' });
  }
});

// Submit feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rating, satisfaction, comment, is_resolved, reopen_reason } = req.body;

  await db.prepare(`INSERT OR REPLACE INTO feedback (complaint_id, user_id, rating, satisfaction, comment, is_resolved, reopen_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.params.id, req.user.id, rating, satisfaction, comment, is_resolved ? 1 : 0, reopen_reason);

  if (!is_resolved && reopen_reason) {
    // Reopen complaint
    await db.prepare("UPDATE complaints SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, 'resolved', 'in_progress', req.user.id, `Reopened by citizen: ${reopen_reason}`);

    const complaint = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (complaint.assigned_officer_id) {
      await createNotification(complaint.assigned_officer_id, 'Complaint Reopened',
        `Complaint ${complaint.complaint_id} has been reopened by citizen. Reason: ${reopen_reason}`, 'warning', complaint.id);
    }
  } else {
    // Close complaint
    await db.prepare("UPDATE complaints SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, 'resolved', 'closed', req.user.id, `Citizen verified: Rating ${rating}/5`);
  }

  res.json({ message: 'Feedback submitted' });
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  const db = getDb();
  const categories = await db.prepare('SELECT * FROM complaint_categories WHERE is_active = 1').all();
  for (const c of categories) {
    c.subcategories = await db.prepare('SELECT * FROM complaint_subcategories WHERE category_id = ?').all(c.id);
  }
  res.json(categories);
});

// Get areas
router.get('/meta/areas', async (req, res) => {
  const db = getDb();
  const areas = await db.prepare('SELECT * FROM areas WHERE is_active = 1').all();
  res.json(areas);
});

// Get map data
router.get('/map/all', async (req, res) => {
  const db = getDb();
  const { category, status, priority, area } = req.query;

  let query = `SELECT c.id, c.complaint_id, c.title, c.latitude, c.longitude, c.status, c.priority, c.severity,
    c.created_at, cc.name as category_name, cc.icon as category_icon, c.area
    FROM complaints c LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL`;

  const params = [];
  if (category) { query += ' AND c.category_id = ?'; params.push(category); }
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (priority) { query += ' AND c.priority = ?'; params.push(priority); }
  if (area) { query += ' AND c.area = ?'; params.push(area); }

  query += ' ORDER BY c.created_at DESC';
  const data = await db.prepare(query).all(...params);
  res.json(data);
});

module.exports = router;

