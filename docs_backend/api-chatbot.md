# 🤖 Chatbot e IA

Sistema inteligente de chatbot con capacidades de RAG (Retrieval-Augmented Generation), embeddings vectoriales y búsqueda semántica para brindar asistencia automatizada a los clientes.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [🧠 Sistema RAG](#-sistema-rag)
- [🔍 Búsqueda Semántica](#-búsqueda-semántica)
- [💾 Gestión de Embeddings](#-gestión-de-embeddings)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Chatbot Inteligente
- **Conversaciones contextuales** con memoria de sesión
- **Respuestas basadas en RAG** con información actualizada
- **Integración con catálogo** de productos
- **Búsqueda semántica** en la base de conocimientos
- **Historial de conversaciones** por usuario
- **Múltiples sesiones** simultáneas

### ✅ Sistema RAG (Retrieval-Augmented Generation)
- **Base de conocimientos** vectorial
- **Recuperación de contexto** relevante
- **Generación de respuestas** aumentadas
- **Actualización automática** de embeddings
- **Índice vectorial** optimizado

### ✅ Gestión de Embeddings
- **Procesamiento de texto** a vectores
- **Almacenamiento eficiente** en MongoDB
- **Búsqueda por similitud** coseno
- **Indexación automática** de contenido
- **Actualización incremental**

## 📋 API Endpoints

### Conversaciones del Chatbot

#### Enviar Mensaje al Chatbot
```http
POST /api/chat/message
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "message": "¿Qué productos de electrónicos tienen disponibles?",
  "sessionId": "sess_64a7f8c9b123456789abcdef",
  "context": {
    "userId": "64a7f8c9b123456789abcde0",
    "currentPage": "/products",
    "cartItems": 3
  }
}
```

**Respuesta Exitosa (200):**
```json
{
  "sessionId": "sess_64a7f8c9b123456789abcdef",
  "messageId": "msg_64a7f8c9b123456789abcdef",
  "response": {
    "text": "Tenemos una amplia variedad de productos electrónicos disponibles. Algunos de nuestros más populares incluyen:\n\n📱 **Smartphones:**\n- iPhone 15 Pro - $1,299.99\n- Samsung Galaxy S24 - $1,199.99\n\n💻 **Laptops:**\n- MacBook Air M2 - $1,499.99\n- Dell XPS 13 - $1,299.99\n\n¿Te interesa alguna categoría específica?",
    "type": "text",
    "suggestions": [
      "Ver smartphones",
      "Ver laptops", 
      "Ver accesorios",
      "Comparar precios"
    ],
    "products": [
      {
        "id": "64a7f8c9b123456789abcde1",
        "name": "iPhone 15 Pro",
        "price": 1299.99,
        "image": "https://example.com/iphone15.jpg"
      }
    ]
  },
  "context": {
    "intent": "product_inquiry",
    "category": "electronics",
    "confidence": 0.95
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Obtener Historial de Conversación
```http
GET /api/chat/sessions/:sessionId/messages?page=1&limit=20
Authorization: Bearer <jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "sessionId": "sess_64a7f8c9b123456789abcdef",
  "messages": [
    {
      "id": "msg_64a7f8c9b123456789abcde0",
      "type": "user",
      "content": "¿Qué productos de electrónicos tienen disponibles?",
      "timestamp": "2024-01-15T10:29:00.000Z"
    },
    {
      "id": "msg_64a7f8c9b123456789abcde1",
      "type": "assistant",
      "content": "Tenemos una amplia variedad de productos electrónicos...",
      "suggestions": ["Ver smartphones", "Ver laptops"],
      "products": [...],
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20
}
```

#### Crear Nueva Sesión
```http
POST /api/chat/sessions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Consulta sobre productos",
  "context": {
    "userId": "64a7f8c9b123456789abcde0",
    "userAgent": "Mozilla/5.0...",
    "referrer": "/products"
  }
}
```

#### Listar Sesiones del Usuario
```http
GET /api/chat/sessions?page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "sessions": [
    {
      "id": "sess_64a7f8c9b123456789abcdef",
      "title": "Consulta sobre productos",
      "lastMessage": "¿Qué productos de electrónicos tienen disponibles?",
      "lastActivity": "2024-01-15T10:30:00.000Z",
      "messageCount": 6,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Búsqueda Semántica

#### Buscar en Base de Conocimientos
```http
POST /api/chat/search
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "query": "política de devoluciones",
  "limit": 5,
  "threshold": 0.7,
  "categories": ["policies", "faq"]
}
```

**Respuesta Exitosa (200):**
```json
{
  "results": [
    {
      "id": "emb_64a7f8c9b123456789abcdef",
      "content": "Nuestra política de devoluciones permite devolver productos dentro de 30 días...",
      "similarity": 0.95,
      "category": "policies",
      "source": "return_policy.md",
      "metadata": {
        "lastUpdated": "2024-01-10T00:00:00.000Z",
        "type": "policy"
      }
    },
    {
      "id": "emb_64a7f8c9b123456789abcde0",
      "content": "Para procesar una devolución, sigue estos pasos...",
      "similarity": 0.87,
      "category": "faq",
      "source": "faq.md",
      "metadata": {
        "lastUpdated": "2024-01-05T00:00:00.000Z",
        "type": "faq"
      }
    }
  ],
  "total": 2,
  "query": "política de devoluciones",
  "executionTime": "45ms"
}
```

### Gestión de Embeddings (Solo Admin)

#### Procesar Nuevo Contenido
```http
POST /api/admin/embeddings/process
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "content": "Nuestra nueva política de envíos incluye envío gratuito para compras superiores a $50...",
  "category": "policies",
  "source": "shipping_policy_2024.md",
  "metadata": {
    "type": "policy",
    "version": "2.0",
    "author": "admin"
  }
}
```

#### Reindexar Base de Conocimientos
```http
POST /api/admin/embeddings/reindex
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "sources": ["products", "policies", "faq"],
  "forceUpdate": true
}
```

#### Listar Embeddings
```http
GET /api/admin/embeddings?page=1&limit=20&category=policies
Authorization: Bearer <admin-jwt-token>
```

## 🧠 Sistema RAG

### Arquitectura del RAG

```typescript
// src/domain/use-cases/chat/rag-chat.use-case.ts
export class RAGChatUseCase {
  constructor(
    private readonly embeddingRepository: EmbeddingRepository,
    private readonly chatRepository: ChatRepository,
    private readonly llmService: LLMService,
    private readonly embeddingService: EmbeddingService
  ) {}

  async execute(query: string, sessionId: string): Promise<ChatResponse> {
    // 1. Generar embedding de la consulta
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    
    // 2. Buscar contenido relevante
    const relevantContent = await this.embeddingRepository.findSimilar(
      queryEmbedding,
      {
        limit: 5,
        threshold: 0.7
      }
    );
    
    // 3. Obtener contexto de la conversación
    const sessionContext = await this.chatRepository.getSessionContext(sessionId);
    
    // 4. Construir prompt aumentado
    const augmentedPrompt = this.buildAugmentedPrompt(
      query,
      relevantContent,
      sessionContext
    );
    
    // 5. Generar respuesta con LLM
    const response = await this.llmService.generateResponse(augmentedPrompt);
    
    // 6. Guardar mensaje en la sesión
    await this.chatRepository.saveMessage({
      sessionId,
      type: 'assistant',
      content: response.text,
      context: {
        retrievedContent: relevantContent.map(c => c.id),
        confidence: response.confidence
      }
    });
    
    return response;
  }

  private buildAugmentedPrompt(
    query: string, 
    context: EmbeddingEntity[], 
    sessionHistory: ChatMessage[]
  ): string {
    const contextText = context
      .map(c => `Fuente: ${c.source}\nContenido: ${c.content}`)
      .join('\n\n');

    const recentHistory = sessionHistory
      .slice(-6) // Últimos 6 mensajes
      .map(m => `${m.type}: ${m.content}`)
      .join('\n');

    return `
Eres un asistente virtual especializado en ayudar a clientes de un e-commerce.

CONTEXTO RELEVANTE:
${contextText}

HISTORIAL RECIENTE:
${recentHistory}

CONSULTA ACTUAL: ${query}

INSTRUCCIONES:
- Responde de manera útil y precisa basándote en el contexto proporcionado
- Si no tienes información suficiente, indícalo claramente
- Mantén un tono amigable y profesional
- Sugiere acciones concretas cuando sea apropiado
- Si la consulta es sobre productos, incluye información específica como precios y disponibilidad

RESPUESTA:`;
  }
}
```

### Servicio de Embeddings

```typescript
// src/infrastructure/services/embedding.service.ts
export class EmbeddingServiceImpl implements EmbeddingService {
  private model: any;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    // Inicializar modelo de embeddings (ej: sentence-transformers)
    const { pipeline } = await import('@xenova/transformers');
    this.model = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Preprocesar texto
      const cleanText = this.preprocessText(text);
      
      // Generar embedding
      const output = await this.model(cleanText, {
        pooling: 'mean',
        normalize: true
      });
      
      return Array.from(output.data);
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw new CustomError('Error processing text');
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    // Similitud coseno
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

## 🔍 Búsqueda Semántica

### Implementación de Búsqueda Vectorial

```typescript
// src/infrastructure/datasources/embedding-mongo.datasource.ts
export class EmbeddingMongoDataSourceImpl implements EmbeddingDatasource {
  constructor(private readonly embeddingModel: Model<any>) {}

  async findSimilar(
    queryEmbedding: number[], 
    options: SearchOptions
  ): Promise<EmbeddingEntity[]> {
    const { limit = 5, threshold = 0.7, categories } = options;

    // Construir pipeline de agregación para búsqueda vectorial
    const pipeline: any[] = [
      // Agregar campo de similitud calculada
      {
        $addFields: {
          similarity: {
            $function: {
              body: `
                function(queryVector, docVector) {
                  if (!docVector || !queryVector) return 0;
                  
                  let dotProduct = 0;
                  let magnitude1 = 0;
                  let magnitude2 = 0;
                  
                  for (let i = 0; i < Math.min(queryVector.length, docVector.length); i++) {
                    dotProduct += queryVector[i] * docVector[i];
                    magnitude1 += queryVector[i] * queryVector[i];
                    magnitude2 += docVector[i] * docVector[i];
                  }
                  
                  magnitude1 = Math.sqrt(magnitude1);
                  magnitude2 = Math.sqrt(magnitude2);
                  
                  if (magnitude1 === 0 || magnitude2 === 0) return 0;
                  
                  return dotProduct / (magnitude1 * magnitude2);
                }
              `,
              args: [queryEmbedding, "$vector"],
              lang: "js"
            }
          }
        }
      },
      
      // Filtrar por umbral de similitud
      {
        $match: {
          similarity: { $gte: threshold }
        }
      }
    ];

    // Filtrar por categorías si se especifican
    if (categories && categories.length > 0) {
      pipeline.unshift({
        $match: {
          category: { $in: categories }
        }
      });
    }

    // Ordenar por similitud y limitar resultados
    pipeline.push(
      { $sort: { similarity: -1 } },
      { $limit: limit }
    );

    const results = await this.embeddingModel.aggregate(pipeline);
    
    return results.map(doc => EmbeddingMapper.fromObjectToEntity(doc));
  }

  async createEmbedding(embeddingData: CreateEmbeddingDto): Promise<EmbeddingEntity> {
    const embedding = new this.embeddingModel(embeddingData);
    const saved = await embedding.save();
    return EmbeddingMapper.fromObjectToEntity(saved);
  }

  async updateEmbedding(id: string, updateData: UpdateEmbeddingDto): Promise<EmbeddingEntity> {
    const updated = await this.embeddingModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updated) throw CustomError.notFound('Embedding not found');
    return EmbeddingMapper.fromObjectToEntity(updated);
  }
}
```

### Indexación Automática de Contenido

```typescript
// src/domain/use-cases/embeddings/auto-index.use-case.ts
export class AutoIndexContentUseCase {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly embeddingRepository: EmbeddingRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async indexProducts(): Promise<void> {
    logger.info('Starting product indexing...');
    
    const products = await this.productRepository.findAll();
    
    for (const product of products) {
      try {
        // Crear texto combinado para embedding
        const productText = this.createProductText(product);
        
        // Generar embedding
        const vector = await this.embeddingService.generateEmbedding(productText);
        
        // Verificar si ya existe embedding para este producto
        const existingEmbedding = await this.embeddingRepository.findBySourceAndId(
          'product',
          product.id
        );
        
        if (existingEmbedding) {
          // Actualizar embedding existente
          await this.embeddingRepository.update(existingEmbedding.id, {
            vector,
            content: productText,
            updatedAt: new Date()
          });
        } else {
          // Crear nuevo embedding
          await this.embeddingRepository.create({
            content: productText,
            vector,
            category: 'products',
            source: 'product',
            sourceId: product.id,
            metadata: {
              productName: product.name,
              categoryId: product.categoryId,
              price: product.price,
              isActive: product.isActive
            }
          });
        }
        
        logger.debug(`Indexed product: ${product.name}`);
      } catch (error) {
        logger.error(`Error indexing product ${product.id}:`, error);
      }
    }
    
    logger.info('Product indexing completed');
  }

  private createProductText(product: ProductEntity): string {
    return `
Producto: ${product.name}
Descripción: ${product.description || ''}
Categoría: ${product.category?.name || ''}
Precio: $${product.price}
Tags: ${product.tags?.map(t => t.name).join(', ') || ''}
Características: ${Object.entries(product.specifications || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}
`.trim();
  }
}
```

## 💡 Ejemplos de Uso

### Cliente Frontend - Chat Widget

```javascript
// Componente React para el chat
import React, { useState, useEffect, useRef } from 'react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Crear sesión al abrir el chat
  useEffect(() => {
    if (isOpen && !sessionId) {
      createChatSession();
    }
  }, [isOpen]);

  // Scroll automático a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createChatSession = async () => {
    try {
      const response = await authenticatedFetch('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Nueva consulta',
          context: {
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent
          }
        })
      });

      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Mensaje de bienvenida
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date().toISOString(),
        suggestions: [
          'Ver productos populares',
          'Información de envíos',
          'Políticas de devolución',
          'Estado de mi pedido'
        ]
      }]);
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  const sendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await authenticatedFetch('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          sessionId,
          context: {
            currentPage: window.location.pathname,
            cartItems: getCartItemCount() // Función auxiliar
          }
        })
      });

      const data = await response.json();

      const assistantMessage = {
        id: data.messageId,
        type: 'assistant',
        content: data.response.text,
        suggestions: data.response.suggestions || [],
        products: data.response.products || [],
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : 'closed'}`}>
      {/* Botón flotante */}
      {!isOpen && (
        <button 
          className="chat-toggle"
          onClick={() => setIsOpen(true)}
        >
          💬
        </button>
      )}

      {/* Panel del chat */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <h3>Asistente Virtual</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Mensajes */}
          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.content}
                </div>
                
                {/* Productos sugeridos */}
                {message.products && message.products.length > 0 && (
                  <div className="suggested-products">
                    {message.products.map(product => (
                      <div key={product.id} className="product-card">
                        <img src={product.image} alt={product.name} />
                        <div>
                          <h4>{product.name}</h4>
                          <p>${product.price}</p>
                          <button onClick={() => window.location.href = `/products/${product.id}`}>
                            Ver producto
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Sugerencias de respuesta */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-chip"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              rows={1}
            />
            <button 
              onClick={() => sendMessage()}
              disabled={isLoading || !inputValue.trim()}
            >
              📤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
```

