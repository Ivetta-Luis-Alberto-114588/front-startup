// src/app/shared/components/mcp-chat/mcp-chat.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IntelligentService } from '../../services/intelligent.service';
import { SidebarService } from '../../sidebar/sidebar.service';
import { ChatMessage, ChatState } from '../../interfaces/intelligent.interfaces';

@Component({
  selector: 'app-mcp-chat',
  templateUrl: './mcp-chat.component.html'
})
export class McpChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // Formulario de chat
  chatForm: FormGroup;

  // Estado del chat
  chatState$ = this.intelligentService.chatState$;
  messages$ = this.intelligentService.messages$;

  // Para manejar suscripciones
  private destroy$ = new Subject<void>();

  // Estado de la UI
  isConnected = false;
  isInitialized = false;
  isLoading = false;
  errorMessage = '';
  shouldScrollToBottom = false;
  isExpanded = false; // Controla si el chat está expandido

  // Estado del sidebar
  sidebarCollapsed$ = this.sidebarService.isSidebarCollapsed$;
  isSidebarCollapsed = false;

  constructor(
    private fb: FormBuilder,
    private intelligentService: IntelligentService,
    private sidebarService: SidebarService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.initializeChat();
    this.subscribeToChat();
    this.subscribeSidebarState();
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
   * Inicializar el chat
   */
  private initializeChat(): void {
    console.log('🚀 Initializing Intelligent Chat...');
    this.checkConnection();
  }

  /**
   * Suscribirse a los cambios del chat
   */
  private subscribeToChat(): void {
    // Suscribirse a los mensajes
    this.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages: ChatMessage[]) => {
        this.shouldScrollToBottom = true;
      });

    // Suscribirse al estado del chat
    this.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: ChatState) => {
        this.isLoading = state === 'loading';
      });
  }

  /**
   * Verificar conexión con el backend
   */
  private checkConnection(): void {
    console.log('🔍 Checking Intelligent service connection...');

    this.intelligentService.checkHealth().subscribe({
      next: (response) => {
        console.log('✅ Intelligent service connected:', response);
        this.isConnected = true;
        this.isInitialized = true;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('❌ Intelligent service connection failed:', error);
        this.isConnected = false;
        this.errorMessage = error.error || 'Error al conectar con el servicio Intelligent';

        // Intentar conexión directa como fallback
        this.intelligentService.testDirectConnection().subscribe({
          next: (healthResponse) => {
            console.log('✅ Direct connection successful:', healthResponse);
            this.isConnected = true;
            this.errorMessage = '';
          },
          error: (proxyError) => {
            console.error('❌ Direct connection also failed:', proxyError);
            this.isConnected = false;
            this.errorMessage = 'No se puede conectar al servicio Intelligent. Verifica que el backend esté funcionando.';
          }
        });
      }
    });
  }

  /**
   * Enviar mensaje
   */
  sendMessage(): void {
    if (this.chatForm.invalid || this.isLoading) {
      return;
    }

    const messageContent = this.chatForm.get('message')?.value?.trim();
    if (!messageContent) {
      return;
    }

    console.log('📤 Sending message:', messageContent);

    // Limpiar el formulario
    this.chatForm.reset();

    // Enviar mensaje al servicio
    this.intelligentService.sendMessage(messageContent).subscribe({
      next: (response: ChatMessage) => {
        console.log('✅ Message sent successfully:', response);
        // El manejo de la respuesta se hace automáticamente en el servicio
      },
      error: (error) => {
        console.error('❌ Error sending message:', error);
        this.errorMessage = error.error || 'Error al enviar el mensaje';
      }
    });
  }

  /**
   * Manejar envío con Enter
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
    console.log('🧹 Clearing chat...');
    this.intelligentService.clearChat();
    this.errorMessage = '';
  }

  /**
   * Cerrar sidebar
   */
  closeSidebar(): void {
    this.sidebarService.setSidebarCollapsed(true);
  }

  /**
   * Scroll al fondo del chat
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.warn('Error scrolling to bottom:', err);
    }
  }

  /**
   * Obtener clase CSS para el mensaje
   */
  getMessageClass(message: ChatMessage): string {
    const baseClass = 'message';
    const roleClass = message.role === 'user' ? 'user' : 'assistant';
    const loadingClass = message.isLoading ? 'loading' : '';
    const errorClass = message.error ? 'error' : '';

    return `${baseClass} ${roleClass} ${loadingClass} ${errorClass}`.trim();
  }

  /**
   * Formatear timestamp
   */
  formatTimestamp(timestamp: Date): string {
    if (!timestamp) return '';

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'ahora';
    } else if (diffMins < 60) {
      return `hace ${diffMins}m`;
    } else if (diffMins < 1440) {
      const diffHours = Math.floor(diffMins / 60);
      return `hace ${diffHours}h`;
    } else {
      return messageTime.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Reiniciar conexión
   */
  reconnect(): void {
    console.log('🔄 Reconnecting to Intelligent service...');
    this.isConnected = false;
    this.errorMessage = '';
    this.checkConnection();
  }

  /**
   * Reiniciar sesión completa
   */
  resetSession(): void {
    console.log('🔄 Resetting Intelligent session...');
    this.intelligentService.resetSession();
    this.errorMessage = '';
    this.checkConnection();
  }

  /**
   * Focus en el input de mensaje
   */
  focusMessageInput(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  /**
   * Verificar si hay información adicional del mensaje
   */
  hasAdditionalInfo(message: ChatMessage): boolean {
    return !!(message.toolUsed || message.executionTime || message.thinking_process);
  }

  /**
   * Alternar información adicional del mensaje
   */
  toggleAdditionalInfo(messageId: string): void {
    console.log('Toggle additional info for message:', messageId);
  }

  /**
   * Obtener texto de herramienta utilizada
   */
  getToolUsedText(toolUsed?: string): string {
    if (!toolUsed) return '';

    const toolMap: { [key: string]: string } = {
      'products': 'Consulta de productos',
      'customers': 'Consulta de clientes',
      'orders': 'Consulta de pedidos',
      'analytics': 'Análisis de datos',
      'general': 'Información general'
    };

    return toolMap[toolUsed] || toolUsed;
  }

  /**
   * Formatear tiempo de ejecución
   */
  formatExecutionTime(executionTime?: number): string {
    if (!executionTime) return '';

    if (executionTime < 1000) {
      return `${executionTime}ms`;
    } else {
      return `${(executionTime / 1000).toFixed(2)}s`;
    }
  }

  /**
   * Suscribirse al estado del sidebar
   */
  private subscribeSidebarState(): void {
    this.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isCollapsed: boolean) => {
        this.isSidebarCollapsed = isCollapsed;
      });
  }

  /**
   * Alternar el estado expandido del chat
   */
  toggleChat(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      setTimeout(() => this.focusMessageInput(), 100);
    }
  }

  /**
   * Obtener clase CSS para el estado del chat
   */
  getChatStateClass(): string {
    const currentState = this.isLoading ? 'loading' : (this.isConnected ? 'connected' : 'disconnected');
    return `text-${currentState === 'connected' ? 'success' : currentState === 'loading' ? 'warning' : 'danger'}`;
  }

  /**
   * Obtener texto para el estado del chat
   */
  getChatStateText(): string {
    if (this.isLoading) return 'Procesando...';
    if (this.isConnected) return 'Conectado';
    return 'Desconectado';
  }

  /**
   * Track by para ngFor de mensajes
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
      'Mostrar pedidos de hoy',
      '¿Hay productos con stock bajo?',
      'Estadísticas de ventas del mes'
    ];
  }

  /**
   * Enviar sugerencia como mensaje
   */
  sendSuggestion(suggestion: string): void {
    this.chatForm.patchValue({ message: suggestion });
    this.sendMessage();
  }

  /**
   * Obtener propiedades computadas para compatibilidad con template
   */
  get messages(): ChatMessage[] {
    // Esta propiedad se mantiene para compatibilidad con el template
    // Los datos reales vienen del observable messages$
    return [];
  }

  get chatState(): ChatState {
    // Esta propiedad se mantiene para compatibilidad con el template
    // Los datos reales vienen del observable chatState$ 
    return this.isLoading ? 'loading' : (this.isConnected ? 'idle' : 'error');
  }
}
