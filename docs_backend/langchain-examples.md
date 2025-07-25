# 🧠 Ejemplos Prácticos de LangChain System

## 📋 Resumen

Esta documentación proporciona **ejemplos prácticos reales** de consultas y respuestas del Sistema Inteligente LangChain. Incluye casos de uso específicos, formatos de request/response y mejores prácticas para la integración frontend.

---

## 🍕 Ejemplos de Consultas de Productos

### **1. Búsqueda de Producto Más Barato**

**Request:**
```json
POST /api/intelligent/chat
{
  "message": "¿Cuál es el producto más barato?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "El producto más barato que tenemos es **Empanada de Verdura** con un precio de **$2.30**. 🥟\n\nTambién tenemos otras opciones económicas:\n• **Empanada de Carne** - $2.50\n• **Empanada de Pollo** - $2.80\n• **Empanada de Jamón y Queso** - $3.00\n\nTodas nuestras empanadas son caseras y están recién hechas. ¿Te interesa alguna en particular?",
  "tool_used": "search_products",
  "execution_time": 1247,
  "thinking_process": {
    "input_analysis": "Usuario busca información de precios - producto más económico",
    "tool_selected": "search_products",
    "search_strategy": "Análisis comparativo de precios con ordenamiento ascendente"
  }
}
```

### **2. Consulta de Disponibilidad Específica**

**Request:**
```json
{
  "message": "¿Tienen pizza margarita?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Sí! Tenemos **Pizza Margarita** disponible. 🍕\n\n**Detalles:**\n• **Precio:** $12.50\n• **Tamaño:** Familiar (8 porciones)\n• **Ingredientes:** Salsa de tomate, mozzarella, albahaca fresca\n• **Estado:** Disponible para pedido\n\n¿Te gustaría hacer un pedido o necesitas información sobre otras pizzas?",
  "tool_used": "search_products",
  "execution_time": 890
}
```

### **3. Listado de Categoría**

**Request:**
```json
{
  "message": "¿Qué pizzas hay disponibles?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenemos las siguientes **pizzas disponibles**: 🍕\n\n🔥 **Pizzas Clásicas:**\n• **Pizza Margarita** - $12.50\n• **Pizza Napolitana** - $14.00\n• **Pizza de Jamón** - $13.80\n\n⭐ **Pizzas Especiales:**\n• **Pizza Especial de la Casa** - $16.50\n• **Pizza Vegetariana** - $15.20\n• **Pizza Cuatro Quesos** - $17.00\n\n🌶️ **Pizzas Gourmet:**\n• **Pizza Provenzal con Aceitunas** - $18.90\n• **Pizza de Rúcula y Jamón Crudo** - $19.50\n\nTodas son tamaño familiar y están disponibles para entrega. ¿Cuál te llama la atención?",
  "tool_used": "search_products",
  "execution_time": 1456
}
```

### **4. Análisis de Precios**

**Request:**
```json
{
  "message": "¿Cuáles son los productos más caros?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Los **productos más caros** de nuestro menú son: 💰\n\n🥇 **Top 3 Más Caros:**\n1. **Parrillada Completa** - $45.00\n   - Incluye: Asado, chorizo, morcilla, pollo, ensalada\n\n2. **Lomito Súper Completo** - $22.50\n   - Con papas fritas, huevo, jamón, queso, lechuga, tomate\n\n3. **Pizza de Rúcula y Jamón Crudo** - $19.50\n   - Pizza gourmet con ingredientes premium\n\n💡 **Dato interesante:** La diferencia de precio entre nuestro producto más caro ($45.00) y más barato ($2.30) es de $42.70, ofreciendo opciones para todos los presupuestos.",
  "tool_used": "search_products",
  "execution_time": 1123
}
```

---

## 👥 Ejemplos de Consultas de Clientes

### **1. Total de Clientes**

**Request:**
```json
{
  "message": "¿Cuántos clientes tengo registrados?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tienes **196 clientes registrados** en total. 👥\n\n📊 **Desglose:**\n• **Clientes activos:** 196\n• **Con historial de compras:** La mayoría\n• **Tipos:** Usuarios registrados y clientes invitados\n\n💡 **Estadística:** Es una base sólida de clientes que demuestra el crecimiento de tu negocio. ¿Te gustaría saber más detalles sobre algún cliente específico?",
  "tool_used": "search_customers",
  "execution_time": 567
}
```

