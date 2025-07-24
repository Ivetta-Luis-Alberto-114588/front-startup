# 🅰️ Implementación de MCP en Angular

## 📋 Resumen

Esta guía explica cómo implementar el **Model Context Protocol (MCP)** en una aplicación Angular usando módulos, servicios y componentes. El sistema MCP permite la integración con herramientas de IA y la gestión de datos del e-commerce desde el frontend.

---

## 🏗️ Arquitectura del Sistema

### **Servidor MCP**
- **Ubicación**: Backend Node.js/Express (Puerto 3000 por defecto)
- **Base URL**: `http://localhost:3000/api/mcp`
- **Protocolo**: REST API con JSON
- **Autenticación**: JWT Bearer Token (para herramientas protegidas)

### **Cliente Angular**
- **Módulos**: Separados por funcionalidad (Core, Shared, Features)
- **Servicios**: Inyección de dependencias para comunicación HTTP
- **Componentes**: UI para interactuar con herramientas MCP
- **Interceptors**: Manejo automático de headers y errores

---

## 📁 Estructura de Módulos Recomendada

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── mcp.service.ts
│   │   │   ├── anthropic.service.ts
│   │   │   └── mcp-tools.service.ts
│   │   ├── interceptors/
│   │   │   ├── mcp-auth.interceptor.ts
│   │   │   └── mcp-error.interceptor.ts
│   │   └── core.module.ts
│   ├── shared/
│   │   ├── interfaces/
│   │   │   ├── mcp.interfaces.ts
│   │   │   ├── tools.interfaces.ts
│   │   │   └── anthropic.interfaces.ts
│   │   ├── components/
│   │   │   ├── tool-executor/
│   │   │   ├── chat-interface/
│   │   │   └── search-tools/
│   │   └── shared.module.ts
│   ├── features/
│   │   ├── mcp-dashboard/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── mcp-dashboard.module.ts
│   │   ├── ai-assistant/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── ai-assistant.module.ts
│   │   └── data-tools/
│   │       ├── components/
│   │       ├── services/
│   │       └── data-tools.module.ts
│   └── app.module.ts
```

---

## 🔌 Endpoints del Servidor MCP

### **1. Health Check**
```http
GET /api/mcp/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "MCP Service",
  "timestamp": "2025-07-23T14:00:00.000Z",
  "anthropic_configured": true
}
```

### **2. Listar Modelos de IA**
```http
GET /api/mcp/models
```

**Response:**
```json
{
  "status": "OK",
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "name": "Claude 3.5 Sonnet",
      "type": "text",
      "max_tokens": 4096
    }
  ]
}
```

### **3. Listar Herramientas Disponibles**
```http
GET /api/mcp/tools/info
```

**Response:**
```json
{
  "status": "OK",
  "service": "MCP Tools Info",
  "timestamp": "2025-07-23T14:00:00.000Z",
  "tools": [
    {
      "name": "get_products",
      "description": "Obtiene la lista de productos con opciones de filtrado",
      "inputSchema": {
        "type": "object",
        "properties": {
          "search": { "type": "string", "description": "Término de búsqueda" },
          "categoryId": { "type": "string" },
          "minPrice": { "type": "number" },
          "maxPrice": { "type": "number" },
          "page": { "type": "number", "default": 1 },
          "limit": { "type": "number", "default": 10 }
        }
      }
    },
    {
      "name": "get_customers",
      "description": "Obtiene la lista de clientes con opciones de búsqueda",
      "inputSchema": {
        "type": "object",
        "properties": {
          "search": { "type": "string", "description": "Buscar por nombre, email o teléfono" },
          "neighborhoodId": { "type": "string" },
          "page": { "type": "number", "default": 1 },
          "limit": { "type": "number", "default": 10 }
        }
      }
    },
    {
      "name": "get_orders",
      "description": "Obtiene la lista de pedidos con filtros",
      "inputSchema": {
        "type": "object",
        "properties": {
          "customerId": { "type": "string" },
          "status": { "type": "string" },
          "dateFrom": { "type": "string", "format": "date" },
          "dateTo": { "type": "string", "format": "date" },
          "page": { "type": "number", "default": 1 },
          "limit": { "type": "number", "default": 10 }
        }
      }
    },
    {
      "name": "get_product_by_id",
      "description": "Obtiene un producto específico por ID",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "required": true }
        }
      }
    }
  ]
}
```

### **4. Ejecutar Herramienta MCP**
```http
POST /api/mcp/tools/call
```

**Request Body:**
```json
{
  "toolName": "get_products",
  "args": {
    "search": "lomito",
    "page": 1,
    "limit": 5
  }
}
```

**Response:**
```json
{
  "status": "OK",
  "service": "MCP Tool Call",
  "timestamp": "2025-07-23T14:00:00.000Z",
  "toolName": "get_products",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"total\": 3, \"page\": 1, \"limit\": 5, \"products\": [...]}"
      }
    ]
  }
}
```

### **5. Proxy Anthropic (Chat IA)**
```http
POST /api/mcp/anthropic
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Busca productos de lomito y muéstrame los resultados"
    }
  ],
  "tools": [
    {
      "name": "get_products",
      "description": "Buscar productos",
      "input_schema": {
        "type": "object",
        "properties": {
          "search": { "type": "string" }
        }
      }
    }
  ]
}
```

**Response:**
```json
{
  "id": "msg_abc123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Te ayudo a buscar productos de lomito."
    },
    {
      "type": "tool_use",
      "id": "tool_xyz789",
      "name": "get_products",
      "input": {
        "search": "lomito"
      }
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 345,
    "output_tokens": 123
  }
}
```

---

## 🛠️ Interfaces TypeScript Recomendadas

### **Interfaces Base MCP**
```typescript
// mcp.interfaces.ts

