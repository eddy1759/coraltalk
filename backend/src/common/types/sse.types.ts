export type SSEEventType = 'token' | 'citation' | 'error' | 'end' | 'metadata';

export interface SSEEvent {
  event: SSEEventType;
  data: string;
}

export interface SSETokenEvent extends SSEEvent {
  event: 'token';
  data: string;
}

export interface SSECitationEvent extends SSEEvent {
  event: 'citation';
  data: string; // JSON stringified CitationData
}

export interface CitationData {
  source: 'Internal Docs' | 'General LLM' | 'Hybrid';
  confidence?: number;
  chunks?: number;
}

export interface SSEMetadataEvent extends SSEEvent {
  event: 'metadata';
  data: string;
}

export interface SSEErrorEvent extends SSEEvent {
  event: 'error';
  data: string;
}

export interface SSEEndEvent extends SSEEvent {
  event: 'end';
  data: string;
}

export interface RetrievalResult {
  content: string;
  score: number;
  metadata?: Record<string, any>;
  chunkId?: string;
}

export type ResponseMode = 'strict' | 'hybrid';
