export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
  toolUsed?: string;
  executionTime?: number;
  thinking_process?: {
    input_analysis: string;
    tool_selected: string;
    search_strategy: string;
  };
}

export type ChatState = 'idle' | 'loading' | 'error' | 'typing';

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  isActive: boolean;
  created: Date;
  lastActivity: Date;
}

export interface IntelligentRequest {
  message: string;
}

export interface IntelligentResponse {
  success: boolean;
  message: string;
  tool_used?: string;
  execution_time?: number;
  thinking_process?: {
    input_analysis: string;
    tool_selected: string;
    search_strategy: string;
  };
  error?: string;
}

export interface IntelligentHealthResponse {
  status: string;
  service: string;
  timestamp: string;
  anthropic_configured: boolean;
  agent_initialized: boolean;
  tools_available: number;
}

export interface IntelligentError {
  error: string;
  details?: {
    status?: number;
    statusText?: string;
    url?: string;
    originalError?: string;
  };
  timestamp: string;
}