export interface MCPResponse<T = any> {
  status: string;
  service?: string;
  timestamp: string;
  data?: T;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  toolName: string;
  args: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: any;
  }>;
}
```

### **Interfaces de Herramientas**
```typescript
// tools.interfaces.ts

export interface ProductSearchArgs {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CustomerSearchArgs {
  search?: string;
  neighborhoodId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderSearchArgs {
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceWithTax: number;
  stock: number;
  category: string;
  unit: string;
  tags: string[];
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  isActive: boolean;
}
```

### **Interfaces Anthropic**
```typescript
// anthropic.interfaces.ts

export interface AnthropicModel {
  id: string;
  name: string;
  type: string;
  max_tokens: number;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    id?: string;
    name?: string;
    input?: any;
    content?: any;
  }>;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  tools?: Array<{
    name: string;
    description: string;
    input_schema: any;
  }>;
  temperature?: number;
  top_p?: number;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: any;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

---

## 🔧 Servicios Angular Principales

### **1. Core MCP Service**
```typescript
// core/services/mcp.service.ts

@Injectable({
  providedIn: 'root'
})
export class McpService {
  private readonly baseUrl = environment.mcpApiUrl; // http://localhost:3000/api/mcp

  constructor(private http: HttpClient) {}

  // Health check del servidor MCP
  checkHealth(): Observable<MCPResponse> {
    return this.http.get<MCPResponse>(`${this.baseUrl}/health`);
  }

  // Listar modelos disponibles
  getModels(): Observable<MCPResponse<AnthropicModel[]>> {
    return this.http.get<MCPResponse<AnthropicModel[]>>(`${this.baseUrl}/models`);
  }

  // Obtener información de herramientas
  getToolsInfo(): Observable<MCPResponse<{ tools: MCPTool[] }>> {
    return this.http.get<MCPResponse<{ tools: MCPTool[] }>>(`${this.baseUrl}/tools/info`);
  }

  // Ejecutar herramienta MCP
  callTool(toolCall: MCPToolCall): Observable<MCPResponse<MCPToolResult>> {
    return this.http.post<MCPResponse<MCPToolResult>>(
      `${this.baseUrl}/tools/call`,
      toolCall
    );
  }

  // Proxy para Anthropic
  chatWithAnthropic(request: AnthropicRequest): Observable<AnthropicResponse> {
    return this.http.post<AnthropicResponse>(`${this.baseUrl}/anthropic`, request);
  }
}
```

### **2. Tools Service**
```typescript
// core/services/mcp-tools.service.ts

@Injectable({
  providedIn: 'root'
})
export class McpToolsService {
  constructor(private mcpService: McpService) {}

  // Buscar productos
  searchProducts(args: ProductSearchArgs): Observable<Product[]> {
    const toolCall: MCPToolCall = {
      toolName: 'get_products',
      args
    };

    return this.mcpService.callTool(toolCall).pipe(
      map(response => {
        const content = response.result?.content?.[0];
        if (content?.type === 'text' && content.text) {
          const data = JSON.parse(content.text);
          return data.products || [];
        }
        return [];
      })
    );
  }

  // Buscar clientes
  searchCustomers(args: CustomerSearchArgs): Observable<Customer[]> {
    const toolCall: MCPToolCall = {
      toolName: 'get_customers',
      args
    };

    return this.mcpService.callTool(toolCall).pipe(
      map(response => {
        const content = response.result?.content?.[0];
        if (content?.type === 'text' && content.text) {
          const data = JSON.parse(content.text);
          return data.customers || [];
        }
        return [];
      })
    );
  }

  // Obtener producto por ID
  getProductById(id: string): Observable<Product | null> {
    const toolCall: MCPToolCall = {
      toolName: 'get_product_by_id',
      args: { id }
    };

    return this.mcpService.callTool(toolCall).pipe(
      map(response => {
        const content = response.result?.content?.[0];
        if (content?.type === 'text' && content.text) {
          return JSON.parse(content.text);
        }
        return null;
      })
    );
  }

  // Buscar pedidos
  searchOrders(args: OrderSearchArgs): Observable<any[]> {
    const toolCall: MCPToolCall = {
      toolName: 'get_orders',
      args
    };

    return this.mcpService.callTool(toolCall).pipe(
      map(response => {
        const content = response.result?.content?.[0];
        if (content?.type === 'text' && content.text) {
          const data = JSON.parse(content.text);
          return data.orders || [];
        }
        return [];
      })
    );
  }
}
```

### **3. AI Assistant Service**
```typescript
// features/ai-assistant/services/ai-assistant.service.ts

@Injectable()
export class AiAssistantService {
  private conversationHistory: AnthropicMessage[] = [];

  constructor(
    private mcpService: McpService,
    private mcpToolsService: McpToolsService
  ) {}

  // Enviar mensaje al asistente
  async sendMessage(userMessage: string): Promise<string> {
    // Agregar mensaje del usuario al historial
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Obtener herramientas disponibles
    const toolsInfo = await this.mcpService.getToolsInfo().toPromise();
    const tools = toolsInfo?.data?.tools?.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    })) || [];

    // Crear request para Anthropic
    const request: AnthropicRequest = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: this.conversationHistory,
      tools
    };

    try {
      const response = await this.mcpService.chatWithAnthropic(request).toPromise();
      
      if (response?.content) {
        let assistantResponse = '';
        
        for (const content of response.content) {
          if (content.type === 'text' && content.text) {
            assistantResponse += content.text;
          } else if (content.type === 'tool_use') {
            // Ejecutar herramienta solicitada por la IA
            const toolResult = await this.executeToolFromAI(content);
            assistantResponse += `\n\n**Resultados de ${content.name}:**\n${toolResult}`;
          }
        }

        // Agregar respuesta al historial
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantResponse
        });

        return assistantResponse;
      }
    } catch (error) {
      console.error('Error al comunicarse con la IA:', error);
      return 'Lo siento, hubo un error al procesar tu mensaje.';
    }

    return 'No se pudo obtener respuesta de la IA.';
  }

  // Ejecutar herramienta solicitada por la IA
  private async executeToolFromAI(toolUse: any): Promise<string> {
    try {
      const toolCall: MCPToolCall = {
        toolName: toolUse.name,
        args: toolUse.input
      };

      const result = await this.mcpService.callTool(toolCall).toPromise();
      const content = result?.result?.content?.[0];
      
      if (content?.type === 'text' && content.text) {
        return content.text;
      }
    } catch (error) {
      console.error(`Error ejecutando herramienta ${toolUse.name}:`, error);
    }
    
    return 'Error al ejecutar la herramienta solicitada.';
  }

  // Limpiar historial de conversación
  clearConversation(): void {
    this.conversationHistory = [];
  }
}
```

---

## 🔧 Interceptors para Manejo Automático

### **Auth Interceptor**
```typescript
// core/interceptors/mcp-auth.interceptor.ts

@Injectable()
export class McpAuthInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo aplicar a requests del MCP
    if (req.url.includes('/api/mcp')) {
      const token = this.authService.getToken();
      
      if (token) {
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next.handle(authReq);
      }
    }
    
    return next.handle(req);
  }
}
```

### **Error Interceptor**
```typescript
// core/interceptors/mcp-error.interceptor.ts

@Injectable()
export class McpErrorInterceptor implements HttpInterceptor {
  
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (req.url.includes('/api/mcp')) {
          let errorMessage = 'Error en el servicio MCP';
          
          if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.status === 401) {
            errorMessage = 'No autorizado para usar MCP';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor MCP';
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
        }
        
        return throwError(() => error);
      })
    );
  }
}
```

---

## 🎯 Casos de Uso Comunes

### **1. Buscador de Productos con IA**
- **Componente**: `ProductSearchComponent`
- **Funcionalidad**: Input de texto natural que la IA convierte en búsqueda estructurada
- **Herramienta MCP**: `get_products`
- **Flujo**: Usuario escribe → IA interpreta → Ejecuta búsqueda → Muestra resultados

### **2. Asistente de Ventas**
- **Componente**: `SalesAssistantComponent`
- **Funcionalidad**: Chat que puede consultar clientes, productos y pedidos
- **Herramientas MCP**: `get_customers`, `get_products`, `get_orders`
- **Flujo**: Chat → IA decide herramientas → Ejecuta múltiples consultas → Respuesta inteligente

### **3. Dashboard de Datos**
- **Componente**: `McpDashboardComponent`
- **Funcionalidad**: Visualización de datos usando herramientas MCP
- **Herramientas MCP**: Todas las disponibles
- **Flujo**: Carga componente → Lista herramientas → Ejecuta consultas → Muestra métricas

### **4. Búsqueda Unificada**
- **Componente**: `UniversalSearchComponent`
- **Funcionalidad**: Busca en productos, clientes y pedidos simultáneamente
- **Herramientas MCP**: `get_products`, `get_customers`, `get_orders`
- **Flujo**: Término búsqueda → Ejecuta en paralelo → Combina resultados

---

## 📦 Configuración de Módulos

### **Core Module**
```typescript
// core/core.module.ts

@NgModule({
  providers: [
    McpService,
    McpToolsService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: McpAuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: McpErrorInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once.');
    }
  }
}
```

### **Shared Module**
```typescript
// shared/shared.module.ts

@NgModule({
  declarations: [
    ToolExecutorComponent,
    ChatInterfaceComponent,
    SearchToolsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  exports: [
    ToolExecutorComponent,
    ChatInterfaceComponent,
    SearchToolsComponent
  ]
})
export class SharedModule {}
```

### **Feature Module**
```typescript
// features/mcp-dashboard/mcp-dashboard.module.ts

@NgModule({
  declarations: [
    McpDashboardComponent,
    ToolListComponent,
    ToolExecutorComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    McpDashboardRoutingModule
  ],
  providers: [
    AiAssistantService
  ]
})
export class McpDashboardModule {}
```

---

## 🚀 Consideraciones de Implementación

### **Performance**
- **Caché**: Implementar caché para herramientas y modelos
- **Lazy Loading**: Cargar módulos MCP bajo demanda
- **Debounce**: Para búsquedas en tiempo real
- **Paginación**: Manejar grandes sets de datos

### **Seguridad**
- **Tokens JWT**: Para autenticación en herramientas protegidas
- **Validación**: Validar inputs antes de enviar a MCP
- **Rate Limiting**: Controlar frecuencia de llamadas
- **Error Handling**: Manejo robusto de errores

### **UX/UI**
- **Loading States**: Indicadores de carga para llamadas MCP
- **Error Messages**: Mensajes claros de error
- **Responsive**: Diseño adaptable para móviles
- **Accessibility**: Cumplir estándares WCAG

### **Testing**
- **Unit Tests**: Servicios y componentes individuales
- **Integration Tests**: Flujos completos con MCP
- **Mocking**: Simular respuestas del servidor MCP
- **E2E Tests**: Casos de uso completos

---

## 🔧 Variables de Entorno

### **environment.ts**
```typescript
export const environment = {
  production: false,
  mcpApiUrl: 'http://localhost:3000/api/mcp',
  anthropicModels: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022'
  ],
  mcpTimeout: 30000, // 30 segundos
  cacheTimeout: 300000 // 5 minutos
};
```

### **environment.prod.ts**
```typescript
export const environment = {
  production: true,
  mcpApiUrl: 'https://yourdomain.com/api/mcp',
  anthropicModels: [
    'claude-3-5-sonnet-20241022'
  ],
  mcpTimeout: 15000, // 15 segundos
  cacheTimeout: 600000 // 10 minutos
};
```

---

## 📝 Conclusión

Esta implementación proporciona una base sólida para integrar MCP en Angular, permitiendo:

- **Modularidad**: Separación clara de responsabilidades
- **Escalabilidad**: Fácil adición de nuevas herramientas
- **Mantenibilidad**: Código organizado y testeable
- **Flexibilidad**: Adaptable a diferentes casos de uso
- **Performance**: Optimizado para aplicaciones de producción

El sistema está diseñado para crecer junto con las necesidades del proyecto, facilitando la integración de nuevas funcionalidades de IA y herramientas de datos.
