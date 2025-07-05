# 📋 Instalación y Configuración

Guía completa para configurar y ejecutar el backend de StartUp E-commerce.

## 📑 Índice

- [📋 Prerrequisitos](#-prerrequisitos)
- [🚀 Instalación](#-instalación)
- [⚙️ Variables de Entorno](#-variables-de-entorno)
- [🗄️ Base de Datos](#-base-de-datos)
- [▶️ Ejecución](#-ejecución)
- [🧪 Testing](#-testing)
- [🐳 Docker](#-docker)
- [🚀 Despliegue](#-despliegue)

## 📋 Prerrequisitos

### Software Requerido

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 o **yarn** >= 1.22.0
- **MongoDB** >= 5.0.0 (local o Atlas)
- **Git** para control de versiones

### Servicios Externos

- **MercadoPago** - Cuenta de desarrollador
- **Cloudinary** - Para almacenamiento de imágenes
- **Email Provider** - Gmail, SendGrid, etc.
- **Telegram Bot** - Para notificaciones (opcional)

### Verificar Instalación

```bash
# Verificar versiones
node --version    # >= 18.0.0
npm --version     # >= 8.0.0
mongo --version   # >= 5.0.0
```

## 🚀 Instalación

### 1. Clonar Repositorio

```bash
# Clonar el proyecto
git clone <repository-url>
cd 14-back

# Verificar estructura
ls -la
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias de producción y desarrollo
npm install

# O usando yarn
yarn install

# Verificar instalación
npm list --depth=0
```

### 3. Verificar Dependencias Críticas

```bash
# Verificar que estas dependencias estén instaladas
npm list express typescript mongoose jsonwebtoken bcryptjs
npm list winston multer cloudinary axios nodemailer
```

## ⚙️ Variables de Entorno

### 1. Crear Archivo de Configuración

```bash
# Copiar plantilla de variables de entorno
cp .env.example .env

# Editar con tus configuraciones
nano .env
```

### 2. Configuración Completa

```env
# === CONFIGURACIÓN GENERAL ===
NODE_ENV=development
PORT=3000
API_VERSION=v1

# === BASE DE DATOS ===
# Opción 1: MongoDB Local
MONGO_URL=mongodb://localhost:27017/startup-ecommerce

# Opción 2: MongoDB Atlas
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/startup-ecommerce

# === AUTENTICACIÓN ===
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_EXPIRATION=7d

# === BCRYPT ===
BCRYPT_SALT_ROUNDS=10

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# === MERCADO PAGO ===
MERCADO_PAGO_ACCESS_TOKEN=your-mercadopago-access-token
MERCADO_PAGO_PUBLIC_KEY=your-mercadopago-public-key

# === EMAIL (NODEMAILER) ===
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=StartUp E-commerce <noreply@startup.com>

# Para otros proveedores SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# === TELEGRAM ===
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
TELEGRAM_ADMIN_CHAT_ID=admin-chat-id

# === URLs ===
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
WEBHOOK_URL=https://your-domain.com/webhook

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# === LOGGING ===
LOG_LEVEL=info
LOG_FILE=logs/combined.log
ERROR_LOG_FILE=logs/error.log
```

### 3. Configuraciones Específicas por Servicio

#### MongoDB Atlas
```env
MONGO_URL=mongodb+srv://username:password@cluster0.xyz.mongodb.net/startup-ecommerce?retryWrites=true&w=majority
```

#### Gmail App Password
1. Habilitar autenticación de 2 factores
2. Ir a Configuración → Seguridad → Contraseñas de aplicación
3. Generar nueva contraseña
4. Usar en `EMAIL_PASSWORD`

#### MercadoPago Sandbox
```env
MERCADO_PAGO_ACCESS_TOKEN=TEST-123456789-abcdef-your-test-token
MERCADO_PAGO_PUBLIC_KEY=TEST-abc123-def456-your-public-key
```

## 🗄️ Base de Datos

### 1. MongoDB Local

```bash
# Instalar MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Iniciar servicio
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verificar conexión
mongo --eval "db.runCommand({ connectionStatus: 1 })"
```

### 2. MongoDB Atlas (Recomendado)

1. **Crear cuenta** en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Crear cluster** gratuito
3. **Configurar usuario** de base de datos
4. **Whitelist IP** o permitir acceso desde cualquier lugar (0.0.0.0/0)
5. **Obtener connection string** y configurar en `.env`

### 3. Seeders (Datos Iniciales)

```bash
# Ejecutar seeders para poblar base de datos
npm run seed

# O ejecutar seeders específicos
npm run seed:users
npm run seed:categories
npm run seed:products
```

## ▶️ Ejecución

### 1. Modo Desarrollo

```bash
# Ejecutar en modo desarrollo (con auto-restart)
npm run dev

# El servidor estará disponible en: http://localhost:3000
```

### 2. Modo Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar versión compilada
npm start
```

### 3. Verificar Funcionamiento

```bash
# Test de conectividad
curl http://localhost:3000/api/health

# Respuesta esperada:
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 1234,
  "environment": "development",
  "version": "1.0.0"
}
```

### 4. Scripts Disponibles

```bash
npm run dev        # Desarrollo con nodemon
npm run build      # Compilar TypeScript
npm start          # Ejecutar versión compilada
npm test           # Ejecutar tests
npm run test:watch # Tests en modo watch
npm run lint       # Verificar código con ESLint
npm run format     # Formatear código con Prettier
npm run seed       # Ejecutar seeders
```

## 🧪 Testing

### 1. Configuración de Testing

```bash
# Instalar dependencias de testing (ya incluidas)
npm install --save-dev jest @types/jest ts-jest supertest

# Verificar configuración
cat jest.config.js
```

### 2. Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests específicos
npm test -- --testNamePattern="Auth"
```

### 3. Base de Datos de Testing

```env
# Agregar en .env.test
NODE_ENV=test
MONGO_URL=mongodb://localhost:27017/startup-ecommerce-test
```

## 🐳 Docker

### 1. Docker Compose (Recomendado)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGO_URL=mongodb://mongo:27017/startup-ecommerce
    depends_on:
      - mongo
    volumes:
      - .:/app
      - /app/node_modules

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### 2. Comandos Docker

```bash
# Ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener servicios
docker-compose down

# Rebuild
docker-compose up --build
```

### 3. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

## 🚀 Despliegue

### 1. Variables de Entorno Producción

```env
NODE_ENV=production
PORT=3000

# Usar URLs de producción
MONGO_URL=mongodb+srv://prod-user:pass@cluster.mongodb.net/startup-ecommerce
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-api-domain.com
WEBHOOK_URL=https://your-api-domain.com/webhook

# Tokens de producción
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-production-token
JWT_SECRET=your-super-secure-production-secret-key

# Configuración de logging para producción
LOG_LEVEL=warn
```

### 2. Plataformas de Despliegue

#### Heroku
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create your-app-name

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set MONGO_URL=your-production-mongo-url
heroku config:set JWT_SECRET=your-jwt-secret

# Desplegar
git push heroku main
```

#### Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y desplegar
railway login
railway init
railway up
```

#### DigitalOcean App Platform
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Configurar build commands: `npm run build`
4. Configurar run command: `npm start`

### 3. Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas
- [ ] Base de datos de producción lista
- [ ] Tokens de producción configurados
- [ ] CORS configurado para frontend
- [ ] HTTPS habilitado
- [ ] Logs configurados
- [ ] Monitoring configurado
- [ ] Backup de base de datos configurado

### 4. Post-Despliegue

```bash
# Verificar salud de la aplicación
curl https://your-api-domain.com/api/health

# Ejecutar seeders en producción (solo primera vez)
heroku run npm run seed

# Monitorear logs
heroku logs --tail
```

## 🔧 Troubleshooting

### Problemas Comunes

**Error de conexión a MongoDB:**
```bash
# Verificar conexión
mongosh "mongodb://localhost:27017/startup-ecommerce"

# Verificar servicios
sudo systemctl status mongodb
```

**Error de permisos:**
```bash
# Verificar permisos de carpetas
sudo chown -R $USER:$USER .
```

**Puerto en uso:**
```bash
# Encontrar proceso usando puerto 3000
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

**Variables de entorno no cargadas:**
```bash
# Verificar que .env existe
ls -la .env

# Verificar contenido
cat .env | grep -v "^#" | grep -v "^$"
```

---

¡Listo! Con esta configuración tendrás el backend funcionando completamente. Para más detalles sobre funcionalidades específicas, consulta:
- [💳 Integración MercadoPago](./mercadopago.md)
- [📱 Notificaciones Telegram](./telegram.md)
- [📧 Notificaciones Email](./email.md)
