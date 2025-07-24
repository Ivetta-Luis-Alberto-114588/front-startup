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
      "directEndpoint": "GET /api/products",
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
        "directCall": "GET /api/products?page=1&limit=10",
        "mcpCall": {
          "method": "POST",
          "url": "/api/mcp/tools/call",
          "body": {
            "toolName": "get_products",
            "args": { "page": 1, "limit": 10, "search": "laptop" }
          }
        }
      }
    },
    {
      "name": "search_products",
      "description": "Busca productos por nombre, descripción o categoría",
      "directEndpoint": "GET /api/products/search",
      "mcpEndpoint": "POST /api/mcp/tools/call",
      "parameters": {
        "q": "término de búsqueda (requerido)",
        "page": "número de página (default: 1)",
        "limit": "productos por página (default: 10)",
        "categories": "categorías separadas por coma",
        "minPrice": "precio mínimo",
        "maxPrice": "precio máximo",
        "sortBy": "campo de ordenamiento",
        "sortOrder": "asc o desc"
      },
      "examples": {
        "directCall": "GET /api/products/search?q=lomito&page=1&limit=5",
        "mcpCall": {
          "method": "POST",
          "url": "/api/mcp/tools/call",
          "body": {
            "toolName": "search_products",
            "args": { "q": "lomito", "page": 1, "limit": 5 }
          }
        }
      }
    },
    {
      "name": "get_product_by_id",
      "description": "Obtiene un producto específico por ID",
      "directEndpoint": "GET /api/products/{id}",
      "mcpEndpoint": "POST /api/mcp/tools/call",
      "parameters": {
        "id": "ID del producto (requerido)"
      },
      "examples": {
        "directCall": "GET /api/products/60f8b4b8e0b2a3a4b8b4b8b4",
        "mcpCall": {
          "method": "POST",
          "url": "/api/mcp/tools/call",
          "body": {
            "toolName": "get_product_by_id",
            "args": { "id": "60f8b4b8e0b2a3a4b8b4b8b4" }
          }
        }
      }
    },
    {
      "name": "get_customers",
      "description": "Obtiene lista de clientes (requiere autenticación admin)",
      "directEndpoint": "GET /api/admin/customers",
      "mcpEndpoint": "POST /api/mcp/tools/call",
      "parameters": {
        "page": "número de página (default: 1)",
        "limit": "clientes por página (default: 10)"
      },
      "examples": {
        "directCall": "GET /api/admin/customers?page=1&limit=10",
        "mcpCall": {
          "method": "POST",
          "url": "/api/mcp/tools/call",
          "body": {
            "toolName": "get_customers",
            "args": { "page": 1, "limit": 10 }
          }
        }
      }
    },
    {
      "name": "search_customers",
      "description": "Busca clientes por nombre, email o teléfono",
      "directEndpoint": "GET /api/customers/search",
      "mcpEndpoint": "POST /api/mcp/tools/call",
      "parameters": {
        "q": "término de búsqueda (nombre, email, teléfono)",
        "neighborhoodId": "ID del barrio para filtrar",
        "page": "número de página (default: 1)",
        "limit": "clientes por página (default: 10)",
        "sortBy": "campo de ordenamiento",
        "sortOrder": "asc o desc"
      },
      "examples": {
        "directCall": "GET /api/customers/search?q=juan&page=1&limit=5",
        "mcpCall": {
          "method": "POST",
          "url": "/api/mcp/tools/call",
          "body": {
            "toolName": "search_customers",
            "args": { "q": "juan", "page": 1, "limit": 5 }
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

## ¿Cómo consulto los productos?

### Opción 1: Endpoint REST directo

```bash
# Listar productos
GET /api/products?page=1&limit=10

# Buscar productos por término específico
GET /api/products/search?q=lomito&page=1&limit=5

# Filtrar por precio
GET /api/products/search?q=combo&minPrice=100&maxPrice=500

# Obtener producto específico
GET /api/products/{productId}
```

### Opción 2: A través del sistema MCP

```bash
# Ejecutar herramienta de búsqueda de productos
POST /api/mcp/tools/call
Content-Type: application/json

{
  "toolName": "search_products",
  "args": {
    "q": "lomito",
    "page": 1,
    "limit": 3
  }
}
```

**Respuesta:**
```json
{
  "status": "OK",
  "service": "MCP Tool Call",
  "timestamp": "2025-07-23T16:17:05.997Z",
  "toolName": "search_products",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 3,\n  \"page\": 1,\n  \"limit\": 3,\n  \"products\": [\n    {\n      \"id\": \"6807f8ab022d7fe5f9d96200\",\n      \"name\": \"doble lomito y mas\",\n      \"description\": \"descripcion picada casera\",\n      \"price\": 5.99,\n      \"priceWithTax\": 7.25,\n      \"stock\": 12,\n      \"category\": \"Empanadas\",\n      \"unit\": \"unidad\",\n      \"tags\": [\"popular\"],\n      \"imgUrl\": \"https://res.cloudinary.com/diwctpwax/image/upload/v1749138722/products/slawgqzz3mshuqsle2xg.jpg\",\n      \"isActive\": true\n    }\n  ]\n}"
      }
    ]
  }
}
```

## ¿Cómo consulto los clientes?

### Opción 1: Endpoint REST directo

```bash
# Buscar clientes por nombre
GET /api/customers/search?q=juan&page=1&limit=5

# Buscar clientes por email
GET /api/customers/search?q=test@gmail.com

# Filtrar por barrio
GET /api/customers/search?neighborhoodId=60f8b4b8e0b2a3a4b8b4b8b4

# Obtener todos los clientes (admin)
GET /api/admin/customers?page=1&limit=10
```

### Opción 2: A través del sistema MCP

```bash
# Ejecutar herramienta de búsqueda de clientes
POST /api/mcp/tools/call
Content-Type: application/json

{
  "toolName": "search_customers",
  "args": {
    "q": "juan",
    "page": 1,
    "limit": 3
  }
}
```

**Respuesta:**
```json
{
  "status": "OK",
  "service": "MCP Tool Call",
  "timestamp": "2025-07-23T16:16:52.307Z",
  "toolName": "search_customers",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 5,\n  \"page\": 1,\n  \"limit\": 3,\n  \"customers\": [\n    {\n      \"id\": \"68766f4a71537bbcca28abf2\",\n      \"name\": \"juan pérez\",\n      \"email\": \"juan.perez.otro@gmail.com\",\n      \"phone\": \"00000000\",\n      \"address\": \"dirección pendiente\",\n      \"neighborhood\": \"No especificado\",\n      \"city\": \"No especificado\",\n      \"isActive\": true\n    }\n  ]\n}"
      }
    ]
  }
}
```

## ¿Qué endpoints están disponibles para búsqueda?

### ✅ Productos - Endpoints Funcionando

1. **Búsqueda avanzada**: `GET /api/products/search?q=termino`
   - Búsqueda por nombre, descripción
   - Filtros por categoría, precio, ordenamiento
   - Paginación completa

2. **Listado general**: `GET /api/products`
   - Listado paginado
   - Filtros básicos

3. **Por ID**: `GET /api/products/{id}`
   - Producto específico

### ✅ Clientes - Endpoints Funcionando

1. **Búsqueda avanzada**: `GET /api/customers/search?q=termino`
   - Búsqueda por nombre, email, teléfono
   - Filtro por barrio
   - Paginación y ordenamiento

2. **Listado admin**: `GET /api/admin/customers`
   - Listado completo (requiere auth)

3. **Por email**: `GET /api/customers/by-email/{email}`
   - Cliente específico por email

### 🔧 Sistema MCP

1. **Descubrimiento**: `GET /api/mcp/tools/info`
   - Lista todas las herramientas disponibles
   - Incluye ejemplos de uso directo y MCP

2. **Ejecución**: `POST /api/mcp/tools/call`
   - Ejecuta cualquier herramienta MCP
   - Respuesta estructurada en formato MCP

## Ejemplo de Flujo Completo

### 1. Descubrir herramientas disponibles

```bash
curl -s "http://localhost:3000/api/mcp/tools/info" | head -20
```

### 2. Buscar productos directamente

```bash
curl -s "http://localhost:3000/api/products/search?q=lomito&limit=2"
```

### 3. Buscar productos vía MCP

```bash
curl -X POST "http://localhost:3000/api/mcp/tools/call" \
  -H "Content-Type: application/json" \
  -d '{"toolName":"search_products","args":{"q":"lomito","limit":2}}'
```

### 4. Buscar clientes

```bash
curl -s "http://localhost:3000/api/customers/search?q=juan&limit=3"
```

### 5. Buscar clientes vía MCP

```bash
curl -X POST "http://localhost:3000/api/mcp/tools/call" \
  -H "Content-Type: application/json" \
  -d '{"toolName":"search_customers","args":{"q":"juan","limit":3}}'
```

## Resumen de URLs Corregidas

- ❌ **Antes**: `/api/v1/products` 
- ✅ **Ahora**: `/api/products`
- ✅ **Búsqueda productos**: `/api/products/search`
- ✅ **Búsqueda clientes**: `/api/customers/search`
- ✅ **Herramientas MCP**: `/api/mcp/tools/info`
- ✅ **Ejecutar MCP**: `/api/mcp/tools/call`

El sistema MCP ahora está completamente funcional con búsqueda avanzada tanto para productos como para clientes, y todas las URLs están actualizadas sin el prefijo `/v1`.