### **2. Búsqueda de Cliente Específico**

**Request:**
```json
{
  "message": "Buscar cliente con nombre Juan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Encontré **3 clientes** con el nombre **Juan**: 🔍\n\n👤 **Resultados de búsqueda:**\n1. **Juan Pérez**\n   - Email: juan.perez@email.com\n   - Última compra: Hace 2 semanas\n\n2. **Juan García** \n   - Email: juan.garcia@email.com\n   - Cliente frecuente\n\n3. **Juan Carlos Rodríguez**\n   - Email: jc.rodriguez@email.com\n   - Nuevo cliente (registrado hace 1 mes)\n\n¿Necesitas información específica de alguno de estos clientes?",
  "tool_used": "search_customers",
  "execution_time": 723
}
```

### **3. Estadísticas Generales**

**Request:**
```json
{
  "message": "¿Cómo está la base de clientes?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tu **base de clientes** está en buen estado: 📈\n\n👥 **Estado Actual:**\n• **Total:** 196 clientes registrados\n• **Crecimiento:** Constante incorporación de nuevos clientes\n• **Actividad:** Base activa con historial de compras\n\n💪 **Fortalezas:**\n• Diversidad en tipos de cliente (registrados + invitados)\n• Retención de clientes existentes\n• Datos completos para marketing personalizado\n\n🎯 **Oportunidades:** Con casi 200 clientes, es el momento perfecto para estrategias de fidelización y campañas dirigidas.",
  "tool_used": "search_customers",
  "execution_time": 834
}
```

---

## 🛒 Ejemplos de Consultas de Órdenes

### **1. Resumen de Ventas**

**Request:**
```json
{
  "message": "¿Cómo van las ventas este mes?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "📊 **Resumen General de Ventas:**\n\n💰 **Números Clave:**\n• **Total de órdenes:** 238 pedidos\n• **Ventas totales:** $115.37\n• **Promedio por orden:** $2.31\n• **Estado del negocio:** Operativo y activo\n\n📈 **Análisis:**\n• Tienes un flujo constante de pedidos\n• El ticket promedio es accesible ($2.31)\n• Volume de órdenes saludable (238 pedidos)\n\n🎯 **Oportunidad:** Con un promedio de $2.31 por orden, podrías implementar estrategias para incrementar el valor promedio del carrito.",
  "tool_used": "search_orders",
  "execution_time": 912
}
```

### **2. Total de Pedidos**

**Request:**
```json
{
  "message": "¿Cuántos pedidos tengo en total?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tienes un **total de 238 órdenes** registradas en el sistema. 📋\n\n📊 **Detalles:**\n• **Pedidos procesados:** 238\n• **Estado del sistema:** Funcionando correctamente\n• **Actividad:** Flujo constante de órdenes\n\n💡 **Insight:** Es un volumen considerable de pedidos que demuestra la actividad comercial de tu negocio. ¿Te gustaría saber más detalles sobre el estado de estos pedidos?",
  "tool_used": "search_orders",
  "execution_time": 445
}
```

### **3. Análisis de Rendimiento**

**Request:**
```json
{
  "message": "¿Cuál es el promedio de venta por pedido?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "El **promedio de venta por pedido** es de **$2.31**. 📊\n\n💰 **Análisis detallado:**\n• **Total vendido:** $115.37\n• **Número de pedidos:** 238\n• **Promedio por orden:** $2.31\n\n🎯 **Contexto del mercado:**\n• Es un ticket promedio bajo, ideal para productos de consumo frecuente\n• Sugiere que vendes principalmente items accesibles (empanadas, snacks)\n• Hay oportunidad de incrementar el valor con combos o upselling\n\n💡 **Recomendación:** Considera ofertas como \"Lleva 3 empanadas por $6.50\" para aumentar el ticket promedio.",
  "tool_used": "search_orders",
  "execution_time": 678
}
```

---

## 📊 Ejemplos de Análisis de Negocio

### **1. Resumen Ejecutivo**

**Request:**
```json
{
  "message": "Dame un resumen completo del negocio"
}
```

