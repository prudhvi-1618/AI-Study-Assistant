import { useState, useCallback, useEffect } from 'react';
import { apiFetch, buildApiUrl, getAccessToken } from './api';

export interface Source {
  title: string;
  page: number;
  relevance: number;
  excerpt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
}

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  room_id: string | null;
  message_count: number;
  status: 'active' | 'archived';
  last_message?: string;
  last_message_at?: string;
  created_at: string;
}

interface BackendDocument {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}

interface BackendChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: BackendSource[] | null;
  created_at: string;
}

interface BackendSource {
  filename: string;
  page_number: number | null;
  chunk_index: number;
  relevance_score?: number;
}

type ChatMode = 'Ask' | 'Summarize' | 'Quiz' | 'Flashcards';
type SSEEvent =
  | { type: 'token'; token: string }
  | { type: 'done'; messageId: string; sources: BackendSource[]; tokensUsed: number }
  | { type: 'error'; message: string };

function displayTime(value: string | Date = new Date()) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mapSources(sources?: BackendSource[] | null): Source[] | undefined {
  if (!sources || sources.length === 0) return undefined;

  return sources.map((source) => {
    const rawScore = typeof source.relevance_score === 'number' ? source.relevance_score : 1;
    const relevance = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

    return {
      title: source.filename,
      page: source.page_number ?? 1,
      relevance: Math.max(0, Math.min(100, relevance)),
      excerpt: `Referenced chunk ${source.chunk_index + 1} from ${source.filename}.`,
    };
  });
}

function mapMessage(message: BackendChatMessage): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: displayTime(message.created_at),
    sources: mapSources(message.sources),
  };
}

