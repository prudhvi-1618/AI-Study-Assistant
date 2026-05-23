CREATE TABLE IF NOT EXISTS study_plans (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  syllabus_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  days_remaining INT NULL,
  status ENUM('active', 'completed', 'archived') DEFAULT 'active',
  generation_config JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (syllabus_id) REFERENCES syllabuses(id) ON DELETE CASCADE
);
