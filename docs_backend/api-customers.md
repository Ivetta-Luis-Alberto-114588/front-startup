# 👥 Gestión de Clientes y Direcciones

Sistema completo de gestión de clientes con soporte para usuarios registrados e invitados, direcciones múltiples y ubicaciones geográficas.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [🏠 Sistema de Direcciones](#-sistema-de-direcciones)
- [🌍 Ubicaciones Geográficas](#-ubicaciones-geográficas)
- [👤 Tipos de Clientes](#-tipos-de-clientes)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [🚨 Troubleshooting](#-troubleshooting)
- [✅ Mejores Prácticas](#-mejores-prácticas)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Gestión de Clientes
- **CRUD completo** para clientes
- **Soporte para invitados** y usuarios registrados
- **Vinculación automática** usuario-cliente
- **Validación** de datos de contacto
- **Búsqueda y filtrado** avanzado

### ✅ Sistema de Direcciones
- **Múltiples direcciones** por cliente
- **Dirección predeterminada** configurable
- **Validación** de direcciones
- **Integración** con ciudades y barrios
- **Historial** de direcciones usadas

### ✅ Ubicaciones Geográficas
- **Gestión de ciudades** y barrios
- **Jerarquía** ciudad → barrio
- **Validación** de ubicaciones
- **Búsqueda** por ubicación

## 📋 API Endpoints

### 👤 Clientes (`/api/customers`)

#### `GET /api/customers` - Listar Clientes (Admin)
**Query Parameters:**
```
page=1                    # Página (default: 1)
limit=10                 # Elementos por página (default: 10)
search=juan              # Búsqueda por nombre/email/teléfono
isGuest=false           # Filtrar por tipo (true=invitados, false=registrados)
cityId=city123          # Filtrar por ciudad
neighborhoodId=neigh123 # Filtrar por barrio
sortBy=name             # Campo para ordenar
sortOrder=asc           # Orden (asc/desc)
```

**Ejemplo:**
```
GET /api/customers?search=juan&isGuest=false&cityId=city123&page=1&limit=20
```

**Respuesta:**
```json
{
  "total": 245,
  "customers": [
    {
      "id": "cust123",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "phone": "+54 11 1234-5678",
      "documentType": "DNI",
      "documentNumber": "12345678",
      "isGuest": false,
      "user": {
        "id": "user123",
        "email": "juan@email.com",
        "role": "CLIENT_ROLE"
      },
      "defaultAddress": {
        "id": "addr123",
        "street": "Av. Corrientes 1234",
        "number": "1234",
        "floor": "2",
        "apartment": "B",
        "neighborhood": {
          "id": "neigh123",
          "name": "Balvanera",
          "city": {
            "id": "city123",
            "name": "Ciudad Autónoma de Buenos Aires"
          }
        },
        "zipCode": "1043",
        "isDefault": true
      },
      "addressCount": 3,
      "orderCount": 12,
      "totalPurchased": 4500.00,
      "lastOrderDate": "2025-01-10T15:30:00Z",
      "createdAt": "2024-06-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  },
  "statistics": {
    "totalCustomers": 245,
    "registeredCustomers": 198,
    "guestCustomers": 47,
    "avgOrdersPerCustomer": 2.3,
    "topCities": [
      { "name": "CABA", "count": 89 },
      { "name": "La Plata", "count": 45 }
    ]
  }
}
```

#### `GET /api/customers/:id` - Obtener Cliente Específico
**Respuesta:**
```json
{
  "customer": {
    "id": "cust123",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "phone": "+54 11 1234-5678",
    "documentType": "DNI",
    "documentNumber": "12345678",
    "isGuest": false,
    "user": {...},
    "addresses": [
      {
        "id": "addr123",
        "street": "Av. Corrientes",
        "number": "1234",
        "floor": "2",
        "apartment": "B",
        "neighborhood": {...},
        "zipCode": "1043",
        "isDefault": true,
        "label": "Casa",
        "observations": "Timbre roto, golpear puerta",
        "createdAt": "2024-06-15T10:30:00Z"
      }
    ],
    "orderHistory": [
      {
        "id": "order123",
        "total": 2500.00,
        "status": "completed",
        "date": "2025-01-10T15:30:00Z"
      }
    ],
    "statistics": {
      "totalOrders": 12,
      "totalPurchased": 4500.00,
      "avgOrderValue": 375.00,
      "favoriteCategory": "Electrónicos"
    }
  }
}
```

#### `POST /api/customers` - Crear Cliente
**Casos de uso:**
- Cliente invitado durante checkout
- Cliente registrado vinculado a usuario
- Administrador crea cliente

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "phone": "+54 11 1234-5678",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "isGuest": false,
  "userId": "user123", // Opcional, para vincular usuario existente
  "address": { // Opcional, dirección inicial
    "street": "Av. Corrientes",
    "number": "1234",
    "floor": "2",
    "apartment": "B",
    "neighborhoodId": "neigh123",
    "zipCode": "1043",
    "label": "Casa",
    "observations": "Timbre roto"
  }
}
```

#### `PUT /api/customers/:id` - Actualizar Cliente
**Body:** Similar al POST, todos los campos opcionales

#### `DELETE /api/customers/:id` - Eliminar Cliente (Admin)

### 🏠 Direcciones (`/api/addresses`)

#### `GET /api/addresses` - Listar Direcciones del Cliente
**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
customerId=cust123  # Para admin: ver direcciones de cualquier cliente
```

**Respuesta:**
```json
{
  "addresses": [
    {
      "id": "addr123",
      "street": "Av. Corrientes",
      "number": "1234",
      "floor": "2",
      "apartment": "B",
      "neighborhood": {
        "id": "neigh123",
        "name": "Balvanera",
        "city": {
          "id": "city123",
          "name": "Ciudad Autónoma de Buenos Aires",
          "state": "CABA",
          "country": "Argentina"
        }
      },
      "zipCode": "1043",
      "isDefault": true,
      "label": "Casa",
      "observations": "Timbre roto, golpear puerta",
      "fullAddress": "Av. Corrientes 1234, Piso 2, Depto B, Balvanera, CABA (1043)",
      "lastUsed": "2025-01-10T15:30:00Z",
      "createdAt": "2024-06-15T10:30:00Z"
    }
  ]
}
```

#### `POST /api/addresses` - Agregar Dirección
**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "street": "Av. Santa Fe",
  "number": "2500",
  "floor": "5",
  "apartment": "A",
  "neighborhoodId": "neigh456",
  "zipCode": "1123",
  "label": "Trabajo",
  "observations": "Edificio azul, portero eléctrico",
  "setAsDefault": false
}
```

#### `PUT /api/addresses/:id` - Actualizar Dirección
#### `DELETE /api/addresses/:id` - Eliminar Dirección

#### `PUT /api/addresses/:id/set-default` - Establecer como Predeterminada
**Respuesta:**
```json
{
  "message": "Dirección establecida como predeterminada",
  "address": {...}
}
```

### 🌍 Ciudades (`/api/cities`)

#### `GET /api/cities` - Listar Ciudades
**Query Parameters:**
```
search=buenos           # Búsqueda por nombre
state=CABA             # Filtrar por provincia/estado
country=Argentina      # Filtrar por país
includeNeighborhoods=true # Incluir barrios
```

**Respuesta:**
```json
{
  "cities": [
    {
      "id": "city123",
      "name": "Ciudad Autónoma de Buenos Aires",
      "state": "CABA",
      "country": "Argentina",
      "zipCodePattern": "^[0-9]{4}$",
      "neighborhoodsCount": 48,
      "neighborhoods": [ // Si includeNeighborhoods=true
        {
          "id": "neigh123",
          "name": "Balvanera"
        }
      ]
    }
  ]
}
```

#### `POST /api/cities` - Crear Ciudad (Admin)
**Body:**
```json
{
  "name": "La Plata",
  "state": "Buenos Aires",
  "country": "Argentina",
  "zipCodePattern": "^[0-9]{4}$"
}
```

### 🏘️ Barrios (`/api/neighborhoods`)

#### `GET /api/neighborhoods` - Listar Barrios
**Query Parameters:**
```
cityId=city123         # Filtrar por ciudad (requerido)
search=balva          # Búsqueda por nombre
```

**Respuesta:**
```json
{
  "neighborhoods": [
    {
      "id": "neigh123",
      "name": "Balvanera",
      "city": {
        "id": "city123",
        "name": "Ciudad Autónoma de Buenos Aires"
      },
      "customerCount": 45,
      "deliveryZone": "ZONE_A",
      "shippingCost": 500.00
    }
  ]
}
```

#### `POST /api/neighborhoods` - Crear Barrio (Admin)
**Body:**
```json
{
  "name": "Villa Crespo",
  "cityId": "city123",
  "deliveryZone": "ZONE_B",
  "shippingCost": 750.00
}
```

## 🏠 Sistema de Direcciones

### Flujo de Gestión de Direcciones

#### 1. Usuario Registrado - Gestión Normal
```javascript
// Ver mis direcciones
GET /api/addresses
Headers: { Authorization: "Bearer user_token" }

// Agregar nueva dirección
POST /api/addresses
Body: { street: "...", neighborhoodId: "...", ... }

// Establecer como predeterminada
PUT /api/addresses/addr123/set-default
```

#### 2. Checkout - Selección de Dirección
```javascript
// Listar direcciones guardadas
const addresses = await fetch('/api/addresses', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Usuario selecciona dirección existente o agrega nueva
const selectedAddress = addresses.find(addr => addr.isDefault) || addresses[0];

// Durante checkout
POST /api/orders
Body: {
  // ...otros datos del pedido
  shippingAddressId: selectedAddress.id,
  // O dirección nueva:
  newShippingAddress: {
    street: "...",
    neighborhoodId: "...",
    saveAddress: true // Guardar para uso futuro
  }
}
```

#### 3. Cliente Invitado - Dirección Temporal
```javascript
// Cliente invitado en checkout
POST /api/orders
Body: {
  customerData: {
    name: "Juan Invitado",
    email: "juan@temp.com",
    phone: "+54111234567",
    isGuest: true
  },
  shippingAddress: {
    street: "Av. Rivadavia",
    number: "5000",
    neighborhoodId: "neigh789",
    zipCode: "1424"
    // NO se guarda automáticamente
  }
}
```

### Validación de Direcciones

#### Reglas de Validación
- **Street**: Requerido, mínimo 5 caracteres
- **Number**: Requerido, números y letras
- **NeighborhoodId**: Debe existir y pertenecer a una ciudad activa
- **ZipCode**: Debe coincidir con el patrón de la ciudad
- **Floor/Apartment**: Opcionales, para edificios

#### Ejemplo de Validación
```json
// Dirección válida
{
  "street": "Av. Corrientes",
  "number": "1234",
  "floor": "2",
  "apartment": "B",
  "neighborhoodId": "neigh123", // Debe existir
  "zipCode": "1043" // Debe coincidir con patrón de CABA (4 dígitos)
}

// Error de validación
{
  "error": "Validation failed",
  "details": [
    "Street must be at least 5 characters",
    "Invalid zipCode for selected city",
    "Neighborhood does not exist"
  ]
}
```

## 🌍 Ubicaciones Geográficas

### Jerarquía de Ubicaciones

```
País (Argentina)
└── Provincia/Estado (Buenos Aires, CABA, Córdoba)
    └── Ciudad (La Plata, CABA, Córdoba Capital)
        └── Barrio (Balvanera, Villa Crespo, Centro)
```

### Casos de Uso Comunes

#### 1. Calcular Costo de Envío
```javascript
// Obtener información del barrio para calcular envío
const getShippingCost = async (neighborhoodId) => {
  const response = await fetch(`/api/neighborhoods/${neighborhoodId}`);
  const neighborhood = await response.json();
  
  return {
    zone: neighborhood.deliveryZone,
    cost: neighborhood.shippingCost,
    cityName: neighborhood.city.name
  };
};

// Uso en checkout
const address = selectedAddress;
const shipping = await getShippingCost(address.neighborhoodId);
const total = subtotal + shipping.cost;
```

#### 2. Formulario Dinámico de Direcciones
```javascript
// Cargar ciudades
const cities = await fetch('/api/cities?country=Argentina');

// Al seleccionar ciudad, cargar barrios
const handleCityChange = async (cityId) => {
  const neighborhoods = await fetch(`/api/neighborhoods?cityId=${cityId}`);
  setNeighborhoods(neighborhoods);
};

// Validar código postal según ciudad
const validateZipCode = (zipCode, cityPattern) => {
  const regex = new RegExp(cityPattern);
  return regex.test(zipCode);
};
```

## 👤 Tipos de Clientes

### Cliente Registrado
**Características:**
- Tiene cuenta de usuario (`userId` no null)
- Puede guardar múltiples direcciones
- Historial de pedidos persistente
- Preferencias guardadas

**Flujo de Creación:**
```javascript
// 1. Usuario se registra
POST /api/auth/register
Body: { email, password, name }

// 2. Sistema crea automáticamente perfil de cliente
// (Manejado internamente por AuthController)

// 3. Cliente puede agregar direcciones
POST /api/addresses
Body: { street, neighborhoodId, ... }
```

### Cliente Invitado
**Características:**
- No tiene cuenta de usuario (`userId` es null)
- Datos temporales solo para el pedido actual
- Puede convertirse en cliente registrado

**Flujo de Checkout:**
```javascript
// Cliente invitado en checkout
POST /api/orders
Body: {
  customerData: {
    name: "Juan Invitado",
    email: "juan@temp.com",
    phone: "+54111234567",
    isGuest: true
  },
  shippingAddress: { ... },
  items: [ ... ]
}

// Sistema crea cliente temporal automáticamente
```

### Conversión Invitado → Registrado
```javascript
// Después del checkout, ofrecer registro
POST /api/auth/register
Body: {
  email: "juan@temp.com", // Email usado como invitado
  password: "newpassword",
  name: "Juan Pérez"
}

// Sistema vincula automáticamente:
// - Historial de pedidos como invitado
// - Datos del cliente existente
// - Direcciones usadas
```

## 💡 Ejemplos de Uso

### Panel de Cliente - Ver y Gestionar Direcciones

```javascript
const CustomerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);

  // Cargar direcciones del cliente
  useEffect(() => {
    const loadAddresses = async () => {
      const response = await fetch('/api/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAddresses(data.addresses);
    };
    loadAddresses();
  }, []);

  // Agregar nueva dirección
  const addAddress = async (addressData) => {
    const response = await fetch('/api/addresses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addressData)
    });
    
    if (response.ok) {
      const newAddress = await response.json();
      setAddresses([...addresses, newAddress.address]);
    }
  };

  // Establecer como predeterminada
  const setDefault = async (addressId) => {
    await fetch(`/api/addresses/${addressId}/set-default`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Actualizar estado local
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
  };
};
```

### Checkout - Seleccionar o Crear Dirección

```javascript
const CheckoutAddressStep = ({ onAddressSelected }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Cargar direcciones guardadas (solo usuarios registrados)
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedAddresses();
    }
  }, []);

  const loadSavedAddresses = async () => {
    const response = await fetch('/api/addresses', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAddresses(data.addresses);
    
    // Seleccionar predeterminada automáticamente
    const defaultAddr = data.addresses.find(addr => addr.isDefault);
    if (defaultAddr) {
      setSelectedAddress(defaultAddr);
      onAddressSelected(defaultAddr);
    }
  };

  const handleNewAddress = async (addressData) => {
    if (isAuthenticated) {
      // Usuario registrado: guardar dirección
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...addressData,
          setAsDefault: addresses.length === 0 // Primera dirección = predeterminada
        })
      });
      
      if (response.ok) {
        const newAddress = await response.json();
        setAddresses([...addresses, newAddress.address]);
        setSelectedAddress(newAddress.address);
        onAddressSelected(newAddress.address);
      }
    } else {
      // Usuario invitado: usar dirección temporal
      onAddressSelected({ ...addressData, isTemporary: true });
    }
    
    setShowNewAddressForm(false);
  };
};
```

### Panel Admin - Gestión de Clientes

```javascript
const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    isGuest: null,
    cityId: '',
    page: 1
  });

  // Cargar clientes con filtros
  const loadCustomers = async () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });

    const response = await fetch(`/api/customers?${params}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();
    setCustomers(data.customers);
  };

  // Ver detalle de cliente
  const viewCustomerDetail = async (customerId) => {
    const response = await fetch(`/api/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();    // Mostrar modal con información completa del cliente
    showCustomerModal(data.customer);
  };
};
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Error: "Email ya registrado"
**Síntoma:** `400 - Email already exists`
**Causa:** Intento de crear cliente con email duplicado
**Solución:**
```javascript
// Verificar email único antes de crear
const existingCustomer = await Customer.findOne({ email });
if (existingCustomer) {
  throw new Error('Email ya está registrado');
}

// Permitir múltiples clientes invitados sin email
const customerData = {
  ...data,
  email: data.email || null // null para invitados
};
```

