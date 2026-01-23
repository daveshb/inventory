# Inventory Telegram Bot - Deployment Checklist

## Pre-Deploy

- [ ] `npm install` completó sin errores
- [ ] `npm run build` compiló sin errores
- [ ] `.env.local` tiene todas las variables requeridas
- [ ] MongoDB Atlas cluster está activo
- [ ] Bot de Telegram creado en BotFather
- [ ] User ID confirmado via @userinfobot

## Vercel Setup

- [ ] Proyecto conectado a Vercel
- [ ] Variables de entorno configuradas:
  - [ ] `MONGODB_URI`
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `TELEGRAM_WEBHOOK_SECRET`
  - [ ] `ALLOWED_USER_IDS`
  - [ ] `APP_BASE_URL`
  - [ ] `NODE_ENV=production`

## Post-Deploy

- [ ] Deploy completado sin errores
- [ ] URL de Vercel anotada (ej: https://mi-inventory.vercel.app)
- [ ] GET /api/health retorna 200
- [ ] POST /api/telegram/set-webhook ejecutado exitosamente
- [ ] Webhook info confirmado con GET /api/telegram/set-webhook

## Testing Telegram

- [ ] Enviar `/start` al bot
- [ ] Enviar `/help` al bot
- [ ] Crear producto: `/agregar cera 10`
- [ ] Consultar inventario: `/inventario`
- [ ] Registrar venta: `/vender cera 1 32000`
- [ ] Ver movimientos: `/movimientos`
- [ ] Probar texto libre: "vendí 2 cera nativo por 32.000"

## Database

- [ ] Colección Products creada con documentos
- [ ] Colección Movements creada con historial
- [ ] Índices creados automáticamente
- [ ] MongoDB Atlas: IP Whitelist contiene 0.0.0.0/0

## Troubleshooting (Si algo falla)

### Bot no responde
```bash
# Verificar webhook
curl https://tu-app.vercel.app/api/telegram/set-webhook

# Ver logs
vercel logs --function /api/telegram
```

### Database connection error
- Verifica MONGODB_URI exacta
- Confirma IP whitelist en MongoDB Atlas
- Verifica credenciales usuario/password

### 401 Unauthorized en webhook
- Verifica TELEGRAM_WEBHOOK_SECRET exacto
- Ejecuta set-webhook nuevamente

---

**Keep this file handy during deployment!**
