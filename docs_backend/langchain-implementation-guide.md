# 🚀 Guía de Implementación LangChain para Frontend

## 📋 Resumen

Esta guía proporciona instrucciones completas para implementar el **Sistema Inteligente LangChain** en aplicaciones frontend (Angular, React, Vue). Incluye ejemplos prácticos, mejores prácticas y patrones de diseño para integrar el asistente inteligente en tu aplicación.

---

## 🏗️ Arquitectura de Integración

### **Flujo de Comunicación**
```
Frontend App → HTTP Service → Backend LangChain → Claude AI → Database → Response
```

### **Componentes Principales**
1. **HTTP Service**: Comunicación con la API
2. **Chat Component**: Interface de usuario
3. **State Management**: Gestión del estado de conversación
4. **Error Handling**: Manejo de errores y fallbacks
5. **Loading States**: Estados de carga y feedback

---

## 🅰️ Implementación Angular

### **1. Servicio Principal**

```typescript
// services/intelligent.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  toolUsed?: string;
  executionTime?: number;
  thinking_process?: {
    input_analysis: string;
    tool_selected: string;
    search_strategy: string;
  };
}

export interface IntelligentResponse {
  success: boolean;
  message: string;
  tool_used?: string;
  execution_time?: number;
  thinking_process?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntelligentService {
  private baseUrl = `${environment.apiUrl}/api/intelligent`;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public messages$ = this.messagesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeChat();
  }

  /**
   * 🚀 Inicializar chat con mensaje de bienvenida
   */
  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      type: 'system',
      content: '¡Hola! Soy tu asistente inteligente. Puedo ayudarte con información sobre productos, clientes y pedidos. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  /**
   * 💬 Enviar mensaje al asistente inteligente
   */
  sendMessage(content: string): Observable<IntelligentResponse> {
    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: this.generateId(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);
    this.loadingSubject.next(true);

    return this.http.post<IntelligentResponse>(`${this.baseUrl}/chat`, {
      message: content
    }).pipe(
      tap(response => {
        // Agregar respuesta del asistente
        const assistantMessage: ChatMessage = {
          id: this.generateId(),
          type: response.success ? 'assistant' : 'error',
          content: response.message,
          timestamp: new Date(),
          toolUsed: response.tool_used,
          executionTime: response.execution_time,
          thinking_process: response.thinking_process
        };

        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, assistantMessage]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        // Manejo de errores
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          type: 'error',
          content: 'Lo siento, ocurrió un error. Por favor intenta nuevamente.',
          timestamp: new Date()
        };

        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, errorMessage]);
        this.loadingSubject.next(false);

        throw error;
      })
    );
  }

  /**
   * 🔍 Verificar estado del sistema
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  /**
   * 🗑️ Limpiar conversación
   */
  clearChat(): void {
    this.initializeChat();
  }

  /**
   * 🔑 Generar ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

### **2. Componente de Chat**

```typescript
// components/intelligent-chat/intelligent-chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { IntelligentService, ChatMessage } from '../../services/intelligent.service';

