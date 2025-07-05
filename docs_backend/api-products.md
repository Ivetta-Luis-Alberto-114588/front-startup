# 📦 Gestión de Productos y Catálogo

Sistema completo de gestión de productos con búsqueda avanzada, categorización y etiquetado inteligente.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [🔍 Búsqueda Avanzada](#-búsqueda-avanzada)
- [🏷️ Sistema de Tags](#-sistema-de-tags)
- [📁 Categorías y Unidades](#-categorías-y-unidades)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [🚨 Troubleshooting](#-troubleshooting)
- [✅ Mejores Prácticas](#-mejores-prácticas)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Productos
- **CRUD completo** con validaciones
- **Búsqueda por texto** (nombre, descripción)
- **Filtrado avanzado** por categoría, tags, precio
- **Ordenamiento** configurable
- **Gestión de stock** básica
- **Cálculo automático** de precios con IVA
- **Subida de imágenes** con Cloudinary
- **Paginación** optimizada

### ✅ Categorías
- **CRUD completo** para categorías
- **Jerarquía** de categorías (padre-hijo)
- **Conteo automático** de productos por categoría
- **Validación** de nombres únicos

### ✅ Tags (Etiquetas)
- **Sistema flexible** de etiquetado
- **Asignación múltiple** a productos
- **Filtrado** por combinaciones de tags
- **Gestión centralizada** de etiquetas

### ✅ Unidades de Medida
- **Definición** de unidades (kg, lt, unidad, etc.)
- **Asociación** con productos
- **Validación** de tipos

## 📋 API Endpoints

### 🛍️ Productos (`/api/products`)

#### `GET /api/products` - Listar con Búsqueda Avanzada
**El endpoint más potente del sistema de productos**

**Query Parameters:**
```
page=1                    # Página (default: 1)
limit=10                 # Elementos por página (default: 10)
search=termo             # Búsqueda por nombre/descripción
category=cat1,cat2       # Filtrar por categorías (IDs separados por coma)
tags=tag1,tag2          # Filtrar por tags (IDs separados por coma)
minPrice=100            # Precio mínimo
maxPrice=1000           # Precio máximo
sortBy=name             # Campo para ordenar
sortOrder=asc           # Orden (asc/desc)
inStock=true            # Solo productos en stock
```

**Ejemplo de búsqueda completa:**
```
GET /api/products?search=laptop&category=electronics&tags=popular,offer&minPrice=500&maxPrice=2000&sortBy=price&sortOrder=asc&page=1&limit=20
```

**Respuesta:**
```json
{
  "total": 156,
  "products": [
    {
      "id": "prod123",
      "name": "Laptop Gaming Pro",
      "description": "Laptop para gaming de alta gama...",
      "price": 1500.00,
      "priceWithTax": 1815.00,
      "taxRate": 21,
      "stock": 25,
      "category": {
        "id": "cat1",
        "name": "Electrónicos",
        "description": "Productos electrónicos"
      },
      "unit": {
        "id": "unit1",
        "name": "Unidad",
        "abbreviation": "ud"
      },
      "tags": [
        {
          "id": "tag1",
          "name": "Popular",
          "color": "#ff5722"
        },
        {
          "id": "tag2",
          "name": "Oferta",
          "color": "#4caf50"
        }
      ],
      "images": [
        "https://res.cloudinary.com/startup/image/upload/v1/products/laptop1.jpg"
      ],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "appliedFilters": {
      "search": "laptop",
      "categories": ["electronics"],
      "tags": ["popular", "offer"],
      "priceRange": { "min": 500, "max": 2000 }
    },
    "availableFilters": {
      "categories": [
        { "id": "cat1", "name": "Electrónicos", "count": 45 },
        { "id": "cat2", "name": "Ropa", "count": 23 }
      ],
      "tags": [
        { "id": "tag1", "name": "Popular", "count": 67 },
        { "id": "tag2", "name": "Oferta", "count": 34 }
      ],
      "priceRange": { "min": 10, "max": 5000 }
    }
  }
}
```

#### `GET /api/products/:id` - Obtener Producto
**Respuesta:**
```json
{
  "product": {
    "id": "prod123",
    "name": "Laptop Gaming Pro",
    "description": "Descripción completa del producto...",
    "price": 1500.00,
    "priceWithTax": 1815.00,
    "taxRate": 21,
    "stock": 25,
    "category": {...},
    "unit": {...},
    "tags": [...],
    "images": [...],
    "specifications": {
      "processor": "Intel i7",
      "ram": "16GB",
      "storage": "512GB SSD"
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### `POST /api/products` - Crear Producto (Admin)
**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
{
  name: "Nuevo Producto",
  description: "Descripción del producto",
  price: 999.99,
  taxRate: 21,
  stock: 100,
  categoryId: "cat123",
  unitId: "unit123",
  tags: ["tag1", "tag2"],
  specifications: JSON.stringify({
    color: "Negro",
    size: "XL"
  }),
  images: [File1, File2] // Archivos de imagen
}
```

#### `PUT /api/products/:id` - Actualizar Producto (Admin)
**Body:** Similar al POST, todos los campos opcionales

#### `DELETE /api/products/:id` - Eliminar Producto (Admin)

### 📁 Categorías (`/api/categories`)

#### `GET /api/categories` - Listar Categorías
**Query Parameters:**
```
page=1
limit=10
search=termo
parentId=cat123    # Filtrar por categoría padre
```

**Respuesta:**
```json
{
  "total": 25,
  "categories": [
    {
      "id": "cat1",
      "name": "Electrónicos",
      "description": "Productos electrónicos y tecnología",
      "parentCategory": null,
      "subcategories": [
        {
          "id": "cat1-1",
          "name": "Laptops",
          "productCount": 15
        }
      ],
      "productCount": 45,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### `POST /api/categories` - Crear Categoría (Admin)
**Body:**
```json
{
  "name": "Nueva Categoría",
  "description": "Descripción de la categoría",
  "parentCategoryId": "cat123" // Opcional
}
```

### 🏷️ Tags (`/api/tags`)

#### `GET /api/tags` - Listar Tags
**Respuesta:**
```json
{
  "total": 15,
  "tags": [
    {
      "id": "tag1",
      "name": "Popular",
      "description": "Productos más vendidos",
      "color": "#ff5722",
      "productCount": 67,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### `POST /api/tags` - Crear Tag (Admin)
**Body:**
```json
{
  "name": "Nuevo Tag",
  "description": "Descripción del tag",
  "color": "#2196f3"
}
```

### 📏 Unidades (`/api/units`)

#### `GET /api/units` - Listar Unidades
**Respuesta:**
```json
{
  "units": [
    {
      "id": "unit1",
      "name": "Kilogramo",
      "abbreviation": "kg",
      "type": "weight",
      "productCount": 23
    },
    {
      "id": "unit2",
      "name": "Unidad",
      "abbreviation": "ud",
      "type": "count",
      "productCount": 156
    }
  ]
}
```

## 🔍 Búsqueda Avanzada

### Capacidades de Búsqueda

#### 🔤 Búsqueda por Texto
```bash
# Buscar en nombre y descripción
GET /api/products?search=laptop gaming

# Búsqueda parcial e insensible a mayúsculas
GET /api/products?search=LAP
```

#### 🏷️ Filtrado por Categorías
```bash
# Una categoría
GET /api/products?category=electronics

# Múltiples categorías (OR)
GET /api/products?category=electronics,clothing,books
```

#### 🎯 Filtrado por Tags
```bash
# Un tag
GET /api/products?tags=popular

# Múltiples tags (AND)
GET /api/products?tags=popular,offer,new
```

#### 💰 Filtrado por Precio
```bash
# Rango de precios
GET /api/products?minPrice=100&maxPrice=500

# Solo precio mínimo
GET /api/products?minPrice=1000

# Solo precio máximo
GET /api/products?maxPrice=100
```

#### 📊 Ordenamiento
```bash
# Por nombre ascendente
GET /api/products?sortBy=name&sortOrder=asc

# Por precio descendente
GET /api/products?sortBy=price&sortOrder=desc

# Por fecha de creación
GET /api/products?sortBy=createdAt&sortOrder=desc

# Opciones: name, price, createdAt, stock
```

#### 📦 Filtros de Stock
```bash
# Solo productos en stock
GET /api/products?inStock=true

# Incluir productos sin stock
GET /api/products?inStock=false
```

### Búsqueda Combinada Completa

```bash
GET /api/products?search=smartphone&category=electronics&tags=popular,offer&minPrice=200&maxPrice=800&sortBy=price&sortOrder=asc&inStock=true&page=1&limit=20
```

Esta búsqueda encuentra:
- Productos que contengan "smartphone" en nombre/descripción
- De la categoría "electronics"
- Con tags "popular" Y "offer"
- Precio entre $200 y $800
- Solo en stock
- Ordenados por precio ascendente
- Página 1, 20 elementos

## 🏷️ Sistema de Tags

### Tipos de Tags Comunes

#### 🔥 Estado del Producto
- **Nuevo** - Productos recién agregados
- **Popular** - Más vendidos
- **Oferta** - En promoción
- **Liquidación** - Últimas unidades

#### 🎯 Características
- **Premium** - Productos de alta gama
- **Ecológico** - Productos sustentables
- **Importado** - Productos internacionales
- **Artesanal** - Productos hechos a mano

#### 📦 Disponibilidad
- **Limitado** - Stock reducido
- **Exclusivo** - Edición limitada
- **Pre-venta** - Disponible próximamente

### Gestión de Tags

#### Crear Tag Estratégico
```json
POST /api/tags
{
  "name": "Súper Oferta",
  "description": "Productos con descuentos excepcionales",
  "color": "#e91e63"
}
```

#### Asignar Tags a Producto
```json
PUT /api/products/prod123
{
  "tags": ["popular", "offer", "limited"]
}
```

#### Buscar por Combinación de Tags
```bash
# Productos que sean populares Y estén en oferta
GET /api/products?tags=popular,offer

# El sistema usa AND logic para múltiples tags
```

## 📁 Categorías y Unidades

### Estructura de Categorías

#### Categorías Jerárquicas
```
Electrónicos
├── Computadoras
│   ├── Laptops
│   ├── Desktops
│   └── Tablets
├── Celulares
│   ├── Smartphones
│   └── Accesorios
└── Audio
    ├── Auriculares
    └── Parlantes
```

#### Crear Categoría con Padre
```json
POST /api/categories
{
  "name": "Laptops",
  "description": "Computadoras portátiles",
  "parentCategoryId": "computadoras-id"
}
```

### Unidades de Medida

#### Tipos de Unidades
```json
[
  {
    "name": "Unidad",
    "abbreviation": "ud",
    "type": "count"
  },
  {
    "name": "Kilogramo",
    "abbreviation": "kg",
    "type": "weight"
  },
  {
    "name": "Litro",
    "abbreviation": "lt",
    "type": "volume"
  },
  {
    "name": "Metro",
    "abbreviation": "m",
    "type": "length"
  }
]
```

## 💡 Ejemplos de Uso

### Catálogo de E-commerce Frontend

```javascript
// Búsqueda con filtros dinámicos
const searchProducts = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  params.append('sortBy', filters.sortBy || 'name');
  params.append('sortOrder', filters.sortOrder || 'asc');
  params.append('page', filters.page || 1);
  params.append('limit', filters.limit || 20);

  const response = await fetch(`/api/products?${params}`);
  return response.json();
};

// Ejemplo de uso
const results = await searchProducts({
  search: 'laptop',
  category: 'electronics',
  tags: ['popular', 'offer'],
  minPrice: 500,
  maxPrice: 2000,
  sortBy: 'price',
  sortOrder: 'asc',
  page: 1,
  limit: 20
});
```

### Panel de Administración

```javascript
// Crear producto con imágenes
const createProduct = async (productData, images) => {
  const formData = new FormData();
  
  // Datos del producto
  Object.keys(productData).forEach(key => {
    if (key === 'specifications') {
      formData.append(key, JSON.stringify(productData[key]));
    } else if (key === 'tags') {
      formData.append(key, JSON.stringify(productData[key]));
    } else {
      formData.append(key, productData[key]);
    }
  });
  
  // Imágenes
  images.forEach(image => {
    formData.append('images', image);
  });

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  return response.json();
};
```

### Sistema de Recomendaciones

```javascript
// Productos relacionados por tags
const getRelatedProducts = async (productId) => {
  const product = await fetch(`/api/products/${productId}`).then(r => r.json());
  const tags = product.product.tags.map(tag => tag.id).join(',');
  
  const related = await fetch(`/api/products?tags=${tags}&limit=4`);
  return related.json();
};

// Productos populares de una categoría
const getPopularByCategory = async (categoryId) => {
  const response = await fetch(
    `/api/products?category=${categoryId}&tags=popular&sortBy=createdAt&sortOrder=desc&limit=8`  );
  return response.json();
};
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Error: "Producto no encontrado"
**Síntoma:** `404 - Product not found`
**Causa:** ID de producto inválido o producto eliminado
**Solución:**
```javascript
// Verificar que el ID sea válido
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

if (!isValidObjectId(productId)) {
  throw new Error('ID de producto inválido');
}
```

#### Error: "Stock insuficiente"
**Síntoma:** `400 - Insufficient stock`
**Causa:** Intento de comprar más productos de los disponibles
**Solución:**
```javascript
// Verificar stock antes de procesar
const product = await Product.findById(productId);
if (product.stock < quantity) {
  throw new Error(`Solo quedan ${product.stock} unidades disponibles`);
}
```

#### Error de Subida de Imágenes
**Síntoma:** `500 - Image upload failed`
**Causa:** Configuración incorrecta de Cloudinary o archivos muy grandes
**Solución:**
```javascript
// Verificar configuración de Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verificar tamaño de archivo
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_FILE_SIZE) {
  throw new Error('Archivo muy grande. Máximo 5MB');
}
```

#### Búsqueda Lenta
**Síntoma:** Consultas de búsqueda muy lentas
**Causa:** Falta de índices en MongoDB
**Solución:**
```javascript
// Crear índices de texto para búsqueda
db.products.createIndex({ 
  "name": "text", 
  "description": "text" 
}, {
  weights: {
    name: 10,
    description: 5
  }
});

// Índices compuestos para filtros
db.products.createIndex({ "category": 1, "price": 1 });
db.products.createIndex({ "tags": 1 });
```

### Logs de Depuración

```javascript
// Habilitar logs detallados
process.env.DEBUG = 'products:*';

// En el código
const debug = require('debug')('products:search');
debug('Searching products with filters:', filters);
```

## ✅ Mejores Prácticas

### 🔒 Seguridad
- **Validar siempre** todos los inputs del usuario
- **Sanitizar** datos antes de guardar en BD
- **Verificar permisos** antes de operaciones CRUD
- **Limitar tamaño** de archivos subidos

```javascript
const sanitizeInput = (input) => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

### 📈 Performance
- **Usar paginación** en todas las listas
- **Implementar caché** para consultas frecuentes
- **Optimizar imágenes** antes de subir
- **Lazy loading** de imágenes en frontend

```javascript
// Ejemplo de caché con Redis
const cached = await redis.get(`products:${cacheKey}`);
if (cached) {
  return JSON.parse(cached);
}
```

### 🎯 Usabilidad
- **Búsqueda tolerante** a errores de tipeo
- **Filtros intuitivos** y combinables
- **Sugerencias** de búsqueda
- **URLs amigables** para productos

```javascript
// Búsqueda tolerante a errores
const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
```

### 🔄 Mantenimiento
- **Logs detallados** de operaciones
- **Monitoreo** de performance
- **Backup automático** de imágenes
- **Limpieza** de productos obsoletos

```javascript
// Cleanup automático
const cleanupOldProducts = async () => {
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  
  await Product.deleteMany({
    createdAt: { $lt: sixMonthsAgo },
    stock: 0,
    status: 'discontinued'
  });
};
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Cloudinary para imágenes
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Configuración de productos
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
DEFAULT_TAX_RATE=21
MAX_IMAGES_PER_PRODUCT=5
```

### Configuración de Multer

```typescript
// Configuración para subida de imágenes
const multerConfig = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 5 // Máximo 5 archivos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
};
```

### Índices de MongoDB

```javascript
// Índices para optimizar búsquedas
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1, "price": 1 });
db.products.createIndex({ "tags": 1 });
db.products.createIndex({ "createdAt": -1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "stock": 1 });
```

### Seeders

```bash
# Poblar con datos de ejemplo
npm run seed:categories  # Categorías básicas
npm run seed:units      # Unidades de medida
npm run seed:tags       # Tags comunes
npm run seed:products   # Productos de ejemplo
```

---

Para más información sobre otros módulos:
- [🛒 Carrito y Pedidos](./api-orders.md)
- [👥 Clientes y Direcciones](./api-customers.md)
- [💳 Integración MercadoPago](./mercadopago.md)
