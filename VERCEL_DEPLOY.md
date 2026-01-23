# 🚀 Vercel Deployment Guide

## Pre-Requisitos

✅ Proyecto compilado localmente (`npm run build` sin errores)  
✅ Cuenta de GitHub con el código pusheado  
✅ Cuenta Vercel (gratuita)  
✅ MongoDB Atlas database creada  
✅ Bot Telegram creado en BotFather  

---

## Paso 1: Preparar el Repositorio

### Crear .gitignore

Asegúrate que `.gitignore` incluya:
```
.env.local
node_modules/
.next/
*.log
```

### Commit del código

```bash
git add .
git commit -m "Initial inventory bot setup"
git push origin main
```

---

## Paso 2: Crear Cuenta en Vercel

1. Ve a https://vercel.com
2. Click "Sign Up"
3. Registrarse con GitHub (recomendado)
4. Autorizar acceso a repositorios

---

## Paso 3: Importar Proyecto a Vercel

1. En Vercel dashboard, click "New Project"
2. Seleccionar tu repositorio (inventory)
3. Click "Import"
4. **NO HACER DEPLOY AÚN** - Primero configurar variables

---

## Paso 4: Configurar Variables de Entorno

En la pantalla "Configure Project":

1. Click en "Environment Variables"
2. Agregar cada variable (copiar exactamente igual a `.env.local`):

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/inventory?retryWrites=true&w=majority` | De MongoDB Atlas |
| `TELEGRAM_BOT_TOKEN` | `123456789:ABCDefGhIjKlmNoPqRstuVwXyZ` | De BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | `algo-super-seguro-aleatorio-2024` | Genera algo aleatorio |
| `ALLOWED_USER_IDS` | `987654321` | Tu User ID de Telegram |
| `APP_BASE_URL` | `https://tu-proyecto.vercel.app` | Verás esta URL después de deploy |
| `TELEGRAM_WEBHOOK_PATH` | `/api/telegram` | Por defecto |
| `NODE_ENV` | `production` | Para Vercel |

3. Click "Deploy"

---

## Paso 5: Esperar el Deploy

Vercel compilará el proyecto automáticamente. Esto toma ~1-2 minutos.

Verás:
- ✅ Build
- ✅ Deploy
- ✅ Domains

---

## Paso 6: Obtener URL Pública

Una vez deployed, tu URL será:

```
https://tu-proyecto.vercel.app
```

(Vercel te la mostrará en el dashboard)

---

## Paso 7: Actualizar `APP_BASE_URL`

Ahora que conoces tu URL pública:

1. Ve a Vercel Project Settings
2. Variables de entorno
3. Editar `APP_BASE_URL` con tu URL real
4. Save (automáticamente redeploy)

---

## Paso 8: Establecer Webhook en Telegram

Una vez que el deploy está completado y `APP_BASE_URL` está actualizado:

```bash
curl -X POST https://tu-proyecto.vercel.app/api/telegram/set-webhook
```

Deberías recibir:
```json
{
  "success": true,
  "message": "Webhook establecido correctamente",
  "url": "https://tu-proyecto.vercel.app/api/telegram"
}
```

---

## Paso 9: Verificar Healthcheck

```bash
curl https://tu-proyecto.vercel.app/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T14:30:00Z",
  "database": "connected"
}
```

---

## Paso 10: Test Telegram

Abre Telegram y envía a tu bot:

```
/start
```

Deberías recibir la respuesta del bot.

---

## Troubleshooting Vercel

### ❌ Build Failed

```bash
vercel logs
```

Causas comunes:
- Falta variable de entorno
- Error en el código TypeScript
- Falta `npm install` en build

### ❌ Bot no responde (Webhook Error)

```bash
# Ver logs de la función webhook
vercel logs --function /api/telegram --follow
```

Causas comunes:
- `TELEGRAM_WEBHOOK_SECRET` incorrecto
- `APP_BASE_URL` no actualizado
- Webhook no fue establecido

### ❌ MongoDB Connection Error

```bash
vercel logs --function /api/health
```

Soluciones:
- En MongoDB Atlas: IP Whitelist → Add 0.0.0.0/0
- Verificar `MONGODB_URI` exacta
- Verificar credenciales user/password
- Esperar ~15 segundos después de crear usuario

### ❌ 401 Unauthorized

El secret del webhook no coincide:
- Verifica que `TELEGRAM_WEBHOOK_SECRET` sea idéntico en env
- Ejecuta nuevamente: `POST /api/telegram/set-webhook`

---

## Logs en Tiempo Real

```bash
# Instalar Vercel CLI
npm install -g vercel

# Loguear
vercel login

# Ver logs
vercel logs --follow
```

---

## Redeploy Manual

Si necesitas redeployar:

```bash
# Opción 1: Push a GitHub (automático)
git push origin main

# Opción 2: Vercel CLI
vercel --prod
```

---

## Escalabilidad y Performance

### MongoDB Atlas

- Usa cluster gratuito M0 para empezar
- Upgrade a M2+ cuando tengas muchos movimientos
- Los índices se crean automáticamente

### Vercel

- Gratis hasta 100GB de banda ancho/mes
- 12 serverless function executions/day
- Sin máximo de requests

### Optimizaciones

- Las conexiones MongoDB se cachean en `globalThis`
- Evita múltiples conexiones simultáneas
- Índices en `(nameNormalized, brandNormalized)` para búsquedas rápidas

---

## Seguridad en Producción

✅ **Secret Token**: Validado en cada request webhook  
✅ **Whitelist Users**: Solo usuarios en ALLOWED_USER_IDS pueden ejecutar comandos  
✅ **HTTPS**: Vercel usa HTTPS por defecto  
✅ **Env Variables**: Nunca expongas tokens en el código  
✅ **MongoDB IP**: Whitelist 0.0.0.0/0 (solo para Vercel) o IPs específicas  

---

## Monitoreo Recomendado

1. **Vercel Dashboard**: Monitorear deploys fallidos
2. **Telegram Bot**: Mensajes de error que retorna el bot
3. **MongoDB Atlas**: Monitorear uso de memoria y conexiones
4. **Logs**: `vercel logs --function /api/telegram`

---

## Rollback (Volver a Versión Anterior)

En Vercel Dashboard:
1. Ir a "Deployments"
2. Encontrar deploy anterior
3. Click "Redeploy"

---

## Dominio Personalizado (Opcional)

1. Vercel Project Settings → Domains
2. Agregar dominio personalizado
3. Actualizar DNS en tu registrador
4. Actualizar `APP_BASE_URL` con nuevo dominio

---

## Checklist Final

- [ ] Código pusheado a GitHub
- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy completado sin errores
- [ ] `APP_BASE_URL` apunta a URL correcta de Vercel
- [ ] `/api/health` retorna 200
- [ ] `/api/telegram/set-webhook` ejecutado exitosamente
- [ ] Bot responde a `/start` en Telegram
- [ ] `/inventario` muestra lista de productos
- [ ] `/agregar cera 10` crea producto
- [ ] `/vender cera 1 32000` registra venta
- [ ] Logs en Vercel son accesibles
- [ ] MongoDB Atlas whitelist tiene 0.0.0.0/0

---

## Próximos Pasos

1. Crear base de productos
2. Entrenar a usuarios en comandos
3. Monitorear logs regularmente
4. Backups de MongoDB
5. Mejoras basadas en feedback

---

**¡Deployment completado! 🎉**

Para soporte: Revisar logs en `vercel logs` y README.md