#### Error: "Dirección inválida"
**Síntoma:** `400 - Invalid address data`
**Causa:** Barrio o ciudad no existe en la base de datos
**Solución:**
```javascript
// Validar que el barrio existe y pertenece a la ciudad
const neighborhood = await Neighborhood.findById(neighborhoodId)
  .populate('cityId');

if (!neighborhood) {
  throw new Error('Barrio no encontrado');
}

if (neighborhood.cityId._id.toString() !== cityId) {
  throw new Error('El barrio no pertenece a la ciudad seleccionada');
}
```

#### Error de Geocodificación
**Síntoma:** `500 - Geocoding failed`
**Causa:** API de geolocalización no disponible o límites excedidos
**Solución:**
```javascript
// Fallback sin coordenadas
const createAddressWithFallback = async (addressData) => {
  try {
    const coordinates = await geocodeService.getCoordinates(addressData);
    return { ...addressData, coordinates };
  } catch (error) {
    console.warn('Geocoding failed, saving without coordinates:', error);
    return addressData; // Guardar sin coordenadas
  }
};
```

#### Cliente Duplicado
**Síntoma:** Múltiples registros para el mismo cliente
**Causa:** Creación concurrente o lógica de vinculación fallida
**Solución:**
```javascript
// Usar transacciones para evitar duplicados
const session = await mongoose.startSession();
session.startTransaction();

try {
  const customer = await Customer.findOneAndUpdate(
    { email },
    { ...customerData },
    { 
      upsert: true, 
      new: true,
      session 
    }
  );
  
  await session.commitTransaction();
  return customer;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Depuración de Ubicaciones

```javascript
// Verificar jerarquía de ubicaciones
const validateLocationHierarchy = async (cityId, neighborhoodId) => {
  const city = await City.findById(cityId);
  const neighborhood = await Neighborhood.findById(neighborhoodId);
  
  console.log('City:', city?.name);
  console.log('Neighborhood:', neighborhood?.name);
  console.log('Belongs to city:', neighborhood?.cityId.toString() === cityId);
};
```

## ✅ Mejores Prácticas

### 🔒 Seguridad y Privacidad
- **Validar email** con formato estricto
- **No exponer** datos sensibles en logs
- **Hashear** números de teléfono si es necesario
- **GDPR compliance** para eliminación de datos

```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Anonimizar datos para logs
const sanitizeCustomerForLog = (customer) => ({
  id: customer.id,
  name: customer.name?.substring(0, 3) + '***',
  email: customer.email ? '***@' + customer.email.split('@')[1] : null
});
```

### 📊 Gestión de Datos
- **Normalización** de datos de entrada
- **Deduplicación** automática de clientes
- **Archivado** en lugar de eliminación
- **Auditoría** de cambios importantes

```javascript
// Normalizar teléfonos
const normalizePhone = (phone) => {
  return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
};

