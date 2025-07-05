# 🔐 Autenticación y Gestión de Usuarios

Sistema completo de autenticación con JWT, gestión de roles y recuperación de contraseñas.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [🔑 Sistema de Autenticación JWT](#-sistema-de-autenticación-jwt)
- [👤 Gestión de Roles](#-gestión-de-roles)
- [🔒 Seguridad y Validaciones](#-seguridad-y-validaciones)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Autenticación
- **Registro de usuarios** con validación de email
- **Login con JWT** tokens
- **Refresh tokens** para renovación automática
- **Logout** con invalidación de tokens
- **Recuperación de contraseña** vía email
- **Verificación de email** (opcional)

### ✅ Gestión de Usuarios
- **CRUD completo** para usuarios
- **Sistema de roles** (USER_ROLE, ADMIN_ROLE)
- **Perfil de usuario** editable
- **Cambio de contraseña** seguro
- **Activación/desactivación** de cuentas

### ✅ Seguridad
- **Hashing de contraseñas** con bcrypt
- **Validación de tokens** JWT
- **Rate limiting** para login
- **Protección CORS** configurada
- **Sanitización de datos** de entrada

## 📋 API Endpoints

### Autenticación Pública

#### Registro de Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "MiPassword123",
  "role": "USER_ROLE"
}
```

**Respuesta Exitosa (201):**
```json
{
  "user": {
    "id": "64a7f8c9b123456789abcdef",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "role": "USER_ROLE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "MiPassword123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "user": {
    "id": "64a7f8c9b123456789abcdef",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "role": "USER_ROLE",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Recuperación de Contraseña
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "juan@email.com"
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Se ha enviado un enlace de recuperación a tu email",
  "tokenSent": true
}
```

#### Restablecer Contraseña
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "NuevaPassword123"
}
```

### Endpoints Protegidos (Requieren JWT)

#### Validar Token
```http
GET /api/auth/validate-token
Authorization: Bearer <jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "user": {
    "id": "64a7f8c9b123456789abcdef",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "role": "USER_ROLE",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Obtener Perfil
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

#### Actualizar Perfil
```http
PUT /api/auth/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Juan Carlos Pérez",
  "phone": "+54 11 1234-5678"
}
```

#### Cambiar Contraseña
```http
POST /api/auth/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "MiPassword123",
  "newPassword": "NuevaPassword456"
}
```

### Endpoints de Administrador

#### Listar Usuarios (Solo Admin)
```http
GET /api/auth/users?page=1&limit=10&role=USER_ROLE
Authorization: Bearer <admin-jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "users": [
    {
      "id": "64a7f8c9b123456789abcdef",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "role": "USER_ROLE",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Cambiar Estado de Usuario (Solo Admin)
```http
PATCH /api/auth/users/:id/status
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Cambiar Rol de Usuario (Solo Admin)
```http
PATCH /api/auth/users/:id/role
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "role": "ADMIN_ROLE"
}
```

## 🔑 Sistema de Autenticación JWT

### Configuración de Tokens

```typescript
// Configuración en src/configs/jwt.ts
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  algorithm: 'HS256'
};
```

### Estructura del Token JWT

```json
{
  "id": "64a7f8c9b123456789abcdef",
  "email": "juan@email.com",
  "role": "USER_ROLE",
  "iat": 1642248000,
  "exp": 1642334400
}
```

### Middleware de Autenticación

```typescript
// Uso en rutas protegidas
app.use('/api/protected', AuthMiddleware.validateJwt);

// Verificación de roles específicos
app.use('/api/admin', [
  AuthMiddleware.validateJwt,
  AuthMiddleware.checkRole(['ADMIN_ROLE'])
]);
```

## 👤 Gestión de Roles

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **USER_ROLE** | Usuario estándar | - Acceso a perfil<br/>- Realizar compras<br/>- Ver historial |
| **ADMIN_ROLE** | Administrador | - Todos los permisos de USER<br/>- Gestión de productos<br/>- Gestión de usuarios<br/>- Acceso a estadísticas |

### Validación de Roles

```typescript
// Verificar rol específico
const hasRole = (userRole: string, requiredRoles: string[]) => {
  return requiredRoles.includes(userRole);
};

// Middleware para verificar roles
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.body.user;
    
    if (!hasRole(user.role, roles)) {
      return res.status(403).json({
        message: 'Acceso denegado - Rol insuficiente'
      });
    }
    
    next();
  };
};
```

## 🔒 Seguridad y Validaciones

### Validación de Contraseñas

```typescript
// Reglas de contraseña
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false
};

