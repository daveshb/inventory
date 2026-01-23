import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

/**
 * GET /api/health
 * Healthcheck que verifica conexión a DB
 */
export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('[HEALTH] Database connection failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
