const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

// Public transparency portal stats
router.get('/stats', (req, res) => {
  const db = getDb();

  const stats = {
    totalComplaints: db.prepare('SELECT COUNT(*) as v FROM complaints').get().v,
    resolvedComplaints: db.prepare("SELECT COUNT(*) as v FROM complaints WHERE status IN ('resolved','closed')").get().v,
    pendingComplaints: db.prepare("SELECT COUNT(*) as v FROM complaints WHERE status NOT IN ('resolved','closed','rejected')").get().v,
    avgResolutionDays: 0,
    resolutionRate: 0,
    avgSatisfaction: 0,

    byCategory: db.prepare('SELECT cc.name, cc.icon, COUNT(*) as count FROM complaints c JOIN complaint_categories cc ON c.category_id = cc.id GROUP BY c.category_id ORDER BY count DESC').all(),
    byArea: db.prepare('SELECT area, COUNT(*) as count FROM complaints WHERE area IS NOT NULL GROUP BY area ORDER BY count DESC LIMIT 8').all(),
    byStatus: db.prepare('SELECT status, COUNT(*) as count FROM complaints GROUP BY status').all(),

    departmentPerformance: db.prepare(`
      SELECT d.name,
      COUNT(c.id) as total,
      SUM(CASE WHEN c.status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved,
      ROUND(AVG(CASE WHEN c.resolved_at IS NOT NULL THEN JULIANDAY(c.resolved_at) - JULIANDAY(c.created_at) END), 1) as avg_days
      FROM departments d LEFT JOIN complaints c ON d.id = c.department_id
      GROUP BY d.id HAVING total > 0 ORDER BY total DESC
    `).all(),

    monthlyTrend: db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved
      FROM complaints GROUP BY month ORDER BY month DESC LIMIT 6
    `).all().reverse(),

    recentResolved: db.prepare(`
      SELECT c.complaint_id, c.title, cc.name as category, c.area, c.resolved_at
      FROM complaints c LEFT JOIN complaint_categories cc ON c.category_id = cc.id
      WHERE c.status IN ('resolved','closed') ORDER BY c.resolved_at DESC LIMIT 5
    `).all()
  };

  // Calculate derived stats
  const avgRes = db.prepare("SELECT AVG(JULIANDAY(resolved_at) - JULIANDAY(created_at)) as v FROM complaints WHERE resolved_at IS NOT NULL").get();
  stats.avgResolutionDays = avgRes.v ? Math.round(avgRes.v * 10) / 10 : 0;
  stats.resolutionRate = stats.totalComplaints > 0 ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0;

  const avgSat = db.prepare('SELECT AVG(rating) as v FROM feedback').get();
  stats.avgSatisfaction = avgSat.v ? Math.round(avgSat.v * 10) / 10 : 0;

  res.json(stats);
});

module.exports = router;