// Validación personalizada
const validatePassword = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return hasMinLength && hasUppercase && hasLowercase && hasNumbers;
};
```

### Rate Limiting

```typescript
// Configuración de rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
```

### Sanitización de Datos

```typescript
// Ejemplo de sanitización en DTOs
export class RegisterUserDto {
  public readonly name: string;
  public readonly email: string;
  public readonly password: string;
  public readonly role: string;

  private constructor(name: string, email: string, password: string, role: string) {
    this.name = name.trim();
    this.email = email.toLowerCase().trim();
    this.password = password;
    this.role = role;
  }

  static create(object: { [key: string]: any }): [string?, RegisterUserDto?] {
    const { name, email, password, role = 'USER_ROLE' } = object;

    // Validaciones
    if (!name) return ['Nombre es requerido'];
    if (name.length < 2) return ['Nombre debe tener al menos 2 caracteres'];
    
    if (!email) return ['Email es requerido'];
    if (!this.isValidEmail(email)) return ['Email no válido'];
    
    if (!password) return ['Contraseña es requerida'];
    if (!this.isValidPassword(password)) return ['Contraseña no cumple los requisitos'];
    
    if (!['USER_ROLE', 'ADMIN_ROLE'].includes(role)) {
      return ['Rol no válido'];
    }

    return [undefined, new RegisterUserDto(name, email, password, role)];
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPassword(password: string): boolean {
    return password.length >= 8 && /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && /\d/.test(password);
  }
}
```

## 💡 Ejemplos de Uso

### Cliente Frontend - Login Completo

```javascript
// Función de login
const login = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar token en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Error de conexión' };
  }
};

// Función para hacer peticiones autenticadas
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  const response = await fetch(url, mergedOptions);
  
  // Si el token expiró, redirigir al login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return response;
};
```

### Protección de Rutas en Frontend

```javascript
// Verificar si el usuario está autenticado
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) return false;
  
  try {
    // Verificar si el token no ha expirado
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Verificar rol de administrador
const isAdmin = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'ADMIN_ROLE';
  } catch (error) {
    return false;
  }
};

// Guard para rutas protegidas
const requireAuth = (Component) => {
  return (props) => {
    if (!isAuthenticated()) {
      // Redirigir al login
      window.location.href = '/login';
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Guard para rutas de admin
const requireAdmin = (Component) => {
  return (props) => {
    if (!isAuthenticated() || !isAdmin()) {
      window.location.href = '/unauthorized';
      return null;
    }
    
    return <Component {...props} />;
  };
};
```

### Recuperación de Contraseña

```javascript
// Solicitar recuperación
const forgotPassword = async (email) => {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    return { success: false, message: 'Error de conexión' };
  }
};

// Restablecer contraseña
const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    return { success: false, message: 'Error de conexión' };
  }
};
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

```env
# JWT Configuration
JWT_SECRET=tu-clave-secreta-muy-segura-aqui
JWT_EXPIRES_IN=24h

# Database
MONGO_URL=mongodb://localhost:27017/startup-ecommerce
MONGO_DB_NAME=startup-ecommerce

# Email para recuperación de contraseña
MAILER_SERVICE=gmail
MAILER_EMAIL=tu-email@gmail.com
MAILER_SECRET_KEY=tu-app-password

# URLs del frontend (para emails)
WEBSERVICE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

# Seguridad
BCRYPT_SALT_ROUNDS=10
```

### Configuración de CORS

```typescript
// src/configs/cors.ts
export const corsOptions = {
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Configuración de Email Templates

```typescript
// Template para recuperación de contraseña
export const resetPasswordTemplate = (resetUrl: string, userName: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Restablecer Contraseña</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hola ${userName},</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
            Restablecer Contraseña
        </a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
    </div>
</body>
</html>
`;
```

---

## 🔗 Enlaces Relacionados

- [🏗️ Arquitectura del Proyecto](./architecture.md)
- [📋 Instalación y Configuración](./installation.md)
- [👥 Gestión de Clientes](./api-customers.md)
- [💰 Pagos y MercadoPago](./api-payments.md)
- [📧 Sistema de Notificaciones](./notifications.md)

---

*Última actualización: Enero 2024*
