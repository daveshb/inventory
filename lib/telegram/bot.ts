import { Bot, Context } from 'grammy';
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
  handleDailySales,
} from './handlers';

let botInstance: Bot | null = null;
let botInitialized = false;

function commandArgs(ctx: Context, command: string): string[] {
  const text = ctx.message?.text || '';
  return text
    .slice(command.length + 1)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

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
  bot.command('stock', (ctx) => handleInventario(ctx, false));
  bot.command('stock_todo', (ctx) => handleInventario(ctx, true));
  bot.command('ventas_hoy', handleDailySales);

  bot.command('agregar', (ctx) => {
    handleAgregar(ctx, commandArgs(ctx, 'agregar'));
  });
  bot.command('sumar', (ctx) => handleAgregar(ctx, commandArgs(ctx, 'sumar')));
  bot.command('entrada', (ctx) => handleAgregar(ctx, commandArgs(ctx, 'entrada')));

  bot.command('vender', (ctx) => {
    handleVender(ctx, commandArgs(ctx, 'vender'));
  });
  bot.command('venta', (ctx) => handleVender(ctx, commandArgs(ctx, 'venta')));

  bot.command('producto', (ctx) => {
    const args = ctx.message?.text?.slice('/producto'.length).trim();
    handleProducto(ctx, args ? [args] : []);
  });
  bot.command('buscar', (ctx) => {
    const args = ctx.message?.text?.slice('/buscar'.length).trim();
    handleProducto(ctx, args ? [args] : []);
  });

  bot.command('movimientos', (ctx) => {
    handleMovimientos(ctx, commandArgs(ctx, 'movimientos'));
  });
  bot.command('historial', (ctx) => handleMovimientos(ctx, commandArgs(ctx, 'historial')));

  bot.command('ajustar', (ctx) => {
    handleAjustar(ctx, commandArgs(ctx, 'ajustar'));
  });

  /**
   * Texto libre
   */
  bot.on('message:text', handleFreeText);

  botInstance = bot;
  return bot;
}
/**
 * Inicializa el bot (llama a init() para obtener botInfo)
 */
export async function initBot(): Promise<void> {
  if (botInitialized) {
    return;
  }

  const bot = getBotInstance();
  try {
    await bot.init();
    botInitialized = true;
    console.log('[BOT] Inicializado correctamente');
  } catch (error) {
    console.error('[BOT] Error al inicializar:', error);
    throw error;
  }
}