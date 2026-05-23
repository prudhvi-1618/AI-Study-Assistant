CREATE TABLE IF NOT EXISTS study_plan_items (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  scheduled_date DATE NOT NULL,
  topic_name VARCHAR(255) NOT NULL,
  activity_type ENUM('flashcard_review', 'quiz', 'summary_read', 'concept_revision') NOT NULL,
  material_id VARCHAR(36) NULL,
  duration_min INT DEFAULT 30,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
