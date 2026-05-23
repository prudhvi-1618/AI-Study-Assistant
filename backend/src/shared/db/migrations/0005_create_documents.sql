CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  room_id VARCHAR(36) NULL,
  filename VARCHAR(500) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  file_type ENUM('pdf', 'docx', 'txt', 'pptx', 'md') NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  status ENUM('pending', 'processing', 'ready', 'failed') DEFAULT 'pending',
  chunk_count INT NULL,
  page_count INT NULL,
  error_msg TEXT NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE SET NULL
);

ALTER TABLE syllabuses ADD CONSTRAINT fk_syllabuses_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
