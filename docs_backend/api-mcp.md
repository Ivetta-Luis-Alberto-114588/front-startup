# 🌐 Model Context Protocol (MCP)

Sistema de integración con herramientas de IA y LLMs usando el protocolo MCP para extender las capacidades del chatbot con herramientas externas.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [🔧 Herramientas Disponibles](#-herramientas-disponibles)
- [🔌 Integración con LLMs](#-integración-con-llms)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Protocolo MCP
- **Servidor MCP** compatible con el estándar
- **Herramientas personalizadas** para e-commerce
- **Integración con LLMs** (Claude, GPT, etc.)
- **Ejecución segura** de herramientas
- **Logging detallado** de operaciones

### ✅ Herramientas E-commerce
- **Búsqueda de productos** con filtros avanzados
- **Gestión de carrito** (agregar, quitar, consultar)
- **Consulta de pedidos** y estados
- **Información de clientes** y direcciones
- **Aplicación de cupones** y descuentos
- **Consulta de inventario** y disponibilidad

### ✅ Capacidades del Sistema
- **Validación de parámetros** automática
- **Manejo de errores** robusto
- **Rate limiting** por herramienta
- **Autenticación** y autorización
- **Monitoreo de uso** y métricas

## 📋 API Endpoints

### Servidor MCP

#### Obtener Lista de Herramientas
```http
POST /mcp/tools/list
Content-Type: application/json

{
  "method": "tools/list",
  "params": {}
}
```

**Respuesta Exitosa (200):**
```json
{
  "tools": [
    {
      "name": "search_products",
      "description": "Buscar productos en el catálogo",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Término de búsqueda"
          },
          "category": {
            "type": "string",
            "description": "Categoría específica"
          },
          "minPrice": {
            "type": "number",
            "description": "Precio mínimo"
          },
          "maxPrice": {
            "type": "number",
            "description": "Precio máximo"
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "add_to_cart",
      "description": "Agregar producto al carrito",
      "inputSchema": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "string",
            "description": "ID del producto"
          },
          "quantity": {
            "type": "number",
            "description": "Cantidad a agregar",
            "minimum": 1
          },
          "userId": {
            "type": "string",
            "description": "ID del usuario"
          }
        },
        "required": ["productId", "quantity", "userId"]
      }
    }
  ]
}
```

#### Ejecutar Herramienta
```http
POST /mcp/tools/call
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "name": "search_products",
    "arguments": {
      "query": "laptop gaming",
      "category": "electronics",
      "minPrice": 500,
      "maxPrice": 2000
    }
  }
}
```

**Respuesta Exitosa (200):**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Encontré 5 laptops gaming en el rango de precio especificado:\n\n1. **ASUS ROG Strix G15** - $1,299\n   - AMD Ryzen 7, RTX 3060, 16GB RAM\n   - Disponible: 8 unidades\n\n2. **MSI Katana GF66** - $1,099\n   - Intel Core i7, RTX 3050 Ti, 16GB RAM\n   - Disponible: 12 unidades\n\n3. **Acer Nitro 5** - $899\n   - AMD Ryzen 5, RTX 3060, 8GB RAM\n   - Disponible: 15 unidades\n\n¿Te interesa información detallada sobre alguno de estos modelos?"
    }
  ],
  "isError": false
}
```

### Integración con Chatbot

#### Chat con Herramientas MCP
```http
POST /api/chat/mcp-message
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "message": "Busca laptops para gaming con precio entre $800 y $1500",
  "sessionId": "sess_64a7f8c9b123456789abcdef",
  "enableTools": true
}
```

**Respuesta Exitosa (200):**
```json
{
  "sessionId": "sess_64a7f8c9b123456789abcdef",
  "messageId": "msg_64a7f8c9b123456789abcdef",
  "response": {
    "text": "He encontrado varios laptops gaming en tu rango de precio. Déjame buscar las mejores opciones disponibles...",
    "toolCalls": [
      {
        "toolName": "search_products",
        "arguments": {
          "query": "laptop gaming",
          "category": "electronics",
          "minPrice": 800,
          "maxPrice": 1500
        },
        "result": "Encontré 5 laptops gaming...",
        "executionTime": "245ms"
      }
    ],
    "finalResponse": "Basándome en tu búsqueda, aquí tienes las mejores opciones de laptops gaming en tu presupuesto...",
    "suggestedActions": [
      "Ver detalles del ASUS ROG Strix",
      "Comparar especificaciones",
      "Agregar al carrito"
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Herramientas Disponibles

### Búsqueda y Productos

#### search_products
Busca productos en el catálogo con filtros avanzados.

**Parámetros:**
- `query` (string, requerido): Término de búsqueda
- `category` (string, opcional): Categoría específica
- `minPrice` (number, opcional): Precio mínimo
- `maxPrice` (number, opcional): Precio máximo
- `tags` (array, opcional): Tags específicos
- `inStock` (boolean, opcional): Solo productos en stock

**Ejemplo de uso:**
```json
{
  "name": "search_products",
  "arguments": {
    "query": "smartphone",
    "category": "electronics",
    "minPrice": 300,
    "maxPrice": 800,
    "inStock": true
  }
}
```

#### get_product_details
Obtiene información detallada de un producto específico.

**Parámetros:**
- `productId` (string, requerido): ID del producto

#### check_product_availability
Verifica disponibilidad y stock de un producto.

**Parámetros:**
- `productId` (string, requerido): ID del producto
- `quantity` (number, opcional): Cantidad deseada

### Gestión de Carrito

#### add_to_cart
Agrega un producto al carrito del usuario.

**Parámetros:**
- `productId` (string, requerido): ID del producto
- `quantity` (number, requerido): Cantidad a agregar
- `userId` (string, requerido): ID del usuario

#### remove_from_cart
Remueve un producto del carrito.

**Parámetros:**
- `productId` (string, requerido): ID del producto
- `userId` (string, requerido): ID del usuario

#### get_cart_contents
Obtiene el contenido actual del carrito.

**Parámetros:**
- `userId` (string, requerido): ID del usuario

#### apply_coupon
Aplica un cupón de descuento al carrito.

**Parámetros:**
- `couponCode` (string, requerido): Código del cupón
- `userId` (string, requerido): ID del usuario

### Gestión de Pedidos

#### get_order_status
Consulta el estado de un pedido.

**Parámetros:**
- `orderId` (string, requerido): ID del pedido
- `userId` (string, requerido): ID del usuario

#### get_user_orders
Obtiene el historial de pedidos de un usuario.

**Parámetros:**
- `userId` (string, requerido): ID del usuario
- `limit` (number, opcional): Número máximo de pedidos
- `status` (string, opcional): Filtrar por estado

#### create_order
Crea un nuevo pedido a partir del carrito actual.

**Parámetros:**
- `userId` (string, requerido): ID del usuario
- `shippingAddressId` (string, requerido): ID de la dirección de envío
- `paymentMethodId` (string, requerido): ID del método de pago

### Información del Cliente

#### get_customer_info
Obtiene información del perfil del cliente.

**Parámetros:**
- `userId` (string, requerido): ID del usuario

#### get_customer_addresses
Obtiene las direcciones de envío del cliente.

**Parámetros:**
- `customerId` (string, requerido): ID del cliente

#### update_customer_info
Actualiza información del cliente.

**Parámetros:**
- `customerId` (string, requerido): ID del cliente
- `updateData` (object, requerido): Datos a actualizar

## 🔌 Integración con LLMs

### Configuración del Servidor MCP

```typescript
// src/infrastructure/adapters/mcp-server.adapter.ts
export class MCPServerAdapter {
  private tools: Map<string, MCPTool> = new Map();
  private logger = getLogger('MCPServer');

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository
  ) {
    this.registerTools();
  }

  private registerTools(): void {
    // Registrar herramienta de búsqueda de productos
    this.tools.set('search_products', {
      name: 'search_products',
      description: 'Buscar productos en el catálogo',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Término de búsqueda' },
          category: { type: 'string', description: 'Categoría específica' },
          minPrice: { type: 'number', description: 'Precio mínimo' },
          maxPrice: { type: 'number', description: 'Precio máximo' },
          tags: { type: 'array', items: { type: 'string' } },
          inStock: { type: 'boolean', description: 'Solo productos en stock' }
        },
        required: ['query']
      },
      handler: this.searchProducts.bind(this)
    });

    // Registrar herramienta de carrito
    this.tools.set('add_to_cart', {
      name: 'add_to_cart',
      description: 'Agregar producto al carrito',
      inputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'ID del producto' },
          quantity: { type: 'number', minimum: 1, description: 'Cantidad' },
          userId: { type: 'string', description: 'ID del usuario' }
        },
        required: ['productId', 'quantity', 'userId']
      },
      handler: this.addToCart.bind(this)
    });

    // ... más herramientas
  }

  async listTools(): Promise<MCPToolsListResponse> {
    const toolsList = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    return { tools: toolsList };
  }

  async callTool(name: string, arguments_: any): Promise<MCPToolCallResponse> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return {
        content: [{
          type: 'text',
          text: `Error: Herramienta '${name}' no encontrada`
        }],
        isError: true
      };
    }

    try {
      // Validar argumentos usando JSON Schema
      const validation = this.validateArguments(tool.inputSchema, arguments_);
      if (!validation.valid) {
        return {
          content: [{
            type: 'text',
            text: `Error de validación: ${validation.errors.join(', ')}`
          }],
          isError: true
        };
      }

      // Ejecutar herramienta
      const startTime = Date.now();
      const result = await tool.handler(arguments_);
      const executionTime = Date.now() - startTime;

      this.logger.info(`Tool ${name} executed in ${executionTime}ms`);

      return {
        content: [{
          type: 'text',
          text: result
        }],
        isError: false,
        metadata: {
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Error executing tool ${name}:`, error);
      
      return {
        content: [{
          type: 'text',
          text: `Error interno al ejecutar la herramienta: ${error.message}`
        }],
        isError: true
      };
    }
  }

  private async searchProducts(args: any): Promise<string> {
    const { query, category, minPrice, maxPrice, tags, inStock } = args;
    
    const filters: any = {};
    if (category) filters.categoryId = category;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (tags && tags.length > 0) filters.tags = tags;
    if (inStock) filters.inStock = true;

    const products = await this.productRepository.search(query, filters, {
      limit: 10,
      page: 1
    });

    if (products.items.length === 0) {
      return `No se encontraron productos para la búsqueda "${query}"`;
    }

    let response = `Encontré ${products.total} productos para "${query}":\n\n`;
    
    products.items.forEach((product, index) => {
      response += `${index + 1}. **${product.name}** - $${product.price}\n`;
      if (product.description) {
        response += `   ${product.description.substring(0, 100)}\n`;
      }
      response += `   Stock: ${product.stock || 'No especificado'}\n`;
      response += `   ID: ${product.id}\n\n`;
    });

    response += `¿Te interesa información detallada sobre algún producto?`;
    
    return response;
  }

  private async addToCart(args: any): Promise<string> {
    const { productId, quantity, userId } = args;

    // Verificar que el producto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return `Error: Producto con ID ${productId} no encontrado`;
    }

    // Verificar stock
    if (product.stock !== undefined && product.stock < quantity) {
      return `Error: Stock insuficiente. Disponible: ${product.stock}, solicitado: ${quantity}`;
    }

    // Agregar al carrito
    await this.cartRepository.addItem(userId, {
      productId,
      quantity,
      price: product.price
    });

    return `✅ ${product.name} agregado al carrito (cantidad: ${quantity}).\nPrecio unitario: $${product.price}\nSubtotal: $${product.price * quantity}`;
  }

  private validateArguments(schema: any, args: any): { valid: boolean; errors: string[] } {
    // Implementar validación JSON Schema
    // Esta es una versión simplificada
    const errors: string[] = [];
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in args)) {
          errors.push(`Campo requerido '${field}' faltante`);
        }
      }
    }

    // Validaciones adicionales según el schema...

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### Use Case para Chat con MCP

