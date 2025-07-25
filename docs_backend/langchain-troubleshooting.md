# 🔧 Troubleshooting LangChain System

## 📋 Resumen

Esta guía proporciona soluciones a problemas comunes del **Sistema Inteligente LangChain**, incluyendo diagnósticos, fixes rápidos y mejores prácticas para mantener el sistema funcionando correctamente.

---

## 🚨 Problemas Comunes y Soluciones

### **1. Error: ANTHROPIC_API_KEY not configured**

**Síntomas:**
```json
{
  "success": false,
  "error": "ANTHROPIC_API_KEY not configured",
  "fallback_mode": true
}
```

**Diagnóstico:**
```bash
# Verificar variables de entorno
echo $ANTHROPIC_API_KEY

# En Windows PowerShell
$env:ANTHROPIC_API_KEY
```

**Soluciones:**

**A. Configurar en archivo .env:**
```env
# .env
ANTHROPIC_API_KEY=tu_clave_antropic_aqui
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
ANTHROPIC_TEMPERATURE=0.1
ANTHROPIC_MAX_TOKENS=1500
```

**B. Verificar configuración en envs.ts:**
```typescript
// src/configs/envs.ts
export const envs = {
  ANTHROPIC_API_KEY: env.get('ANTHROPIC_API_KEY').required().asString(),
  // ... otras configuraciones
};
```

**C. Validar en intelligent.assistant.ts:**
```typescript
constructor() {
  if (!envs.ANTHROPIC_API_KEY) {
    console.warn('⚠️ ANTHROPIC_API_KEY not configured. System will work in demo mode.');
    return;
  }
  
  this.llm = new ChatAnthropic({
    modelName: 'claude-3-5-haiku-20241022',
    anthropicApiKey: envs.ANTHROPIC_API_KEY
  });
}
```

---

### **2. Error: Agent initialization failed**

**Síntomas:**
```
[Intelligent] Agent initialization failed, will use fallback mode: Error: ...
```

**Diagnóstico:**
```typescript
// Verificar logs en el constructor
console.log('[Intelligent] Initializing agent...');
console.log('[Intelligent] API Key configured:', !!envs.ANTHROPIC_API_KEY);
console.log('[Intelligent] Tools created:', this.tools.length);
```

**Soluciones:**

**A. Verificar dependencias:**
```bash
npm install @langchain/anthropic @langchain/core langchain
```

**B. Re-inicializar agente manualmente:**
```typescript
// En el controller o service
try {
  await intelligentAssistant.initialize();
  console.log('Agent re-initialized successfully');
} catch (error) {
  console.error('Re-initialization failed:', error);
}
```

**C. Verificar configuración de herramientas:**
```typescript
private createDynamicTools(): DynamicTool[] {
  console.log('[Debug] Creating tools...');
  
  const tools = [
    new DynamicTool({
      name: 'search_products',
      description: 'Search products...',
      func: async (input: string) => {
        console.log('[Debug] Product tool called with:', input);
        // ... implementación
      }
    })
    // ... más herramientas
  ];
  
  console.log('[Debug] Created tools:', tools.length);
  return tools;
}
```

---

### **3. Error: Database connection timeout**

**Síntomas:**
```json
{
  "success": false,
  "error": "Error buscando productos: Database connection failed",
  "tool_attempted": "search_products"
}
```

