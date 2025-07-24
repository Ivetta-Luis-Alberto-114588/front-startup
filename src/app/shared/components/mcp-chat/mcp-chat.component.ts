// src/app/shared/components/mcp-chat/mcp-chat.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { McpService } from '../../services/mcp.service';
import { SidebarService } from '../../sidebar/sidebar.service';
import { ChatMessage, ChatState } from '../../interfaces/mcp.interfaces';

@Component({
  selector: 'app-mcp-chat',
  templateUrl: './mcp-chat.component.html'
})
export class McpChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  chatState: ChatState = 'idle';
  isExpanded = false;
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  
  constructor(
    private fb: FormBuilder,
    private mcpService: McpService,
    public sidebarService: SidebarService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.maxLength(1000)]]
    });
  }
  
  ngOnInit(): void {
    this.initializeSubscriptions();
    this.checkMcpHealth();
    this.loadMcpTools();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
  
  /**
   * Inicializar suscripciones a los observables
   */
  private initializeSubscriptions(): void {
    // Suscribirse a los mensajes
    this.mcpService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      });
    
    // Suscribirse al estado del chat
    this.mcpService.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.chatState = state;
        
        // Manejar el estado disabled del FormControl
        const messageControl = this.chatForm.get('message');
        if (state === 'loading' || state === 'typing') {
          messageControl?.disable();
        } else {
          messageControl?.enable();
        }
      });
  }
  
  /**
   * Verificar el estado del servicio MCP
   */
  private checkMcpHealth(): void {
    console.log('🏥 Starting MCP health checks...');
    
    // Primero probar conexión directa
    this.mcpService.testDirectConnection()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Direct connection successful:', response);
          // Si la conexión directa funciona, probar el proxy
          this.mcpService.checkHealth()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (healthResponse) => {
                console.log('✅ Proxy connection successful:', healthResponse);
              },
              error: (proxyError) => {
                console.error('❌ Proxy connection failed:', proxyError);
              }
            });
        },
        error: (directError) => {
          console.error('❌ Direct connection failed:', directError);
          console.log('📡 Backend might be offline or unreachable');
        }
      });
  }
  
  /**
   * Cargar herramientas MCP disponibles
   */
  private loadMcpTools(): void {
    console.log('🔧 Loading MCP tools...');
    
    this.mcpService.getTools()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (toolsResponse) => {
          console.log('✅ MCP Tools loaded:', toolsResponse);
        },
        error: (error) => {
          console.error('❌ Failed to load MCP tools:', error);
        }
      });
  }
  
  /**
   * Alternar expansión del chat
   */
  toggleChat(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }
  
  /**
   * Enviar mensaje
   */
  sendMessage(): void {
    const messageContent = this.chatForm.get('message')?.value?.trim();
    
    if (!messageContent || this.chatState === 'loading' || this.chatState === 'typing') {
      return;
    }
    
    // Limpiar el formulario
    this.chatForm.reset();
    
    // Enviar mensaje
    this.mcpService.sendMessage(messageContent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Message sent successfully:', response);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      });
  }
  
  /**
   * Manejar Enter en el textarea
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  /**
   * Limpiar chat
   */
  clearChat(): void {
    this.mcpService.clearChat();
  }
  
  /**
   * Reiniciar sesión
   */
  resetSession(): void {
    this.mcpService.resetSession()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Session reset successfully');
        },
        error: (error) => {
          console.error('Error resetting session:', error);
        }
      });
  }
  
  /**
   * Scroll al final de los mensajes
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
  
  /**
   * Obtener clase CSS para el estado del chat
   */
  getChatStateClass(): string {
    switch (this.chatState) {
      case 'loading':
        return 'text-primary';
      case 'error':
        return 'text-danger';
      case 'typing':
        return 'text-info';
      default:
        return 'text-success';
    }
  }
  
  /**
   * Obtener texto del estado del chat
   */
  getChatStateText(): string {
    switch (this.chatState) {
      case 'loading':
        return 'Procesando...';
      case 'error':
        return 'Error';
      case 'typing':
        return 'Escribiendo...';
      default:
        return 'Conectado';
    }
  }
  
  /**
   * Verificar si el sidebar está colapsado
   */
  get isSidebarCollapsed(): boolean {
    let isCollapsed = false;
    this.sidebarService.isSidebarCollapsed$.subscribe(collapsed => {
      isCollapsed = collapsed;
    });
    return isCollapsed;
  }
  
  /**
   * Formatear timestamp
   */
  formatTimestamp(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Track by function para ngFor de mensajes
   */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }
  
  /**
   * Obtener sugerencias de mensajes
   */
  getSuggestions(): string[] {
    return [
      '¿Cuáles son los productos más vendidos?',
      '¿Cuántos clientes tenemos?',
      '¿Cuáles son los pedidos pendientes?',
      '¿Qué productos están en stock?'
    ];
  }
}
