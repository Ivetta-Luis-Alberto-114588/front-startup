# 🤖 Chat MCP - Asistente de IA para E-commerce

## ✅ Implementación Completada

Se ha implementado exitosamente un **componente de chat con IA** integrado en el sidebar que se conecta al sistema MCP (Model Context Protocol) del backend para brindar asistencia especializada en e-commerce.

## 📁 Archivos Creados

### 1. **Interfaces y Tipos**
- `src/app/shared/models/mcp.interfaces.ts` - Definiciones de tipos TypeScript para MCP

### 2. **Servicio MCP**
- `src/app/shared/services/mcp.service.ts` - Servicio para comunicación con el backend MCP

### 3. **Componente de Chat**
- `src/app/shared/components/mcp-chat/mcp-chat.component.ts` - Lógica del componente
- `src/app/shared/components/mcp-chat/mcp-chat.component.html` - Template HTML con Bootstrap

### 4. **Integración**
- Actualizado `src/app/shared/shared.module.ts` - Registro del componente
- Actualizado `src/app/shared/sidebar/sidebar.component.html` - Integración en sidebar

## 🎯 Características Implementadas

### ✅ **Interface de Chat**
- **Diseño responsivo** con Bootstrap (sin CSS/SCSS personalizado)
- **Chat expandible/colapsable** en el sidebar
- **Mensajes en tiempo real** con indicadores de carga
- **Avatares diferenciados** para usuario y asistente
- **Timestamps** en cada mensaje
- **Manejo de errores** con mensajes informativos

### ✅ **Funcionalidades**
- **Envío de mensajes** al modelo Claude AI
- **Gestión de sesiones** con IDs únicos
- **Verificación de salud** del servicio MCP
- **Reinicio de sesión** y limpieza de chat
- **Sugerencias rápidas** para consultas comunes
- **Validación de formularios** con ReactiveForMS

### ✅ **Integración con Backend**
- **Endpoints MCP** completamente integrados
- **Autenticación por sesión** con headers personalizados
- **Guardarriles implementados** para limitar el ámbito a e-commerce
- **Manejo de errores HTTP** con mensajes descriptivos

## 🔧 Configuración del Backend

El chat se conecta a los siguientes endpoints del backend:

### **Base URL:** `https://sistema-mongo.onrender.com/api/mcp`

### **Endpoints Utilizados:**
- `GET /health` - Verificación del servicio
- `GET /models` - Modelos disponibles
- `GET /tools/info` - Herramientas MCP disponibles
- `POST /anthropic/messages` - Envío de mensajes a Claude AI
- `POST /tools/call` - Ejecución de herramientas MCP
- `GET /guardrails/stats` - Estadísticas de guardarriles
- `POST /guardrails/sessions/{id}/reset` - Reinicio de sesión

## 🚀 Cómo Usar el Chat

### 1. **Ubicación**
- El chat aparece en la **parte inferior del sidebar**
- Disponible para **todos los usuarios** (no requiere permisos admin)
- Se adapta al estado colapsado/expandido del sidebar

### 2. **Interacciones**
- **Clic en "AI Assistant"** para expandir/contraer el chat
- **Escribir mensaje** y presionar Enter o clic en enviar
- **Sugerencias rápidas** aparecen al inicio del chat
- **Botones de acción**: limpiar chat, reiniciar sesión, cerrar

### 3. **Tipos de Consultas Soportadas**
- ✅ **Productos**: "¿Cuáles son los productos más vendidos?"
- ✅ **Clientes**: "¿Cuántos clientes tenemos registrados?"
- ✅ **Pedidos**: "¿Cuáles son los pedidos pendientes?"
- ✅ **Inventario**: "¿Qué productos están en stock?"
- ✅ **Análisis**: "¿Cuáles son las categorías más populares?"

### 4. **Limitaciones del Sistema**
- ❌ **Solo e-commerce**: No responde consultas fuera del ámbito del negocio
- ❌ **Sin información personal**: No accede a datos sensibles
- ❌ **Límites de sesión**: Máximo 50 requests por hora por sesión
- ❌ **Guardarriles activos**: Filtra contenido inapropiado automáticamente

## 🎨 Diseño y Estilos

### **Solo Bootstrap 5**
- ✅ **Sin CSS/SCSS personalizado** - Solo clases de Bootstrap
- ✅ **Diseño responsivo** - Se adapta a diferentes tamaños de pantalla
- ✅ **Colores consistentes** - Usa la paleta de colores del proyecto
- ✅ **Iconos Bootstrap** - Iconografía consistente con el resto de la app

### **Estados Visuales**
- 🟢 **Conectado** - Texto verde, listo para recibir mensajes
- 🔵 **Procesando** - Spinner azul, enviando mensaje a la IA
- 🔴 **Error** - Texto rojo, problema de conectividad o respuesta
- ⚫ **Escribiendo** - Indicador cuando la IA está generando respuesta

## 🔧 Estructura Técnica

### **Servicio MCP (`mcp.service.ts`)**
```typescript
// Características principales:
- BehaviorSubjects para estado reactivo
- Gestión de sesiones con IDs únicos
- Manejo de errores HTTP personalizado
- Integración con interceptors de autenticación
- Observables para estados de carga y mensajes
```

### **Componente Chat (`mcp-chat.component.ts`)**
```typescript
// Funcionalidades:
- FormBuilder para validación de mensajes
- ViewChild para scroll automático
- Lifecycle hooks para suscripciones
- TrackBy functions para optimización de ngFor
- Gestión de estados de UI responsiva
```

## 📱 Responsive Design

### **Desktop (>768px)**
- Chat con altura de 500px
- Sidebar completo con textos
- Todas las funcionalidades visibles

### **Mobile (<768px)**
- Chat con altura de 400px
- Sidebar colapsado con solo iconos
- Interface optimizada para touch

## 🔒 Seguridad Implementada

### **Frontend**
- ✅ **Validación de formularios** con Reactive Forms
- ✅ **Sanitización automática** de inputs de Angular
- ✅ **Límites de caracteres** (máximo 1000 por mensaje)
- ✅ **Timeout de sesión** automático

### **Backend (Guardarriles)**
- ✅ **Filtrado de contenido** automático
- ✅ **Límites de rate limiting** por sesión
- ✅ **Scope limitado** solo a e-commerce
- ✅ **System prompts** automáticos para restringir respuestas

## 🎉 ¡Listo para Usar!

El chat MCP está **completamente funcional** y listo para ser utilizado. Los usuarios pueden:

1. **Hacer consultas** sobre el negocio de e-commerce
2. **Recibir respuestas inteligentes** generadas por Claude AI
3. **Interactuar de forma natural** con el asistente virtual
4. **Obtener insights** sobre productos, clientes y pedidos

**El sistema respeta los guardarriles implementados y solo responde consultas relacionadas con el e-commerce, manteniendo la seguridad y relevancia de las respuestas.**
