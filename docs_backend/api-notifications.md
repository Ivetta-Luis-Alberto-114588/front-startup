# API de Notificaciones Manuales

## Endpoint: POST /api/notifications/manual

Permite enviar una notificación manual por email y/o Telegram.

### Body esperado
```json
{
  "subject": "Título de la notificación",
  "message": "Texto plano o stringificado (puede ser JSON como string)",
  "emailTo": "destinatario@email.com", // opcional
  "telegramChatId": "123456789"        // opcional
}
```
- `subject` (string, requerido): Título o asunto de la notificación.
- `message` (string, requerido): Mensaje a enviar. Si se desea enviar un objeto JSON, debe serializarse como string.
- `emailTo` (string, opcional): Email destino. Si no se especifica, se usa el default.
- `telegramChatId` (string, opcional): ChatId destino. Si no se especifica, se usa el default.

### Ejemplo de request
```json
{
  "subject": "Alerta manual",
  "message": "{\"tipo\":\"alerta\",\"detalle\":\"Stock bajo\"}",
  "emailTo": "admin@ejemplo.com"
}
```

### Respuesta exitosa
```json
{
  "success": true,
  "message": "Notificación enviada"
}
```

### Errores comunes
- 400: Faltan campos requeridos o tipos incorrectos
- 500: Error interno al enviar la notificación

### Notas
- El campo `message` debe ser string. Si se envía un objeto, serializar con `JSON.stringify`.
- La notificación se envía por ambos canales si no se especifica destino.
