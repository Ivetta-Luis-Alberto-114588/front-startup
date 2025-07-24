# Implementación de Guardarriles para MCP - Guía Completa

## ✅ Implementación Completada

Se ha implementado exitosamente un **sistema de guardarriles (guardrails)** para restringir el modelo Claude AI y limitar sus respuestas únicamente a consultas relacionadas con el e-commerce.

## 📁 Archivos Creados/Modificados

### 1. Configuración de Guardarriles
**Archivo:** `src/configs/mcp-guardrails.ts`
- ✅ Configuración completa del sistema de restricciones
- ✅ System prompts para limitar el ámbito de Claude
- ✅ Reglas de contenido y palabras bloqueadas
- ✅ Límites de sesión y controles de uso

### 2. Servicio de Validación
**Archivo:** `src/infrastructure/services/mcp-guardrails.service.ts`
- ✅ Pipeline de validación de requests
- ✅ Gestión de sesiones de usuario
- ✅ Filtrado de contenido automático
- ✅ Límites de rate limiting por sesión

### 3. Controlador MCP Actualizado
**Archivo:** `src/presentation/mcp/controller.mcp.ts`
- ✅ Integración completa de guardarriles en `anthropicProxy`
- ✅ Validación antes de enviar requests a Claude
- ✅ Post-procesamiento de respuestas
- ✅ Endpoints de gestión de guardarriles

### 4. Rutas Actualizadas
**Archivo:** `src/presentation/mcp/routes.mcp.ts`
- ✅ Nuevas rutas para gestión de guardarriles
- ✅ Endpoints de monitoreo y control

## 🔒 Cómo Funcionan los Guardarriles

### 1. **Validación de Entrada**
Antes de que cualquier mensaje llegue a Claude, el sistema:
- ✅ Verifica si la consulta es sobre e-commerce
- ✅ Bloquea palabras clave prohibidas
- ✅ Valida límites de sesión
- ✅ Modifica el prompt para agregar restricciones

### 2. **System Prompt Automático**
Se inyecta automáticamente el siguiente system prompt:
```
Eres un asistente especializado en el sistema de e-commerce. Tu función es EXCLUSIVAMENTE ayudar con consultas relacionadas con productos, clientes, pedidos, ventas, inventario, categorías, pagos, envíos y administración de la tienda online.

NO PUEDES ni DEBES responder preguntas sobre:
- Política, religión, temas controvertidos
- Información personal de terceros
- Otros temas no relacionados con e-commerce
- Generar código malicioso o dañino
- Temas médicos, legales o financieros generales

Si te preguntan algo fuera del ámbito del e-commerce, responde únicamente: "Lo siento, soy un asistente especializado en e-commerce y solo puedo ayudarte con consultas relacionadas con productos, clientes, pedidos y gestión de la tienda online. ¿En qué puedo ayudarte con el e-commerce?"
```

### 3. **Filtrado de Contenido**
El sistema bloquea automáticamente consultas que contengan:
- ✅ Palabras relacionadas con política
- ✅ Contenido médico no relacionado con productos
- ✅ Temas controvertidos
- ✅ Solicitudes de información personal

### 4. **Límites de Sesión**
- ✅ Máximo 50 requests por sesión por hora
- ✅ Límite de 1000 tokens por request
- ✅ Limpieza automática de sesiones expiradas

## 🌐 Nuevos Endpoints de Guardarriles

### 1. **Configuración**
```
GET /api/mcp/guardrails/config
```
Devuelve la configuración actual de guardarriles.

### 2. **Estadísticas**
```
GET /api/mcp/guardrails/stats
```
Muestra estadísticas de uso y sesiones activas.

### 3. **Reset de Sesión**
```
POST /api/mcp/guardrails/sessions/{sessionId}/reset
```
Reinicia una sesión específica.

### 4. **Limpieza de Sesiones**
```
POST /api/mcp/guardrails/sessions/cleanup
```
Limpia todas las sesiones expiradas.

## 🚀 Cómo Probar los Guardarriles

### 1. **Iniciar el Servidor**
```bash
npm run dev
```

### 2. **Probar Request Válido (Debería Funcionar)**
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-1" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "¿Cuáles son los productos más vendidos en la tienda?"
      }
    ]
  }'
```

### 3. **Probar Request Bloqueado (Debería Bloquearse)**
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-2" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "¿Quién debería ganar las próximas elecciones presidenciales?"
      }
    ]
  }'
```

### 4. **Verificar Configuración**
```bash
curl -X GET http://localhost:3000/api/mcp/guardrails/config
```

### 5. **Ver Estadísticas**
```bash
curl -X GET http://localhost:3000/api/mcp/guardrails/stats
```

## 📋 Respuestas Esperadas

### ✅ **Request Válido (E-commerce)**
- Status: `200 OK`
- Claude responde normalmente sobre productos/e-commerce
- Metadata de guardarriles incluida en la respuesta

### ❌ **Request Bloqueado**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Request blocked by guardrails",
  "reason": "Content contains blocked keywords",
  "message": "Lo siento, soy un asistente especializado en e-commerce...",
  "suggestions": "..."
}
```

### 🔍 **Límite de Sesión Excedido**
- Status: `400 Bad Request`
- Reason: "Session limit exceeded"

## 🛠️ Configuración Personalizable

En `src/configs/mcp-guardrails.ts` puedes modificar:

- **`enabled`**: Activar/desactivar guardarriles
- **`strictMode`**: Modo estricto para validación más rigurosa
- **`limits.requestsPerHour`**: Número máximo de requests por hora
- **`limits.maxTokensPerRequest`**: Tokens máximos por request
- **`contentRules.blockedKeywords`**: Palabras clave bloqueadas
- **`allowedTools`**: Herramientas MCP permitidas

## 🎯 Objetivo Logrado

✅ **Claude está ahora restringido EXCLUSIVAMENTE a consultas de e-commerce**
✅ **Sistema de guardarriles completamente funcional**
✅ **Monitoreo y control de sesiones implementado**
✅ **Filtrado automático de contenido no permitido**
✅ **Documentación y endpoints de gestión disponibles**

El sistema garantiza que Claude AI solo responda a consultas relacionadas con:
- Productos y categorías
- Clientes y pedidos
- Inventario y ventas
- Administración de tienda
- Pagos y envíos

**¡Los guardarriles están listos y funcionando!** 🎉