```typescript
// src/domain/use-cases/chat/mcp-chat.use-case.ts
export class MCPChatUseCase {
  constructor(
    private readonly mcpServer: MCPServerAdapter,
    private readonly llmService: LLMService,
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(request: MCPChatRequest): Promise<MCPChatResponse> {
    const { message, sessionId, enableTools = true } = request;

    // 1. Analizar el mensaje para identificar intenciones de herramientas
    const toolAnalysis = await this.analyzeToolIntent(message);
    
    let toolResults: ToolCallResult[] = [];
    let contextualInfo = '';

    // 2. Ejecutar herramientas si se detectaron intenciones
    if (enableTools && toolAnalysis.suggestedTools.length > 0) {
      toolResults = await this.executeTools(toolAnalysis.suggestedTools);
      contextualInfo = toolResults.map(r => r.result).join('\n\n');
    }

    // 3. Generar respuesta considerando los resultados de las herramientas
    const prompt = this.buildMCPPrompt(message, contextualInfo, toolResults);
    const llmResponse = await this.llmService.generateResponse(prompt);

    // 4. Guardar conversación
    await this.chatRepository.saveMessage({
      sessionId,
      type: 'user',
      content: message
    });

    await this.chatRepository.saveMessage({
      sessionId,
      type: 'assistant',
      content: llmResponse.text,
      metadata: {
        toolCalls: toolResults,
        mcpEnabled: enableTools
      }
    });

    return {
      sessionId,
      messageId: generateId(),
      response: {
        text: llmResponse.text,
        toolCalls: toolResults,
        finalResponse: llmResponse.text,
        suggestedActions: this.generateSuggestedActions(toolResults)
      },
      timestamp: new Date().toISOString()
    };
  }

  private async analyzeToolIntent(message: string): Promise<ToolAnalysis> {
    // Patrones para detectar intenciones de herramientas
    const patterns = [
      {
        pattern: /buscar|busca|encuentra|mostrar|ver/i,
        tool: 'search_products',
        extractors: {
          query: /buscar|busca (.+?)(?:\s|$)/i,
          category: /categoría|categoria (.+?)(?:\s|$)/i,
          price: /precio (.+?)(?:\s|$)/i
        }
      },
      {
        pattern: /agregar|añadir|comprar|carrito/i,
        tool: 'add_to_cart',
        extractors: {
          product: /agregar|añadir (.+?) al carrito/i,
          quantity: /cantidad (\d+)/i
        }
      },
      {
        pattern: /pedido|orden|estado/i,
        tool: 'get_order_status',
        extractors: {
          orderId: /pedido #?([A-Z0-9-]+)/i
        }
      }
    ];

    const suggestedTools: ToolSuggestion[] = [];

    for (const { pattern, tool, extractors } of patterns) {
      if (pattern.test(message)) {
        const arguments_: any = {};
        
        for (const [key, extractor] of Object.entries(extractors)) {
          const match = message.match(extractor);
          if (match) {
            arguments_[key] = match[1];
          }
        }

        suggestedTools.push({ tool, arguments: arguments_ });
      }
    }

    return {
      intent: this.classifyIntent(message),
      confidence: 0.8, // Simplificado
      suggestedTools
    };
  }

  private async executeTools(suggestions: ToolSuggestion[]): Promise<ToolCallResult[]> {
    const results: ToolCallResult[] = [];

    for (const suggestion of suggestions) {
      try {
        const result = await this.mcpServer.callTool(
          suggestion.tool,
          suggestion.arguments
        );

        results.push({
          toolName: suggestion.tool,
          arguments: suggestion.arguments,
          result: result.content[0].text,
          isError: result.isError,
          executionTime: result.metadata?.executionTime || '0ms'
        });
      } catch (error) {
        results.push({
          toolName: suggestion.tool,
          arguments: suggestion.arguments,
          result: `Error ejecutando herramienta: ${error.message}`,
          isError: true,
          executionTime: '0ms'
        });
      }
    }

    return results;
  }

  private buildMCPPrompt(
    userMessage: string,
    toolResults: string,
    toolCalls: ToolCallResult[]
  ): string {
    let prompt = `
