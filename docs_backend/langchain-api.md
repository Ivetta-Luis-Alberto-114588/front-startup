# 🧠 LangChain Intelligent System API

## 📋 Resumen

Esta documentación describe el **Sistema Inteligente con LangChain** del backend de e-commerce. El sistema utiliza **Claude 3.5 Haiku** de Anthropic junto con **LangChain** para crear un asistente inteligente que puede responder preguntas sobre productos, clientes y órdenes usando lenguaje natural.

### 🔄 Última Actualización
**25 Enero 2025**: Sistema completamente funcional con 4 herramientas universales y agente inteligente.

---

## 🏗️ Arquitectura del Sistema

### **Backend LangChain + Claude**
- **Ubicación**: `src/presentation/intelligent/intelligent.assistant.ts`
- **Base URL**: `http://localhost:3000/api/intelligent`
- **Protocolo**: REST API con JSON
- **IA**: Claude 3.5 Haiku con React Agent pattern
- **Herramientas**: 4 herramientas universales dinámicas

### **Flujo de Procesamiento**
1. **Entrada**: Usuario envía mensaje en lenguaje natural
2. **Análisis**: LangChain + Claude analizan la intención
3. **Decisión**: El agente decide qué herramienta usar
4. **Ejecución**: Se ejecuta la herramienta apropiada
5. **Respuesta**: Formateo inteligente de la respuesta

---

## 🔌 Endpoints del Sistema

### **1. Health Check**
```http
GET /api/intelligent/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "Intelligent Assistant",
  "timestamp": "2025-01-25T14:00:00.000Z",
  "anthropic_configured": true,
  "agent_initialized": true,
  "tools_available": 4
}
```

### **2. Chat Inteligente Principal**
```http
POST /api/intelligent/chat
```

**Request:**
```json
{
  "message": "¿Cuál es el producto más barato?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "El producto más barato es 'Empanada de Carne' con un precio de $2.50. También tenemos otras opciones económicas como 'Empanada de Pollo' ($2.80) y 'Empanada de Verdura' ($2.30).",
  "tool_used": "search_products",
  "execution_time": 1250,
  "thinking_process": {
    "input_analysis": "Usuario busca información de precios - producto más económico",
    "tool_selected": "search_products",
    "search_strategy": "Análisis comparativo de precios"
  }
}
```

---

## 🛠️ Herramientas Disponibles

### **1. search_products**
**Descripción**: Herramienta universal para consultas de productos.

**Capacidades**:
- ✅ Precios específicos: *"precio de empanadas"*
- ✅ Consultas analíticas: *"producto más barato", "más caro"*
- ✅ Disponibilidad: *"hay pizza?", "tienes lomito?"*
- ✅ Listados: *"qué pizzas hay", "mostrar productos"*
- ✅ Búsquedas específicas: *"pizza margarita"*

**Ejemplo de uso**:
```json
{
  "message": "¿Qué pizzas tienen disponibles?"
}
```

**Response típica**:
```json
{
  "success": true,
  "message": "Tenemos las siguientes pizzas disponibles:\n\n🍕 **Pizza Margarita** - $12.50\n🍕 **Pizza Napolitana** - $14.00\n🍕 **Pizza Especial** - $16.50\n🍕 **Pizza de Jamón** - $13.80\n\nTodas nuestras pizzas están disponibles y son de tamaño familiar.",
  "tool_used": "search_products"
}
```

### **2. search_customers**
**Descripción**: Herramienta universal para consultas de clientes.

**Capacidades**:
- ✅ Conteo total: *"cuántos clientes tengo"*
- ✅ Búsqueda específica: *"cliente Juan"*
- ✅ Estadísticas: *"clientes registrados"*
- ✅ Análisis: *"nuevos clientes"*

**Ejemplo de uso**:
```json
{
  "message": "¿Cuántos clientes tengo registrados?"
}
```

**Response típica**:
```json
{
  "success": true,
  "message": "Tienes **196 clientes registrados** en total. Esto incluye tanto usuarios registrados como clientes invitados que han realizado compras anteriormente.",
  "tool_used": "search_customers"
}
```

