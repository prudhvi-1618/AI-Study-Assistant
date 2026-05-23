CREATE TABLE IF NOT EXISTS analytics_events (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  event_type ENUM('doc_uploaded', 'chat_message', 'flashcard_reviewed', 'quiz_completed', 'plan_item_completed', 'login') NOT NULL,
  entity_id VARCHAR(36) NULL,
  entity_type VARCHAR(100) NULL,
  metadata JSON NULL,
  session_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
