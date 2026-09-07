const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'civicconnect.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen' CHECK(role IN ('citizen','authority','admin')),
      city TEXT,
      area TEXT,
      profile_photo TEXT,
      department_id INTEGER,
      is_active INTEGER DEFAULT 1,
      language TEXT DEFAULT 'en',
      notification_email INTEGER DEFAULT 1,
      notification_sms INTEGER DEFAULT 1,
      notification_push INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      head_name TEXT,
      head_email TEXT,
      head_phone TEXT,
      sla_hours INTEGER DEFAULT 72,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaint_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT,
      department_id INTEGER,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER,
      subcategory_id INTEGER,
      latitude REAL,
      longitude REAL,
      address TEXT,
      landmark TEXT,
      city TEXT,
      area TEXT,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','ai_analyzed','assigned','under_review','in_progress','resolved','verified','closed','rejected')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
      severity INTEGER DEFAULT 5,
      department_id INTEGER,
      assigned_officer_id INTEGER,
      ai_category TEXT,
      ai_severity TEXT,
      ai_priority TEXT,
      ai_summary TEXT,
      ai_department TEXT,
      ai_safety_risk TEXT,
      ai_resolution_time TEXT,
      ai_confidence REAL,
      is_duplicate INTEGER DEFAULT 0,
      duplicate_of INTEGER,
      upvote_count INTEGER DEFAULT 1,
      sla_deadline DATETIME,
      estimated_resolution DATETIME,
      resolved_at DATETIME,
      closed_at DATETIME,
      resolution_proof TEXT,
      resolution_notes TEXT,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES complaint_subcategories(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      image_type TEXT DEFAULT 'complaint' CHECK(image_type IN ('complaint','progress','resolution')),
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(complaint_id, user_id),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      satisfaction TEXT CHECK(satisfaction IN ('very_dissatisfied','dissatisfied','neutral','satisfied','very_satisfied')),
      comment TEXT,
      is_resolved INTEGER DEFAULT 1,
      reopen_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      complaint_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sla_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      priority TEXT NOT NULL,
      sla_hours INTEGER NOT NULL,
      deadline DATETIME NOT NULL,
      is_breached INTEGER DEFAULT 0,
      breached_at DATETIME,
      escalated INTEGER DEFAULT 0,
      escalation_level INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    );

    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      zone TEXT,
      latitude REAL,
      longitude REAL,
      is_active INTEGER DEFAULT 1
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
    CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON complaint_status_history(complaint_id);
  `);

  console.log('✅ Database initialized successfully');
}

module.exports = { getDb, initDatabase };

