import { z } from 'zod';
import { getEnv } from '@/lib/env';
import { ParsedMessage, validateParsedMessage } from '@/lib/parser';

const AiParsedMessageSchema = z.object({
  intent: z.enum(['INVENTORY', 'SALE', 'RESTOCK', 'ADJUST', 'DAILY_SALES', 'UNKNOWN']),
  productName: z.string().nullable(),
  brand: z.string().nullable(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive().nullable(),
});

function normalizeAiParsedMessage(
  rawText: string,
  data: z.infer<typeof AiParsedMessageSchema>
): ParsedMessage {
  const parsed: ParsedMessage = {
    intent: data.intent,
    productName: data.productName?.trim() || null,
    brand: data.brand?.trim() || null,
    quantity: data.quantity || 1,
    price: data.price ?? null,
    rawText,
  };

  const validation = validateParsedMessage(parsed);
  if (!validation.valid) {
    return {
      intent: 'UNKNOWN',
      productName: null,
      brand: null,
      quantity: 1,
      price: null,
      rawText,
    };
  }

  return parsed;
}

export async function parseMessageWithAI(rawText: string): Promise<ParsedMessage | null> {
  const env = getEnv();
  if (!env.AI_INTENT_ENABLED || !env.OPENAI_API_KEY) {
    return null;
  }

  const systemPrompt = [
    'Eres un parser de intenciones para un bot de inventario.',
    'Tu salida debe ser JSON válido.',
    'Solo usa estos intents: INVENTORY, SALE, RESTOCK, ADJUST, DAILY_SALES, UNKNOWN.',
    'quantity debe ser entero positivo. Si no hay cantidad, usa 1.',
    'price es precio unitario entero positivo o null.',
    'Si no hay producto claro, productName debe ser null.',
    'No inventes campos ni agregues texto fuera del JSON.',
  ].join(' ');

  const userPrompt = `Mensaje del usuario: "${rawText}"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'inventory_intent',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                intent: {
                  type: 'string',
                  enum: ['INVENTORY', 'SALE', 'RESTOCK', 'ADJUST', 'DAILY_SALES', 'UNKNOWN'],
                },
                productName: { type: ['string', 'null'] },
                brand: { type: ['string', 'null'] },
                quantity: { type: 'integer', minimum: 1 },
                price: { type: ['integer', 'null'], minimum: 1 },
              },
              required: ['intent', 'productName', 'brand', 'quantity', 'price'],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('[AI] Error OpenAI:', response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsedJson = JSON.parse(content);
    const parsed = AiParsedMessageSchema.parse(parsedJson);
    return normalizeAiParsedMessage(rawText, parsed);
  } catch (error) {
    console.error('[AI] Error parseando intención:', error);
    return null;
  }
}