**Diagnóstico:**
```typescript
// Verificar conexión a MongoDB
const testConnection = async () => {
  try {
    const result = await this.productRepository.getAll();
    console.log('Database connection OK:', result.length);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

**Soluciones:**

**A. Verificar configuración de MongoDB:**
```env
# .env
MONGO_URL=mongodb://localhost:27017/ecommerce
MONGO_DB_NAME=ecommerce
```

**B. Implementar retry logic:**
```typescript
private async executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.warn(`[Retry ${i + 1}/${maxRetries}] Operation failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**C. Verificar timeouts:**
```typescript
// En la configuración de Mongoose
mongoose.connect(envs.MONGO_URL, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

### **4. Error: Tool execution timeout**

**Síntomas:**
- Respuestas que tardan más de 30 segundos
- Timeouts en consultas complejas
- Sistema no responde

**Diagnóstico:**
```typescript
// Agregar timing logs
const startTime = Date.now();
try {
  const result = await this.handleUniversalProductSearch(input);
  const endTime = Date.now();
  console.log(`[Performance] Tool executed in ${endTime - startTime}ms`);
  return result;
} catch (error) {
  console.error('[Performance] Tool execution failed after', Date.now() - startTime, 'ms');
  throw error;
}
```

**Soluciones:**

**A. Implementar timeouts por herramienta:**
```typescript
private async executeToolWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = 10000
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Tool timeout')), timeoutMs)
    )
  ]);
}
```

**B. Optimizar consultas a la base de datos:**
```typescript
// Usar paginación y límites
const searchProducts = async (query: string) => {
  return await this.productRepository.search({
    query,
    limit: 50, // Limitar resultados
    fields: ['name', 'price', 'category'] // Solo campos necesarios
  });
};
```

**C. Implementar caché:**
```typescript
private queryCache = new Map<string, any>();

private async getCachedResult<T>(
  key: string,
  operation: () => Promise<T>,
  ttlMs = 60000
): Promise<T> {
  const cached = this.queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }
  
  const result = await operation();
  this.queryCache.set(key, { data: result, timestamp: Date.now() });
  return result;
}
```

---

### **5. Error: Invalid response format**

**Síntomas:**
```json
{
  "success": false,
  "message": "Error: Could not parse LLM output: `Invalid format`"
}
```

**Diagnóstico:**
```typescript
// Log de respuestas del LLM
console.log('[Debug] LLM raw response:', response);
console.log('[Debug] Parsed result:', parsedResult);
```

**Soluciones:**

**A. Mejorar el prompt template:**
```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ['system', `Eres un asistente de e-commerce. 

IMPORTANTE: SIEMPRE sigue este formato exacto:
Question: la pregunta de entrada
Thought: tu análisis
Action: nombre_de_herramienta
Action Input: parámetros para la herramienta
Observation: resultado de la herramienta
Thought: tu conclusión
Final Answer: respuesta final en español

Herramientas disponibles: {tool_names}
{tools}`],
  ['human', '{input}'],
  ['assistant', '{agent_scratchpad}']
]);
```

**B. Validar formato de respuesta:**
```typescript
private validateResponse(response: any): boolean {
  if (typeof response !== 'object') return false;
  if (!response.hasOwnProperty('output')) return false;
  return true;
}
```

**C. Implementar fallback parser:**
```typescript
private parseResponseWithFallback(rawResponse: string): string {
  try {
    // Parser principal
    return this.parseNormalResponse(rawResponse);
  } catch (error) {
    console.warn('[Fallback] Using fallback parser');
    
    // Extraer respuesta manualmente
    const finalAnswerMatch = rawResponse.match(/Final Answer:\s*(.+)/s);
    if (finalAnswerMatch) {
      return finalAnswerMatch[1].trim();
    }
    
    // Último recurso
    return "Lo siento, ocurrió un error procesando tu consulta.";
  }
}
```

---

### **6. Error: Memory/Performance issues**

**Síntomas:**
- Sistema lento después de varias consultas
- Uso excesivo de memoria
- Crashes por falta de memoria

**Diagnóstico:**
```typescript
// Monitor de memoria
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB'
  });
};
```

**Soluciones:**

**A. Cleanup de recursos:**
```typescript
private cleanup(): void {
  // Limpiar caché cada hora
  setInterval(() => {
    this.queryCache.clear();
    console.log('[Cleanup] Cache cleared');
  }, 3600000);
  
  // Limitar tamaño de caché
  if (this.queryCache.size > 100) {
    const oldestKey = this.queryCache.keys().next().value;
    this.queryCache.delete(oldestKey);
  }
}
```

**B. Lazy loading de herramientas:**
```typescript
private async getToolByName(name: string): Promise<DynamicTool> {
  if (!this.toolsCache[name]) {
    this.toolsCache[name] = this.createTool(name);
  }
  return this.toolsCache[name];
}
```

**C. Configurar límites:**
```typescript
const llm = new ChatAnthropic({
  modelName: 'claude-3-5-haiku-20241022',
  maxTokens: 1000, // Reducir si es necesario
  temperature: 0.1,
  streaming: false,
  maxConcurrency: 1 // Una consulta a la vez
});
```

---

### **7. Error: Repository/DataSource issues**

**Síntomas:**
```json
{
  "error": "TypeError: this.productRepository.search is not a function"
}
```

**Diagnóstico:**
```typescript
// Verificar inyección de dependencias
console.log('Product repository:', this.productRepository);
console.log('Available methods:', Object.getOwnPropertyNames(this.productRepository));
```

**Soluciones:**

**A. Verificar inyección en el controller:**
```typescript
// presentation/intelligent/intelligent.controller.ts
export class IntelligentController {
  constructor(
    private productRepository: ProductRepository,
    private customerRepository: CustomerRepository,
    private orderRepository: OrderRepository
  ) {
    this.intelligentAssistant = new IntelligentAssistant(
      productRepository,
      customerRepository,
      orderRepository
    );
  }
}
```

**B. Verificar métodos del repository:**
```typescript
// domain/repositories/product.repository.ts
export abstract class ProductRepository {
  abstract search(dto: SearchProductsDto): Promise<{ total: number, items: ProductEntity[] }>;
  abstract getAll(): Promise<ProductEntity[]>;
  // ... otros métodos
}
```

**C. Verificar implementación:**
```typescript
// infrastructure/repositories/product.repository.impl.ts
export class ProductRepositoryImpl implements ProductRepository {
  async search(dto: SearchProductsDto): Promise<{ total: number, items: ProductEntity[] }> {
    return this.datasource.search(dto);
  }
  
  async getAll(): Promise<ProductEntity[]> {
    return this.datasource.getAll();
  }
}
```

---

## 🔍 Herramientas de Debug

### **1. Health Check Avanzado**

```typescript
// presentation/intelligent/intelligent.controller.ts
healthCheck = async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'OK',
      service: 'Intelligent Assistant',
      timestamp: new Date().toISOString(),
      
      // Verificaciones básicas
      anthropic_configured: !!envs.ANTHROPIC_API_KEY,
      agent_initialized: !!this.intelligentAssistant.agent,
      tools_available: this.intelligentAssistant.tools?.length || 0,
      
      // Verificaciones de base de datos
      database: await this.checkDatabaseHealth(),
      
      // Verificaciones de memoria
      memory: this.getMemoryStats(),
      
      // Último error si existe
      last_error: this.lastError || null
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

private async checkDatabaseHealth(): Promise<any> {
  try {
    const [productCount, customerCount, orderCount] = await Promise.all([
      this.productRepository.getAll().then(p => p.length),
      this.customerRepository.getAll().then(c => c.length),
      this.orderRepository.getAll().then(o => o.length)
    ]);
    
    return {
      status: 'OK',
      products: productCount,
      customers: customerCount,
      orders: orderCount
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}
```

### **2. Debug Logger**

```typescript
// configs/debug-logger.ts
export class DebugLogger {
  private static logLevel = envs.LOG_LEVEL || 'info';
  
  static debug(message: string, data?: any): void {
    if (this.logLevel === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, data);
    }
  }
  
  static tool(toolName: string, input: string, output: any, duration: number): void {
    console.log(`[TOOL] ${toolName} - ${duration}ms`);
    if (this.logLevel === 'debug') {
      console.log(`  Input: ${input}`);
      console.log(`  Output: ${JSON.stringify(output).substring(0, 200)}...`);
    }
  }
  
  static error(context: string, error: any): void {
    console.error(`[ERROR] ${context}:`, error);
  }
}
```

### **3. Performance Monitor**

```typescript
// utils/performance-monitor.ts
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTimer(operation: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
      return duration;
    };
  }
  
  private static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const durations = this.metrics.get(operation)!;
    durations.push(duration);
    
    // Mantener solo las últimas 100 mediciones
    if (durations.length > 100) {
      durations.shift();
    }
  }
  
  static getStats(operation: string): any {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { avg: Math.round(avg), min, max, count: durations.length };
  }
  
  static getAllStats(): any {
    const stats = {};
    for (const [operation] of this.metrics) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }
}
```

---

## 📊 Monitoreo en Producción

### **1. Endpoint de Métricas**

```typescript
// presentation/intelligent/intelligent.controller.ts
getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = {
      performance: PerformanceMonitor.getAllStats(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      system_health: await this.getSystemHealth(),
      recent_errors: this.getRecentErrors()
    };
    
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **2. Alerts System**

```typescript
// utils/alert-system.ts
export class AlertSystem {
  private static errorThreshold = 5;
  private static responseTimeThreshold = 10000;
  
  static checkHealth(): void {
    const recentErrors = this.getRecentErrors();
    const avgResponseTime = this.getAverageResponseTime();
    
    if (recentErrors.length > this.errorThreshold) {
      this.sendAlert('HIGH_ERROR_RATE', {
        count: recentErrors.length,
        threshold: this.errorThreshold
      });
    }
    
    if (avgResponseTime > this.responseTimeThreshold) {
      this.sendAlert('SLOW_RESPONSE_TIME', {
        avg: avgResponseTime,
        threshold: this.responseTimeThreshold
      });
    }
  }
  
  private static sendAlert(type: string, data: any): void {
    console.error(`[ALERT] ${type}:`, data);
    // Aquí podrías integrar con Slack, email, etc.
  }
}
```

---

## 🛠️ Scripts de Utilidad

### **1. Test de Conexión**

```bash
#!/bin/bash
# scripts/test-intelligent.sh

echo "Testing Intelligent System..."

# Test health endpoint
echo "1. Health Check:"
curl -s http://localhost:3000/api/intelligent/health | jq

# Test basic query
echo -e "\n2. Basic Query Test:"
curl -s -X POST http://localhost:3000/api/intelligent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuántos productos hay?"}' | jq

# Test metrics
echo -e "\n3. Metrics:"
curl -s http://localhost:3000/api/intelligent/metrics | jq
```

### **2. Reset de Sistema**

```typescript
// scripts/reset-intelligent.ts
import { IntelligentAssistant } from '../src/presentation/intelligent/intelligent.assistant';

const resetSystem = async () => {
  console.log('Resetting Intelligent System...');
  
  try {
    // Crear nueva instancia
    const assistant = new IntelligentAssistant(
      productRepository,
      customerRepository,
      orderRepository
    );
    
    // Re-inicializar
    await assistant.initialize();
    
    console.log('System reset successfully');
  } catch (error) {
    console.error('Reset failed:', error);
  }
};

resetSystem();
```

### **3. Benchmark Script**

```typescript
// scripts/benchmark-intelligent.ts
const benchmarkQueries = [
  "¿Cuál es el producto más barato?",
  "¿Cuántos clientes tengo?",
  "¿Cómo van las ventas?",
  "Dame un resumen del negocio"
];

const runBenchmark = async () => {
  console.log('Running Intelligent System Benchmark...');
  
  const results = [];
  
  for (const query of benchmarkQueries) {
    console.log(`Testing: "${query}"`);
    
    const startTime = Date.now();
    try {
      const response = await fetch('http://localhost:3000/api/intelligent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      results.push({
        query,
        success: data.success,
        duration,
        tool_used: data.tool_used
      });
      
    } catch (error) {
      results.push({
        query,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }
  
  console.table(results);
};

runBenchmark();
```

---

## 🔍 FAQ - Preguntas Frecuentes

### **Q: ¿Por qué el sistema responde "modo demo"?**
**A:** Falta configurar `ANTHROPIC_API_KEY` en las variables de entorno.

### **Q: ¿Las consultas son muy lentas, qué hacer?**
**A:** Verificar conexión a MongoDB, implementar caché y optimizar consultas.

### **Q: ¿Cómo agregar nuevas herramientas?**
**A:** Crear un nuevo `DynamicTool` en el método `createDynamicTools()`.

### **Q: ¿El sistema no reconoce mi consulta?**
**A:** Mejorar la descripción de las herramientas existentes o agregar más patrones.

### **Q: ¿Cómo monitorear el sistema en producción?**
**A:** Usar los endpoints `/health` y `/metrics`, implementar logging y alertas.

### **Q: ¿Qué hacer si se agota la memoria?**
**A:** Implementar cleanup de caché, limitar concurrencia y optimizar consultas.

---

*Troubleshooting LangChain System - Última actualización: 25 Enero 2025*