**Response:**
```json
{
  "success": true,
  "message": "📊 **RESUMEN EJECUTIVO DEL NEGOCIO**\n\n🏢 **Estado General:** ✅ **OPERATIVO Y SALUDABLE**\n\n👥 **CLIENTES:**\n• 196 clientes registrados\n• Base diversa y activa\n• Oportunidad de fidelización\n\n🛒 **VENTAS:**\n• 238 órdenes procesadas\n• $115.37 en ventas totales\n• $2.31 promedio por pedido\n\n🍕 **PRODUCTOS:**\n• Amplio catálogo disponible\n• Rango de precios: $2.30 - $45.00\n• Productos populares: Empanadas y pizzas\n\n🎯 **OPORTUNIDADES CLAVE:**\n1. Aumentar ticket promedio con combos\n2. Campañas de fidelización para 196 clientes\n3. Promociones especiales en productos premium\n\n💪 **FORTALEZAS:** Negocio establecido con flujo constante de pedidos y clientela fija.",
  "tool_used": "business_analytics",
  "execution_time": 1567
}
```

### **2. Análisis de Productos Populares**

**Request:**
```json
{
  "message": "¿Cuáles son los productos más solicitados?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "📈 **ANÁLISIS DE PRODUCTOS POPULARES**\n\n🥇 **Categorías Más Demandadas:**\n\n🥟 **EMPANADAS** (Líderes del mercado)\n• Precio accesible ($2.30 - $3.00)\n• Alta rotación y demanda constante\n• Variedad: Carne, Pollo, Verdura, Jamón y Queso\n\n🍕 **PIZZAS** (Productos premium)\n• Rango medio-alto ($12.50 - $19.50)\n• Pedidos familiares y ocasiones especiales\n• Especialidades: Margarita, Especiales, Gourmet\n\n🥩 **CARNES** (Productos premium)\n• Ticket más alto ($18.50 - $45.00)\n• Lomitos y parrilladas para ocasiones especiales\n\n💡 **INSIGHT:** Las empanadas son tu producto estrella por accesibilidad y frecuencia de compra, mientras que pizzas y carnes generan mayor margen por pedido.",
  "tool_used": "business_analytics",
  "execution_time": 1234
}
```

---

## 🔍 Ejemplos de Consultas Complejas

### **1. Comparación Multi-Categoría**

**Request:**
```json
{
  "message": "Compara las ventas de empanadas vs pizzas"
}
```

**Response:**
```json
{
  "success": true,
  "message": "🥊 **EMPANADAS vs PIZZAS - ANÁLISIS COMPARATIVO**\n\n🥟 **EMPANADAS:**\n• **Precio promedio:** $2.65\n• **Volumen:** Alto (producto de consumo diario)\n• **Margen:** Bajo pero constante\n• **Target:** Todos los segmentos\n• **Frecuencia:** Compras regulares\n\n🍕 **PIZZAS:**\n• **Precio promedio:** $15.40\n• **Volumen:** Medio (ocasiones especiales)\n• **Margen:** Alto por unidad\n• **Target:** Familias y grupos\n• **Frecuencia:** Fines de semana y eventos\n\n🏆 **CONCLUSIÓN:**\n• **Empanadas:** Generan volumen y fidelidad\n• **Pizzas:** Generan rentabilidad y ocasiones especiales\n• **Estrategia recomendada:** Mantener ambas como complementarias",
  "tool_used": "business_analytics",
  "execution_time": 1456
}
```

### **2. Consulta de Tendencias**

**Request:**
```json
{
  "message": "¿Cómo está funcionando el negocio últimamente?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "📈 **ANÁLISIS DE TENDENCIAS DEL NEGOCIO**\n\n🎯 **Estado Actual:** ✅ **ESTABLE Y CRECIENDO**\n\n📊 **Indicadores Clave:**\n• **Actividad comercial:** Constante\n• **Base de clientes:** 196 (sólida)\n• **Flujo de pedidos:** 238 órdenes (activo)\n• **Diversidad de productos:** Amplia gama\n\n🔥 **TENDENCIAS POSITIVAS:**\n✅ Retención de clientes existentes\n✅ Variedad de productos funcionando\n✅ Tickets accesibles que fomentan compras frecuentes\n✅ Productos premium disponibles para ocasiones especiales\n\n🚀 **RECOMENDACIONES:**\n1. **Fidelización:** Programa de puntos para los 196 clientes\n2. **Crecimiento:** Marketing digital para nuevos clientes\n3. **Rentabilidad:** Combos para aumentar ticket promedio\n\n💪 **CONCLUSIÓN:** Tu negocio está bien posicionado con fundamentos sólidos para crecimiento.",
  "tool_used": "business_analytics",
  "execution_time": 1678
}
```

