# AI Agents Architecture

## Project
AI-Powered Exam Preparation Assistant

This platform uses multi-agent orchestration with LangGraph and LangChain.

---

# Core AI Workflow

User Request
    ↓
Router Agent
    ↓
Specialized AI Agents
    ↓
RAG Retrieval Pipeline
    ↓
LLM Response Generation
    ↓
Verification & Memory
    ↓
Frontend Streaming Response

---

# AI Agents

## 1. Router Agent

### Responsibility
Determines which workflow or agent should handle the request.

### Input
- User query
- User context
- Current session state

### Output
Routes request to:
- Chat Agent
- Quiz Agent
- Summary Agent
- Flashcard Agent
- Planner Agent
- Analytics Agent

---

## 2. Chat Agent

### Responsibility
Handles conversational Q&A over uploaded study materials.

### Features
- RAG retrieval
- Citation-based answers
- Multi-document querying
- Context compression

### Uses
- Hybrid Retriever
- Vector Search
- Conversation Memory

---

## 3. Summary Agent

### Responsibility
Generates study summaries.

### Summary Types
- Quick revision
- Detailed notes
- Exam-focused notes
- Last-minute revision sheets

---

## 4. Flashcard Agent

### Responsibility
Creates AI-generated flashcards.

### Features
- Q/A cards
- Cloze cards
- Topic grouping
- Difficulty tagging

---

## 5. Quiz Agent

### Responsibility
Generates adaptive quizzes and MCQs.

### Features
- Difficulty levels
- Explanations
- Weak-topic detection
- Personalized questions

---

## 6. Planner Agent

### Responsibility
Creates personalized study plans.

### Inputs
- Exam dates
- Subject list
- Confidence levels
- Available study time

### Outputs
- Daily plans
- Revision cycles
- Smart scheduling

---

## 7. Analytics Agent

### Responsibility
Analyzes student performance.

### Features
- Weak area detection
- Progress tracking
- Learning insights
- AI recommendations

---

# RAG Architecture

## Pipeline

Document Upload
    ↓
OCR/Text Extraction
    ↓
Chunking
    ↓
Embeddings Generation
    ↓
Qdrant Vector Storage
    ↓
Hybrid Retrieval
    ↓
Re-ranking
    ↓
LLM Context Injection

---

# LangGraph Workflow

## Main Graph Nodes

1. Router Node
2. Retrieval Node
3. Context Compression Node
4. Generation Node
5. Verification Node
6. Memory Node

---

# Memory System

## Stores
- Chat history
- Weak topics
- Quiz performance
- User preferences
- Study progress

---

# AI Stack

## Frameworks
- LangChain
- LangGraph

## Models
- OpenAI
- Gemini
- Groq

## Vector Database
- Qdrant

## Cache
- Redis

---

# Design Goals

- Production-ready AI architecture
- Modular agent design
- Scalable workflows
- Explainable AI responses
- Real-time streaming
- Low-latency retrieval
- Personalized learning

---

# Future Improvements

- Voice tutor
- Multi-modal learning
- Handwritten notes OCR
- AI mentor mode
- Collaborative study groups
- Autonomous revision planning