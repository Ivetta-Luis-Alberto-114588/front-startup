#!/bin/sh

# Script de build para Coolify
echo "🚀 Iniciando build de Angular..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --omit=dev --prefer-offline --no-audit

# Construir la aplicación
echo "🏗️ Construyendo aplicación..."
npm run build

echo "✅ Build completado exitosamente!"