### Búsqueda Semántica en Productos

```javascript
// Hook personalizado para búsqueda semántica
const useSemanticSearch = () => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchProducts = async (query, options = {}) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await authenticatedFetch('/api/chat/search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          categories: ['products'],
          limit: options.limit || 10,
          threshold: options.threshold || 0.6
        })
      });

      const data = await response.json();
      
      // Convertir resultados de embeddings a productos
      const productResults = await Promise.all(
        data.results.map(async (result) => {
          if (result.metadata?.productId) {
            const productResponse = await fetch(`/api/products/${result.metadata.productId}`);
            const product = await productResponse.json();
            return {
              ...product,
              similarity: result.similarity,
              matchedContent: result.content
            };
          }
          return null;
        })
      );

      setResults(productResults.filter(Boolean));
    } catch (error) {
      console.error('Error in semantic search:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return { results, isSearching, searchProducts };
};

// Componente de búsqueda inteligente
const SmartProductSearch = () => {
  const [query, setQuery] = useState('');
  const { results, isSearching, searchProducts } = useSemanticSearch();
  const [debouncedQuery] = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      searchProducts(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <div className="smart-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca productos por descripción natural..."
        />
        {isSearching && <span className="loading-spinner">🔍</span>}
      </div>

      {results.length > 0 && (
        <div className="search-results">
          <h3>Resultados encontrados:</h3>
          {results.map(product => (
            <div key={product.id} className="search-result-item">
              <img src={product.images[0]} alt={product.name} />
              <div className="product-info">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <div className="match-info">
                  <span className="similarity">
                    Similitud: {Math.round(product.similarity * 100)}%
                  </span>
                  <span className="matched-content">
                    "{product.matchedContent.substring(0, 100)}..."
                  </span>
                </div>
                <div className="product-actions">
                  <span className="price">${product.price}</span>
                  <button onClick={() => addToCart(product.id)}>
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## ⚙️ Configuración

### Variables de Entorno para IA/Chatbot

```env
# Configuración del modelo de embeddings
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# Configuración de LLM (si usas APIs externas)
OPENAI_API_KEY=tu-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Configuración de búsqueda
SIMILARITY_THRESHOLD=0.7
MAX_SEARCH_RESULTS=10

