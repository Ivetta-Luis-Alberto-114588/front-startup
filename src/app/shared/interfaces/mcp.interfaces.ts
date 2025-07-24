export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

export type ChatState = 'idle' | 'loading' | 'error' | 'typing';

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  isActive: boolean;
  created: Date;
  lastActivity: Date;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  session_id?: string;
}

export interface AnthropicResponse {
  status: string;
  service: string;
  timestamp: string;
  data: {
    id: string;
    type: string;
    role: string;
    content: {
      type: string;
      text: string;
    }[];
    model: string;
    stop_reason: string;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolsResponse {
  status: string;
  service: string;
  timestamp: string;
  data: {
    tools: McpTool[];
  };
}

export interface McpToolCall {
  toolName: string;
  args: Record<string, any>;
  session_id?: string;
}

export interface McpToolCallResponse {
  status: string;
  service: string;
  timestamp: string;
  data: {
    result: any;
    metadata?: Record<string, any>;
  };
}

export interface McpHealthResponse {
  status: string;
  service: string;
  timestamp: string;
  data: {
    healthy: boolean;
    version: string;
    uptime: number;
    services: {
      anthropic: boolean;
      tools: boolean;
      guardrails: boolean;
    };
  };
}

export interface McpModelsResponse {
  status: string;
  service: string;
  timestamp: string;
  data: {
    models: string[];
  };
}

export interface McpError {
  error: string;
  details?: {
    status?: number;
    statusText?: string;
    url?: string;
    originalError?: string;
  };
  timestamp: string;
}

export interface GuardrailsStats {
  status: string;
  service: string;
  timestamp: string;
  data: {
    total_requests: number;
    blocked_requests: number;
    allowed_requests: number;
    block_rate: number;
    top_blocked_reasons: Array<{
      reason: string;
      count: number;
    }>;
    recent_activity: Array<{
      timestamp: string;
      action: 'allowed' | 'blocked';
      reason?: string;
    }>;
  };
}

export interface GuardrailsConfig {
  status: string;
  service: string;
  timestamp: string;
  data: {
    enabled: boolean;
    rules: Array<{
      id: string;
      name: string;
      description: string;
      enabled: boolean;
      severity: 'low' | 'medium' | 'high';
      pattern?: string;
      action: 'warn' | 'block';
    }>;
    thresholds: {
      max_requests_per_minute: number;
      max_tokens_per_request: number;
      max_session_duration_minutes: number;
    };
  };
}
