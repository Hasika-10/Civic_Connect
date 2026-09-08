const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = getDb();

    const [
      totalUsersRow,
      totalAuthoritiesRow,
      totalDepartmentsRow,
      totalComplaintsRow,
      resolvedComplaintsRow,
      pendingComplaintsRow,
      criticalComplaintsRow,
      overdueComplaintsRow,
      avgSatisfactionRow,
      totalWithSlaRow,
      withinSlaRow,
      departmentPerformance,
      officerPerformance,
      recentAuditLogs
    ] = await Promise.all([
      db.prepare("SELECT COUNT(*) as v FROM users WHERE role = 'citizen'").get(),
      db.prepare("SELECT COUNT(*) as v FROM users WHERE role = 'authority'").get(),
      db.prepare('SELECT COUNT(*) as v FROM departments').get(),
      db.prepare('SELECT COUNT(*) as v FROM complaints').get(),
      db.prepare("SELECT COUNT(*) as v FROM complaints WHERE status IN ('resolved','closed')").get(),
      db.prepare("SELECT COUNT(*) as v FROM complaints WHERE status NOT IN ('resolved','closed','rejected')").get(),
      db.prepare("SELECT COUNT(*) as v FROM complaints WHERE priority = 'critical' AND status NOT IN ('resolved','closed','rejected')").get(),
      db.prepare("SELECT COUNT(*) as v FROM complaints WHERE sla_deadline < datetime('now') AND status NOT IN ('resolved','closed','rejected')").get(),
      db.prepare('SELECT AVG(rating) as v FROM feedback').get(),
      db.prepare("SELECT COUNT(*) as v FROM complaints WHERE sla_deadline IS NOT NULL AND status IN ('resolved','closed')").get(),
      db.prepare("SELECT COUNT(*) as v FROM complaints WHERE sla_deadline IS NOT NULL AND status IN ('resolved','closed') AND resolved_at <= sla_deadline").get(),
      db.prepare(`
        SELECT d.name, d.code,
        COUNT(c.id) as total,
        SUM(CASE WHEN c.status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved,
        AVG(CASE WHEN c.resolved_at IS NOT NULL THEN JULIANDAY(c.resolved_at) - JULIANDAY(c.created_at) END) as avg_days
        FROM departments d
        LEFT JOIN complaints c ON d.id = c.department_id
        GROUP BY d.id ORDER BY total DESC
      `).all(),
      db.prepare(`
        SELECT u.full_name, d.name as department_name,
        COUNT(c.id) as total,
        SUM(CASE WHEN c.status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved,
        AVG(CASE WHEN c.resolved_at IS NOT NULL THEN JULIANDAY(c.resolved_at) - JULIANDAY(c.created_at) END) as avg_days
        FROM users u
        LEFT JOIN complaints c ON u.id = c.assigned_officer_id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.role = 'authority'
        GROUP BY u.id ORDER BY total DESC
      `).all(),
      db.prepare(`
        SELECT al.*, u.full_name as user_name FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 20
      `).all()
    ]);

    const totalWithSla = totalWithSlaRow?.v || 0;
    const withinSla = withinSlaRow?.v || 0;

    const stats = {
      totalUsers: totalUsersRow?.v || 0,
      totalAuthorities: totalAuthoritiesRow?.v || 0,
      totalDepartments: totalDepartmentsRow?.v || 0,
      totalComplaints: totalComplaintsRow?.v || 0,
      resolvedComplaints: resolvedComplaintsRow?.v || 0,
      pendingComplaints: pendingComplaintsRow?.v || 0,
      criticalComplaints: criticalComplaintsRow?.v || 0,
      overdueComplaints: overdueComplaintsRow?.v || 0,
      avgSatisfaction: avgSatisfactionRow?.v || 0,
      slaCompliance: totalWithSla > 0 ? Math.round((withinSla / totalWithSla) * 100) : 100,
      departmentPerformance,
      officerPerformance,
      recentAuditLogs
    };

    res.json(stats);
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Manage users
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const { role, search } = req.query;

    let query = 'SELECT u.id, u.full_name, u.email, u.phone, u.role, u.city, u.area, u.department_id, u.is_active, u.created_at, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE 1=1';
    const params = [];

    if (role) { query += ' AND u.role = ?'; params.push(role); }
    if (search) { query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY u.created_at DESC';
    const users = await db.prepare(query).all(...params);
    res.json(users);
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create authority user
router.post('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const { full_name, email, phone, password, role, department_id, city, area } = req.body;
  const db = getDb();

  try {
    const hashed = await bcrypt.hash(password || 'password123', 10);

    const result = await db.prepare('INSERT INTO users (full_name, email, phone, password, role, department_id, city, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(full_name, email, phone, hashed, role || 'authority', department_id, city, area);

    await db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'USER_CREATE', 'user', result.lastInsertRowid, `Created ${role || 'authority'} user: ${full_name}`);

    res.status(201).json({ id: result.lastInsertRowid, message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Toggle user active status
router.put('/users/:id/toggle', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
    res.json({ message: 'User status toggled' });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Manage departments
router.get('/departments', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const db = getDb();
    const departments = await db.prepare(`
      SELECT d.*,
      (SELECT COUNT(*) FROM complaints c WHERE c.department_id = d.id) as total_complaints,
      (SELECT COUNT(*) FROM complaints c WHERE c.department_id = d.id AND c.status IN ('resolved','closed')) as resolved_complaints,
      (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'authority') as officer_count
      FROM departments d ORDER BY d.name
    `).all();
    res.json(departments);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

router.post('/departments', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, code, description, head_name, head_email, head_phone, sla_hours } = req.body;
  const db = getDb();

  try {
    const result = await db.prepare('INSERT INTO departments (name, code, description, head_name, head_email, head_phone, sla_hours) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, code, description, head_name, head_email, head_phone, sla_hours || 48);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Department code already exists' });
  }
});

router.put('/departments/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, description, head_name, head_email, head_phone, sla_hours, is_active } = req.body;
  try {
    const db = getDb();

    await db.prepare('UPDATE departments SET name=COALESCE(?,name), description=COALESCE(?,description), head_name=COALESCE(?,head_name), head_email=COALESCE(?,head_email), head_phone=COALESCE(?,head_phone), sla_hours=COALESCE(?,sla_hours), is_active=COALESCE(?,is_active) WHERE id=?')
      .run(name, description, head_name, head_email, head_phone, sla_hours, is_active, req.params.id);

    res.json({ message: 'Department updated' });
  } catch (err) {
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Manage categories
router.get('/categories', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const categories = await db.prepare('SELECT cc.*, d.name as department_name FROM complaint_categories cc LEFT JOIN departments d ON cc.department_id = d.id').all();
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, code, icon, description, department_id } = req.body;
    const db = getDb();

    const result = await db.prepare('INSERT INTO complaint_categories (name, code, icon, description, department_id) VALUES (?, ?, ?, ?, ?)')
      .run(name, code, icon, description, department_id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

module.exports = router;

