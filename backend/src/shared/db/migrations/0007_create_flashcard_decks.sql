CREATE TABLE IF NOT EXISTS flashcard_decks (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  room_id VARCHAR(36) NULL,
  document_ids JSON NOT NULL,
  title VARCHAR(255) NOT NULL,
  card_count INT DEFAULT 0,
  model_used VARCHAR(100) NOT NULL,
  tokens_used INT NULL,
  generation_config JSON NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE SET NULL
);
