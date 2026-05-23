CREATE TABLE IF NOT EXISTS quiz_answers (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  attempt_id VARCHAR(36) NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  user_answer ENUM('A', 'B', 'C', 'D') NULL,
  is_correct TINYINT(1) NOT NULL,
  time_taken_s INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);
