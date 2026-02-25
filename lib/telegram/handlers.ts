import { Context } from 'grammy';
import {
  findOrCreateProduct,
  sellProduct,
  restockProduct,
  adjustProductStock,
  listInventory,
  listMovements,
  searchProducts,
  getProductDetail,
  getDailySales,
} from '@/services/inventoryService';
import {
  parseMessage,
  normalizeText,
  extractProductName,
} from '@/lib/parser';
import { parseMessageWithAI } from '@/lib/aiIntent';
import { ITelegramData } from '@/models/Movement';

/**
 * Crea datos de Telegram del contexto
 */
function getTelegramData(ctx: Context): ITelegramData {
  return {
    chatId: ctx.chat?.id || 0,
    userId: ctx.from?.id || 0,
    messageId: ctx.message?.message_id || 0,
  };
}

/**
 * Comando /mi_id - Muestra el userId de Telegram del remitente
 */
export async function handleMiId(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const username = ctx.from?.username ? `@${ctx.from.username}` : '(sin username)';
  const firstName = ctx.from?.first_name || '(sin nombre)';

  const message = `🆔 *Tu información de Telegram*

👤 Nombre: ${firstName}
🔖 Username: ${username}
🔢 Tu User ID: \`${userId}\`

Para autorizar este teléfono en el bot, el administrador debe agregar tu User ID (\`${userId}\`) a la variable de entorno \`ALLOWED_USER_IDS\`.`;

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Comando /start
 */
export async function handleStart(ctx: Context): Promise<void> {
  const message = `👋 ¡Hola! Soy tu asistente de inventario por Telegram.

Puedo ayudarte a:
✅ Registrar ventas
📦 Registrar restock
📊 Consultar inventario
🔄 Ajustar stock
📋 Ver movimientos

Escribe /help para ver todos los comandos o simplemente escribe mensajes normales como:
• "vendí 2 cera marca nativo por 32.000"
• "agrega 10 cera"
• "dame el inventario"`;

  await ctx.reply(message);
}

/**
 * Comando /help
 */
export async function handleHelp(ctx: Context): Promise<void> {
  const message = `📚 **COMANDOS DISPONIBLES**

📋 *Información*
/start - Mensaje de bienvenida
/help - Muestra esta ayuda
/mi_id - Muestra tu User ID de Telegram

📊 *Inventario*
/inventario - Muestra productos con stock > 0
/inventario_todo - Muestra todos los productos (incluso sin stock)
/stock - Alias rápido de /inventario
/ventas_hoy - Resumen de ventas del día

➕ *Operaciones*
/agregar <producto> [cantidad] [marca] - Agrega stock
/sumar <producto> [cantidad] [marca] - Alias de /agregar
/vender <producto> [cantidad] [precio] - Registra venta
/venta <producto> [cantidad] [precio] - Alias de /vender
/producto <nombre> - Muestra detalle del producto
/buscar <nombre> - Alias de /producto
/movimientos [n] - Últimos n movimientos (default 10)
/historial [n] - Alias de /movimientos
/ajustar <producto> <nuevo_stock> - Ajusta stock exacto

📝 *Texto Libre*
También puedes escribir mensajes normales:
• "se vendió cera para el cabello marca nativo por 32.000"
• "vendí 2 cera nativo"
• "dame el inventario"
• "agrega 10 cera marca nativo"

🤖 *IA Conversacional*
Si configuras \`OPENAI_API_KEY\`, el bot interpreta mejor frases ambiguas y lenguaje natural.

💡 **EJEMPLOS**
/inventario
/agregar cera para el cabello marca nativo 10
/vender cera nativo 1 32000
/movimientos 20
/producto cera nativo`;

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Comando /inventario
 */
export async function handleInventario(
  ctx: Context,
  includeEmpty: boolean = false
): Promise<void> {
  try {
    const products = await listInventory(includeEmpty);

    if (products.length === 0) {
      await ctx.reply(
        includeEmpty
          ? '📦 No hay productos registrados'
          : '📦 No hay productos con stock disponible'
      );
      return;
    }

    let response = includeEmpty
      ? '📦 **INVENTARIO COMPLETO**\n\n'
      : '📦 **INVENTARIO DISPONIBLE**\n\n';

    for (const product of products) {
      const brand = product.brand ? ` (${product.brand})` : '';
      const stock = product.stock > 0 ? `${product.stock}` : '0';
      response += `• ${product.name}${brand}: **${stock}** unidades\n`;
    }

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[INVENTARIO]', error);
    await ctx.reply('❌ Error al obtener el inventario');
  }
}

/**
 * Comando /agregar
 */
export async function handleAgregar(
  ctx: Context,
  args: string[]
): Promise<void> {
  if (!args || args.length === 0) {
    await ctx.reply('❌ Uso: /agregar <producto> [cantidad] [marca]');
    return;
  }

  try {
    const text = args.join(' ');
    const quantity = parseInt(args[args.length - 1], 10) || 1;
    const productName = extractProductName(`agregar ${text}`);
    const brand = text.match(/marca\s+(\S+)/)?.[1] || null;

    if (!productName) {
      await ctx.reply('❌ No entiendo el nombre del producto');
      return;
    }

    const product = await findOrCreateProduct(productName, brand);
    const result = await restockProduct(
      product._id.toString(),
      quantity,
      getTelegramData(ctx),
      ctx.message?.text || text
    );

    await ctx.reply(result.message);
  } catch (error) {
    console.error('[AGREGAR]', error);
    await ctx.reply('❌ Error al procesar el restock');
  }
}

/**
 * Comando /vender
 */
export async function handleVender(
  ctx: Context,
  args: string[]
): Promise<void> {
  if (!args || args.length === 0) {
    await ctx.reply('❌ Uso: /vender <producto> [cantidad] [precio]');
    return;
  }

  try {
    const text = args.join(' ');
    const quantity = parseInt(args[args.length - 2], 10) || 1;
    const price = parseInt(args[args.length - 1], 10) || null;
    const productName = extractProductName(`vendí ${text}`);
    const brand = text.match(/marca\s+(\S+)/)?.[1] || null;

    if (!productName) {
      await ctx.reply('❌ No entiendo el nombre del producto');
      return;
    }

    const products = await searchProducts(productName, brand);

    if (products.length === 0) {
      await ctx.reply(
        `❌ Producto no encontrado: "${productName}"${brand ? ` (${brand})` : ''}`
      );
      return;
    }

    if (products.length > 1) {
      let response = '⚠️ Múltiples coincidencias. ¿Cuál es?\n\n';
      products.forEach((p, i) => {
        response += `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ''}\n`;
      });
      await ctx.reply(response);
      return;
    }

    const product = products[0];
    const result = await sellProduct(
      product._id.toString(),
      quantity,
      price,
      getTelegramData(ctx),
      ctx.message?.text || text
    );

    await ctx.reply(result.message);
  } catch (error) {
    console.error('[VENDER]', error);
    await ctx.reply('❌ Error al procesar la venta');
  }
}

/**
 * Comando /producto
 */
export async function handleProducto(
  ctx: Context,
  args: string[]
): Promise<void> {
  if (!args || args.length === 0) {
    await ctx.reply('❌ Uso: /producto <nombre>');
    return;
  }

  try {
    const productName = args.join(' ');
    const products = await searchProducts(productName);

    if (products.length === 0) {
      await ctx.reply(`❌ Producto no encontrado: "${productName}"`);
      return;
    }

    if (products.length > 1) {
      let response = '⚠️ Múltiples coincidencias:\n\n';
      products.forEach((p, i) => {
        response += `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ''}\n`;
      });
      await ctx.reply(response);
      return;
    }

    const product = products[0];
    const { lastMovements } = await getProductDetail(product._id.toString());

    let response = `📦 **${product.name}**${
      product.brand ? `\n🏷️ Marca: ${product.brand}` : ''
    }\n📊 Stock: **${product.stock}** unidades`;

    if (product.sku) {
      response += `\n🔖 SKU: ${product.sku}`;
    }

    if (product.lastMovementAt) {
      response += `\n⏰ Última actualización: ${product.lastMovementAt.toLocaleString(
        'es-CO'
      )}`;
    }

    if (lastMovements.length > 0) {
      response += `\n\n📋 Últimos movimientos:\n`;
      lastMovements.forEach((m) => {
        response += `• ${m.type}: ${m.qty} unidades`;
        if (m.price) {
          response += ` @ $${m.price.toLocaleString('es-CO')}`;
        }
        response += ` (${m.createdAt.toLocaleString('es-CO')})\n`;
      });
    }

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[PRODUCTO]', error);
    await ctx.reply('❌ Error al obtener el detalle');
  }
}

/**
 * Comando /movimientos
 */
export async function handleMovimientos(
  ctx: Context,
  args: string[]
): Promise<void> {
  try {
    const limit = parseInt(args?.[0] || '10', 10) || 10;
    const movements = await listMovements(Math.min(limit, 100));

    if (movements.length === 0) {
      await ctx.reply('📋 No hay movimientos registrados');
      return;
    }

    let response = `📋 **ÚLTIMOS ${movements.length} MOVIMIENTOS**\n\n`;

    movements.forEach((m) => {
      const icon =
        m.type === 'SALE' ? '📉' : m.type === 'RESTOCK' ? '📈' : '⚙️';
      const action = m.type === 'SALE' ? 'Venta' : m.type === 'RESTOCK' ? 'Restock' : 'Ajuste';
      response += `${icon} ${action}: ${m.productName}${
        m.productBrand ? ` (${m.productBrand})` : ''
      }\n`;
      response += `  Qty: ${m.qty}`;
      if (m.price) {
        response += ` | Precio: $${m.price.toLocaleString('es-CO')}`;
      }
      response += `\n  ${m.createdAt.toLocaleString('es-CO')}\n\n`;
    });

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[MOVIMIENTOS]', error);
    await ctx.reply('❌ Error al obtener movimientos');
  }
}

/**
 * Comando /ajustar
 */
export async function handleAjustar(
  ctx: Context,
  args: string[]
): Promise<void> {
  if (!args || args.length < 2) {
    await ctx.reply('❌ Uso: /ajustar <producto> <nuevo_stock>');
    return;
  }

  try {
    const newStock = parseInt(args[args.length - 1], 10);
    if (isNaN(newStock) || newStock < 0) {
      await ctx.reply('❌ El nuevo stock debe ser un número positivo');
      return;
    }

    const productName = args.slice(0, -1).join(' ');
    const products = await searchProducts(productName);

    if (products.length === 0) {
      await ctx.reply(`❌ Producto no encontrado: "${productName}"`);
      return;
    }

    if (products.length > 1) {
      let response = '⚠️ Múltiples coincidencias:\n\n';
      products.forEach((p, i) => {
        response += `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ''}\n`;
      });
      await ctx.reply(response);
      return;
    }

    const product = products[0];
    const result = await adjustProductStock(
      product._id.toString(),
      newStock,
      getTelegramData(ctx),
      ctx.message?.text || `ajustar ${productName} ${newStock}`
    );

    await ctx.reply(result.message);
  } catch (error) {
    console.error('[AJUSTAR]', error);
    await ctx.reply('❌ Error al ajustar el stock');
  }
}

/**
 * Maneja mensajes de texto libre
 */
export async function handleFreeText(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  try {
    const localParsed = parseMessage(text);
    const normalized = normalizeText(text);
    const needsAiFallback =
      localParsed.intent === 'UNKNOWN' ||
      ((localParsed.intent === 'SALE' ||
        localParsed.intent === 'RESTOCK' ||
        localParsed.intent === 'ADJUST') &&
        !localParsed.productName);

    const parsed =
      needsAiFallback || normalized.length > 18
        ? (await parseMessageWithAI(text)) ?? localParsed
        : localParsed;

    switch (parsed.intent) {
      case 'DAILY_SALES':
        await handleDailySales(ctx);
        break;

      case 'INVENTORY':
        await handleInventario(ctx, text.includes('todo'));
        break;

      case 'SALE': {
        if (!parsed.productName) {
          await ctx.reply('❌ No entiendo qué producto se vendió');
          return;
        }
        const products = await searchProducts(parsed.productName, parsed.brand);
        if (products.length === 0) {
          await ctx.reply(`❌ Producto no encontrado: "${parsed.productName}"`);
          return;
        }
        if (products.length > 1) {
          let response = '⚠️ Múltiples coincidencias:\n\n';
          products.forEach((p, i) => {
            response += `${i + 1}. ${p.name}${
              p.brand ? ` (${p.brand})` : ''
            }\n`;
          });
          await ctx.reply(response);
          return;
        }
        const result = await sellProduct(
          products[0]._id.toString(),
          parsed.quantity,
          parsed.price,
          getTelegramData(ctx),
          text
        );
        await ctx.reply(result.message);
        break;
      }

      case 'RESTOCK': {
        if (!parsed.productName) {
          await ctx.reply('❌ No entiendo qué producto se agrega');
          return;
        }
        const product = await findOrCreateProduct(
          parsed.productName,
          parsed.brand
        );
        const result = await restockProduct(
          product._id.toString(),
          parsed.quantity,
          getTelegramData(ctx),
          text
        );
        await ctx.reply(result.message);
        break;
      }

      case 'ADJUST': {
        if (!parsed.productName) {
          await ctx.reply('❌ No entiendo qué producto ajustar');
          return;
        }
        const products = await searchProducts(parsed.productName, parsed.brand);
        if (products.length === 0) {
          await ctx.reply(`❌ Producto no encontrado: "${parsed.productName}"`);
          return;
        }
        if (products.length > 1) {
          let response = '⚠️ Múltiples coincidencias:\n\n';
          products.forEach((p, i) => {
            response += `${i + 1}. ${p.name}${
              p.brand ? ` (${p.brand})` : ''
            }\n`;
          });
          await ctx.reply(response);
          return;
        }
        const result = await adjustProductStock(
          products[0]._id.toString(),
          parsed.quantity,
          getTelegramData(ctx),
          text
        );
        await ctx.reply(result.message);
        break;
      }

      default:
        await ctx.reply(
          `❓ No te entendí del todo. Prueba con algo como:
• "vendí 2 cera marca nativo por 32000"
• "agrega 5 shampoo"
• "ajusta crema a 12"
• "ventas de hoy"

También puedes usar /help para ver todos los comandos.`
        );
    }
  } catch (error) {
    console.error('[TEXT]', error);
    await ctx.reply('❌ Error procesando el mensaje');
  }
}

/**
 * Manejador para ventas del día
 */
export async function handleDailySales(ctx: Context): Promise<void> {
  try {
    const dailySales = await getDailySales();

    if (dailySales.sales.length === 0) {
      await ctx.reply(
        '📊 No hay ventas registradas hoy.\n\n¿Quieres registrar una? Escribe /vender'
      );
      return;
    }

    // Construir respuesta
    let message = '📈 *Resumen de Ventas del Día*\n\n';

    dailySales.sales.forEach((sale, i) => {
      const time = sale.createdAt.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      });

      message += `${i + 1}. *${sale.productName}*`;
      if (sale.productBrand) {
        message += ` (${sale.productBrand})`;
      }
      message += `\n`;
      message += `   📦 Qty: ${sale.qty}`;
      if (sale.price) {
        message += ` | 💵 ${sale.price.toLocaleString('es-CO')} c/u`;
        message += ` | Total: $${sale.subtotal.toLocaleString('es-CO')}`;
      }
      message += `\n   🕐 ${time}\n\n`;
    });

    // Totales
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📦 *Total Unidades*: ${dailySales.totalQuantity}\n`;
    message += `💰 *Total Ventas*: $${dailySales.totalRevenue.toLocaleString('es-CO')}\n`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[DAILY_SALES]', error);
    await ctx.reply('❌ Error al obtener ventas del día');
  }
}
