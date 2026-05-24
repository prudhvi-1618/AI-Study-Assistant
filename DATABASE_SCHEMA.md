# 🗄️ Database Schema

The AI Exam Copilot uses a hybrid database approach:
- **MySQL (Relational):** Used for structured data (users, metadata, flashcards, analytics, quiz scores).
- **Qdrant (Vector):** Used for semantic search, storing high-dimensional embeddings of study materials.

---

## 1. Relational Database (MySQL)

### `users`
Stores user authentication and profile data.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR | NOT NULL | User's full name |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's email |
| `password_hash` | VARCHAR | NOT NULL | Bcrypt hashed password |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |

### `documents`
Stores metadata about the study materials uploaded by users.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique document identifier |
| `user_id` | UUID | FOREIGN KEY (`users.id`) | Owner of the document |
| `filename` | VARCHAR | NOT NULL | Original filename (e.g., "Biology_Ch4.pdf") |
| `status` | ENUM | NOT NULL | `processing`, `ready`, `failed` |
| `qdrant_collection` | VARCHAR | NOT NULL | Points to the vector collection name |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload date |

### `flashcards`
Stores the AI-generated flashcards.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Flashcard identifier |
| `document_id` | UUID | FOREIGN KEY (`documents.id`) | The source document |
| `user_id` | UUID | FOREIGN KEY (`users.id`) | The owner |
| `question` | TEXT | NOT NULL | The front of the card |
| `answer` | TEXT | NOT NULL | The back of the card |
| `type` | ENUM | NOT NULL | `qa`, `cloze` |
| `difficulty` | INT | DEFAULT 1 | 1 (Easy) to 5 (Hard) |
| `next_review_date`| TIMESTAMP | NOT NULL | Calculated via Spaced Repetition |

### `quiz_attempts`
Tracks user performance on AI-generated quizzes.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Attempt identifier |
| `user_id` | UUID | FOREIGN KEY (`users.id`) | Student who took the quiz |
| `topic` | VARCHAR | NOT NULL | E.g., "Cardiovascular System" |
| `score_percentage`| FLOAT | NOT NULL | 0.0 to 100.0 |
| `completed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the quiz was finished |

---

## 2. Vector Database (Qdrant)

The vector database stores document chunks as mathematical embeddings to allow for **Semantic Search (RAG)**.

### Collection: `study_materials`
- **Vector Size:** 1536 (OpenAI `text-embedding-3-small`) or 768 (Google `text-embedding-004`)
- **Distance Metric:** Cosine Similarity

### Payload (Metadata) Schema
Every vector point in Qdrant stores the following metadata alongside the vector array, allowing for hybrid filtering during retrieval:

```json
{
  "documentId": "uuid-string",
  "userId": "uuid-string",
  "chunkIndex": 42,
  "text": "The mitochondria is the powerhouse of the cell, responsible for generating most of the cell's supply of adenosine triphosphate (ATP)...",
  "pageNumber": 12,
  "topicTags": ["biology", "cellular-respiration"]
}
```

### Retrieval Strategy
When a user asks a question to the **Chat Agent**:
1. The user's query is embedded into a vector.
2. Qdrant performs a similarity search, filtering `WHERE userId = current_user AND documentId = active_document`.
3. The top 5 matching chunks (payload text) are retrieved and injected into the LLM prompt.
