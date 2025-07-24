# Guía de Endpoints MCP - Consulta de Herramientas y Datos

## ¿Qué herramientas tengo disponibles?

### 1. Información completa de herramientas MCP

```bash
GET /api/mcp/tools/info
```

**Respuesta:**

```json
{
  "status": "OK",
  "service": "MCP Tools Info",
  "timestamp": "2025-07-23T...",
  "availableTools": [
    {
      "name": "get_products",
      "description": "Obtiene lista de productos con filtros opcionales",
      "directEndpoint": "GET /api/v1/products",
      "mcpEndpoint": "POST /api/mcp/tools/call",
      "parameters": {
        "page": "número de página (default: 1)",
        "limit": "productos por página (default: 10)",
        "search": "término de búsqueda",
        "categoryId": "ID de categoría",
        "minPrice": "precio mínimo",
        "maxPrice": "precio máximo"
      },
      "examples": {
        "directCall": "GET /api/v1/products?page=1&limit=10&search=laptop",
        "mcpCall": {
          "method": "POST",
          "url": "/api/mcp/tools/call",
          "body": {
            "toolName": "get_products",
            "args": { "page": 1, "limit": 10, "search": "laptop" }
          }
        }
      }
    }
  ],
  "usage": {
    "note": "Puedes usar los endpoints REST directamente o a través del sistema MCP",
    "authentication": "Los endpoints de admin requieren autenticación JWT",
    "baseUrl": "http://localhost:3000"
  }
}
```

### 2. Listar herramientas MCP (formato técnico)

```bash
GET /api/mcp/tools
```

**Respuesta:**

```json
{
  "status": "OK",
  "service": "MCP Tools",
  "timestamp": "2025-07-23T...",
  "tools": [
    {
      "name": "get_products",
      "description": "Obtiene lista de productos con filtros opcionales",
      "inputSchema": {
        "type": "object",
        "properties": {
          "page": { "type": "number", "description": "Número de página (default: 1)" },
          "limit": { "type": "number", "description": "Productos por página (default: 10)" },
          "search": { "type": "string", "description": "Término de búsqueda" }
        }
      }
    }
  ]
}
```

## ¿Cómo consulto los productos?

### Opción 1: Endpoint REST directo

```bash
# Listar productos
GET /api/v1/products?page=1&limit=10

# Buscar productos
GET /api/v1/products?search=laptop

# Filtrar por precio
GET /api/v1/products?minPrice=100&maxPrice=500

# Obtener producto específico
GET /api/v1/products/{productId}
```

### Opción 2: Usando el sistema MCP

```bash
# Llamar herramienta MCP (ejecuta directamente en la base de datos)
POST /api/mcp/tools/call
Content-Type: application/json

{
  "toolName": "get_products",
  "args": {
    "page": 1,
    "limit": 10,
    "search": "empanadas"
  }
}
```

**Respuesta:**

```json
{
  "status": "OK",
  "service": "MCP Tool Call",
  "timestamp": "2025-07-23T...",
  "toolName": "get_products",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 25,\n  \"page\": 1,\n  \"limit\": 10,\n  \"products\": [\n    {\n      \"id\": \"60f8b4b8e0b2a3a4b8b4b8b4\",\n      \"name\": \"Laptop HP\",\n      \"description\": \"Laptop HP 15 pulgadas\",\n      \"price\": 500,\n      \"priceWithTax\": 605,\n      \"stock\": 10,\n      \"category\": \"Electrónicos\",\n      \"unit\": \"Unidad\",\n      \"tags\": [\"ofertas\"],\n      \"isActive\": true\n    }\n  ]\n}"
      }
    ]
  }
}
```

## ¿Cómo consulto los clientes?

### Endpoint REST directo

```bash
# Listar clientes (requiere autenticación admin)
GET /api/v1/admin/customers?page=1&limit=10

# Buscar clientes
GET /api/v1/admin/customers?search=juan

# Obtener cliente específico
GET /api/v1/admin/customers/{customerId}
```

