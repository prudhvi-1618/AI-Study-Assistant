-- users indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- refresh_tokens indexes
CREATE INDEX idx_rt_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_rt_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_rt_family_id ON refresh_tokens(family_id);

-- study_rooms indexes
CREATE INDEX idx_rooms_user_id ON study_rooms(user_id);

-- documents indexes
CREATE INDEX idx_docs_user_room ON documents(user_id, room_id);
CREATE INDEX idx_docs_status ON documents(status);

-- document_chunks indexes
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_room_user ON document_chunks(room_id, user_id);

-- flashcard_decks indexes
CREATE INDEX idx_decks_user_room ON flashcard_decks(user_id, room_id);

-- flashcards indexes
CREATE INDEX idx_cards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_cards_next_review ON flashcards(user_id, next_review_at);

-- quizzes indexes
CREATE INDEX idx_quizzes_user_room ON quizzes(user_id, room_id);

-- quiz_questions indexes
CREATE INDEX idx_questions_quiz_id ON quiz_questions(quiz_id);

-- quiz_attempts indexes
CREATE INDEX idx_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);

-- quiz_answers indexes
CREATE INDEX idx_answers_attempt_id ON quiz_answers(attempt_id);

-- chat_sessions indexes
CREATE INDEX idx_sessions_user_room ON chat_sessions(user_id, room_id);

-- chat_messages indexes
CREATE INDEX idx_messages_session_id ON chat_messages(session_id);

-- topic_mastery indexes
CREATE INDEX idx_mastery_user_syllabus ON topic_mastery(user_id, syllabus_id);
CREATE INDEX idx_mastery_weak_flag ON topic_mastery(user_id, weak_flag);

-- study_plan_items indexes
CREATE INDEX idx_items_plan_date ON study_plan_items(plan_id, scheduled_date);

-- analytics_events indexes
CREATE INDEX idx_events_user_date ON analytics_events(user_id, session_date);
CREATE INDEX idx_events_type ON analytics_events(user_id, event_type);
