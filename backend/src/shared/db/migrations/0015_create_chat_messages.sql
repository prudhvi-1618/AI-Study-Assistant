CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  sources JSON NULL,
  tokens_used INT NULL,
  model_used VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