### Usando MCP

```bash
POST /api/mcp/tools/call
Content-Type: application/json

{
  "toolName": "get_customers",
  "args": {
    "page": 1,
    "limit": 10,
    "search": "juan"
  }
}
```

## ¿Cómo consulto los pedidos?

### Endpoint REST directo

```bash
# Listar pedidos (requiere autenticación admin)
GET /api/v1/admin/orders?page=1&limit=10

# Filtrar por cliente
GET /api/v1/admin/orders?customerId={customerId}

# Filtrar por estado
GET /api/v1/admin/orders?status=pending

# Filtrar por fecha
GET /api/v1/admin/orders?dateFrom=2025-01-01&dateTo=2025-01-31
```

### Usando MCP

```bash
POST /api/mcp/tools/call
Content-Type: application/json

{
  "toolName": "get_orders",
  "args": {
    "page": 1,
    "limit": 10,
    "customerId": "60f8b4b8e0b2a3a4b8b4b8b4"
  }
}
```

## Estado del servicio

```bash
# Verificar estado del servicio MCP
GET /api/mcp/health
```

**Respuesta:**

```json
{
  "status": "OK",
  "service": "MCP Service",
  "timestamp": "2025-07-23T...",
  "anthropic_configured": true
}
```

## Resumen de endpoints disponibles

| Funcionalidad                | Endpoint MCP                 | Endpoint REST Directo                |
| ---------------------------- | ---------------------------- | ------------------------------------ |
| Información de herramientas | `GET /api/mcp/tools/info`  | -                                    |
| Listar herramientas          | `GET /api/mcp/tools`       | -                                    |
| Listar productos             | `POST /api/mcp/tools/call` | `GET /api/v1/products`             |
| Obtener producto             | `POST /api/mcp/tools/call` | `GET /api/v1/products/{id}`        |
| Listar clientes              | `POST /api/mcp/tools/call` | `GET /api/v1/admin/customers`      |
| Obtener cliente              | `POST /api/mcp/tools/call` | `GET /api/v1/admin/customers/{id}` |
| Listar pedidos               | `POST /api/mcp/tools/call` | `GET /api/v1/admin/orders`         |
| Estado del servicio          | `GET /api/mcp/health`      | -                                    |
| Modelos Claude               | `GET /api/mcp/models`      | -                                    |
| Proxy Anthropic              | `POST /api/mcp/anthropic`  | -                                    |

## Ejemplos prácticos

### 1. Consultar los primeros 5 productos

```bash
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=5"
```

### 2. Buscar productos con "laptop" en el nombre

```bash
curl -X GET "http://localhost:3000/api/v1/products?search=laptop"
```

### 3. Obtener información de herramientas disponibles

```bash
curl -X GET "http://localhost:3000/api/mcp/tools/info"
```

### 4. Listar herramientas técnicas MCP

```bash
curl -X GET "http://localhost:3000/api/mcp/tools"
```

### 5. Usar herramienta MCP para productos

```bash
curl -X POST "http://localhost:3000/api/mcp/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "get_products",
    "args": {
      "page": 1,
      "limit": 5,
      "search": "laptop"
    }
  }'
```

### 6. Verificar estado del servicio MCP

```bash
curl -X GET "http://localhost:3000/api/mcp/health"
```

## Notas importantes

1. **Productos**: Los endpoints de productos son públicos
2. **Clientes y Pedidos**: Los endpoints de admin requieren autenticación JWT
3. **MCP Tools**: Los endpoints MCP (`/api/mcp/*`) ejecutan las herramientas directamente con la base de datos
4. **Información de herramientas**: Usa `/api/mcp/tools/info` para obtener documentación completa con ejemplos
5. **Herramientas técnicas**: Usa `/api/mcp/tools` para obtener el esquema técnico de las herramientas MCP