---

## 🤖 Ejemplos de Interacciones Naturales

### **1. Consulta Casual**

**Request:**
```json
{
  "message": "¿Qué tal va todo?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Todo va muy bien! 😊\n\n🎯 **En resumen:**\n• **Clientes:** 196 registrados y activos\n• **Pedidos:** 238 órdenes procesadas\n• **Productos:** Amplio catálogo funcionando\n• **Ventas:** $115.37 generados\n\n💪 Tu negocio está **estable y operativo**. Tienes una base sólida de clientes, buen flujo de pedidos y productos que funcionan bien en el mercado.\n\n¿Hay algo específico que te gustaría saber o algún área en la que pueda ayudarte a mejorar?",
  "tool_used": "business_analytics",
  "execution_time": 890
}
```

### **2. Pregunta Coloquial**

**Request:**
```json
{
  "message": "¿Hay algo bueno y barato para comer?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Por supuesto! Tenemos varias opciones **buenas, bonitas y baratas**: 😋\n\n💰 **MÁS ECONÓMICAS:**\n• **Empanada de Verdura** - $2.30 ⭐ *(¡La más barata!)*\n• **Empanada de Carne** - $2.50 🥩\n• **Empanada de Pollo** - $2.80 🐔\n\n🔥 **COMBOS SUGERIDOS:**\n• 3 empanadas mixtas = aprox $7.60\n• 2 empanadas + gaseosa = ideal para el almuerzo\n\n✨ **¿Por qué son buena opción?**\n• Caseras y recién hechas\n• Perfectas para cualquier momento del día\n• Llenadoras y sabrosas\n• Precios súper accesibles\n\n¿Te tienta alguna empanada en particular? ¡Todas están buenísimas!",
  "tool_used": "search_products",
  "execution_time": 1123
}
```

### **3. Consulta de Ayuda**

**Request:**
```json
{
  "message": "¿En qué me puedes ayudar?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Puedo ayudarte con muchas cosas! 🎯\n\n🔍 **CONSULTAS DE PRODUCTOS:**\n• Precios y disponibilidad\n• Comparaciones y recomendaciones\n• Productos más baratos/caros\n• Listados por categoría\n\n👥 **INFORMACIÓN DE CLIENTES:**\n• Cantidad de clientes registrados\n• Búsqueda de clientes específicos\n• Estadísticas de la base de datos\n\n📊 **ANÁLISIS DE VENTAS:**\n• Resúmenes de órdenes y pedidos\n• Promedios de venta\n• Estado del negocio\n\n🧠 **ANÁLISIS INTELIGENTE:**\n• Insights del negocio\n• Recomendaciones de mejora\n• Comparaciones entre productos\n• Tendencias y oportunidades\n\n💬 **¿Cómo preguntar?**\nHabla conmigo de manera natural, como si fuera una conversación:\n• \"¿Cuál es el producto más barato?\"\n• \"¿Cuántos clientes tengo?\"\n• \"¿Cómo van las ventas?\"\n• \"Dame un resumen del negocio\"\n\n¿Con qué te gustaría empezar?",
  "tool_used": "business_analytics",
  "execution_time": 756
}
```

---

## 🚨 Ejemplos de Manejo de Errores

### **1. Consulta Ambigua**