@Component({
  selector: 'app-intelligent-chat',
  templateUrl: './intelligent-chat.component.html',
  styleUrls: ['./intelligent-chat.component.scss']
})
export class IntelligentChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  loading = false;
  isMinimized = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private intelligentService: IntelligentService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Suscribirse a mensajes
    this.intelligentService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      });

    // Suscribirse a estado de carga
    this.intelligentService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Verificar estado del sistema
    this.checkSystemHealth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 📤 Enviar mensaje
   */
  sendMessage(): void {
    if (this.chatForm.invalid || this.loading) return;

    const message = this.chatForm.get('message')?.value?.trim();
    if (!message) return;

    this.intelligentService.sendMessage(message).subscribe({
      next: () => {
        this.chatForm.reset();
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  /**
   * ⌨️ Manejo de tecla Enter
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * 🔍 Verificar salud del sistema
   */
  private checkSystemHealth(): void {
    this.intelligentService.checkHealth().subscribe({
      next: (health) => {
        if (!health.anthropic_configured) {
          console.warn('Sistema en modo demo: API de Anthropic no configurada');
        }
      },
      error: (error) => {
        console.error('Error checking system health:', error);
      }
    });
  }

  /**
   * 📜 Scroll automático al final
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  /**
   * 🗑️ Limpiar chat
   */
  clearChat(): void {
    this.intelligentService.clearChat();
  }

  /**
   * ↕️ Minimizar/Maximizar
   */
  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }

  /**
   * 🎨 Formatear mensaje
   */
  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/📊|🍕|👥|🛒|✅|❌|⚠️|🔍|💰/g, '<span class="emoji">$&</span>');
  }
}
```

### **3. Template HTML**

```html
<!-- intelligent-chat.component.html -->
<div class="intelligent-chat" [class.minimized]="isMinimized">
  <!-- Header -->
  <div class="chat-header">
    <div class="header-content">
      <div class="title">
        <span class="icon">🧠</span>
        <h3>Asistente Inteligente</h3>
      </div>
      <div class="actions">
        <button class="btn-icon" (click)="clearChat()" title="Limpiar chat">
          🗑️
        </button>
        <button class="btn-icon" (click)="toggleMinimize()" title="Minimizar">
          {{isMinimized ? '⬆️' : '⬇️'}}
        </button>
      </div>
    </div>
  </div>

  <!-- Messages Container -->
  <div class="messages-container" #messagesContainer *ngIf="!isMinimized">
    <div class="messages">
      <div *ngFor="let message of messages; trackBy: trackByMessageId" 
           [class]="'message message-' + message.type">
        
        <!-- Avatar -->
        <div class="avatar">
          <span *ngIf="message.type === 'user'">👤</span>
          <span *ngIf="message.type === 'assistant'">🧠</span>
          <span *ngIf="message.type === 'system'">ℹ️</span>
          <span *ngIf="message.type === 'error'">❌</span>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="text" [innerHTML]="formatMessage(message.content)"></div>
          
          <!-- Tool Info -->
          <div *ngIf="message.toolUsed" class="tool-info">
            <span class="tool-label">🛠️ Herramienta:</span>
            <span class="tool-name">{{message.toolUsed}}</span>
            <span *ngIf="message.executionTime" class="execution-time">
              ({{message.executionTime}}ms)
            </span>
          </div>

          <!-- Thinking Process -->
          <div *ngIf="message.thinking_process" class="thinking-process">
            <details>
              <summary>🤔 Proceso de análisis</summary>
              <div class="thinking-content">
                <p><strong>Análisis:</strong> {{message.thinking_process.input_analysis}}</p>
                <p><strong>Herramienta:</strong> {{message.thinking_process.tool_selected}}</p>
                <p><strong>Estrategia:</strong> {{message.thinking_process.search_strategy}}</p>
              </div>
            </details>
          </div>

          <!-- Timestamp -->
          <div class="timestamp">
            {{message.timestamp | date:'HH:mm:ss'}}
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="loading" class="message message-loading">
        <div class="avatar">🧠</div>
        <div class="content">
          <div class="thinking-animation">
            <span>Pensando</span>
            <div class="dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Input Area -->
  <div class="input-area" *ngIf="!isMinimized">
    <form [formGroup]="chatForm" (ngSubmit)="sendMessage()">
      <div class="input-group">
        <textarea
          formControlName="message"
          placeholder="Pregúntame sobre productos, clientes o pedidos..."
          rows="2"
          (keypress)="onKeyPress($event)"
          [disabled]="loading"
        ></textarea>
        <button 
          type="submit" 
          class="send-button"
          [disabled]="chatForm.invalid || loading"
        >
          <span *ngIf="!loading">📤</span>
          <span *ngIf="loading" class="spinner">⏳</span>
        </button>
      </div>
    </form>
  </div>
