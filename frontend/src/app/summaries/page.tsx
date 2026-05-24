'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { apiFetch } from '@/lib/api';

type SummaryType = 'full' | 'section' | 'compare' | 'revision_notes';

interface StudyDocument {
  id: string;
  filename: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface SummaryRecord {
  id: string;
  document_id: string;
  type: SummaryType;
  content: Record<string, unknown>;
  created_at: string;
}

const summaryTypes: Array<{ label: string; value: SummaryType }> = [
  { label: 'Full', value: 'full' },
  { label: 'Section', value: 'section' },
  { label: 'Compare', value: 'compare' },
  { label: 'Revision notes', value: 'revision_notes' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getSummaryTitle(content: Record<string, unknown>, type: SummaryType) {
  if (typeof content.title === 'string') return content.title;
  if (typeof content.section_title === 'string') return content.section_title;
  if (type === 'revision_notes') return 'Revision notes';
  if (type === 'compare') return 'Comparative summary';
  return 'Study summary';
}

function renderSummaryMarkdown(content: Record<string, unknown>) {
  const lines: string[] = [];

  const tldr = content.tldr;
  if (typeof tldr === 'string') lines.push(`**TL;DR:** ${tldr}`);

  const overview = content.overview ?? content.summary ?? content.detailed_summary;
  if (typeof overview === 'string') lines.push('', overview);

  const keyPoints = content.key_points;
  if (Array.isArray(keyPoints) && keyPoints.length > 0) {
    lines.push('', '### Key points');
    keyPoints.forEach((point) => lines.push(`- ${String(point)}`));
  }

  const topics = content.topics_covered ?? content.common_themes;
  if (Array.isArray(topics) && topics.length > 0) {
    lines.push('', '### Topics');
    topics.forEach((topic) => lines.push(`- ${String(topic)}`));
  }

  const terms = content.important_terms;
  if (Array.isArray(terms) && terms.length > 0) {
    lines.push('', '### Important terms');
    terms.forEach((term) => {
      if (term && typeof term === 'object') {
        const item = term as Record<string, unknown>;
        lines.push(`- **${String(item.term ?? 'Term')}**: ${String(item.definition ?? '')}`);
      }
    });
  }

  const sections = content.sections;
  if (Array.isArray(sections)) {
    sections.forEach((section) => {
      if (section && typeof section === 'object') {
        const item = section as Record<string, unknown>;
        if (typeof item.heading === 'string') lines.push('', `### ${item.heading}`);
        if (Array.isArray(item.bullets)) {
          item.bullets.forEach((bullet) => lines.push(`- ${String(bullet)}`));
        }
        if (Array.isArray(item.formulas_or_rules) && item.formulas_or_rules.length > 0) {
          lines.push('', '**Formulas or rules**');
          item.formulas_or_rules.forEach((rule) => lines.push(`- ${String(rule)}`));
        }
      }
    });
  }

  const remember = content.exam_tips ?? content.must_remember ?? content.common_mistakes;
  if (Array.isArray(remember) && remember.length > 0) {
    lines.push('', '### Remember');
    remember.forEach((item) => lines.push(`- ${String(item)}`));
  }

  return lines.length > 0 ? lines.join('\n') : `\`\`\`json\n${JSON.stringify(content, null, 2)}\n\`\`\``;
}

export default function SummariesPage() {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('full');
  const [sectionTopic, setSectionTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === 'ready'),
    [documents]
  );

  const activeSummary = useMemo(
    () => summaries.find((summary) => summary.id === activeSummaryId) ?? summaries[0],
    [activeSummaryId, summaries]
  );

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [docsData, summariesData] = await Promise.all([
        apiFetch<{ documents: StudyDocument[] }>('/upload/documents?limit=50'),
        apiFetch<{ summaries: SummaryRecord[] }>('/summaries?limit=20'),
      ]);

      setDocuments(docsData.documents);
      setSummaries(summariesData.summaries);
      if (!activeSummaryId && summariesData.summaries.length > 0) {
        setActiveSummaryId(summariesData.summaries[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summaries');
    } finally {
      setLoading(false);
    }
  }, [activeSummaryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId].slice(0, 5)
    );
  };

  const generateSummary = async () => {
    if (selectedDocumentIds.length === 0) {
      setError('Select at least one ready document first.');
      return;
    }
    if (summaryType === 'section' && !sectionTopic.trim()) {
      setError('Add a section topic for section summaries.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const result = await apiFetch<{ summaryId: string; content: Record<string, unknown>; fromCache: boolean }>('/summaries/generate', {
        method: 'POST',
        body: {
          documentIds: selectedDocumentIds,
          type: summaryType,
          sectionTopic: summaryType === 'section' ? sectionTopic : undefined,
          subject: subject || undefined,
          forceRegenerate: false,
        },
      });

      await loadData();
      setActiveSummaryId(result.summaryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const deleteSummary = async (summaryId: string) => {
    setError(null);
    try {
      await apiFetch(`/summaries/${summaryId}`, { method: 'DELETE' });
      setSummaries((prev) => prev.filter((summary) => summary.id !== summaryId));
      if (activeSummaryId === summaryId) setActiveSummaryId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete summary');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface">
        <Sidebar />

        <main className="md:ml-16 lg:ml-60 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight sentence-case">
                Summaries
              </h1>
              <p className="text-sm text-gray-500 mt-1 sentence-case">
                Generate and revisit notes from processed study documents
              </p>
            </div>
            <button
              onClick={loadData}
              className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-sm font-bold text-ink hover:bg-gray-50 flex items-center gap-2 self-start md:self-auto"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
            <section className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <h2 className="text-sm font-extrabold text-ink sentence-case">
                    Generate summary
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {summaryTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSummaryType(type.value)}
                      className={`h-9 rounded-xl text-xs font-bold transition-colors ${
                        summaryType === type.value
                          ? 'bg-brand text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject or exam focus"
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 mb-3"
                />

                {summaryType === 'section' && (
                  <input
                    value={sectionTopic}
                    onChange={(event) => setSectionTopic(event.target.value)}
                    placeholder="Section topic"
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 mb-3"
                  />
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {readyDocuments.map((document) => {
                    const selected = selectedDocumentIds.includes(document.id);
                    return (
                      <button
                        key={document.id}
                        onClick={() => toggleDocument(document.id)}
                        className={`w-full rounded-xl border px-3 py-2 text-left flex items-center gap-3 transition-colors ${
                          selected
                            ? 'border-brand bg-brand-light/40'
                            : 'border-gray-100 bg-white hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          selected ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-ink truncate">
                            {document.filename}
                          </span>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase">
                            {document.file_type}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {readyDocuments.length === 0 && (
                  <div className="rounded-xl bg-gray-50 px-3 py-6 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-500">
                      Upload and process documents before generating summaries.
                    </p>
                  </div>
                )}

                <button
                  onClick={generateSummary}
                  disabled={generating || selectedDocumentIds.length === 0}
                  className="mt-4 w-full h-11 rounded-xl bg-brand text-white text-sm font-extrabold hover:bg-brand-mid disabled:opacity-40 flex items-center justify-center gap-2"
                  type="button"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate
                </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-extrabold text-ink mb-3 sentence-case">
                  Saved summaries
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-6 h-6 text-brand animate-spin" />
                    </div>
                  ) : summaries.length === 0 ? (
                    <p className="text-xs font-semibold text-gray-400 py-4">
                      No summaries yet.
                    </p>
                  ) : (
                    summaries.map((summary) => (
                      <button
                        key={summary.id}
                        onClick={() => setActiveSummaryId(summary.id)}
                        className={`w-full text-left rounded-xl px-3 py-3 border transition-colors ${
                          activeSummary?.id === summary.id
                            ? 'border-brand bg-brand-light/30'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        <span className="block text-xs font-bold text-ink truncate">
                          {getSummaryTitle(summary.content, summary.type)}
                        </span>
                        <span className="block text-[10px] font-semibold text-gray-400 mt-1 sentence-case">
                          {summary.type.replace('_', ' ')} · {formatDate(summary.created_at)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-100 rounded-2xl shadow-sm min-h-[560px] overflow-hidden">
              {activeSummary ? (
                <motion.div
                  key={activeSummary.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-brand shrink-0" />
                        <span className="text-[10px] font-extrabold text-brand uppercase tracking-wide">
                          {activeSummary.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-ink truncate">
                        {getSummaryTitle(activeSummary.content, activeSummary.type)}
                      </h2>
                      <p className="text-xs font-semibold text-gray-400 mt-1">
                        Created {formatDate(activeSummary.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSummary(activeSummary.id)}
                      className="w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center shrink-0"
                      type="button"
                      title="Delete summary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <article className="prose prose-sm max-w-none text-gray-800 markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {renderSummaryMarkdown(activeSummary.content)}
                      </ReactMarkdown>
                    </article>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[560px] flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-brand" />
                  </div>
                  <h2 className="text-lg font-extrabold text-ink sentence-case">
                    Choose or generate a summary
                  </h2>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Select ready documents on the left and generate focused study notes.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
