import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

export const RAG_CHAT_PROMPT = ChatPromptTemplate.fromMessages([
  ['system', `You are StudyAI, an expert AI tutor helping a student understand
their study materials. You have access to the student's uploaded documents
via the context below.

RULES:
- Answer ONLY from the provided context. Do not hallucinate facts.
- If the answer is not in the context, say:
  "I couldn't find information about that in your uploaded documents.
   Try uploading a document that covers this topic."
- Be concise but thorough. Use bullet points for lists.
- When you reference specific information, mention which document it came from.
- Use encouraging, tutor-like language.
- If the student seems confused, offer to explain differently.
- Format math/formulas using plain text (no LaTeX).

Context from student's documents:
{context}

Source documents used (cite these by filename when relevant):
{source_references}`],
  new MessagesPlaceholder('history'),
  ['human', '{question}'],
]);

export const CONDENSE_HISTORY_PROMPT = ChatPromptTemplate.fromTemplate(`
Summarize the following conversation between a student and an AI tutor.
Preserve:
- Key topics discussed
- Questions the student asked
- Concepts explained
- Any confusion or weak areas the student showed
- Important facts or definitions that were established

Keep the summary under 200 words. Write in third person.
Focus on what's important for continuing the tutoring session.

Conversation:
{history}

Summary:`);

export const STANDALONE_QUESTION_PROMPT = ChatPromptTemplate.fromTemplate(`
Given the conversation history below, rewrite the student's latest question
as a complete standalone question that captures full context.
If the question is already standalone, return it unchanged.
Return ONLY the rewritten question, no explanation.

Conversation History:
{history}

Latest Question: {question}

Standalone Question:`);

export const SESSION_TITLE_PROMPT = ChatPromptTemplate.fromTemplate(`
Generate a short, descriptive chat session title (max 6 words) based on
this student's first question. Return ONLY the title text.

Question: {question}

Title:`);

export const CLARIFICATION_PROMPT = ChatPromptTemplate.fromTemplate(`
The student asked: "{question}"

This question is ambiguous. Generate a single, friendly clarifying question
to help understand exactly what they need.
Return ONLY the clarifying question, no preamble.`);