Eres un asistente virtual especializado en e-commerce. 

MENSAJE DEL USUARIO: ${userMessage}

`;

    if (toolResults) {
      prompt += `
INFORMACIÓN OBTENIDA DE HERRAMIENTAS:
${toolResults}

`;
    }

    prompt += `
INSTRUCCIONES:
- Responde de manera útil basándote en la información disponible
- Si usaste herramientas, integra esa información naturalmente en tu respuesta
- Ofrece acciones concretas que el usuario puede tomar
- Mantén un tono amigable y profesional
- Si hay errores en las herramientas, explícalos de manera comprensible

RESPUESTA:`;

    return prompt;
  }

  private generateSuggestedActions(toolResults: ToolCallResult[]): string[] {
    const actions: string[] = [];

    for (const result of toolResults) {
      switch (result.toolName) {
        case 'search_products':
          if (!result.isError) {
            actions.push('Ver detalles de un producto');
            actions.push('Agregar producto al carrito');
            actions.push('Comparar productos');
          }
          break;
        case 'add_to_cart':
          if (!result.isError) {
            actions.push('Ver carrito completo');
            actions.push('Proceder al checkout');
            actions.push('Continuar comprando');
          }
          break;
        case 'get_order_status':
          if (!result.isError) {
            actions.push('Ver detalles del pedido');
            actions.push('Rastrear envío');
            actions.push('Contactar soporte');
          }
          break;
      }
    }

    return actions;
  }
}
```

