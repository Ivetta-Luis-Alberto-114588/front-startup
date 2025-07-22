# API de Notificaciones Manuales

## Endpoint: POST /api/notifications/manual

Permite enviar una notificación manual por email y/o Telegram. **Este endpoint es público y está destinado para invitados/usuarios no autenticados.**

### Body esperado
```json
{
  "subject": "Título de la notificación",
  "message": "Texto plano o stringificado (puede ser JSON como string)",
  "emailTo": "destinatario@email.com",     // opcional
  "telegramChatId": "123456789"            // opcional
}
```
- `subject` (string, requerido): Título o asunto de la notificación.
- `message` (string, requerido): Mensaje a enviar. Si se desea enviar un objeto JSON, debe serializarse como string.
- `emailTo` (string, opcional): Email destino. Si se proporciona, debe ser un email válido.
- `telegramChatId` (string, opcional): ChatId destino. Si no se especifica, se usa el default configurado en el servidor.

### Ejemplo de request
```json
{
  "subject": "Consulta desde página web",
  "message": "Un visitante ha dejado una consulta: ¿Tienen productos veganos disponibles?",
  "emailTo": "laivetta@gmail.com",
  "telegramChatId": "736207422"
}
```

### Respuesta exitosa
```json
{
  "success": true,
  "message": "Notificación enviada",
  "timestamp": "2025-07-22T13:35:00.000Z",
  "sentTo": {
    "telegram": "736207422",
    "email": "laivetta@gmail.com"
  }
}
```

### Errores comunes
- 400: Faltan campos requeridos, tipos incorrectos, email inválido, o error de las APIs de Telegram/Email
- 500: Error interno al enviar la notificación

### Notas
- **Acceso público**: Este endpoint NO requiere autenticación y está pensado para formularios de contacto o consultas de invitados.
- El campo `message` debe ser string. Si se envía un objeto, serializar con `JSON.stringify`.
- **Canales disponibles**: Telegram y Email.
- **Comportamiento por defecto**: Si no se especifica ningún canal, se envía por Telegram usando el chat por defecto.
- **Email**: Se envía con formato HTML responsivo. Los saltos de línea se convierten automáticamente.
- **Telegram**: Los mensajes se envían en formato HTML, por lo que se pueden usar etiquetas como `<b>`, `<i>`, etc.
- **Validaciones**: 
  - Máximo 4096 caracteres para el mensaje completo (título + mensaje) por limitaciones de Telegram
  - Validación básica de formato de email si se proporciona
