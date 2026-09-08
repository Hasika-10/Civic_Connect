const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const storageService = require('../services/storageService');
const { createNotification, notifyStatusChange } = require('../services/notificationService');

const router = express.Router();

// Get all complaints for authority
router.get('/complaints', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const { status, priority, category, department, search, sort, order, page, limit: lim } = req.query;

  let query = `SELECT c.*, cc.name as category_name, cc.icon as category_icon,
    d.name as department_name, u.full_name as officer_name, cr.full_name as reporter_name
    FROM complaints c
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.assigned_officer_id = u.id
    LEFT JOIN users cr ON c.user_id = cr.id WHERE 1=1`;

  const params = [];

  // Authority can only see complaints from their department (unless admin)
  if (req.user.role === 'authority' && req.user.department_id) {
    query += ' AND c.department_id = ?';
    params.push(req.user.department_id);
  }

  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (priority) { query += ' AND c.priority = ?'; params.push(priority); }
  if (category) { query += ' AND c.category_id = ?'; params.push(category); }
  if (department) { query += ' AND c.department_id = ?'; params.push(department); }
  if (search) {
    query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.complaint_id LIKE ? OR c.address LIKE ? OR cr.full_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  const sortField = sort || 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  const validSorts = ['created_at', 'priority', 'status', 'severity', 'updated_at'];
  query += ` ORDER BY ${validSorts.includes(sortField) ? `c.${sortField}` : 'c.created_at'} ${sortOrder}`;

  const pageNum = parseInt(page) || 1;
  const limit = parseInt(lim) || 50;
  const offset = (pageNum - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const complaints = await db.prepare(query).all(...params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM complaints c LEFT JOIN users cr ON c.user_id = cr.id WHERE 1=1`;
  const countParams = [];
  if (req.user.role === 'authority' && req.user.department_id) {
    countQuery += ' AND c.department_id = ?';
    countParams.push(req.user.department_id);
  }
  if (status) { countQuery += ' AND c.status = ?'; countParams.push(status); }
  if (priority) { countQuery += ' AND c.priority = ?'; countParams.push(priority); }

  const countRow = await db.prepare(countQuery).get(...countParams);
  const total = countRow?.total || 0;

  res.json({ complaints, total, page: pageNum, totalPages: Math.ceil(total / limit) });
});

// Update complaint status
router.put('/complaints/:id/status', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const { status, comment } = req.body;
  const complaint = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const oldStatus = complaint.status;

  await db.prepare(`UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP ${status === 'resolved' ? ', resolved_at = CURRENT_TIMESTAMP' : ''} WHERE id = ?`)
    .run(status, req.params.id);

  await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.id, oldStatus, status, req.user.id, comment || `Status changed to ${status}`);

  await notifyStatusChange(parseInt(req.params.id), oldStatus, status, req.user.id);

  await db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, 'STATUS_CHANGE', 'complaint', req.params.id, oldStatus, status);

  res.json({ message: 'Status updated' });
});

// Assign/Reassign complaint
router.put('/complaints/:id/assign', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const { officer_id, department_id } = req.body;

  await db.prepare('UPDATE complaints SET assigned_officer_id = ?, department_id = COALESCE(?, department_id), status = CASE WHEN status = "ai_analyzed" THEN "assigned" ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(officer_id, department_id, req.params.id);

  if (officer_id) {
    const officer = await db.prepare('SELECT full_name FROM users WHERE id = ?').get(officer_id);
    await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, null, 'assigned', req.user.id, `Assigned to ${officer?.full_name || 'officer'}`);

    const complaint = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    await createNotification(officer_id, 'Complaint Assigned', `Complaint ${complaint.complaint_id} has been assigned to you.`, 'info', complaint.id);
  }

  res.json({ message: 'Assignment updated' });
});

// Update priority
router.put('/complaints/:id/priority', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const { priority } = req.body;
  const complaint = await db.prepare('SELECT priority FROM complaints WHERE id = ?').get(req.params.id);

  await db.prepare('UPDATE complaints SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(priority, req.params.id);

  await db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, 'PRIORITY_CHANGE', 'complaint', req.params.id, complaint?.priority, priority);

  res.json({ message: 'Priority updated' });
});

// Reject complaint
router.put('/complaints/:id/reject', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const { reason } = req.body;

  await db.prepare("UPDATE complaints SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(reason, req.params.id);

  await db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.id, 'submitted', 'rejected', req.user.id, `Rejected: ${reason}`);

  await notifyStatusChange(parseInt(req.params.id), 'submitted', 'rejected', req.user.id);

  res.json({ message: 'Complaint rejected' });
});

// Upload progress/resolution images
router.post('/complaints/:id/images', authenticateToken, requireRole('authority', 'admin'), upload.array('images', 5), async (req, res) => {
  const db = getDb();
  const { image_type } = req.body;

  if (req.files && req.files.length > 0) {
    const insertImage = db.prepare('INSERT INTO complaint_images (complaint_id, image_path, image_type, uploaded_by) VALUES (?, ?, ?, ?)');
    for (const file of req.files) {
      const imagePath = await storageService.saveFile(file);
      await insertImage.run(req.params.id, imagePath, image_type || 'progress', req.user.id);
    }
  }

  res.json({ message: 'Images uploaded' });
});

// Get authority dashboard stats
router.get('/dashboard', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const deptFilter = req.user.role === 'authority' && req.user.department_id ? req.user.department_id : null;

  const whereClause = deptFilter ? 'WHERE c.department_id = ?' : '';
  const params = deptFilter ? [deptFilter] : [];

  const totalRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause}`).get(...params);
  const submittedRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.status IN ('submitted','ai_analyzed')`).get(...params);
  const assignedRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.status = 'assigned'`).get(...params);
  const inProgressRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.status = 'in_progress'`).get(...params);
  const underReviewRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.status = 'under_review'`).get(...params);
  const resolvedRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.status IN ('resolved','closed')`).get(...params);
  const rejectedRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.status = 'rejected'`).get(...params);
  const criticalRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.priority = 'critical' AND c.status NOT IN ('resolved','closed','rejected')`).get(...params);
  const highRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.priority = 'high' AND c.status NOT IN ('resolved','closed','rejected')`).get(...params);
  const overdueRow = await db.prepare(`SELECT COUNT(*) as v FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.sla_deadline < datetime('now') AND c.status NOT IN ('resolved','closed','rejected')`).get(...params);

  const stats = {
    total: totalRow?.v || 0,
    submitted: submittedRow?.v || 0,
    assigned: assignedRow?.v || 0,
    inProgress: inProgressRow?.v || 0,
    underReview: underReviewRow?.v || 0,
    resolved: resolvedRow?.v || 0,
    rejected: rejectedRow?.v || 0,
    critical: criticalRow?.v || 0,
    high: highRow?.v || 0,
    overdue: overdueRow?.v || 0
  };

  // Average resolution time
  const avgRes = await db.prepare(`SELECT AVG(JULIANDAY(resolved_at) - JULIANDAY(created_at)) as avg_days FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} c.resolved_at IS NOT NULL`).get(...params);
  stats.avgResolutionDays = avgRes?.avg_days ? Math.round(avgRes.avg_days * 10) / 10 : 0;

  // Charts data
  stats.byCategory = await db.prepare(`SELECT cc.name, COUNT(*) as count FROM complaints c JOIN complaint_categories cc ON c.category_id = cc.id ${whereClause ? whereClause + ' AND 1=1' : ''} GROUP BY c.category_id ORDER BY count DESC`).all(...params);
  stats.byStatus = await db.prepare(`SELECT status, COUNT(*) as count FROM complaints c ${whereClause} GROUP BY status`).all(...params);
  stats.byPriority = await db.prepare(`SELECT priority, COUNT(*) as count FROM complaints c ${whereClause} GROUP BY priority`).all(...params);
  stats.byArea = await db.prepare(`SELECT area, COUNT(*) as count FROM complaints c ${whereClause ? whereClause + ' AND' : 'WHERE'} area IS NOT NULL GROUP BY area ORDER BY count DESC LIMIT 10`).all(...params);

  // Monthly trend
  const monthlyRows = await db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as total,
    SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved
    FROM complaints c ${whereClause}
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all(...params);
  stats.monthlyTrend = (monthlyRows || []).reverse();

  // Recent complaints
  stats.recentComplaints = await db.prepare(`
    SELECT c.*, cc.name as category_name, cr.full_name as reporter_name
    FROM complaints c
    LEFT JOIN complaint_categories cc ON c.category_id = cc.id
    LEFT JOIN users cr ON c.user_id = cr.id
    ${whereClause} ORDER BY c.created_at DESC LIMIT 10
  `).all(...params);

  res.json(stats);
});

// Get officers for assignment
router.get('/officers', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  const db = getDb();
  const { department_id } = req.query;

  let query = "SELECT id, full_name, email, department_id FROM users WHERE role = 'authority' AND is_active = 1";
  const params = [];
  if (department_id) {
    query += ' AND department_id = ?';
    params.push(department_id);
  }

  const officers = await db.prepare(query).all(...params);
  res.json(officers);
});

module.exports = router;