## 💡 Ejemplos de Uso

### Integración con Claude Desktop

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "startup-ecommerce": {
      "command": "node",
      "args": ["/path/to/your/mcp-server.js"],
      "env": {
        "NODE_ENV": "production",
        "MONGO_URL": "mongodb://localhost:27017/startup-ecommerce"
      }
    }
  }
}
```

### Cliente JavaScript para MCP

```javascript
// mcp-client.js
class MCPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async listTools() {
    const response = await fetch(`${this.baseUrl}/mcp/tools/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/list',
        params: {}
      })
    });

    return response.json();
  }

  async callTool(name, arguments_) {
    const response = await fetch(`${this.baseUrl}/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name,
          arguments: arguments_
        }
      })
    });

    return response.json();
  }

  // Ejemplo de uso específico
  async searchProducts(query, filters = {}) {
    return this.callTool('search_products', {
      query,
      ...filters
    });
  }

  async addToCart(productId, quantity, userId) {
    return this.callTool('add_to_cart', {
      productId,
      quantity,
      userId
    });
  }
}

// Uso del cliente
const mcpClient = new MCPClient('http://localhost:3000');

// Buscar productos
const searchResult = await mcpClient.searchProducts('laptop gaming', {
  minPrice: 800,
  maxPrice: 1500,
  category: 'electronics'
});

