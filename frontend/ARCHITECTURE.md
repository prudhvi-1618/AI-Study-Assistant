# AI Exam Copilot - System Architecture

## Overview

AI Exam Copilot is a production-ready AI-powered exam preparation platform designed to help students study smarter using Generative AI, Retrieval-Augmented Generation (RAG), and Multi-Agent AI workflows.

The platform enables students to:
- Upload study materials
- Ask contextual questions
- Generate summaries
- Create flashcards
- Generate MCQs
- Build personalized study plans
- Track learning performance

---

# High-Level Architecture

```text
Frontend (Next.js)
        │
        ▼
Express.js API Gateway
        │
        ▼
LangGraph AI Orchestrator
        │
 ┌──────┼───────────────────────┐
 ▼      ▼           ▼           ▼
Chat  Summary     Quiz      Planner
Agent   Agent      Agent      Agent
        │
        ▼
RAG Retrieval Pipeline
        │
 ┌──────┼───────────────┐
 ▼      ▼               ▼
Qdrant MySQL          Redis
(Vector) (Metadata)   (Cache/Queue)
```

---

# Frontend Architecture

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- React Query
- Framer Motion

---

# Frontend Responsibilities

The frontend handles:
- Authentication
- File uploads
- AI chat UI
- Streaming responses
- Flashcards
- Quiz interfaces
- Analytics dashboards
- Study planner visualization

---

# Frontend Structure

```text
src/
├── app/
├── components/
├── features/
├── services/
├── hooks/
├── store/
├── providers/
├── lib/
└── types/
```

---

# Backend Architecture

## Stack

- Node.js
- Express.js
- TypeScript
- LangChain
- LangGraph

---

# Backend Responsibilities

The backend manages:
- AI orchestration
- RAG retrieval
- Queue processing
- Authentication
- Streaming APIs
- AI workflows
- Analytics generation

---

# Backend Structure

```text
src/
├── modules/
├── ai/
├── shared/
├── config/
├── websocket/
└── uploads/
```

---

# Module-Based Architecture

Each business feature is isolated into its own module.

Example:

```text
modules/
├── auth/
├── upload/
├── chat/
├── flashcards/
├── quiz/
├── planner/
└── analytics/
```

Each module contains:
- routes
- controllers
- services
- validators
- prompts
- AI logic

---

# AI Architecture

## AI Layer Structure

```text
ai/
├── agents/
├── graphs/
├── rag/
├── prompts/
└── memory/
```

---

# LangGraph Orchestration

LangGraph is used for:
- AI workflow orchestration
- state management
- agent coordination
- routing logic
- retry handling

---

# Main AI Workflow

```text
User Query
    ↓
Router Agent
    ↓
Retrieval Pipeline
    ↓
Context Compression
    ↓
LLM Generation
    ↓
Verification
    ↓
Streaming Response
```

---

# AI Agents

## 1. Router Agent

### Purpose
Routes requests to the correct AI workflow.

### Responsibilities
- Intent classification
- Workflow selection
- State transitions

---

## 2. Chat Agent

### Purpose
Handles conversational Q&A over uploaded documents.

### Features
- RAG retrieval
- source citations
- multi-document reasoning
- contextual answers

---

## 3. Summary Agent

### Purpose
Generates AI-powered study summaries.

### Summary Types
- quick revision
- detailed notes
- exam-focused summaries
- last-minute revision sheets

---

## 4. Flashcard Agent

### Purpose
Creates AI-generated flashcards.

### Features
- Q/A flashcards
- cloze cards
- difficulty tagging
- spaced repetition support

---

## 5. Quiz Agent

### Purpose
Generates adaptive quizzes and MCQs.

### Features
- multiple difficulty levels
- AI explanations
- personalized questions
- weak-topic targeting

---

## 6. Planner Agent

### Purpose
Creates intelligent study schedules.

### Inputs
- exam dates
- available hours
- subjects
- confidence levels

### Outputs
- daily schedules
- revision cycles
- smart priorities

---

## 7. Analytics Agent

### Purpose
Analyzes learning performance.

### Features
- weakness detection
- progress insights
- recommendation generation
- learning analytics

---

# RAG Architecture

## Retrieval-Augmented Generation Pipeline

```text
Document Upload
      ↓
OCR/Text Extraction
      ↓
Chunking
      ↓
Embedding Generation
      ↓
Vector Storage
      ↓
Hybrid Retrieval
      ↓
Re-ranking
      ↓
Context Injection
      ↓
LLM Response
```

---

# Document Processing Pipeline

## Supported Formats

- PDF
- DOCX
- PPT
- TXT
- Images

---

# Processing Steps

1. File upload
2. OCR extraction
3. Text cleaning
4. Metadata extraction
5. Chunk generation
6. Embedding generation
7. Vector storage

---

# Vector Database

## Qdrant

Used for:
- semantic search
- embedding storage
- metadata filtering
- similarity retrieval

---

# Relational Database

## MySQL

Stores:
- users
- document metadata
- flashcards
- quiz history
- analytics
- planner data

---

# Cache & Queue Layer

## Redis

Used for:
- caching
- session storage
- queue state
- streaming state

---

# Queue Architecture

## BullMQ

Used for:
- document processing
- embedding generation
- summary generation
- flashcard generation
- MCQ generation

Heavy AI tasks run asynchronously.

---

# Streaming Architecture

The platform supports real-time AI streaming using:
- WebSockets
or
- Server-Sent Events

Streaming allows:
- token-by-token responses
- lower perceived latency
- better user experience

---

# Security Architecture

## Security Features

- JWT authentication
- protected routes
- rate limiting
- input validation
- file sanitization
- secure environment variables

---

# Validation Layer

## Zod Validation

Used for:
- request validation
- schema enforcement
- API safety

---

# Observability

## LangSmith

Used for:
- AI tracing
- workflow debugging
- prompt monitoring
- token tracking
- graph visualization

---

# Scalability Goals

The system is designed for:
- modular scaling
- distributed queues
- reusable AI workflows
- independent feature development

---

# Performance Optimizations

## Backend

- async queues
- retrieval caching
- optimized chunking
- context compression

## Frontend

- lazy loading
- streaming UI
- React Server Components
- optimized rendering

---

# Design Principles

The platform follows:

- modular architecture
- AI-first design
- reusable workflows
- scalable systems
- production-grade engineering
- clean separation of concerns

---

# User Flow

```text
User Uploads Notes
        ↓
AI Processes Documents
        ↓
Embeddings Stored in Qdrant
        ↓
User Interacts with AI
        ↓
LangGraph Orchestrates Workflow
        ↓
RAG Retrieves Context
        ↓
AI Generates Personalized Response
        ↓
Analytics & Memory Updated
```

---

# Future Enhancements

- Voice tutor
- Handwritten notes OCR
- AI whiteboard
- Real-time collaboration
- Multi-modal learning
- Autonomous revision planning
- Mobile applications
- Offline learning support

---

# Core Philosophy

This is not a basic PDF chatbot.

AI Exam Copilot is designed as:
- an autonomous AI tutor
- a personalized exam preparation system
- an intelligent learning assistant
- a scalable AI-native EdTech platform