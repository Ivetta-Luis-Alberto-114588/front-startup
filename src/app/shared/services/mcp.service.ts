// src/app/shared/services/mcp.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ChatMessage,
  ChatSession,
  ChatState,
  AnthropicRequest,
  AnthropicResponse,
  McpToolsResponse,
  McpToolCall,
  McpToolCallResponse,
  McpHealthResponse,
  McpModelsResponse,
  McpError,
  GuardrailsStats,
  GuardrailsConfig
} from '../interfaces/mcp.interfaces';

@Injectable({
  providedIn: 'root'
})
export class McpService {
  private readonly apiUrl = environment.apiUrl;
  private readonly mcpBaseUrl = `${this.apiUrl}/api/mcp`;
  
  // Estado del chat
  private chatStateSubject = new BehaviorSubject<ChatState>('idle');
  public chatState$ = this.chatStateSubject.asObservable();
  
  // Sesión actual de chat
  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();
  
  // Mensajes del chat actual
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  // Herramientas disponibles
  private toolsSubject = new BehaviorSubject<McpToolsResponse | null>(null);
  public tools$ = this.toolsSubject.asObservable();
  
  // Modelos disponibles
  private modelsSubject = new BehaviorSubject<McpModelsResponse | null>(null);
  public models$ = this.modelsSubject.asObservable();
  
  // ID de sesión actual
  private sessionId: string;
  
  constructor(private http: HttpClient) {
    this.sessionId = this.generateSessionId();
    this.initializeChat();
  }
  
