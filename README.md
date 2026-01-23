# 📦 Inventory Telegram Bot

Sistema de inventario desplegable en Vercel controlado por Telegram. Backend ONLY (sin UI).

**Stack**: Next.js 14+ (App Router) + TypeScript + MongoDB Atlas + grammY + Mongoose

## 🎯 Características

✅ **Comandos Telegram**: /start, /help, /inventario, /agregar, /vender, /producto, /movimientos, /ajustar  
✅ **Texto Libre (NLP)**: Parseo regex para intenciones naturales  
✅ **MongoDB Atlas**: Con caching de conexiones para Vercel  
✅ **Webhook Seguro**: Validación vía header secret  
✅ **Whitelist de Usuarios**: Control de acceso por userId  
✅ **Historial**: Kardex completo (SALE, RESTOCK, ADJUST)  
✅ **Atomicidad**: Operaciones de stock consistentes  
✅ **Vercel Ready**: Deployable sin cambios  

---

## 📋 Requisitos Previos

- Node.js 18+ / npm
- MongoDB Atlas (gratuito)
- Bot Telegram (BotFather)
- Vercel (para deploy)

---

## 🚀 Setup Local

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Crear Bot Telegram (BotFather)

1. Busca `@BotFather` en Telegram
2. `/start` → `/newbot`
3. Nombre: "InventoryBot", Username: "my_inventory_bot"
4. Copiar TOKEN: `123456789:ABCDefGhIjKlmNoPqRstuVwXyZ`

### 3. Obtener User ID

1. Busca `@userinfobot`
2. `/start` → verás tu ID

### 4. MongoDB Atlas

1. [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Crear cluster gratuito + usuario
3. Connection string: `mongodb+srv://user:pwd@cluster.mongodb.net/inventory?retryWrites=true`

### 5. Variables de Entorno

`.env.local`:

```env
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/inventory?retryWrites=true&w=majority
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIjKlmNoPqRstuVwXyZ
TELEGRAM_WEBHOOK_SECRET=mi-secreto-2024
ALLOWED_USER_IDS=1234567890
APP_BASE_URL=http://localhost:3000
TELEGRAM_WEBHOOK_PATH=/api/telegram
NODE_ENV=development
```

### 6. Ejecutar

```bash
npm run dev
```

---

## 🌐 Deploy a Vercel

1. Configurar variables en Vercel
2. Deploy automático
3. Establecer webhook:

```bash
curl -X POST https://tu-app.vercel.app/api/telegram/set-webhook
```

---

## 📖 Uso

### Comandos

| Comando | Uso |
|---------|-----|
| `/start` | Bienvenida |
| `/help` | Listar todos |
| `/inventario` | Stock > 0 |
| `/inventario_todo` | Todos |
| `/agregar <producto> [qty] [marca]` | Agregar stock |
| `/vender <producto> [qty] [precio]` | Registrar venta |
| `/producto <nombre>` | Detalle |
| `/movimientos [n]` | Últimos n (default 10) |
| `/ajustar <producto> <stock>` | Stock exacto |

### Texto Libre

```
"dame el inventario"
"vendí 2 cera nativo por 32.000"
"agrega 10 cera marca nativo"
"ajusta cera a 15"
```

---

## 🗄️ Base de Datos

**Products**:
- name, nameNormalized, brand, brandNormalized
- stock, sku, lastMovementAt
- Índice único: (nameNormalized, brandNormalized)

**Movements**:
- type: SALE | RESTOCK | ADJUST
- productId, qty, price, rawText
- telegram: {chatId, userId, messageId}
- createdAt
- Índices: createdAt, (productId, createdAt)

---

## 🔒 Seguridad

- **Webhook**: Validación X-Telegram-Bot-Api-Secret-Token
- **Whitelist**: ALLOWED_USER_IDS (usuarios no autorizados ignorados)
- **MongoDB**: Connection caching en globalThis (Vercel serverless)

---

## 🧪 Testing

Healthcheck:
```bash
curl http://localhost:3000/api/health
```

Webhook info:
```bash
curl http://localhost:3000/api/telegram/set-webhook
```

---

## 📦 Estructura del Proyecto

```
.
├── app/api/
│   ├── health/route.ts
│   └── telegram/
│       ├── route.ts
│       └── set-webhook/route.ts
├── lib/
│   ├── db.ts (Mongoose + cache)
│   ├── env.ts (Zod validation)
│   ├── parser.ts (NLP)
│   └── telegram/
│       ├── bot.ts (grammY)
│       └── handlers.ts
├── models/
│   ├── Product.ts
│   └── Movement.ts
├── services/
│   └── inventoryService.ts
└── README.md
```

---

## 📝 Variables de Entorno

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | ✅ | `mongodb+srv://...` |
| `TELEGRAM_BOT_TOKEN` | ✅ | `123456:ABC...` |
| `TELEGRAM_WEBHOOK_SECRET` | ✅ | `mi-secreto` |
| `ALLOWED_USER_IDS` | ✅ | `123,456` |
| `APP_BASE_URL` | ⚠️ | `https://app.vercel.app` |
| `TELEGRAM_WEBHOOK_PATH` | ❌ | `/api/telegram` |
| `NODE_ENV` | ❌ | `production` |

---

## 🐛 Troubleshooting

### MongoDB error
- Verifica MONGODB_URI
- MongoDB Atlas: Whitelist `0.0.0.0/0`
- Usuario/password correctos

### Webhook 401
- TELEGRAM_WEBHOOK_SECRET exacto
- Llama POST `/api/telegram/set-webhook`

### Usuario no recibe mensajes
- Verifica userId en ALLOWED_USER_IDS
- Usa @userinfobot para confirmar

---

## 📞 Recursos

- [Telegram Bot API](https://core.telegram.org/bots)
- [grammY Framework](https://grammy.dev)
- [MongoDB Docs](https://docs.mongodb.com)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 📄 Licencia

MIT

---

**¡Happy inventory tracking! 📦**
