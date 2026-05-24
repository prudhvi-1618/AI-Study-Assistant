# API Specification

This document details the core REST and WebSocket/SSE endpoints for the AI Exam Copilot backend.

## Base URL
`http://localhost:<PORT>/api/v1`

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Creates a new user account.
- **Body:** `{ "name": "...", "email": "...", "password": "..." }`
- **Response:** `{ "token": "jwt_string", "user": { "id": 1, "name": "..." } }`

### `POST /auth/login`
Authenticates a user.
- **Body:** `{ "email": "...", "password": "..." }`
- **Response:** `{ "token": "jwt_string", "user": { ... } }`

---

## 2. Document Management (`/documents`)

### `POST /documents/upload`
Uploads a new study document and triggers the background processing queue (OCR, chunking, embedding).
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body:** Form-data with key `file` (PDF, DOCX, TXT).
- **Response:** `{ "documentId": "uuid", "status": "processing" }`

### `GET /documents/:id/status`
Checks the processing status of an uploaded document.
- **Response:** `{ "documentId": "uuid", "status": "completed", "chunks": 45 }`

---

## 3. Study Tools (`/study`)

### `POST /study/generate-flashcards`
Requests the Flashcard Agent to generate a deck for a specific document.
- **Body:** `{ "documentId": "uuid", "count": 20, "type": "qa" }`
- **Response:** `{ "jobId": "bullmq_job_id", "message": "Generation started" }`

### `GET /study/flashcards/:jobId`
Retrieves generated flashcards once the background job completes.
- **Response:** `{ "status": "completed", "flashcards": [ { "q": "...", "a": "..." } ] }`

### `POST /study/generate-quiz`
Requests the Quiz Agent to build a quiz.
- **Body:** `{ "documentIds": ["uuid"], "difficulty": "medium", "questionCount": 10 }`
- **Response:** `{ "quizId": "uuid", "questions": [...] }`

---

## 4. Real-Time Chat (WebSockets / SSE)

For low-latency interactions with the **Chat Agent**, the application uses Server-Sent Events (SSE) or WebSockets.

### `POST /chat/stream`
Initiates a streaming chat session.
- **Headers:** `Authorization: Bearer <token>`, `Accept: text/event-stream`
- **Body:** `{ "query": "Explain the cardiovascular system", "documentIds": ["uuid"] }`

**Event Stream Format:**
```text
data: {"type": "status", "message": "Retrieving context..."}

data: {"type": "token", "content": "The"}
data: {"type": "token", "content": " cardiovascular"}
data: {"type": "token", "content": " system"}
...
data: {"type": "citations", "sources": [{"page": 4, "text": "..."}]}
data: {"type": "done"}
```