function formatSummaryContent(content: Record<string, unknown>) {
  const lines: string[] = [];
  const title = typeof content.title === 'string' ? content.title : 'Summary';
  lines.push(`## ${title}`);

  const tldr = content.tldr;
  if (typeof tldr === 'string') {
    lines.push('', `**TL;DR:** ${tldr}`);
  }

  const summary = content.detailed_summary ?? content.summary ?? content.overview;
  if (typeof summary === 'string') {
    lines.push('', summary);
  }

  const keyPoints = content.key_points;
  if (Array.isArray(keyPoints) && keyPoints.length > 0) {
    lines.push('', '### Key points');
    keyPoints.forEach((point) => lines.push(`- ${String(point)}`));
  }

  const sections = content.sections;
  if (Array.isArray(sections)) {
    sections.forEach((section) => {
      if (section && typeof section === 'object') {
        const item = section as Record<string, unknown>;
        if (typeof item.heading === 'string') lines.push('', `### ${item.heading}`);
        if (Array.isArray(item.bullets)) {
          item.bullets.forEach((point) => lines.push(`- ${String(point)}`));
        }
        if (Array.isArray(item.formulas_or_rules) && item.formulas_or_rules.length > 0) {
          lines.push('', '**Formulas or rules**');
          item.formulas_or_rules.forEach((point) => lines.push(`- ${String(point)}`));
        }
      }
    });
  }

  const examTips = content.exam_tips ?? content.must_remember;
  if (Array.isArray(examTips) && examTips.length > 0) {
    lines.push('', '### Remember');
    examTips.forEach((tip) => lines.push(`- ${String(tip)}`));
  }

  if (lines.length <= 1) {
    lines.push('', '```json', JSON.stringify(content, null, 2), '```');
  }

  return lines.join('\n');
}

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ChatMode>('Ask');
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;

  const refreshSessions = useCallback(async () => {
    try {
      const data = await apiFetch<{ sessions: ChatSessionSummary[] }>('/chat/sessions');
      setSessions(data.sessions);
      if (!activeSessionId && data.sessions.length > 0) {
        setActiveSessionId(data.sessions[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat sessions', err);
    }
  }, [activeSessionId]);

  const loadSession = useCallback(async (sessionId: string) => {
    const data = await apiFetch<{ messages: BackendChatMessage[] }>(`/chat/sessions/${sessionId}/messages?limit=50`);
    setMessages(data.messages.map(mapMessage));
    setActiveSessionId(sessionId);
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (activeSessionId && messages.length === 0) {
      loadSession(activeSessionId).catch((err) => console.error('Failed to load chat session', err));
    }
  }, [activeSessionId, loadSession, messages.length]);

  const getReadyDocumentIds = useCallback(async () => {
    const data = await apiFetch<{ documents: BackendDocument[] }>('/upload/documents?limit=10');
    return data.documents
      .filter((doc) => doc.status === 'ready')
      .slice(0, 10)
      .map((doc) => doc.id);
  }, []);

  const ensureSession = useCallback(async (firstMessage: string, documentIds: string[]) => {
    if (activeSessionId) return activeSessionId;

    const session = await apiFetch<ChatSessionSummary>('/chat/sessions', {
      method: 'POST',
      body: {
        title: firstMessage.slice(0, 80),
        documentIds,
      },
    });
    setActiveSessionId(session.id);
    setSessions((prev) => [session, ...prev]);
    return session.id;
  }, [activeSessionId]);

  const appendAssistantError = useCallback((messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content }
          : msg
      )
    );
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    if (activeSession?.status === 'archived') {
      throw new Error('This chat session is archived. Please select or unarchive a different session before sending a new message.');
    }

    const timestamp = displayTime();
    
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const aiMsgId = `msg-ai-${Date.now()}`;
    const aiMsgPlaceholder: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: displayTime(),
    };
    
    setMessages((prev) => [...prev, aiMsgPlaceholder]);

    try {
      const documentIds = await getReadyDocumentIds();
      if (documentIds.length === 0) {
        throw new Error('Upload at least one processed document before using chat or summaries.');
      }

      if (activeMode === 'Summarize') {
        const result = await apiFetch<{ summaryId: string; content: Record<string, unknown>; fromCache: boolean }>('/summaries/generate', {
          method: 'POST',
          body: {
            documentIds,
            type: 'full',
            subject: content.slice(0, 255),
          },
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: formatSummaryContent(result.content) }
              : msg
          )
        );
        await refreshSessions();
        return;
      }

      if (activeMode === 'Quiz' || activeMode === 'Flashcards') {
        throw new Error(`${activeMode} mode is available from its dedicated page for now.`);
      }

      const sessionId = await ensureSession(content, documentIds);
      const accessToken = getAccessToken();
      const res = await fetch(buildApiUrl(`/chat/sessions/${sessionId}/messages`), {
        method: 'POST',
        body: JSON.stringify({ message: content }),
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        let errorMessage = 'Failed to fetch streaming response';
        try {
          const json = await res.json();
          errorMessage = json.message || errorMessage;
        } catch {
          // SSE errors may not be JSON.
        }
        throw new Error(errorMessage);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessageContent = '';
      let pending = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          pending += decoder.decode(value, { stream: true });
          const events = pending.split('\n\n');
          pending = events.pop() ?? '';

          for (const rawEvent of events) {
            const dataLine = rawEvent
              .split('\n')
              .find((line) => line.startsWith('data: '));

            if (!dataLine) continue;

            const event = JSON.parse(dataLine.slice(6)) as SSEEvent;
            if (event.type === 'token') {
              aiMessageContent += event.token;

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, content: aiMessageContent } : msg
                )
              );
            }

            if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? { ...msg, id: event.messageId || msg.id, content: aiMessageContent, sources: mapSources(event.sources) }
                    : msg
                )
              );
            }

            if (event.type === 'error') {
              throw new Error(event.message);
            }
          }
        }
      }

      await refreshSessions();
    } catch (err) {
      console.error(err);
      appendAssistantError(
        aiMsgId,
        err instanceof Error
          ? err.message
          : 'Sorry, I encountered an error while retrieving the explanation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeMode, activeSession?.status, appendAssistantError, ensureSession, getReadyDocumentIds, refreshSessions]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
  }, []);

  return {
    messages,
    loading,
    activeMode,
    setActiveMode,
    sendMessage,
    clearChat,
    sessions,
    activeSessionId,
    activeSessionStatus: activeSession?.status ?? 'active',
    loadSession,
  };
}