// Soft delete para auditoria
const archiveCustomer = async (customerId) => {
  return await Customer.findByIdAndUpdate(customerId, {
    isArchived: true,
    archivedAt: new Date()
  });
};
```

### 🏠 Gestión de Direcciones
- **Validación** de códigos postales
- **Geocodificación** automática
- **Dirección predeterminada** siempre definida
- **Historial** de direcciones anteriores

```javascript
// Auto-geocodificar direcciones
const enrichAddressWithCoordinates = async (address) => {
  try {
    const fullAddress = `${address.street} ${address.number}, ${address.neighborhood.name}, ${address.city.name}`;
    const coordinates = await geocodingService.geocode(fullAddress);
    
    return {
      ...address,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      }
    };
  } catch (error) {
    console.warn('Geocoding failed for address:', address.id);
    return address;
  }
};
```

### 🔗 Integración con Usuarios
- **Vinculación automática** usuario-cliente
- **Migración** de datos de invitado a registrado
- **Sincronización** de perfiles
- **Manejo** de cuentas múltiples

```javascript
// Migrar cliente invitado a registrado
const migrateGuestToRegistered = async (guestCustomerId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Actualizar cliente
    const customer = await Customer.findByIdAndUpdate(
      guestCustomerId,
      { 
        userId,
        isGuest: false,
        migratedAt: new Date()
      },
      { session, new: true }
    );
    
    // Transferir carritos y pedidos
    await Cart.updateMany(
      { customerId: guestCustomerId },
      { userId },
      { session }
    );
    
    await session.commitTransaction();
    return customer;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Configuración de validaciones
MIN_NAME_LENGTH=2
MAX_NAME_LENGTH=100
PHONE_PATTERN=^\+?[0-9\s\-\(\)]{8,20}$
DOCUMENT_TYPES=DNI,PASSPORT,CUIT,CUIL

# Configuración de direcciones
MAX_ADDRESSES_PER_CLIENT=10
DEFAULT_COUNTRY=Argentina
REQUIRE_ZIPCODE=true

# Configuración de envíos
DEFAULT_SHIPPING_COST=500
FREE_SHIPPING_THRESHOLD=5000
```

### Seeders de Ubicaciones

```bash
# Poblar con datos de Argentina
npm run seed:locations:argentina

# Incluye:
# - Provincias principales
# - Ciudades importantes
# - Barrios de CABA y GBA
# - Códigos postales
```

### Índices de MongoDB

```javascript
// Optimizaciones de búsqueda
db.customers.createIndex({ "name": "text", "email": "text", "phone": "text" });
db.customers.createIndex({ "email": 1 }, { unique: true, sparse: true });
db.customers.createIndex({ "isGuest": 1, "createdAt": -1 });
db.customers.createIndex({ "userId": 1 }, { unique: true, sparse: true });

db.addresses.createIndex({ "customerId": 1, "isDefault": 1 });
db.addresses.createIndex({ "neighborhoodId": 1 });

db.neighborhoods.createIndex({ "cityId": 1, "name": 1 });
db.cities.createIndex({ "name": 1, "state": 1 });
```

---

Para más información sobre otros módulos:
- [🛒 Carrito y Pedidos](./api-orders.md)
- [📦 Gestión de Productos](./api-products.md)
- [💳 Integración MercadoPago](./mercadopago.md)