  /**
   * Inicializar el chat con mensaje de bienvenida
   */
  private initializeChat(): void {
    const session: ChatSession = {
      id: this.sessionId,
      messages: [{
        id: this.generateMessageId(),
        role: 'assistant',
        content: '¡Hola! Soy tu asistente especializado en e-commerce. Puedo ayudarte con consultas sobre productos, clientes, pedidos y gestión de la tienda. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }],
      isActive: true,
      created: new Date(),
      lastActivity: new Date()
    };
    
    this.currentSessionSubject.next(session);
    this.messagesSubject.next(session.messages);
  }
  
  /**
   * Verificar el estado del servicio MCP
   */
  checkHealth(): Observable<McpHealthResponse> {
    console.log('🔍 Checking MCP health at:', `${this.mcpBaseUrl}/health`);
    return this.http.get<McpHealthResponse>(`${this.mcpBaseUrl}/health`)
      .pipe(
        tap(response => console.log('✅ MCP Health OK:', response)),
        catchError(error => {
          console.error('❌ MCP Health Failed:', error);
          return this.handleError<McpHealthResponse>('checkHealth')(error);
        })
      );
  }
  
  /**
   * Test directo al backend sin proxy
   */
  testDirectConnection(): Observable<any> {
    const directUrl = 'https://sistema-mongo.onrender.com/api/mcp/health';
    console.log('🧪 Testing direct connection to:', directUrl);
    
    return this.http.get(directUrl).pipe(
      tap(response => console.log('✅ Direct connection OK:', response)),
      catchError(error => {
        console.error('❌ Direct connection failed:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Obtener modelos disponibles
   */
  getModels(): Observable<McpModelsResponse> {
    return this.http.get<McpModelsResponse>(`${this.mcpBaseUrl}/models`)
      .pipe(
        tap(response => this.modelsSubject.next(response)),
        catchError(this.handleError<McpModelsResponse>('getModels'))
      );
  }
  
  /**
   * Obtener herramientas disponibles
   */
  getTools(): Observable<McpToolsResponse> {
    return this.http.get<McpToolsResponse>(`${this.mcpBaseUrl}/tools/info`)
      .pipe(
        tap(response => this.toolsSubject.next(response)),
        catchError(this.handleError<McpToolsResponse>('getTools'))
      );
  }
  
  /**
   * Enviar mensaje al chat
   */
  sendMessage(content: string): Observable<ChatMessage> {
    if (!content.trim()) {
      return throwError(() => new Error('El mensaje no puede estar vacío'));
    }
    
    // Cambiar estado a loading
    this.chatStateSubject.next('loading');
    
    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    // Añadir mensaje del usuario
    this.addMessage(userMessage);
    
    // Crear mensaje de loading para el asistente
    const loadingMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    
    this.addMessage(loadingMessage);
    
    // Preparar request para Anthropic
    const currentMessages = this.messagesSubject.value
      .filter(msg => !msg.isLoading && !msg.error)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    const request: AnthropicRequest = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: currentMessages
    };
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
      // Removido x-session-id por problemas de CORS
    });
    
    // Incluir session ID en el body del request en lugar del header
    const requestWithSession = {
      ...request,
      session_id: this.sessionId
    };
    
    console.log('🚀 Sending message to MCP:', {
      url: `${this.mcpBaseUrl}/anthropic`,
      headers: headers,
      request: requestWithSession
    });
    
    return this.http.post<AnthropicResponse>(
      `${this.mcpBaseUrl}/anthropic`,
      requestWithSession,
      { headers }
    ).pipe(
      map(response => {
        console.log('✅ MCP Response received:', response);
        // Remover mensaje de loading
        this.removeLoadingMessage(loadingMessage.id);
        
        // Crear mensaje de respuesta
        const assistantMessage: ChatMessage = {
          id: this.generateMessageId(),
          role: 'assistant',
          content: response.data.content[0]?.text || 'Sin respuesta',
          timestamp: new Date()
        };
        
        this.addMessage(assistantMessage);
        this.chatStateSubject.next('idle');
        
        return assistantMessage;
      }),
      catchError(error => {
        console.error('❌ MCP Error details:', {
          error: error,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        
        // Remover mensaje de loading
        this.removeLoadingMessage(loadingMessage.id);
        
        // Crear mensaje de error
        const errorMessage: ChatMessage = {
          id: this.generateMessageId(),
          role: 'assistant',
          content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.',
          timestamp: new Date(),
          error: error.message
        };
        
        this.addMessage(errorMessage);
        this.chatStateSubject.next('error');
        
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Ejecutar herramienta MCP
   */
  callTool(toolCall: McpToolCall): Observable<McpToolCallResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Incluir session ID en el body
    const toolCallWithSession = {
      ...toolCall,
      session_id: this.sessionId
    };
    
    return this.http.post<McpToolCallResponse>(
      `${this.mcpBaseUrl}/tools/call`,
      toolCallWithSession,
      { headers }
    ).pipe(
      catchError(this.handleError<McpToolCallResponse>('callTool'))
    );
  }
  
  /**
   * Obtener estadísticas de guardarriles
   */
  getGuardrailsStats(): Observable<GuardrailsStats> {
    return this.http.get<GuardrailsStats>(`${this.mcpBaseUrl}/guardrails/stats`)
      .pipe(
        catchError(this.handleError<GuardrailsStats>('getGuardrailsStats'))
      );
  }
  
  /**
   * Obtener configuración de guardarriles
   */
  getGuardrailsConfig(): Observable<GuardrailsConfig> {
    return this.http.get<GuardrailsConfig>(`${this.mcpBaseUrl}/guardrails/config`)
      .pipe(
        catchError(this.handleError<GuardrailsConfig>('getGuardrailsConfig'))
      );
  }
  
  /**
   * Limpiar chat
   */
  clearChat(): void {
    this.messagesSubject.next([]);
    this.chatStateSubject.next('idle');
    this.initializeChat();
  }
  
  /**
   * Reiniciar sesión
   */
  resetSession(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.mcpBaseUrl}/guardrails/sessions/${this.sessionId}/reset`,
      { session_id: this.sessionId },
      { headers }
    ).pipe(
      tap(() => {
        this.sessionId = this.generateSessionId();
        this.clearChat();
      }),
      catchError(this.handleError<any>('resetSession'))
    );
  }
  
  /**
   * Añadir mensaje al chat
   */
  private addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
    
    // Actualizar sesión
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      currentSession.messages = updatedMessages;
      currentSession.lastActivity = new Date();
      this.currentSessionSubject.next(currentSession);
    }
  }
  
  /**
   * Remover mensaje de loading
   */
  private removeLoadingMessage(messageId: string): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);
    this.messagesSubject.next(updatedMessages);
  }
  
  /**
   * Generar ID de sesión único
   */
  private generateSessionId(): string {
    return `chat-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generar ID de mensaje único
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Manejar errores HTTP
   */
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      let errorMessage = 'Ocurrió un error inesperado';
      
      if (error.status === 0) {
        errorMessage = 'No se puede conectar al servidor MCP. Verifica que el backend esté funcionando y que no haya problemas de CORS.';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status >= 500) {
        errorMessage = 'Error interno del servidor MCP. El servicio podría estar temporalmente no disponible.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint MCP no encontrado. Verifica que el servicio MCP esté desplegado correctamente.';
      } else if (error.status === 403 || error.status === 401) {
        errorMessage = 'No tienes permisos para acceder al servicio MCP.';
      }
      
      const mcpError: McpError = {
        error: errorMessage,
        details: {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          originalError: error.message
        },
        timestamp: new Date().toISOString()
      };
      
      return throwError(() => mcpError);
    };
  }
}