### **3. search_orders**
**Descripción**: Herramienta universal para consultas de órdenes y pedidos.

**Capacidades**:
- ✅ Total de órdenes: *"cuántos pedidos tengo"*
- ✅ Análisis de ventas: *"total de ventas"*
- ✅ Estados: *"pedidos pendientes"*
- ✅ Estadísticas: *"promedio de venta"*

**Ejemplo de uso**:
```json
{
  "message": "¿Cómo van las ventas?"
}
```

**Response típica**:
```json
{
  "success": true,
  "message": "📊 **Resumen de Ventas:**\n\n• **Total de órdenes**: 238 pedidos\n• **Ventas totales**: $115.37\n• **Promedio por orden**: $2.31\n• **Estado**: El negocio está operativo con un flujo constante de pedidos",
  "tool_used": "search_orders"
}
```

### **4. business_analytics**
**Descripción**: Herramienta universal para análisis de negocio.

**Capacidades**:
- ✅ Resúmenes generales: *"resumen del negocio"*
- ✅ Estadísticas: *"ventas del mes"*
- ✅ Comparaciones: *"productos más vendidos"*
- ✅ Tendencias: *"cómo va el negocio"*

---

## 🔧 Integración Frontend

### **Servicio Angular Recomendado**

```typescript
// intelligent.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IntelligentChatRequest {
  message: string;
}

export interface IntelligentChatResponse {
  success: boolean;
  message: string;
  tool_used?: string;
  execution_time?: number;
  thinking_process?: {
    input_analysis: string;
    tool_selected: string;
    search_strategy: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IntelligentService {
  private baseUrl = 'http://localhost:3000/api/intelligent';

  constructor(private http: HttpClient) {}

  // Chat principal con el asistente inteligente
  chat(message: string): Observable<IntelligentChatResponse> {
    return this.http.post<IntelligentChatResponse>(`${this.baseUrl}/chat`, {
      message
    });
  }

  // Verificar estado del sistema
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }
}
```

### **Componente de Chat Básico**

```typescript
// intelligent-chat.component.ts
import { Component } from '@angular/core';
import { IntelligentService } from './intelligent.service';

@Component({
  selector: 'app-intelligent-chat',
  template: `
    <div class="chat-container">
      <div class="messages">
        <div *ngFor="let msg of messages" 
             [class]="'message ' + msg.type">
          <div class="content" [innerHTML]="msg.content"></div>
          <small *ngIf="msg.toolUsed" class="tool-info">
            🛠️ Herramienta: {{msg.toolUsed}}
          </small>
        </div>
      </div>
      
      <div class="input-area">
        <input [(ngModel)]="currentMessage" 
               (keyup.enter)="sendMessage()"
               placeholder="Pregúntame sobre productos, clientes o pedidos...">
        <button (click)="sendMessage()" [disabled]="loading">
          {{loading ? 'Pensando...' : 'Enviar'}}
        </button>
      </div>
    </div>
  `
})
export class IntelligentChatComponent {
  messages: any[] = [];
  currentMessage = '';
  loading = false;

  constructor(private intelligentService: IntelligentService) {}

  sendMessage() {
    if (!this.currentMessage.trim()) return;

    // Agregar mensaje del usuario
    this.messages.push({
      type: 'user',
      content: this.currentMessage
    });

    const userMessage = this.currentMessage;
    this.currentMessage = '';
    this.loading = true;

    // Enviar al asistente inteligente
    this.intelligentService.chat(userMessage).subscribe({
      next: (response) => {
        this.messages.push({
          type: 'assistant',
          content: this.formatResponse(response.message),
          toolUsed: response.tool_used
        });
        this.loading = false;
      },
      error: (error) => {
        this.messages.push({
          type: 'error',
          content: 'Error: No pude procesar tu consulta.'
        });
        this.loading = false;
      }
    });
  }

  private formatResponse(message: string): string {
    // Convertir markdown básico a HTML
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
```

