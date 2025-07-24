// src/app/shared/models/mcp.interfaces.ts

/**
 * Interfaz para mensajes de chat
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isLoading?: boolean;
    error?: string;
}

/**
 * Tipo para el estado del chat
 */
export type ChatState = 'idle' | 'loading' | 'error' | 'typing';

/**
 * Interfaz para la sesión de chat
 */
export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    isActive: boolean;
    created: Date;
    lastActivity: Date;
}

/**
 * Interfaz para solicitud a Anthropic
 */
export interface AnthropicRequest {
    model: string;
    max_tokens: number;
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
    session_id?: string; // Opcional para compatibilidad
}

/**
 * Interfaz para respuesta de Anthropic
 */
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

/**
 * Interfaz para herramientas MCP
 */
export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

/**
 * Interfaz para respuesta de herramientas
 */
export interface McpToolsResponse {
    status: string;
    service: string;
    timestamp: string;
    data: {
        tools: McpTool[];
    };
}

/**
 * Interfaz para llamada a herramientas
 */
export interface McpToolCall {
    toolName: string;
    args: Record<string, any>;
    session_id?: string; // Opcional para compatibilidad
}

/**
 * Interfaz para respuesta de llamada a herramientas
 */
export interface McpToolCallResponse {
    status: string;
    service: string;
    timestamp: string;
    data: {
        result: any;
        metadata?: Record<string, any>;
    };
}

/**
 * Interfaz para verificación de salud del servicio
 */
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

/**
 * Interfaz para modelos disponibles
 */
export interface McpModelsResponse {
    status: string;
    service: string;
    timestamp: string;
    data: {
        models: string[];
    };
}

/**
 * Interfaz para errores MCP
 */
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

/**
 * Interfaz para estadísticas de guardarriles
 */
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

/**
 * Interfaz para configuración de guardarriles
 */
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
