CREATE TABLE IF NOT EXISTS flashcards (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  deck_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  topic VARCHAR(255) NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  mastery_level ENUM('new', 'learning', 'review', 'mastered') DEFAULT 'new',
  review_count INT DEFAULT 0,
  next_review_at TIMESTAMP NULL,
  source_chunk_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_chunk_id) REFERENCES document_chunks(id) ON DELETE SET NULL
);