---

## 📝 Ejemplos de Uso

### **Consultas de Productos**

```json
// Pregunta: "¿Cuál es el producto más barato?"
{
  "message": "¿Cuál es el producto más barato?",
  "response": "El producto más barato es 'Empanada de Verdura' con un precio de $2.30..."
}

// Pregunta: "¿Tienen pizza?"
{
  "message": "¿Tienen pizza?",
  "response": "Sí, tenemos varias opciones de pizza: Pizza Margarita ($12.50), Pizza Napolitana ($14.00)..."
}

// Pregunta: "Precio del lomito"
{
  "message": "Precio del lomito",
  "response": "El Lomito Completo tiene un precio de $18.50. Es uno de nuestros productos más populares..."
}
```

### **Consultas de Clientes**

```json
// Pregunta: "¿Cuántos clientes tengo?"
{
  "message": "¿Cuántos clientes tengo?",
  "response": "Tienes 196 clientes registrados en total..."
}

// Pregunta: "Buscar cliente Juan"
{
  "message": "Buscar cliente Juan",
  "response": "Encontré 3 clientes con el nombre Juan: Juan Pérez, Juan García..."
}
```

### **Consultas de Órdenes**

```json
// Pregunta: "¿Cómo van las ventas?"
{
  "message": "¿Cómo van las ventas?",
  "response": "📊 Resumen de Ventas: Total de órdenes: 238 pedidos, Ventas totales: $115.37..."
}

// Pregunta: "¿Cuántos pedidos tengo?"
{
  "message": "¿Cuántos pedidos tengo?",
  "response": "Tienes un total de 238 órdenes registradas en el sistema..."
}
```

---

## ⚙️ Configuración Técnica

### **Variables de Entorno Requeridas**

```env
# Anthropic API Key (obligatoria)
ANTHROPIC_API_KEY=tu_clave_antropic_aqui

# Configuración del modelo (opcional)
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
ANTHROPIC_TEMPERATURE=0.1
ANTHROPIC_MAX_TOKENS=1500
```

### **Dependencias NPM**

```json
{
  "dependencies": {
    "@langchain/anthropic": "^0.1.0",
    "@langchain/core": "^0.1.0",
    "langchain": "^0.1.0"
  }
}
```

### **Instalación**

```bash
npm install @langchain/anthropic @langchain/core langchain
```

---

## 🔍 Debugging y Logs

### **Logs del Sistema**

El sistema genera logs detallados para debugging:

```
[Intelligent] Agent auto-initialized successfully
[Intelligent] Universal product search: "producto más barato"
[Intelligent] Executing product analysis with strategy: price_comparison
[Intelligent] Found 45 products, analyzing prices...
[Intelligent] Response formatted successfully
```

### **Manejo de Errores**

```json
// Error de API Key
{
  "success": false,
  "error": "ANTHROPIC_API_KEY not configured",
  "fallback_mode": true
}

// Error de herramienta
{
  "success": false,
  "error": "Error buscando productos: Database connection failed",
  "tool_attempted": "search_products"
}
```

---

## 🚀 Roadmap y Mejoras

### **Próximas Características**
- [ ] Memoria de conversación persistente
- [ ] Herramientas para gestión de inventario
- [ ] Integración con reportes avanzados
- [ ] Soporte multiidioma
- [ ] Análisis predictivo de ventas

### **Optimizaciones Técnicas**
- [ ] Cache de respuestas frecuentes
- [ ] Compresión de prompts
- [ ] Paralelización de herramientas
- [ ] Métricas de performance

---

## 📞 Soporte y Contacto

Para preguntas técnicas sobre la implementación del sistema LangChain:

- **Documentación adicional**: `/docs/langchain-implementation-guide.md`
- **Ejemplos de código**: `/docs/langchain-examples.md`
- **Troubleshooting**: `/docs/langchain-troubleshooting.md`

---

*Sistema LangChain Intelligent Assistant - Última actualización: 25 Enero 2025*
