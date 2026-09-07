const { getDb } = require('../database');

function createNotification(userId, title, message, type = 'info', complaintId = null) {
  const db = getDb();
  db.prepare('INSERT INTO notifications (user_id, title, message, type, complaint_id) VALUES (?, ?, ?, ?, ?)')
    .run(userId, title, message, type, complaintId);
}

function notifyStatusChange(complaintId, oldStatus, newStatus, userId) {
  const db = getDb();
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
  if (!complaint) return;

  const statusLabels = {
    submitted: 'Submitted', ai_analyzed: 'AI Analyzed', assigned: 'Assigned to Department',
    under_review: 'Under Review', in_progress: 'In Progress', resolved: 'Resolved',
    verified: 'Verified', closed: 'Closed', rejected: 'Rejected'
  };

  createNotification(
    complaint.user_id,
    `Complaint ${statusLabels[newStatus] || newStatus}`,
    `Your complaint "${complaint.title}" (${complaint.complaint_id}) status changed to: ${statusLabels[newStatus] || newStatus}`,
    newStatus === 'resolved' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
    complaintId
  );
}

function notifyAssignment(complaintId, officerId) {
  const db = getDb();
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
  if (!complaint || !officerId) return;

  createNotification(
    officerId,
    'New Complaint Assigned',
    `Complaint "${complaint.title}" (${complaint.complaint_id}) has been assigned to you. Priority: ${complaint.priority.toUpperCase()}`,
    complaint.priority === 'critical' ? 'error' : 'warning',
    complaintId
  );
}

module.exports = { createNotification, notifyStatusChange, notifyAssignment };

