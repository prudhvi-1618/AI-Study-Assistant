import { ChatPromptTemplate } from '@langchain/core/prompts';

// ── FLASHCARD GENERATION PROMPT ──────────────────────────────────────────
// Used by flashcard.agent.ts to generate cards from retrieved chunks
export const FLASHCARD_GENERATION_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an expert study material creator. Generate exactly {count} flashcards
from the study material below. Focus on key concepts, definitions, formulas,
and important facts a student must remember for their exam.

Study Material:
{context}

Topic Focus (if specified): {topic_focus}
Difficulty: {difficulty}

RULES:
- front: a clear question, term, or concept prompt
- back: a concise, complete answer (max 3 sentences)
- topic: the sub-topic this card belongs to (infer from context)
- difficulty: easy | medium | hard
- Do NOT number the cards
- Do NOT add any preamble or explanation outside the JSON

Return ONLY valid JSON, no markdown backticks:
{{
  "flashcards": [
    {{
      "front": "string",
      "back": "string", 
      "topic": "string",
      "difficulty": "easy" | "medium" | "hard"
    }}
  ],
  "deck_title": "string (descriptive title for this deck)",
  "topics_covered": ["string"]
}}
`);

// ── FLASHCARD REVIEW EXPLANATION PROMPT ──────────────────────────────────
// Used when student marks a card wrong and requests a deeper explanation
export const FLASHCARD_EXPLAIN_PROMPT = ChatPromptTemplate.fromTemplate(`
A student is struggling with this flashcard concept. 
Provide a clear, simple explanation with an analogy or example.

Concept (front): {front}
Answer (back): {back}
Topic: {topic}

Give a helpful explanation in 2-3 paragraphs maximum.
Use simple language appropriate for a student.
`);

// ── DECK TITLE GENERATION PROMPT ─────────────────────────────────────────
export const DECK_TITLE_PROMPT = ChatPromptTemplate.fromTemplate(`
Generate a concise, descriptive deck title (max 8 words) for flashcards 
covering these topics from the document "{filename}":
Topics: {topics}
Return ONLY the title text, nothing else.
`);
