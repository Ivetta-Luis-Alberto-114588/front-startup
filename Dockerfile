# Multi-stage Dockerfile para Angular
FROM node:20-alpine AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm ci --include=dev --prefer-offline --no-audit

# Copiar código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

# Instalar serve globalmente
RUN npm install -g serve@14.2.3

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos construidos desde la etapa anterior
COPY --from=build /app/dist/test2 ./dist

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["serve", "-s", "dist", "-l", "3000"]
