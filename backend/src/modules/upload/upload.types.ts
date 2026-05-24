// Document processing status — mirrors MySQL ENUM
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

// Supported file types — mirrors MySQL ENUM
export type FileType = 'pdf' | 'docx' | 'txt' | 'pptx' | 'md';

// Shape of a document row returned from MySQL
export interface DocumentRecord {
  id: string;
  user_id: string;
  room_id: string | null;
  filename: string;
  s3_key: string;
  file_type: FileType;
  size_bytes: number;
  status: DocumentStatus;
  chunk_count: number | null;
  page_count: number | null;
  error_msg: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// BullMQ job payload — what goes into the queue
export interface IngestionJobPayload {
  documentId: string;
  userId: string;
  roomId: string | null;
  s3Key: string;
  fileType: FileType;
  filename: string;
}

// Metadata attached to each Qdrant vector point
export interface ChunkMetadata {
  chunk_id: string;       // same as document_chunks.id (UUID)
  document_id: string;
  user_id: string;
  room_id: string | null;
  page_number: number | null;
  chunk_index: number;
  filename: string;
}

// Shape of one processed chunk before embedding
export interface ProcessedChunk {
  id: string;             // UUID generated here, used in both MySQL and Qdrant
  content: string;
  page_number: number | null;
  chunk_index: number;
  token_count: number;
}

// Result returned by upload.processor.ts
export interface ProcessingResult {
  chunkCount: number;
  pageCount: number | null;
  durationMs: number;
}

// Response shape for POST /api/upload
export interface UploadResponse {
  documentId: string;
  filename: string;
  status: DocumentStatus;
  message: string;
}

// Query params for GET /api/upload/documents
export interface ListDocumentsQuery {
  roomId?: string;
  status?: DocumentStatus;
  page?: number;
  limit?: number;
}
