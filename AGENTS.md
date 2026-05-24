# Multi-Agent System (LangGraph)

AI Exam Copilot is powered by a **Multi-Agent Architecture** orchestrated through **LangGraph**. Instead of relying on a single complex prompt, we break down tasks and route them to specialized agents. This ensures high accuracy, prevents hallucinations, and allows for parallel processing.

## Router Agent
**The Traffic Controller.**
- **Responsibility:** Analyzes the user's input, context, and intent to determine which specialized agent should handle the request.
- **Input:** User query, Chat history.
- **Output:** Routes the graph execution to the correct agent node.

## Chat Agent
**The Tutor.**
- **Responsibility:** Handles conversational Q&A based directly on uploaded study materials.
- **Features:**
  - Connects to the RAG Retrieval Pipeline.
  - Enforces strict citation rules (refuses to answer if the answer isn't in the uploaded documents).
  - Maintains conversation memory and context compression.

## Summary Agent
**The Note-Taker.**
- **Responsibility:** Condenses heavy documents into highly readable, organized study guides.
- **Output Types:**
  - *Quick Revision:* Bullet points and core formulas.
  - *Detailed Notes:* Comprehensive breakdown with subheadings.
  - *Last-Minute Sheets:* High-yield concepts only.

## Flashcard Agent
**The Memorizer.**
- **Responsibility:** Extracts key terms, definitions, and concepts to automatically build flashcard decks.
- **Features:** 
  - Generates both standard Q/A cards and Cloze (fill-in-the-blank) cards.
  - Assigns initial difficulty tags.

## Quiz Agent
**The Examiner.**
- **Responsibility:** Generates adaptive Multiple Choice Questions (MCQs).
- **Features:**
  - Adjusts difficulty based on user's past performance in that topic.
  - Generates detailed explanations for *why* an answer is right or wrong, turning failure into a learning moment.

## Planner Agent
**The Strategist.**
- **Responsibility:** Builds personalized study schedules.
- **Inputs:** Exam dates, list of subjects, user's self-reported confidence levels, and available study hours per day.
- **Outputs:** A structured calendar mapping out revision blocks and spaced repetition cycles.

## Analytics Agent
**The Evaluator.**
- **Responsibility:** Operates in the background, analyzing the user's quiz scores and chat interactions.
- **Output:** Identifies weak knowledge areas and proactively suggests new quizzes or topics to review.

---

## Execution Graph Flow

```text
[User Input] 
    │
    ▼
(Router Node) ──► (Chat Node) ──► [RAG Pipeline] ──► (Generation Node) 
    │
    ├──► (Summary Node) ──► [Queue Task]
    │
    ├──► (Quiz Node) ──► [RAG Pipeline] ──► (Generation Node)
    │
    └──► (Planner Node) ──► [Database Write]
```