# Base de datos para vectores
MONGO_URL=mongodb://localhost:27017/startup-ecommerce
VECTOR_COLLECTION=embeddings

# Configuración de cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

### Configuración del Modelo de Embeddings

```typescript
// src/configs/ai.config.ts
export const AI_CONFIG = {
  embedding: {
    model: envs.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    dimension: envs.EMBEDDING_DIMENSION || 384,
    batchSize: 32,
    timeout: 30000
  },
  
  search: {
    defaultThreshold: envs.SIMILARITY_THRESHOLD || 0.7,
    maxResults: envs.MAX_SEARCH_RESULTS || 10,
    cacheResults: true,
    cacheTTL: envs.CACHE_TTL || 3600
  },
  
  chat: {
    maxContextMessages: 10,
    responseTimeout: 15000,
    enableSuggestions: true,
    enableProductRecommendations: true
  }
};
```

### Esquema MongoDB para Embeddings

```typescript
// src/data/mongodb/models/embeddings/embedding.model.ts
import { Schema, model } from 'mongoose';

const embeddingSchema = new Schema({
  content: {
    type: String,
    required: true,
    index: 'text'
  },
  vector: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 384; // Dimensión del modelo
      },
      message: 'Vector must have exactly 384 dimensions'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['products', 'policies', 'faq', 'general'],
    index: true
  },
  source: {
    type: String,
    required: true
  },
  sourceId: {
    type: String,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
embeddingSchema.index({ category: 1, isActive: 1 });
embeddingSchema.index({ source: 1, sourceId: 1 });

export const EmbeddingModel = model('Embedding', embeddingSchema);
```

---

## 🔗 Enlaces Relacionados

- [📦 Gestión de Productos](./api-products.md)
- [👥 Gestión de Clientes](./api-customers.md)
- [🛒 Carrito y Pedidos](./api-orders.md)
- [⚙️ Panel de Administración](./api-admin.md)
- [📧 Sistema de Notificaciones](./notifications.md)

---

*Última actualización: Enero 2024*
