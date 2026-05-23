CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  oauth_provider ENUM('google', 'github') NULL,
  oauth_id VARCHAR(255) NULL,
  plan ENUM('free', 'pro') DEFAULT 'free',
  is_verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
