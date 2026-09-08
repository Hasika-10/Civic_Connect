const { getDb } = require('../database');

async function createNotification(userId, title, message, type = 'info', complaintId = null) {
  const db = getDb();
  await db.prepare('INSERT INTO notifications (user_id, title, message, type, complaint_id) VALUES (?, ?, ?, ?, ?)')
    .run(userId, title, message, type, complaintId);
}

async function notifyStatusChange(complaintId, oldStatus, newStatus, userId) {
  const db = getDb();
  const complaint = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
  if (!complaint) return;

  const statusLabels = {
    submitted: 'Submitted', ai_analyzed: 'AI Analyzed', assigned: 'Assigned to Department',
    under_review: 'Under Review', in_progress: 'In Progress', resolved: 'Resolved',
    verified: 'Verified', closed: 'Closed', rejected: 'Rejected'
  };

  await createNotification(
    complaint.user_id,
    `Complaint ${statusLabels[newStatus] || newStatus}`,
    `Your complaint "${complaint.title}" (${complaint.complaint_id}) status changed to: ${statusLabels[newStatus] || newStatus}`,
    newStatus === 'resolved' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
    complaintId
  );
}

async function notifyAssignment(complaintId, officerId) {
  const db = getDb();
  const complaint = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
  if (!complaint || !officerId) return;

  await createNotification(
    officerId,
    'New Complaint Assigned',
    `Complaint "${complaint.title}" (${complaint.complaint_id}) has been assigned to you. Priority: ${complaint.priority.toUpperCase()}`,
    complaint.priority === 'critical' ? 'error' : 'warning',
    complaintId
  );
}

module.exports = { createNotification, notifyStatusChange, notifyAssignment };

