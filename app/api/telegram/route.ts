import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';
import { getBotInstance, initBot } from '@/lib/telegram/bot';
import { connectDB } from '@/lib/db';

/**
 * POST /api/telegram
 * Webhook para recibir updates de Telegram
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv();

    // Validar secret token
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('[TELEGRAM] Secret inválido', { secret });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parsear body
    const update = await request.json();
    console.log('[TELEGRAM] Update recibido:', {
      update_id: update.update_id,
      message_id: update.message?.message_id,
      from_id: update.message?.from?.id,
      text: update.message?.text?.substring(0, 50),
    });

    // Asegurar conexión a DB
    await connectDB();

    // Inicializar bot (primera vez)
    await initBot();

    // Procesar update con el bot
    const bot = getBotInstance();
    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[TELEGRAM] Error procesando update:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram
 * Healthcheck simple para el webhook
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'ok', message: 'Telegram webhook ready' });
}
