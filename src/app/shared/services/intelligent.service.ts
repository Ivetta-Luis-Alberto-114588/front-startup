// src/app/shared/services/intelligent.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    ChatMessage,
    ChatSession,
    ChatState,
    IntelligentRequest,
    IntelligentResponse,
    IntelligentHealthResponse,
    IntelligentError
} from '../interfaces/intelligent.interfaces';

@Injectable({
    providedIn: 'root'
})
export class IntelligentService {
    private readonly apiUrl = environment.apiUrl;
    private readonly intelligentBaseUrl = `${this.apiUrl}/api/intelligent`;

    // Estado del chat
    private chatStateSubject = new BehaviorSubject<ChatState>('idle');
    public chatState$ = this.chatStateSubject.asObservable();

    // Sesión actual de chat
    private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
    public currentSession$ = this.currentSessionSubject.asObservable();

    // Mensajes del chat actual
    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    public messages$ = this.messagesSubject.asObservable();

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
                content: '¡Hola! Soy tu asistente inteligente. Puedo ayudarte con información sobre productos, clientes, pedidos y gestión de la tienda. ¿En qué puedo ayudarte hoy?',
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
     * Verificar el estado del servicio Intelligent
     */
    checkHealth(): Observable<IntelligentHealthResponse> {
        console.log('🔍 Checking Intelligent health at:', `${this.intelligentBaseUrl}/health`);
        return this.http.get<IntelligentHealthResponse>(`${this.intelligentBaseUrl}/health`)
            .pipe(
                tap(response => console.log('✅ Intelligent Health OK:', response)),
                catchError(error => {
                    console.error('❌ Intelligent Health Failed:', error);
                    return this.handleError<IntelligentHealthResponse>('checkHealth')(error);
                })
            );
    }

    /**
     * Test directo al backend sin proxy
     */
    testDirectConnection(): Observable<any> {
        const directUrl = `${environment.apiUrl}/api/intelligent/health`;
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
     * Enviar mensaje al asistente inteligente
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

        // Preparar request para Intelligent API
        const request: IntelligentRequest = {
            message: content.trim()
        };

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        console.log('🚀 Sending message to Intelligent:', {
            url: `${this.intelligentBaseUrl}/chat`,
            headers: headers,
            request: request
        });

        return this.http.post<IntelligentResponse>(
            `${this.intelligentBaseUrl}/chat`,
            request,
            { headers }
        ).pipe(
            map(response => {
                console.log('✅ Intelligent Response received:', response);
                // Remover mensaje de loading
                this.removeLoadingMessage(loadingMessage.id);

                // Crear mensaje de respuesta
                const assistantMessage: ChatMessage = {
                    id: this.generateMessageId(),
                    role: 'assistant',
                    content: response.message || 'Sin respuesta',
                    timestamp: new Date(),
                    toolUsed: response.tool_used,
                    executionTime: response.execution_time,
                    thinking_process: response.thinking_process
                };

                this.addMessage(assistantMessage);
                this.chatStateSubject.next('idle');

                return assistantMessage;
            }),
            catchError(error => {
                console.error('❌ Intelligent Error details:', {
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
    resetSession(): void {
        this.sessionId = this.generateSessionId();
        this.clearChat();
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
        return `intelligent-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
                errorMessage = 'No se puede conectar al servidor Intelligent. Verifica que el backend esté funcionando y que no haya problemas de CORS.';
            } else if (error.error?.error) {
                errorMessage = error.error.error;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.status >= 500) {
                errorMessage = 'Error interno del servidor Intelligent. El servicio podría estar temporalmente no disponible.';
            } else if (error.status === 404) {
                errorMessage = 'Endpoint Intelligent no encontrado. Verifica que el servicio esté desplegado correctamente.';
            } else if (error.status === 403 || error.status === 401) {
                errorMessage = 'No tienes permisos para acceder al servicio Intelligent.';
            }

            const intelligentError: IntelligentError = {
                error: errorMessage,
                details: {
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url,
                    originalError: error.message
                },
                timestamp: new Date().toISOString()
            };

            return throwError(() => intelligentError);
        };
    }
}
