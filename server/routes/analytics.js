const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateInsights } = require('../services/aiService');

const router = express.Router();

router.get('/overview', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const db = getDb();
    const { period } = req.query;

    let dateFilter = "datetime('now', '-30 days')";
    if (period === 'week') dateFilter = "datetime('now', '-7 days')";
    if (period === 'year') dateFilter = "datetime('now', '-365 days')";

    const [
      totalRow,
      resolvedRow,
      avgResRow,
      satRow,
      byCategory,
      byArea,
      byDepartment,
      byPriority,
      byStatus,
      dailyTrend,
      slaRow
    ] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as v FROM complaints WHERE created_at > ${dateFilter}`).get(),
      db.prepare(`SELECT COUNT(*) as v FROM complaints WHERE status IN ('resolved','closed') AND created_at > ${dateFilter}`).get(),
      db.prepare(`SELECT AVG(JULIANDAY(resolved_at)-JULIANDAY(created_at)) as v FROM complaints WHERE resolved_at IS NOT NULL AND created_at > ${dateFilter}`).get(),
      db.prepare(`SELECT AVG(rating) as v FROM feedback f JOIN complaints c ON f.complaint_id=c.id WHERE c.created_at > ${dateFilter}`).get(),
      db.prepare(`SELECT cc.name, COUNT(*) as count FROM complaints c JOIN complaint_categories cc ON c.category_id=cc.id WHERE c.created_at > ${dateFilter} GROUP BY c.category_id ORDER BY count DESC`).all(),
      db.prepare(`SELECT area, COUNT(*) as count FROM complaints WHERE created_at > ${dateFilter} AND area IS NOT NULL GROUP BY area ORDER BY count DESC LIMIT 10`).all(),
      db.prepare(`SELECT d.name, COUNT(*) as count, AVG(CASE WHEN c.resolved_at IS NOT NULL THEN JULIANDAY(c.resolved_at)-JULIANDAY(c.created_at) END) as avg_days FROM complaints c JOIN departments d ON c.department_id=d.id WHERE c.created_at > ${dateFilter} GROUP BY c.department_id`).all(),
      db.prepare(`SELECT priority, COUNT(*) as count FROM complaints WHERE created_at > ${dateFilter} GROUP BY priority`).all(),
      db.prepare(`SELECT status, COUNT(*) as count FROM complaints WHERE created_at > ${dateFilter} GROUP BY status`).all(),
      db.prepare(`SELECT DATE(created_at) as date, COUNT(*) as count FROM complaints WHERE created_at > ${dateFilter} GROUP BY DATE(created_at) ORDER BY date`).all(),
      db.prepare(`SELECT COUNT(*) as v FROM complaints WHERE sla_deadline < datetime('now') AND status NOT IN ('resolved','closed','rejected') AND created_at > ${dateFilter}`).get()
    ]);

    const data = {
      totalComplaints: totalRow?.v || 0,
      resolved: resolvedRow?.v || 0,
      avgResolution: avgResRow?.v || 0,
      satisfaction: satRow?.v || 0,
      byCategory,
      byArea,
      byDepartment,
      byPriority,
      byStatus,
      dailyTrend,
      slaViolations: slaRow?.v || 0
    };

    res.json(data);
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

router.get('/insights', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const db = getDb();
    const insights = await generateInsights(db);
    res.json(insights);
  } catch (err) {
    console.error('Analytics insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/export', authenticateToken, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const db = getDb();
    const { format, period } = req.query;

    let dateFilter = '';
    if (period === 'week') dateFilter = "WHERE c.created_at > datetime('now', '-7 days')";
    else if (period === 'month') dateFilter = "WHERE c.created_at > datetime('now', '-30 days')";
    else if (period === 'year') dateFilter = "WHERE c.created_at > datetime('now', '-365 days')";

    const complaints = await db.prepare(`
      SELECT c.complaint_id, c.title, c.description, cc.name as category, c.status, c.priority,
      c.address, c.area, c.city, d.name as department, u.full_name as officer,
      c.created_at, c.resolved_at, c.ai_category, c.ai_priority
      FROM complaints c
      LEFT JOIN complaint_categories cc ON c.category_id = cc.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.assigned_officer_id = u.id
      ${dateFilter} ORDER BY c.created_at DESC
    `).all();

    if (format === 'csv') {
      const headers = Object.keys(complaints[0] || {}).join(',');
      const rows = complaints.map(c => Object.values(c).map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=complaints_report.csv');
      res.send(`${headers}\n${rows}`);
    } else {
      res.json(complaints);
    }
  } catch (err) {
    console.error('Analytics export error:', err);
    res.status(500).json({ error: 'Failed to export complaints' });
  }
});

module.exports = router;

