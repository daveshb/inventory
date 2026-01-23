import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

/**
 * POST /api/telegram/set-webhook
 * Endpoint para establecer el webhook en Telegram
 * Protegido por un header secreto adicional
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv();

    // Verificar que sea una llamada local o de un admin
    const adminSecret = request.headers.get('X-Admin-Secret');
    // En producción, usar una variable de entorno para el admin secret
    // Por ahora, solo permitir en desarrollo
    if (
      env.NODE_ENV === 'production' &&
      (!adminSecret || adminSecret !== process.env.ADMIN_SECRET)
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!env.APP_BASE_URL) {
      return NextResponse.json(
        { error: 'APP_BASE_URL no configurado' },
        { status: 400 }
      );
    }

    const webhookUrl = `${env.APP_BASE_URL}${env.TELEGRAM_WEBHOOK_PATH}`;

    // Llamar a Telegram API
    const response = await fetch(
      'https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/setWebhook',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: env.TELEGRAM_WEBHOOK_SECRET,
          allowed_updates: ['message'],
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('[WEBHOOK] Error setting webhook:', data);
      return NextResponse.json(
        { error: data.description || 'Error setting webhook' },
        { status: 400 }
      );
    }

    console.log('[WEBHOOK] Webhook establecido correctamente:', webhookUrl);

    return NextResponse.json({
      success: true,
      message: 'Webhook establecido correctamente',
      url: webhookUrl,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/set-webhook
 * Información del webhook actual
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getEnv();

    // Llamar a Telegram API para obtener info del webhook
    const response = await fetch(
      'https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/getWebhookInfo',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      webhookInfo: data.result || null,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error getting info:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
