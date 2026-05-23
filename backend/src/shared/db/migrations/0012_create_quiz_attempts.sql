CREATE TABLE IF NOT EXISTS quiz_attempts (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  quiz_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  score DECIMAL(5,2) NULL,
  total_questions INT NOT NULL,
  correct_count INT NULL,
  time_taken_s INT NULL,
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