console.log(searchResult.content[0].text);

// Agregar al carrito
const addResult = await mcpClient.addToCart(
  'product-id-123',
  2,
  'user-id-456'
);

console.log(addResult.content[0].text);
```

## ⚙️ Configuración

### Variables de Entorno para MCP

```env
# Configuración del servidor MCP
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost
MCP_TOOLS_ENABLED=true

# Configuración de herramientas
MCP_RATE_LIMIT_PER_MINUTE=60
MCP_MAX_TOOL_EXECUTION_TIME=30000

# Integración con LLMs
OPENAI_API_KEY=tu-openai-api-key
ANTHROPIC_API_KEY=tu-anthropic-api-key

# Configuración de logging
MCP_LOG_LEVEL=info
MCP_LOG_TOOL_CALLS=true
```

### Configuración del Servidor MCP

```typescript
// src/configs/mcp.config.ts
export const MCP_CONFIG = {
  server: {
    port: envs.MCP_SERVER_PORT || 3001,
    host: envs.MCP_SERVER_HOST || 'localhost',
    enabled: envs.MCP_TOOLS_ENABLED === 'true'
  },
  
  tools: {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minuto
      max: envs.MCP_RATE_LIMIT_PER_MINUTE || 60
    },
    maxExecutionTime: envs.MCP_MAX_TOOL_EXECUTION_TIME || 30000,
    enabledTools: [
      'search_products',
      'add_to_cart',
      'remove_from_cart',
      'get_cart_contents',
      'apply_coupon',
      'get_order_status',
      'get_user_orders',
      'get_customer_info'
    ]
  },
  
  logging: {
    level: envs.MCP_LOG_LEVEL || 'info',
    logToolCalls: envs.MCP_LOG_TOOL_CALLS === 'true'
  }
};
```

---

## 🔗 Enlaces Relacionados

- [🤖 Chatbot e IA](./api-chatbot.md)
- [📦 Gestión de Productos](./api-products.md)
- [🛒 Carrito y Pedidos](./api-orders.md)
- [👥 Gestión de Clientes](./api-customers.md)
- [⚙️ Panel de Administración](./api-admin.md)

---

*Última actualización: Enero 2024*
