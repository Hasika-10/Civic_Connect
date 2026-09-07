const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();

  const stats = {
    totalUsers: db.prepare("SELECT COUNT(*) as v FROM users WHERE role = 'citizen'").get().v,
    totalAuthorities: db.prepare("SELECT COUNT(*) as v FROM users WHERE role = 'authority'").get().v,
    totalDepartments: db.prepare('SELECT COUNT(*) as v FROM departments').get().v,
    totalComplaints: db.prepare('SELECT COUNT(*) as v FROM complaints').get().v,
    resolvedComplaints: db.prepare("SELECT COUNT(*) as v FROM complaints WHERE status IN ('resolved','closed')").get().v,
    pendingComplaints: db.prepare("SELECT COUNT(*) as v FROM complaints WHERE status NOT IN ('resolved','closed','rejected')").get().v,
    criticalComplaints: db.prepare("SELECT COUNT(*) as v FROM complaints WHERE priority = 'critical' AND status NOT IN ('resolved','closed','rejected')").get().v,
    overdueComplaints: db.prepare("SELECT COUNT(*) as v FROM complaints WHERE sla_deadline < datetime('now') AND status NOT IN ('resolved','closed','rejected')").get().v,
    avgSatisfaction: db.prepare('SELECT AVG(rating) as v FROM feedback').get().v || 0,
    slaCompliance: 0
  };

  // SLA compliance
  const totalWithSla = db.prepare("SELECT COUNT(*) as v FROM complaints WHERE sla_deadline IS NOT NULL AND status IN ('resolved','closed')").get().v;
  const withinSla = db.prepare("SELECT COUNT(*) as v FROM complaints WHERE sla_deadline IS NOT NULL AND status IN ('resolved','closed') AND resolved_at <= sla_deadline").get().v;
  stats.slaCompliance = totalWithSla > 0 ? Math.round((withinSla / totalWithSla) * 100) : 100;

  // Department performance
  stats.departmentPerformance = db.prepare(`
    SELECT d.name, d.code,
    COUNT(c.id) as total,
    SUM(CASE WHEN c.status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved,
    AVG(CASE WHEN c.resolved_at IS NOT NULL THEN JULIANDAY(c.resolved_at) - JULIANDAY(c.created_at) END) as avg_days
    FROM departments d
    LEFT JOIN complaints c ON d.id = c.department_id
    GROUP BY d.id ORDER BY total DESC
  `).all();

  // Officer performance
  stats.officerPerformance = db.prepare(`
    SELECT u.full_name, d.name as department_name,
    COUNT(c.id) as total,
    SUM(CASE WHEN c.status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved,
    AVG(CASE WHEN c.resolved_at IS NOT NULL THEN JULIANDAY(c.resolved_at) - JULIANDAY(c.created_at) END) as avg_days
    FROM users u
    LEFT JOIN complaints c ON u.id = c.assigned_officer_id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role = 'authority'
    GROUP BY u.id ORDER BY total DESC
  `).all();

  // Audit logs (recent)
  stats.recentAuditLogs = db.prepare(`
    SELECT al.*, u.full_name as user_name FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC LIMIT 20
  `).all();

  res.json(stats);
});

// Manage users
router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { role, search } = req.query;

  let query = 'SELECT u.id, u.full_name, u.email, u.phone, u.role, u.city, u.area, u.department_id, u.is_active, u.created_at, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE 1=1';
  const params = [];

  if (role) { query += ' AND u.role = ?'; params.push(role); }
  if (search) { query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY u.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// Create authority user
router.post('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const { full_name, email, phone, password, role, department_id, city, area } = req.body;
  const db = getDb();

  const hashed = await bcrypt.hash(password || 'password123', 10);

  try {
    const result = db.prepare('INSERT INTO users (full_name, email, phone, password, role, department_id, city, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(full_name, email, phone, hashed, role || 'authority', department_id, city, area);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'USER_CREATE', 'user', result.lastInsertRowid, `Created ${role || 'authority'} user: ${full_name}`);

    res.status(201).json({ id: result.lastInsertRowid, message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Toggle user active status
router.put('/users/:id/toggle', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
  res.json({ message: 'User status toggled' });
});

// Manage departments
router.get('/departments', authenticateToken, requireRole('admin', 'authority'), (req, res) => {
  const db = getDb();
  const departments = db.prepare(`
    SELECT d.*,
    (SELECT COUNT(*) FROM complaints c WHERE c.department_id = d.id) as total_complaints,
    (SELECT COUNT(*) FROM complaints c WHERE c.department_id = d.id AND c.status IN ('resolved','closed')) as resolved_complaints,
    (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'authority') as officer_count
    FROM departments d ORDER BY d.name
  `).all();
  res.json(departments);
});

router.post('/departments', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, code, description, head_name, head_email, head_phone, sla_hours } = req.body;
  const db = getDb();

  try {
    const result = db.prepare('INSERT INTO departments (name, code, description, head_name, head_email, head_phone, sla_hours) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, code, description, head_name, head_email, head_phone, sla_hours || 48);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Department code already exists' });
  }
});

router.put('/departments/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, description, head_name, head_email, head_phone, sla_hours, is_active } = req.body;
  const db = getDb();

  db.prepare('UPDATE departments SET name=COALESCE(?,name), description=COALESCE(?,description), head_name=COALESCE(?,head_name), head_email=COALESCE(?,head_email), head_phone=COALESCE(?,head_phone), sla_hours=COALESCE(?,sla_hours), is_active=COALESCE(?,is_active) WHERE id=?')
    .run(name, description, head_name, head_email, head_phone, sla_hours, is_active, req.params.id);

  res.json({ message: 'Department updated' });
});

// Manage categories
router.get('/categories', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT cc.*, d.name as department_name FROM complaint_categories cc LEFT JOIN departments d ON cc.department_id = d.id').all());
});

router.post('/categories', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, code, icon, description, department_id } = req.body;
  const db = getDb();

  const result = db.prepare('INSERT INTO complaint_categories (name, code, icon, description, department_id) VALUES (?, ?, ?, ?, ?)')
    .run(name, code, icon, description, department_id);
  res.status(201).json({ id: result.lastInsertRowid });
});

module.exports = router;

