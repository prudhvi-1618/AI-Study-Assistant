CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  room_id VARCHAR(36) NULL,
  document_ids JSON NOT NULL,
  title VARCHAR(255) NOT NULL,
  question_count INT DEFAULT 0,
  difficulty_mix JSON NULL,
  topic_focus JSON NULL,
  model_used VARCHAR(100) NOT NULL,
  tokens_used INT NULL,
  generation_config JSON NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE SET NULL
);
