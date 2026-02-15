import { z } from 'zod';

/**
 * Normaliza strings: elimina tildes, pasa a minúsculas, trim y espacios múltiples
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/\s+/g, ' '); // Espacios múltiples a uno
}

/**
 * Detecta intención del mensaje
 */
export type Intent = 'INVENTORY' | 'SALE' | 'RESTOCK' | 'ADJUST' | 'DAILY_SALES' | 'UNKNOWN';

export function detectIntent(text: string): Intent {
  const normalized = normalizeText(text);

  // Ventas del día
  if (/cuanto se vendio|cuanto vendi|ventas de hoy|venta de hoy|vendido hoy|sales today/i.test(normalized)) {
    return 'DAILY_SALES';
  }

  // Inventario
  if (/dame el inventario|inventario|stock|dame stock/i.test(normalized)) {
    return 'INVENTORY';
  }

  // Venta
  if (/se vendio|se vendio|vendí|vendi|vendimos/i.test(normalized)) {
    return 'SALE';
  }

  // Restock
  if (/agrega|annade|suma le|ingresa|compre|recibimos/i.test(normalized)) {
    return 'RESTOCK';
  }

  // Ajuste
  if (/ajusta|deja en|pon en|corrige|actualiza el stock/i.test(normalized)) {
    return 'ADJUST';
  }

  return 'UNKNOWN';
}

/**
 * Extrae cantidad del texto
 * Busca números antes o después del verbo principal
 */
export function extractQuantity(text: string): number {
  const numberMatch = text.match(/\b(\d+(?:[.,]\d+)?)\b/);
  if (numberMatch) {
    const num = parseFloat(numberMatch[1].replace(',', '.'));
    return Number.isNaN(num) ? 1 : Math.max(1, Math.floor(num));
  }
  return 1;
}

/**
 * Extrae precio del texto
 * Busca "por 32.000", "por 32,000", "por 32000", "$32000"
 */
export function extractPrice(text: string): number | null {
  // Patrón: "por 32.000", "por 32,000", "$32000"
  const priceMatch = text.match(/(?:por|^\$)\s*\$?\s*([\d.,]+)/i);
  if (priceMatch) {
    const priceStr = priceMatch[1].replace(/[.,]/g, '');
    const price = parseInt(priceStr, 10);
    return !isNaN(price) ? price : null;
  }
  return null;
}

/**
 * Extrae marca del texto
 * Busca "marca X" o "marca: X"
 */
export function extractBrand(text: string): string | null {
  const brandMatch = text.match(/marca[:\s]+([^\s,;.por]+(?:\s+[^\s,;.por]+)*)/i);
  if (brandMatch) {
    return brandMatch[1].trim();
  }
  return null;
}

/**
 * Extrae nombre del producto
 * Elimina verbo, cantidad, marca, precio
 */
export function extractProductName(text: string): string {
  let cleaned = text;

  // Remover verbos comunes
  cleaned = cleaned.replace(
    /^(se\s+)?(vendio|vendio|vendí|vendi|vendimos|agrega|annade|suma le|ingresa|ajusta|deja en|pon en|dame|muestra|compre|recibimos)/i,
    ''
  );

  // Remover "marca X"
  cleaned = cleaned.replace(/marca[:\s]+[^\s,;.por]+(?:\s+[^\s,;.por]+)*/i, '');

  // Remover "por PRECIO"
  cleaned = cleaned.replace(/por\s+[\d.,]+/i, '');

  // Remover números de cantidad (comúnmente al inicio o final)
  cleaned = cleaned.replace(/^\s*\d+\s+/i, '');
  cleaned = cleaned.replace(/\s+\d+\s*$/i, '');

  // Remover símbolos de dinero
  cleaned = cleaned.replace(/[$]/g, '');

  return cleaned.trim();
}

/**
 * Parsea mensaje de texto libre y retorna estructura
 */
export interface ParsedMessage {
  intent: Intent;
  productName: string | null;
  brand: string | null;
  quantity: number;
  price: number | null;
  rawText: string;
}

export function parseMessage(rawText: string): ParsedMessage {
  const intent = detectIntent(rawText);
  const brand = extractBrand(rawText);
  const quantity = extractQuantity(rawText);
  const price = extractPrice(rawText);
  const productName =
    intent === 'INVENTORY'
      ? null
      : extractProductName(rawText) || null;

  return {
    intent,
    productName,
    brand,
    quantity,
    price,
    rawText,
  };
}

/**
 * Valida que el producto y otros datos tengan sentido
 */
const ParsedMessageSchema = z.object({
  intent: z.enum(['INVENTORY', 'SALE', 'RESTOCK', 'ADJUST', 'UNKNOWN']),
  productName: z.string().min(1).nullable(),
  brand: z.string().nullable(),
  quantity: z.number().positive(),
  price: z.number().positive().nullable(),
  rawText: z.string(),
});

export function validateParsedMessage(
  msg: ParsedMessage
): { valid: boolean; errors?: string[] } {
  try {
    ParsedMessageSchema.parse(msg);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error.errors.map((e) => e.message) };
    }
    return { valid: false, errors: ['Validación desconocida falló'] };
  }
}
