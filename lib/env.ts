import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url('MongoDB URI inválido'),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Token de bot requerido'),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1, 'Secret de webhook requerido'),
  ALLOWED_USER_IDS: z.string().transform((val) =>
    val
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
  ),
  APP_BASE_URL: z.string().url('URL base inválida').optional(),
  TELEGRAM_WEBHOOK_PATH: z.string().default('/api/telegram'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  AI_INTENT_ENABLED: z
    .string()
    .optional()
    .transform((val) => (val ?? 'true').toLowerCase() === 'true'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  try {
    const env = envSchema.parse(process.env);
    cachedEnv = env;
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Errores en variables de entorno:', error.errors);
      throw new Error('Configuración de entorno inválida');
    }
    throw error;
  }
}
