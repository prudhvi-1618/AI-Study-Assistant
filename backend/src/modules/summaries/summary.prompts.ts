import { ChatPromptTemplate } from '@langchain/core/prompts';

export const FULL_SUMMARY_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an expert academic summarizer. Summarize the following study material
at three levels of detail for a student preparing for an exam.

Document: {filename}
Subject/Topic: {subject}

Study Material:
{context}

Return ONLY valid JSON, no markdown backticks:
{{
  "tldr": "2-3 sentence executive summary of the entire material",
  "key_points": [
    "string — each key point as a complete sentence (8-12 points)"
  ],
  "detailed_summary": "string — 4-6 paragraph structured summary covering all major concepts. Use paragraph breaks. Written as if explaining to a student.",
  "topics_covered": ["string — list of sub-topics covered"],
  "important_terms": [
    {{
      "term": "string",
      "definition": "string — 1 sentence definition"
    }}
  ],
  "exam_tips": [
    "string — likely exam question or important point to remember (3-5 items)"
  ]
}}
`);

export const SECTION_SUMMARY_PROMPT = ChatPromptTemplate.fromTemplate(`
Summarize only this specific section of the study material.
Be concise and exam-focused.

Section Topic: {section_topic}
Document: {filename}

Content:
{context}

Return ONLY valid JSON, no markdown backticks:
{{
  "section_title": "string",
  "summary": "string — 2-3 paragraphs",
  "key_points": ["string (4-6 points)"],
  "important_terms": [{{"term": "string", "definition": "string"}}]
}}
`);

export const COMPARE_DOCUMENTS_PROMPT = ChatPromptTemplate.fromTemplate(`
A student has uploaded multiple documents on related topics.
Create a comparative summary highlighting similarities, differences, and complementary information.

Documents: {document_names}

Combined Content:
{context}

Return ONLY valid JSON, no markdown backticks:
{{
  "overview": "string — 2-3 sentence overview of all documents combined",
  "common_themes": ["string — themes that appear across documents"],
  "unique_to_each": {{
    "string (doc name)": ["string — unique points from this doc"]
  }},
  "key_points": ["string — unified key points across all docs"],
  "recommended_study_order": ["string — doc names in suggested reading order"],
  "exam_tips": ["string"]
}}
`);

export const REVISION_NOTES_PROMPT = ChatPromptTemplate.fromTemplate(`
Create concise revision notes from this study material.
Format them like a quick-reference cheatsheet a student would use the day before an exam.

Document: {filename}
Topics to focus on: {focus_topics}

Content:
{context}

Return ONLY valid JSON, no markdown backticks:
{{
  "title": "string",
  "sections": [
    {{
      "heading": "string",
      "bullets": ["string — short, memorable points"],
      "formulas_or_rules": ["string — any formulas, rules, or mnemonics"]
    }}
  ],
  "must_remember": ["string — absolute must-knows for the exam (5-7 items)"],
  "common_mistakes": ["string — mistakes students commonly make on this topic"]
}}
`);