</div>
```

### **4. Estilos SCSS**

```scss
// intelligent-chat.component.scss
.intelligent-chat {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &.minimized {
    max-height: 60px;
  }

  .chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px 12px 0 0;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 8px;

      .icon {
        font-size: 18px;
      }

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .actions {
      display: flex;
      gap: 8px;

      .btn-icon {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 6px;
        padding: 4px 8px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }

  .messages-container {
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;

    .message {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }

      .content {
        flex: 1;
        
        .text {
          background: #f5f5f5;
          padding: 10px 14px;
          border-radius: 12px;
          line-height: 1.4;
          word-wrap: break-word;

          :global(.emoji) {
            font-size: 18px;
          }
        }

        .tool-info {
          margin-top: 6px;
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;

          .tool-name {
            background: #e3f2fd;
            padding: 2px 6px;
            border-radius: 4px;
            color: #1976d2;
          }

          .execution-time {
            color: #999;
          }
        }

        .thinking-process {
          margin-top: 8px;
          
          details {
            summary {
              cursor: pointer;
              font-size: 12px;
              color: #666;
              
              &:hover {
                color: #333;
              }
            }

            .thinking-content {
              margin-top: 8px;
              padding: 8px;
              background: #f9f9f9;
              border-radius: 6px;
              font-size: 12px;
              
              p {
                margin: 4px 0;
              }
            }
          }
        }

        .timestamp {
          margin-top: 4px;
          font-size: 11px;
          color: #999;
        }
      }

      &.message-user {
        flex-direction: row-reverse;
        
        .content .text {
          background: #667eea;
          color: white;
        }
      }

      &.message-assistant {
        .avatar {
          background: #e8f5e8;
        }
      }

      &.message-system {
        .avatar {
          background: #fff3cd;
        }
        
        .content .text {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        }
      }

      &.message-error {
        .avatar {
          background: #ffebee;
        }
        
        .content .text {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }
      }

      &.message-loading {
        .thinking-animation {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-style: italic;

          .dots {
            display: flex;
            gap: 2px;
            
            span {
              width: 4px;
              height: 4px;
              background: #666;
              border-radius: 50%;
              animation: thinking 1.4s infinite;
              
              &:nth-child(2) { animation-delay: 0.2s; }
              &:nth-child(3) { animation-delay: 0.4s; }
            }
          }
        }
      }
    }
  }

  .input-area {
    padding: 16px;
    border-top: 1px solid #eee;

    .input-group {
      display: flex;
      gap: 8px;
      align-items: end;

      textarea {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px 12px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;

        &:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }

        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      }

      .send-button {
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        height: 44px;
        transition: background 0.2s;

        &:hover:not(:disabled) {
          background: #5a6fd8;
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

@keyframes thinking {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 480px) {
  .intelligent-chat {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
}
```

### **5. Módulo Angular**

```typescript
// intelligent.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { IntelligentChatComponent } from './components/intelligent-chat/intelligent-chat.component';
import { IntelligentService } from './services/intelligent.service';

@NgModule({
  declarations: [
    IntelligentChatComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    IntelligentService
  ],
  exports: [
    IntelligentChatComponent
  ]
})
export class IntelligentModule { }
```

---

## ⚛️ Implementación React

### **1. Hook Personalizado**

```typescript
// hooks/useIntelligentChat.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  toolUsed?: string;
  executionTime?: number;
}

interface UseIntelligentChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  error: string | null;
}

export const useIntelligentChat = (): UseIntelligentChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Inicializar chat
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      type: 'system',
      content: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];
  }, []);

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    // Agregar mensaje del usuario
    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);
    messagesRef.current = updatedMessages;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: data.success ? 'assistant' : 'error',
        content: data.message,
        timestamp: new Date(),
        toolUsed: data.tool_used,
        executionTime: data.execution_time
      };

      const finalMessages = [...messagesRef.current, assistantMessage];
      setMessages(finalMessages);
      messagesRef.current = finalMessages;

    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'error',
        content: 'Error de conexión. Por favor intenta nuevamente.',
        timestamp: new Date()
      };

      const finalMessages = [...messagesRef.current, errorMessage];
      setMessages(finalMessages);
      messagesRef.current = finalMessages;
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearChat = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      type: 'system',
      content: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];
    setError(null);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearChat,
    error
  };
};
```

### **2. Componiente Principal React**

```tsx
// components/IntelligentChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useIntelligentChat } from '../hooks/useIntelligentChat';
import './IntelligentChat.css';

