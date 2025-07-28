# Multi-stage Dockerfile para Angular
FROM node:20-alpine AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production=false --prefer-offline --no-audit

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

# Instalar serve
RUN npm install -g serve

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos construidos
COPY --from=build /app/dist/test2 ./

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["serve", "-s", ".", "-l", "3000"]
