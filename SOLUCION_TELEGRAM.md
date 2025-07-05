# 🐛 Solución: Telegram no envía notificaciones (pero email sí)

## 📋 Resumen del Problema

**Síntoma:** Los emails de notificación llegan correctamente, pero las notificaciones de Telegram no se reciben.

**Causa probable:** Problema en la configuración del bot de Telegram, chat ID incorrecto, o el bot fue removido del grupo.

## 🔧 Solución Paso a Paso

### 1. **Usar la Herramienta de Diagnóstico** 🛠️

He creado una herramienta especial para diagnosticar problemas de Telegram:

```
🔗 URL: https://tu-dominio.com/admin/telegram-test
```

**Pasos:**
1. Iniciar sesión como administrador
2. Ir a `/admin/telegram-test`
3. Hacer clic en **"Ejecutar Todas las Pruebas"**
4. Revisar cada resultado

### 2. **Verificar Configuración del Bot** 🤖

#### a) Token del Bot
```bash
# Verificar que el token sea válido
curl "https://api.telegram.org/bot<TU_TOKEN>/getMe"
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "Tu Bot",
    "username": "tu_bot_username"
  }
}
```

#### b) Variables de Entorno del Backend
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ADMIN_CHAT_ID=-1001234567890
TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### 3. **Verificar Chat ID** 💬

#### Problema Común: Chat ID Incorrecto

**Para grupos:** El Chat ID debe empezar con `-100` (ejemplo: `-1001234567890`)
**Para chats privados:** Número positivo (ejemplo: `123456789`)

#### Cómo obtener el Chat ID correcto:

1. **Agregar el bot al grupo de admins**
2. **Enviar un mensaje al grupo**
3. **Consultar actualizaciones:**
   ```bash
   curl "https://api.telegram.org/bot<TU_TOKEN>/getUpdates"
   ```
4. **Buscar el chat ID en la respuesta**

### 4. **Problemas Comunes y Soluciones** ⚠️

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Token inválido | Generar nuevo token con @BotFather |
| `403 Forbidden` | Bot bloqueado/removido | Reagregar bot al grupo |
| `400 Bad Request` | Chat ID incorrecto | Verificar Chat ID con getUpdates |
| `Timeout` | Red bloqueada | Verificar firewall/proxy |

### 5. **Pasos de Verificación** ✅

#### a) Probar Bot Manualmente
```bash
# Enviar mensaje de prueba
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=🧪 Prueba manual del bot"
```

#### b) Verificar Webhook de MercadoPago
1. Hacer una compra de prueba
2. Verificar logs del backend:
   ```bash
   grep -i "telegram\|webhook" /var/log/app.log
   ```

#### c) Confirmar Flujo Completo
1. ✅ Cliente crea orden → ❌ NO se envía Telegram
2. ✅ Cliente paga → ❌ NO se envía Telegram
3. ✅ Webhook confirma pago → **🚀 SÍ se envía Telegram**

### 6. **Usar la Página de Diagnóstico** 🧪

La herramienta creada te permite:

- ✅ **Verificar configuración** actual
- ✅ **Probar conectividad** del bot
- ✅ **Enviar mensajes** de prueba
- ✅ **Simular notificaciones** de pago
- ✅ **Ver logs** del backend
- ✅ **Guía de solución** de problemas

### 7. **Si Todo Falla** 🆘

#### Recrear Bot desde Cero:

1. **Contactar @BotFather**
2. **Crear nuevo bot:** `/newbot`
3. **Obtener nuevo token**
4. **Agregar bot al grupo de admins**
5. **Obtener nuevo Chat ID**
6. **Actualizar variables de entorno**
7. **Reiniciar backend**
8. **Probar con la herramienta de diagnóstico**

## 🎯 Resultado Esperado

Después de aplicar estas soluciones:

- ✅ **Emails siguen llegando** (no se afectan)
- ✅ **Telegram funciona** para notificaciones de pago
- ✅ **Una sola notificación** por pago confirmado
- ✅ **No spam** de notificaciones duplicadas

## 📞 Soporte

Si después de seguir todos los pasos el problema persiste:

1. **Capturar pantalla** de la herramienta de diagnóstico
2. **Copiar logs** relevantes del backend
3. **Verificar** que las variables de entorno estén bien configuradas
4. **Contactar** al equipo de desarrollo con esta información

---

**💡 Tip:** La herramienta de diagnóstico en `/admin/telegram-test` es tu mejor aliado para identificar exactamente dónde está el problema.