export const IntelligentChat: React.FC = () => {
  const { messages, loading, sendMessage, clearChat, error } = useIntelligentChat();
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (content: string): string => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`intelligent-chat ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="title">
            <span className="icon">🧠</span>
            <h3>Asistente Inteligente</h3>
          </div>
          <div className="actions">
            <button 
              className="btn-icon" 
              onClick={clearChat}
              title="Limpiar chat"
            >
              🗑️
            </button>
            <button 
              className="btn-icon" 
              onClick={() => setIsMinimized(!isMinimized)}
              title="Minimizar"
            >
              {isMinimized ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="messages-container">
            <div className="messages">
              {messages.map((message) => (
                <div key={message.id} className={`message message-${message.type}`}>
                  <div className="avatar">
                    {message.type === 'user' && '👤'}
                    {message.type === 'assistant' && '🧠'}
                    {message.type === 'system' && 'ℹ️'}
                    {message.type === 'error' && '❌'}
                  </div>
                  <div className="content">
                    <div 
                      className="text"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessage(message.content) 
                      }}
                    />
                    {message.toolUsed && (
                      <div className="tool-info">
                        <span className="tool-label">🛠️ Herramienta:</span>
                        <span className="tool-name">{message.toolUsed}</span>
                        {message.executionTime && (
                          <span className="execution-time">
                            ({message.executionTime}ms)
                          </span>
                        )}
                      </div>
                    )}
                    <div className="timestamp">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message message-loading">
                  <div className="avatar">🧠</div>
                  <div className="content">
                    <div className="thinking-animation">
                      <span>Pensando</span>
                      <div className="dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="input-area">
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregúntame sobre productos, clientes o pedidos..."
                  rows={2}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="send-button"
                  disabled={!input.trim() || loading}
                >
                  {loading ? <span className="spinner">⏳</span> : '📤'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
```

---

## 🌐 Implementación Vue 3

### **1. Composable**

```typescript
// composables/useIntelligentChat.ts
import { ref, reactive, onMounted } from 'vue';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  toolUsed?: string;
  executionTime?: number;
}

export const useIntelligentChat = () => {
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      type: 'system',
      content: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    };
    messages.value = [welcomeMessage];
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading.value) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    messages.value.push(userMessage);
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/intelligent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: data.success ? 'assistant' : 'error',
        content: data.message,
        timestamp: new Date(),
        toolUsed: data.tool_used,
        executionTime: data.execution_time
      };

      messages.value.push(assistantMessage);

    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'error',
        content: 'Error de conexión. Por favor intenta nuevamente.',
        timestamp: new Date()
      };

      messages.value.push(errorMessage);
      error.value = 'Error de conexión';
    } finally {
      loading.value = false;
    }
  };

  const clearChat = () => {
    initializeChat();
    error.value = null;
  };

  onMounted(() => {
    initializeChat();
  });

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat
  };
};
```

### **2. Componente Vue**

```vue
<!-- components/IntelligentChat.vue -->
<template>
  <div class="intelligent-chat" :class="{ minimized: isMinimized }">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-content">
        <div class="title">
          <span class="icon">🧠</span>
          <h3>Asistente Inteligente</h3>
        </div>
        <div class="actions">
          <button class="btn-icon" @click="clearChat" title="Limpiar chat">
            🗑️
          </button>
          <button class="btn-icon" @click="toggleMinimize" title="Minimizar">
            {{ isMinimized ? '⬆️' : '⬇️' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="!isMinimized" class="messages-container" ref="messagesContainer">
      <div class="messages">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="`message message-${message.type}`"
        >
          <div class="avatar">
            <span v-if="message.type === 'user'">👤</span>
            <span v-else-if="message.type === 'assistant'">🧠</span>
            <span v-else-if="message.type === 'system'">ℹ️</span>
            <span v-else-if="message.type === 'error'">❌</span>
          </div>
          <div class="content">
            <div class="text" v-html="formatMessage(message.content)"></div>
            <div v-if="message.toolUsed" class="tool-info">
              <span class="tool-label">🛠️ Herramienta:</span>
              <span class="tool-name">{{ message.toolUsed }}</span>
              <span v-if="message.executionTime" class="execution-time">
                ({{ message.executionTime }}ms)
              </span>
            </div>
            <div class="timestamp">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="message message-loading">
          <div class="avatar">🧠</div>
          <div class="content">
            <div class="thinking-animation">
              <span>Pensando</span>
              <div class="dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div v-if="!isMinimized" class="input-area">
      <form @submit.prevent="handleSendMessage">
        <div class="input-group">
          <textarea
            v-model="inputMessage"
            @keypress="handleKeyPress"
            placeholder="Pregúntame sobre productos, clientes o pedidos..."
            rows="2"
            :disabled="loading"
          ></textarea>
          <button
            type="submit"
            class="send-button"
            :disabled="!inputMessage.trim() || loading"
          >
            <span v-if="loading" class="spinner">⏳</span>
            <span v-else>📤</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { useIntelligentChat } from '../composables/useIntelligentChat';

const { messages, loading, sendMessage, clearChat } = useIntelligentChat();

const inputMessage = ref('');
const isMinimized = ref(false);
const messagesContainer = ref<HTMLElement>();

const handleSendMessage = async () => {
  if (!inputMessage.value.trim()) return;
  
  const message = inputMessage.value;
  inputMessage.value = '';
  
  await sendMessage(message);
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  }
};

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
};

const formatMessage = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

// Auto scroll
watch(
  messages,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* Usar los mismos estilos del ejemplo Angular */
</style>
```

---

## 🔧 Mejores Prácticas

### **1. Gestión de Estado**
- Usar estado reactivo para mensajes y loading
- Implementar persist de conversación en localStorage
- Manejar estados de error gracefully

### **2. Performance**
- Lazy loading del componente de chat
- Debounce en input para evitar requests excesivos
- Virtualización para conversaciones largas

### **3. UX/UI**
- Scroll automático a nuevos mensajes
- Indicadores de typing y pensamiento
- Responsive design para móviles
- Accesibilidad con ARIA labels

### **4. Seguridad**
- Sanitización de HTML en mensajes
- Rate limiting en frontend
- Validación de input antes de enviar

---

## 📱 Adaptación Móvil

```scss
// Estilos móviles
@media (max-width: 768px) {
  .intelligent-chat {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100vh;
    border-radius: 0;
    
    &.minimized {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }
  }
}
```

---

## 🚀 Extensiones Avanzadas

### **1. Plugin de Sugerencias**
```typescript
const suggestions = [
  "¿Cuál es el producto más barato?",
  "¿Cuántos clientes tengo?",
  "¿Cómo van las ventas?",
  "Mostrar productos disponibles"
];
```

### **2. Historial de Conversación**
```typescript
const saveConversation = (messages: ChatMessage[]) => {
  localStorage.setItem('chat-history', JSON.stringify(messages));
};

const loadConversation = (): ChatMessage[] => {
  const saved = localStorage.getItem('chat-history');
  return saved ? JSON.parse(saved) : [];
};
```

### **3. Export de Conversación**
```typescript
const exportChat = (messages: ChatMessage[]) => {
  const text = messages
    .map(m => `[${m.timestamp.toLocaleString()}] ${m.type}: ${m.content}`)
    .join('\n');
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat-export.txt';
  a.click();
};
```

---

*Guía de Implementación LangChain - Última actualización: 25 Enero 2025*
