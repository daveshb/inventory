import { Bot } from 'grammy';
import { getEnv } from '@/lib/env';
import {
  handleStart,
  handleHelp,
  handleInventario,
  handleAgregar,
  handleVender,
  handleProducto,
  handleMovimientos,
  handleAjustar,
  handleFreeText,
} from './handlers';

let botInstance: Bot | null = null;

/**
 * Obtiene o crea la instancia del bot
 */
export function getBotInstance(): Bot {
  if (botInstance) {
    return botInstance;
  }

  const env = getEnv();
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  /**
   * Middleware: Validar que el usuario esté en whitelist
   */
  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;

    if (!userId) {
      console.warn('[AUTH] No userId en contexto');
      return;
    }

    if (!env.ALLOWED_USER_IDS.includes(userId)) {
      console.warn(`[AUTH] Usuario no autorizado: ${userId}`);
      // No respondemos para no dar feedback
      return;
    }

    await next();
  });

  /**
   * Comandos
   */
  bot.command('start', handleStart);
  bot.command('help', handleHelp);

  bot.command('inventario', (ctx) => handleInventario(ctx, false));
  bot.command('inventario_todo', (ctx) => handleInventario(ctx, true));

  bot.command('agregar', (ctx) => {
    const args = ctx.message?.text?.slice('/agregar'.length).trim().split(/\s+/);
    handleAgregar(ctx, args || []);
  });

  bot.command('vender', (ctx) => {
    const args = ctx.message?.text?.slice('/vender'.length).trim().split(/\s+/);
    handleVender(ctx, args || []);
  });

  bot.command('producto', (ctx) => {
    const args = ctx.message?.text?.slice('/producto'.length).trim();
    handleProducto(ctx, args ? [args] : []);
  });

  bot.command('movimientos', (ctx) => {
    const args = ctx.message?.text?.slice('/movimientos'.length).trim().split(/\s+/);
    handleMovimientos(ctx, args || []);
  });

  bot.command('ajustar', (ctx) => {
    const args = ctx.message?.text?.slice('/ajustar'.length).trim().split(/\s+/);
    handleAjustar(ctx, args || []);
  });

  /**
   * Texto libre
   */
  bot.on('message:text', handleFreeText);

  botInstance = bot;
  return bot;
}
