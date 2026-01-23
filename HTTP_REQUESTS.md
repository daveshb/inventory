# 📡 HTTP Requests Examples

## Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T14:30:00Z",
  "database": "connected"
}
```

---

## Set Telegram Webhook

### Local (Development)

```bash
curl -X POST http://localhost:3000/api/telegram/set-webhook
```

### Vercel (Production)

```bash
curl -X POST https://tu-app.vercel.app/api/telegram/set-webhook
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Webhook establecido correctamente",
  "url": "https://tu-app.vercel.app/api/telegram"
}
```

---

## Get Webhook Info

```bash
curl -X GET http://localhost:3000/api/telegram/set-webhook
```

**Response (200 OK)**:
```json
{
  "webhookInfo": {
    "url": "https://tu-app.vercel.app/api/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "ip_address": "1.2.3.4",
    "last_error_date": null,
    "last_error_message": null,
    "last_synchronization_error_date": null,
    "max_connections": 40,
    "allowed_updates": ["message"]
  }
}
```

---

## Telegram Webhook (POST)

### Estructura que Telegram envía

```bash
POST /api/telegram HTTP/1.1
Host: tu-app.vercel.app
Content-Type: application/json
X-Telegram-Bot-Api-Secret-Token: mi-secreto-2024

{
  "update_id": 123456789,
  "message": {
    "message_id": 42,
    "date": 1674434400,
    "chat": {
      "id": 987654321,
      "first_name": "David",
      "last_name": "User",
      "username": "daviduser",
      "type": "private"
    },
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "David",
      "last_name": "User",
      "username": "daviduser",
      "language_code": "es"
    },
    "text": "/start"
  }
}
```

### Ejemplos de Mensajes

#### Comando /start

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 42,
    "from": { "id": 987654321 },
    "chat": { "id": 987654321 },
    "date": 1674434400,
    "text": "/start"
  }
}
```

#### Comando /agregar

```json
{
  "update_id": 123456790,
  "message": {
    "message_id": 43,
    "from": { "id": 987654321 },
    "chat": { "id": 987654321 },
    "date": 1674434401,
    "text": "/agregar cera para el cabello marca nativo 10"
  }
}
```

#### Texto libre (venta)

```json
{
  "update_id": 123456791,
  "message": {
    "message_id": 44,
    "from": { "id": 987654321 },
    "chat": { "id": 987654321 },
    "date": 1674434402,
    "text": "vendí 2 cera nativo por 32.000"
  }
}
```

---

## Respuestas del Bot

El bot responde automáticamente a través de la API de Telegram.

### Ejemplo: Respuesta a /start

```json
{
  "method": "sendMessage",
  "chat_id": 987654321,
  "text": "👋 ¡Hola! Soy tu asistente de inventario por Telegram.\n\nPuedo ayudarte a...",
  "parse_mode": "Markdown"
}
```

### Ejemplo: Respuesta a /inventario

```json
{
  "method": "sendMessage",
  "chat_id": 987654321,
  "text": "📦 INVENTARIO DISPONIBLE\n\n• cera para el cabello (nativo): 23 unidades\n• shampoo: 15 unidades",
  "parse_mode": "Markdown"
}
```

### Ejemplo: Respuesta a venta exitosa

```json
{
  "method": "sendMessage",
  "chat_id": 987654321,
  "text": "✅ Venta registrada: cera para el cabello x2 @ $65.000\n📦 Stock restante: 21"
}
```

### Ejemplo: Error - Stock insuficiente

```json
{
  "method": "sendMessage",
  "chat_id": 987654321,
  "text": "❌ Stock insuficiente. Disponible: 15 unidades"
}
```

---

## Verificación con curl

### Test directo de webhook local

```bash
# Instalar ngrok o similar para exponerlo
ngrok http 3000

# Luego setear el webhook a:
# https://tu-ngrok-url/api/telegram

# Simular request de Telegram
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: mi-secreto-2024" \
  -d '{
    "update_id": 123,
    "message": {
      "message_id": 1,
      "from": {"id": 987654321},
      "chat": {"id": 987654321},
      "date": 1674434400,
      "text": "/start"
    }
  }'
```

### Test con token incorrecto (401)

```bash
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: WRONG_SECRET" \
  -d '{"update_id": 123}'
```

Respuesta esperada:
```json
{"error": "Unauthorized"}
```

---

## Monitoreo en Vercel

### Ver logs del webhook

```bash
vercel logs --function /api/telegram --follow
```

### Ver logs de toda la app

```bash
vercel logs
```

---

## Testing Completo (Script bash)

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
SECRET="mi-secreto-2024"

echo "🏥 Testing Health Check..."
curl -s $BASE_URL/api/health | jq .

echo -e "\n🔧 Testing Webhook Setup..."
curl -s -X POST $BASE_URL/api/telegram/set-webhook | jq .

echo -e "\n📡 Testing Bot Message..."
curl -s -X POST $BASE_URL/api/telegram \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $SECRET" \
  -d '{
    "update_id": 123,
    "message": {
      "message_id": 1,
      "from": {"id": 987654321},
      "chat": {"id": 987654321},
      "date": 1674434400,
      "text": "/start"
    }
  }' | jq .

echo -e "\n✅ Tests complete!"
```

Ejecutar:
```bash
chmod +x test.sh
./test.sh
```

---

**Happy testing! 🚀**
