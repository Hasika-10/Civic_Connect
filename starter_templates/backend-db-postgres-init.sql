-- PostgreSQL Database Setup for CivicConnect
-- Users, Authorities, Departments, SLAs, Audit Logs

-- Create database
CREATE DATABASE IF NOT EXISTS civicconnect_db;

-- Users Table (Citizens, Authorities, Admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('citizen', 'authority', 'admin')),
  city VARCHAR(100),
  area VARCHAR(100),
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  jurisdiction_areas TEXT[], -- Array of areas
  avg_resolution_time INT, -- in hours
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department Staff (Authority Users)
CREATE TABLE IF NOT EXISTS department_staff (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('officer', 'supervisor', 'manager')),
  assignment_capacity INT DEFAULT 10,
  current_load INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, department_id)
);

-- SLA Rules
CREATE TABLE IF NOT EXISTS sla_rules (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  category VARCHAR(100) NOT NULL,
  priority_level VARCHAR(20) NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  response_time_hours INT,
  resolution_time_hours INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT false,
  notify_on_assignment BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,
  notify_on_feedback_request BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_department_staff_user_id ON department_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_sla_rules_category_priority ON sla_rules(category, priority_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
