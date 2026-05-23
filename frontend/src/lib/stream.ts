import { useState, useCallback } from 'react';

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

const waveInterferenceSources: Source[] = [
  {
    title: 'Physics_Chapter3.pdf',
    page: 12,
    relevance: 96,
    excerpt: 'Wave interference occurs when two or more waves overlap in the same region of space. The resultant displacement at any point is the algebraic sum of the displacements of the individual waves (principle of superposition).',
  },
  {
    title: 'Lecture_Notes.docx',
    page: 4,
    relevance: 89,
    excerpt: 'The wavelength determines the pattern of interference. Constructive interference leads to maximum amplitude, whereas destructive interference can lead to complete cancellation if amplitudes are equal and opposite.',
  },
];

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'Ask' | 'Summarize' | 'Quiz' | 'Flashcards'>('Ask');

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // 1. Add User Message
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // 2. Add empty AI Message to fill during stream
    const aiMsgId = `msg-ai-${Date.now()}`;
    const aiMsgPlaceholder: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    
    setMessages((prev) => [...prev, aiMsgPlaceholder]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: content }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch streaming response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessageContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          aiMessageContent += chunk;

          // Update AI Message content in real-time
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, content: aiMessageContent } : msg
            )
          );
        }
      }

      // Finish streaming and append source citations
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: aiMessageContent, sources: waveInterferenceSources }
            : msg
        )
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: 'Sorry, I encountered an error while retrieving the explanation. Please try again.',
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    activeMode,
    setActiveMode,
    sendMessage,
    clearChat,
  };
}
