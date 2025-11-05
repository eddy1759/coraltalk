export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | Date;
  citation?: Citation;
}

export interface Citation {
  source: string;
  confidence: number;
}

export interface ChatQueryPayload {
  query: string;
  useGeneralLLM: boolean;
  conversationHistory?: ChatMessage[]
}

export interface SSEEvent {
  type: string;
  data: string;
}