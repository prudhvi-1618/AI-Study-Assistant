CREATE TABLE IF NOT EXISTS document_chunks (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  document_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  room_id VARCHAR(36) NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  page_number INT NULL,
  token_count INT NULL,
  embedding_model VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE CASCADE
);