**Request:**
```json
{
  "message": "información"
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Hola! Me gustaría ayudarte, pero necesito que seas un poco más específico. 🤔\n\n❓ **¿Qué tipo de información buscas?**\n\n🍕 **Sobre productos:**\n• \"¿Qué productos tienes?\"\n• \"¿Cuál es el más barato?\"\n• \"¿Hay pizzas disponibles?\"\n\n👥 **Sobre clientes:**\n• \"¿Cuántos clientes tengo?\"\n• \"Buscar cliente Juan\"\n\n📊 **Sobre ventas:**\n• \"¿Cómo van las ventas?\"\n• \"Resumen del negocio\"\n\n💡 **Tip:** Puedes preguntarme de manera natural, como si estuviéramos conversando. ¿Qué te gustaría saber específicamente?",
  "tool_used": "business_analytics",
  "execution_time": 234
}
```

### **2. Error de Sistema**

**Request:**
```json
{
  "message": "¿Cuántos productos hay?"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Disculpa, ocurrió un error técnico al acceder a la información de productos. Por favor intenta nuevamente en un momento.",
  "error": "Database connection timeout",
  "tool_attempted": "search_products",
  "execution_time": 5000
}
```

---

## 📋 Plantillas de Request/Response

### **Template Básico de Request**

```typescript
interface IntelligentChatRequest {
  message: string;
  context?: {
    user_id?: string;
    session_id?: string;
    previous_context?: any;
  };
}
```

### **Template Completo de Response**

```typescript
interface IntelligentChatResponse {
  success: boolean;
  message: string;
  tool_used?: 'search_products' | 'search_customers' | 'search_orders' | 'business_analytics';
  execution_time?: number;
  thinking_process?: {
    input_analysis: string;
    tool_selected: string;
    search_strategy: string;
    confidence_level?: number;
  };
  metadata?: {
    query_type: 'product' | 'customer' | 'order' | 'analytics' | 'general';
    results_count?: number;
    suggestions?: string[];
  };
  error?: string;
  debug_info?: {
    raw_query: string;
    processed_query: string;
    tool_parameters: any;
  };
}
```

---

## 🎯 Casos de Uso Recomendados

### **1. Dashboard de Administración**
```typescript
// Queries automáticas para dashboard
const dashboardQueries = [
  "Resumen del negocio",
  "¿Cuántos clientes tengo?",
  "¿Cómo van las ventas?",
  "¿Cuáles son los productos más populares?"
];
```

### **2. Asistente de Ventas**
```typescript
// Consultas de apoyo a ventas
const salesQueries = [
  "¿Qué productos están en oferta?",
  "¿Cuál es el producto más vendido?",
  "Recomendaciones para cliente frecuente",
  "Productos complementarios"
];
```

### **3. Análisis de Rendimiento**
```typescript
// Métricas de negocio
const analyticsQueries = [
  "Promedio de venta por cliente",
  "Productos con mayor margen",
  "Tendencias de ventas",
  "Oportunidades de mejora"
];
```

---

## 🔧 Tips de Implementación

### **1. Formateo de Mensajes**
```typescript
const formatResponse = (message: string): string => {
  return message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/(📊|🍕|👥|🛒|✅|❌|⚠️|🔍|💰)/g, '<span class="emoji">$&</span>');
};
```

### **2. Detección de Intent**
```typescript
const detectIntent = (message: string): string => {
  const lower = message.toLowerCase();
  
  if (lower.includes('precio') || lower.includes('barato') || lower.includes('caro')) {
    return 'price_inquiry';
  }
  if (lower.includes('cliente') || lower.includes('cuántos')) {
    return 'customer_inquiry';
  }
  if (lower.includes('venta') || lower.includes('pedido')) {
    return 'sales_inquiry';
  }
  
  return 'general_inquiry';
};
```

### **3. Suggestions Inteligentes**
```typescript
const getSuggestions = (lastQuery: string): string[] => {
  const suggestions = {
    product: [
      "¿Cuál es el producto más caro?",
      "¿Qué pizzas hay disponibles?",
      "Mostrar productos en oferta"
    ],
    customer: [
      "Buscar cliente específico",
      "¿Cuántos clientes nuevos este mes?",
      "Clientes más frecuentes"
    ],
    sales: [
      "¿Cuál es el promedio de venta?",
      "Pedidos de la semana",
      "Análisis de rentabilidad"
    ]
  };
  
  const intent = detectIntent(lastQuery);
  return suggestions[intent] || suggestions.product;
};
```

---

*Ejemplos Prácticos LangChain - Última actualización: 25 Enero 2025*
