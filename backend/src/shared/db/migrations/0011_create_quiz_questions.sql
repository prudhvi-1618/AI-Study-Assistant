CREATE TABLE IF NOT EXISTS quiz_questions (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  quiz_id VARCHAR(36) NOT NULL,
  question_index INT NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  explanation TEXT NOT NULL,
  topic VARCHAR(255) NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  source_chunk_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (source_chunk_id) REFERENCES document_chunks(id) ON DELETE SET NULL
);
