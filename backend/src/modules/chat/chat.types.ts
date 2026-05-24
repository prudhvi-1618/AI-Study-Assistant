export type MessageRole = 'user' | 'assistant';

export type SessionStatus = 'active' | 'archived';

export interface ChatSession {
  id: string;
  user_id: string;
  room_id: string | null;
  title: string | null;
  message_count: number;
  status: SessionStatus;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  sources: CitedSource[] | null;
  tokens_used: number | null;
  model_used: string | null;
  created_at: Date;
}

export interface CitedSource {
  chunk_id: string;
  document_id: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  relevance_score?: number;
}

export interface ChatRAGPayload {
  sessionId: string;
  userId: string;
  roomId: string | null;
  documentIds: string[];
  userMessage: string;
  conversationHistory: Array<{ role: MessageRole; content: string }>;
}

export interface ChatAgentResponse {
  answer: string;
  sources: CitedSource[];
  tokensUsed: number;
  modelUsed: string;
}

export interface SSETokenEvent {
  type: 'token';
  token: string;
}

export interface SSEDoneEvent {
  type: 'done';
  messageId: string;
  sources: CitedSource[];
  tokensUsed: number;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent = SSETokenEvent | SSEDoneEvent | SSEErrorEvent;

export interface CreateSessionDTO {
  roomId?: string;
  title?: string;
  documentIds?: string[];
}

export interface SendMessageDTO {
  message: string;
  documentIds?: string[];
}

export interface ListSessionsQuery {
  roomId?: string;
  page?: number;
  limit?: number;
}

export interface SessionSummary {
  id: string;
  title: string | null;
  room_id: string | null;
  message_count: number;
  status: SessionStatus;
  last_message?: string;
  last_message_at?: Date;
  created_at: Date;
}
