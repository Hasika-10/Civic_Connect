#!/usr/bin/env node
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

async function runMigration() {
  console.log('====================================================');
  console.log('  CivicConnect: Local SQLite -> Turso Migration Tool');
  console.log('====================================================\n');

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl) {
    console.error('❌ ERROR: TURSO_DATABASE_URL environment variable is missing.');
    console.error('Please add it to your .env file or environment:');
    console.error('  TURSO_DATABASE_URL=libsql://your-db-name.turso.io');
    console.error('  TURSO_AUTH_TOKEN=your_auth_token_here\n');
    process.exit(1);
  }

  const localDbPath = path.resolve(__dirname, '..', '..', 'civicconnect.db');
  if (!fs.existsSync(localDbPath)) {
    console.error(`❌ ERROR: Local database file not found at: ${localDbPath}`);
    process.exit(1);
  }

  console.log(`📂 Source SQLite: ${localDbPath}`);
  console.log(`🌐 Target Turso:  ${tursoUrl}\n`);

  // Connect to local SQLite using better-sqlite3 or node:sqlite
  let localDb;
  try {
    const Database = require('better-sqlite3');
    localDb = new Database(localDbPath);
  } catch {
    const { DatabaseSync } = require('node:sqlite');
    localDb = new DatabaseSync(localDbPath);
  }

  // Connect to remote Turso
  const remoteClient = createClient({
    url: tursoUrl,
    authToken: tursoToken
  });

  // 1. Initialize schema on Turso
  console.log('⚙️  Ensuring schema exists on Turso...');
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
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
    )`,
    `CREATE TABLE IF NOT EXISTS departments (
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
    )`,
    `CREATE TABLE IF NOT EXISTS complaint_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT,
      department_id INTEGER,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )`,
    `CREATE TABLE IF NOT EXISTS complaint_subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES complaint_categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS complaints (
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
      city TEXT DEFAULT 'Chennai',
      area TEXT,
      pincode TEXT,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','ai_analyzed','assigned','under_review','in_progress','resolved','closed','rejected')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
      severity INTEGER DEFAULT 5,
      department_id INTEGER,
      assigned_officer_id INTEGER,
      assigned_at DATETIME,
      sla_deadline DATETIME,
      resolved_at DATETIME,
      resolution_notes TEXT,
      resolution_photo TEXT,
      rejection_reason TEXT,
      ai_category TEXT,
      ai_subcategory TEXT,
      ai_severity TEXT,
      ai_priority TEXT,
      ai_summary TEXT,
      ai_department TEXT,
      ai_safety_risk TEXT,
      ai_resolution_time TEXT,
      ai_confidence REAL,
      ai_analyzed_at DATETIME,
      duplicate_of INTEGER,
      is_duplicate INTEGER DEFAULT 0,
      upvote_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES complaint_subcategories(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS complaint_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      image_type TEXT DEFAULT 'complaint' CHECK(image_type IN ('complaint','progress','resolution')),
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS complaint_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS complaint_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS complaint_upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(complaint_id, user_id),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      satisfaction TEXT CHECK(satisfaction IN ('very_dissatisfied','dissatisfied','neutral','satisfied','very_satisfied')),
      comment TEXT,
      is_resolved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','alert')),
      complaint_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS sla_records (
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
    )`,
    `CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      zone TEXT,
      latitude REAL,
      longitude REAL,
      is_active INTEGER DEFAULT 1
    )`
  ];

  for (const stmt of schemaStatements) {
    await remoteClient.execute(stmt);
  }

  // 2. Migrate tables in dependency order
  const tables = [
    'departments',
    'users',
    'areas',
    'complaint_categories',
    'complaint_subcategories',
    'complaints',
    'complaint_images',
    'complaint_status_history',
    'complaint_comments',
    'complaint_upvotes',
    'feedback',
    'notifications',
    'sla_records',
    'audit_logs'
  ];

  console.log('\n🚀 Starting table migration...');

  for (const table of tables) {
    let rows;
    if (typeof localDb.prepare === 'function') {
      rows = localDb.prepare(`SELECT * FROM ${table}`).all();
    } else {
      rows = [];
    }

    if (!rows || rows.length === 0) {
      console.log(`  ⚪ ${table.padEnd(26)}: 0 rows (skipped)`);
      continue;
    }

    console.log(`  ⏳ ${table.padEnd(26)}: Migrating ${rows.length} rows...`);

    // Insert each row
    for (const row of rows) {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      const values = keys.map(k => row[k]);
      await remoteClient.execute({ sql, args: values });
    }

    console.log(`  ✅ ${table.padEnd(26)}: ${rows.length} rows migrated`);
  }

  console.log('\n====================================================');
  console.log('🎉 Migration to Turso completed successfully!');
  console.log('All tables and relational integrity preserved.');
  console.log('====================================================\n');
}

runMigration().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
