const { getDb } = require('../database');

function autoAssignComplaint(complaintId, departmentId) {
  const db = getDb();

  // Find an authority user in the department with the fewest active complaints
  const officer = db.prepare(`
    SELECT u.id, u.full_name,
    (SELECT COUNT(*) FROM complaints c WHERE c.assigned_officer_id = u.id AND c.status NOT IN ('resolved','closed','rejected')) as active_count
    FROM users u
    WHERE u.role = 'authority' AND u.department_id = ? AND u.is_active = 1
    ORDER BY active_count ASC
    LIMIT 1
  `).get(departmentId);

  if (officer) {
    db.prepare('UPDATE complaints SET assigned_officer_id = ?, department_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(officer.id, departmentId, 'assigned', complaintId);

    db.prepare('INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)')
      .run(complaintId, 'ai_analyzed', 'assigned', null, `Auto-assigned to ${officer.full_name}`);

    return officer;
  }

  // No officer found, just assign to department
  db.prepare('UPDATE complaints SET department_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(departmentId, complaintId);

  return null;
}

function calculateSLA(priority) {
  switch (priority) {
    case 'critical': return 12;
    case 'high': return 24;
    case 'medium': return 48;
    case 'low': return 72;
    default: return 48;
  }
}

module.exports = { autoAssignComplaint, calculateSLA };

