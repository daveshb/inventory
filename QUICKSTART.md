# 🚀 Quick Start Guide

## Local Development

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env.local con tus variables
# Ver .env.example como referencia

# 3. Ejecutar en desarrollo
npm run dev

# 4. El servidor estará en http://localhost:3000
```

## Configuración del Bot

### 1. Crear Bot en Telegram

1. Abre Telegram, busca `@BotFather`
2. Envía `/start` → `/newbot`
3. Dame un nombre: `InventoryBot`
4. Dame un username: `my_inventory_bot`
5. **Copiar el TOKEN que te da**

### 2. Obtener tu User ID

1. Busca `@userinfobot`
2. Envía `/start`
3. Verás tu User ID en el mensaje

### 3. Crear MongoDB Atlas Database

1. Ve a https://mongodb.com/cloud/atlas
2. Crear cuenta gratuita (cluster M0)
3. Crear usuario de base de datos
4. Obtener connection string en "Connect" → "Drivers"

### 4. Configurar .env.local

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inventory?retryWrites=true&w=majority
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIjKlmNoPqRstuVwXyZ
TELEGRAM_WEBHOOK_SECRET=algo-super-seguro-aleatorio
ALLOWED_USER_IDS=tu_user_id
APP_BASE_URL=http://localhost:3000
TELEGRAM_WEBHOOK_PATH=/api/telegram
NODE_ENV=development
```

## Deployment a Vercel

```bash
# 1. Compilar localmente para verificar
npm run build

# 2. Hacer push a GitHub
git add .
git commit -m "Initial bot setup"
git push

# 3. Conectar a Vercel
# - Ve a https://vercel.com
# - Importa tu repositorio
# - Agrega las variables de entorno (iguales que .env.local)
# - Deploy

# 4. Establecer webhook
curl -X POST https://tu-app.vercel.app/api/telegram/set-webhook
```

## Testing

### Healthcheck

```bash
curl http://localhost:3000/api/health
```

Debería retornar:
```json
{"status":"healthy","database":"connected"}
```

### Verificar Webhook

```bash
curl http://localhost:3000/api/telegram/set-webhook
```

### Enviar comando al bot

En Telegram, envía:
- `/start` - Bienvenida
- `/help` - Lista de comandos
- `/inventario` - Ver stock
- `/agregar cera 10` - Agregar producto

## Estructura de Carpetas

```
.
├── app/
│   ├── layout.tsx          # Layout root
│   └── api/
│       ├── health/route.ts         # Healthcheck
│       └── telegram/
│           ├── route.ts             # Webhook POST
│           └── set-webhook/route.ts # Config webhook
├── lib/
│   ├── db.ts               # MongoDB connection + cache
│   ├── env.ts              # Validación de env vars (zod)
│   ├── parser.ts           # NLP parsing
│   └── telegram/
│       ├── bot.ts          # grammY bot instance
│       └── handlers.ts     # Command handlers
├── models/
│   ├── Product.ts          # Schema de productos
│   └── Movement.ts         # Schema de movimientos
├── services/
│   └── inventoryService.ts # Business logic
└── [config files]
```

## Variables de Entorno

| Nombre | Requerido | Descripción |
|--------|-----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `TELEGRAM_BOT_TOKEN` | ✅ | Token del bot (BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | ✅ | Secret para validar requests |
| `ALLOWED_USER_IDS` | ✅ | IDs de Telegram autorizados (csv) |
| `APP_BASE_URL` | ⚠️ | URL pública (para setWebhook) |
| `TELEGRAM_WEBHOOK_PATH` | ❌ | Ruta webhook (default: /api/telegram) |
| `NODE_ENV` | ❌ | development o production |

## Comandos Disponibles

| Comando | Ejemplo |
|---------|---------|
| `/start` | Muestra mensaje de bienvenida |
| `/help` | Lista todos los comandos |
| `/inventario` | Muestra stock > 0 |
| `/inventario_todo` | Todos los productos |
| `/agregar` | `/agregar cera marca nativo 10` |
| `/vender` | `/vender cera 1 32000` |
| `/producto` | `/producto cera nativo` |
| `/movimientos` | `/movimientos 20` |
| `/ajustar` | `/ajustar cera 5` |

## Texto Libre (NLP)

El bot también entiende mensajes naturales sin `/`:

```
"dame el inventario"
"vendí 2 cera nativo por 32.000"
"agrega 10 cera marca nativo"
"pon el stock en 15"
```

## Troubleshooting

### ❌ "Cannot find module 'mongoose'"

```bash
npm install
```

### ❌ "MongoDB connection failed"

- Verifica la URL en MONGODB_URI
- En MongoDB Atlas, agrega `0.0.0.0/0` a IP Whitelist
- Verifica user/password

### ❌ Bot no responde

- Verifica que el usuario esté en ALLOWED_USER_IDS
- Usa @userinfobot para confirmar tu ID
- Chequea los logs: `vercel logs --function /api/telegram`

### ❌ Webhook 401 Unauthorized

- Verifica que TELEGRAM_WEBHOOK_SECRET sea idéntico
- Ejecuta nuevamente: `POST /api/telegram/set-webhook`

## Recursos

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [grammY Framework](https://grammy.dev)
- [MongoDB Mongoose](https://mongoosejs.com)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**¿Preguntas? Revisa README.md para documentación completa.**



