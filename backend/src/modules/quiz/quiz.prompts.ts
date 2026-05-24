import { ChatPromptTemplate } from '@langchain/core/prompts';

// ── MCQ GENERATION PROMPT ─────────────────────────────────────────────────
export const MCQ_GENERATION_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an expert exam question creator. Generate exactly {count} multiple choice 
questions from the study material below.

Study Material:
{context}

Target Topics (prioritize these if specified): {topic_focus}
Difficulty distribution: {difficulty_mix}

RULES:
- Each question must have exactly 4 options: A, B, C, D
- Only ONE correct answer per question
- Wrong options (distractors) must be plausible, not obviously wrong
- explanation: clear 2-sentence explanation of why the correct answer is right
- difficulty: easy | medium | hard
- topic: sub-topic this question tests (infer from context)
- Do NOT reference "the passage" or "the text" — questions must stand alone
- Do NOT add any preamble outside the JSON

Return ONLY valid JSON, no markdown backticks:
{{
  "questions": [
    {{
      "question": "string",
      "options": {{
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      }},
      "correct_answer": "A" | "B" | "C" | "D",
      "explanation": "string",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "string"
    }}
  ],
  "quiz_title": "string",
  "topics_covered": ["string"]
}}
`);

// ── ADAPTIVE QUIZ PROMPT ──────────────────────────────────────────────────
// Used when generating a quiz targeting specific weak areas
export const ADAPTIVE_MCQ_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an adaptive exam coach. A student has shown weakness in these specific topics:

Weak Topics: {weak_topics}
Weakness Details: {weakness_details}

Generate {count} multiple choice questions that specifically test understanding of 
these weak areas. Questions should start easier and progressively get harder.

Study Material:
{context}

Return the same JSON format as standard MCQ generation.
Focus 70% of questions on the weak topics listed above.
`);

// ── QUIZ FEEDBACK PROMPT ──────────────────────────────────────────────────
// Generates personalized feedback after a quiz attempt
export const QUIZ_FEEDBACK_PROMPT = ChatPromptTemplate.fromTemplate(`
A student just completed a quiz. Analyze their performance and provide 
personalized, encouraging feedback.

Quiz Topic: {quiz_title}
Score: {score}% ({correct}/{total} correct)
Time Taken: {time_taken} minutes

Topics they struggled with (got wrong):
{wrong_topics}

Topics they did well on:
{correct_topics}

Provide:
1. A brief encouraging opening (1 sentence)
2. Key strengths shown (2-3 bullet points)
3. Areas needing improvement with specific study advice (2-3 bullet points)
4. One concrete next step recommendation

Keep the tone supportive, like a personal tutor. Maximum 200 words.
Return as plain text, no JSON.
`);

// ── QUESTION EXPLANATION PROMPT ───────────────────────────────────────────
export const QUESTION_EXPLAIN_PROMPT = ChatPromptTemplate.fromTemplate(`
Explain why the correct answer to this exam question is right, 
and why the other options are wrong. Use simple, clear language.

Question: {question}
Options: A) {optionA}  B) {optionB}  C) {optionC}  D) {optionD}
Correct Answer: {correct_answer}
Topic: {topic}

Provide a clear explanation in 3-4 sentences maximum.
`);
