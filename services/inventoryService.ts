import { connectDB } from '@/lib/db';
import { Product, IProduct } from '@/models/Product';
import { Movement, ITelegramData } from '@/models/Movement';
import { normalizeText } from '@/lib/parser';
import { nanoid } from 'nanoid';

/**
 * Encuentra o crea un producto por nombre y marca
 */
export async function findOrCreateProduct(
  name: string,
  brand: string | null = null
): Promise<IProduct> {
  await connectDB();

  const nameNormalized = normalizeText(name);
  const brandNormalized = brand ? normalizeText(brand) : null;

  let product = await Product.findOne({
    nameNormalized,
    brandNormalized,
  });

  if (!product) {
    product = new Product({
      name,
      nameNormalized,
      brand: brand || null,
      brandNormalized,
      stock: 0,
      sku: nanoid(8),
    });
    await product.save();
    console.log(`[INVENTORY] Producto creado: ${name} (${brand || 'sin marca'})`);
  }

  return product;
}

/**
 * Busca productos que coincidan con el nombre/marca
 * Soporta búsqueda fuzzy básica
 */
export async function searchProducts(
  productName: string,
  brand?: string | null
): Promise<IProduct[]> {
  await connectDB();

  const nameNormalized = normalizeText(productName);
  const brandNormalized = brand ? normalizeText(brand) : null;

  const query: Record<string, { $regex: string; $options: string }> = {
    nameNormalized: { $regex: nameNormalized, $options: 'i' },
  };

  if (brandNormalized) {
    query.brandNormalized = { $regex: brandNormalized, $options: 'i' };
  }

  const products = await Product.find(query).limit(10);
  return products;
}

/**
 * Realiza una venta: decrementa stock de forma atómica
 */
export async function sellProduct(
  productId: string,
  quantity: number,
  price: number | null,
  telegramData: ITelegramData,
  rawText: string
): Promise<{ success: boolean; message: string; newStock?: number }> {
  await connectDB();

  try {
    // Actualización atómica: decrementa si hay stock suficiente
    const updated = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: { stock: -quantity },
        lastMovementAt: new Date(),
      },
      { new: true, conditions: { stock: { $gte: quantity } } }
    );

    if (!updated) {
      // No hay stock suficiente
      const product = await Product.findById(productId);
      return {
        success: false,
        message: `❌ Stock insuficiente. Disponible: ${product?.stock || 0} unidades`,
      };
    }

    // Registrar movimiento
    const movement = new Movement({
      type: 'SALE' as const,
      productId,
      qty: quantity,
      price,
      rawText,
      telegram: telegramData,
    });
    await movement.save();

    console.log(
      `[SALE] ${updated.name} -${quantity} (stock: ${updated.stock})`
    );

    return {
      success: true,
      message: `✅ Venta registrada: ${updated.name} x${quantity}${
        price ? ` @ $${price.toLocaleString('es-CO')}` : ''
      }\n📦 Stock restante: ${updated.stock}`,
      newStock: updated.stock,
    };
  } catch (error) {
    console.error('[SELL] Error:', error);
    return { success: false, message: '❌ Error al procesar la venta' };
  }
}

/**
 * Agrega stock (restock)
 */
export async function restockProduct(
  productId: string,
  quantity: number,
  telegramData: ITelegramData,
  rawText: string
): Promise<{ success: boolean; message: string; newStock?: number }> {
  await connectDB();

  try {
    const updated = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: { stock: quantity },
        lastMovementAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return { success: false, message: '❌ Producto no encontrado' };
    }

    // Registrar movimiento
    const movement = new Movement({
      type: 'RESTOCK' as const,
      productId,
      qty: quantity,
      price: null,
      rawText,
      telegram: telegramData,
    });
    await movement.save();

    console.log(`[RESTOCK] ${updated.name} +${quantity} (stock: ${updated.stock})`);

    return {
      success: true,
      message: `✅ Restock registrado: ${updated.name} +${quantity}\n📦 Stock total: ${updated.stock}`,
      newStock: updated.stock,
    };
  } catch (error) {
    console.error('[RESTOCK] Error:', error);
    return { success: false, message: '❌ Error al procesar el restock' };
  }
}

/**
 * Ajusta el stock a un valor exacto
 */
export async function adjustProductStock(
  productId: string,
  newStock: number,
  telegramData: ITelegramData,
  rawText: string
): Promise<{ success: boolean; message: string; newStock?: number }> {
  await connectDB();

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, message: '❌ Producto no encontrado' };
    }

    const oldStock = product.stock;
    const adjustment = newStock - oldStock;

    const updated = await Product.findByIdAndUpdate(
      productId,
      {
        stock: newStock,
        lastMovementAt: new Date(),
      },
      { new: true }
    );

    // Registrar movimiento
    const movement = new Movement({
      type: 'ADJUST' as const,
      productId,
      qty: Math.abs(adjustment),
      price: null,
      rawText,
      telegram: telegramData,
    });
    await movement.save();

    console.log(`[ADJUST] ${updated?.name}: ${oldStock} → ${newStock}`);

    return {
      success: true,
      message: `✅ Stock ajustado: ${product.name}\n📊 Antes: ${oldStock} → Ahora: ${newStock}`,
      newStock,
    };
  } catch (error) {
    console.error('[ADJUST] Error:', error);
    return { success: false, message: '❌ Error al ajustar el stock' };
  }
}

/**
 * Lista inventario actual (stock > 0)
 */
export async function listInventory(includeEmpty = false): Promise<IProduct[]> {
  await connectDB();

  const query = includeEmpty ? {} : { stock: { $gt: 0 } };
  const products = (await Product.find(query)
    .sort({ name: 1, brand: 1 })
    .lean()) as unknown as IProduct[];

  return products;
}

/**
 * Obtiene detalle de un producto
 */
export async function getProductDetail(
  productId: string
): Promise<{
  product: IProduct | null;
  lastMovements: Array<{
    type: string;
    qty: number;
    price?: number;
    createdAt: Date;
  }>;
}> {
  await connectDB();

  const product = (await Product.findById(productId).lean()) as unknown as IProduct | null;
  const lastMovements = (await Movement.find({ productId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()) as unknown as Array<{ type: string; qty: number; price?: number; createdAt: Date }>;

  return {
    product,
    lastMovements: lastMovements.map((m) => ({
      type: m.type,
      qty: m.qty,
      price: m.price,
      createdAt: m.createdAt,
    })),
  };
}

/**
 * Lista últimos movimientos (con opción de límite)
 */
export async function listMovements(
  limit = 10
): Promise<
  Array<{
    _id: string;
    type: string;
    productName: string;
    productBrand: string | null;
    qty: number;
    price?: number;
    createdAt: Date;
  }>
> {
  await connectDB();

  const movements = (await Movement.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('productId', 'name brand')
    .lean()) as unknown as Array<{ _id: string; type: string; productId?: { name: string; brand: string | null }; qty: number; price?: number; createdAt: Date }>;

  return movements.map((m) => ({
    _id: m._id.toString(),
    type: m.type,
    productName: m.productId?.name || 'Desconocido',
    productBrand: m.productId?.brand || null,
    qty: m.qty,
    price: m.price,
    createdAt: m.createdAt,
  }));
}

/**
 * Obtiene las ventas del día actual con resumen
 */
export async function getDailySales(): Promise<{
  sales: Array<{
    productName: string;
    productBrand: string | null;
    qty: number;
    price: number | null;
    subtotal: number;
    createdAt: Date;
  }>;
  totalQuantity: number;
  totalRevenue: number;
}> {
  await connectDB();

  // Calcular inicio y fin del día actual
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Buscar ventas de hoy
  const sales = (await Movement.find({
    type: 'SALE',
    createdAt: { $gte: today, $lt: tomorrow },
  })
    .populate('productId', 'name brand')
    .sort({ createdAt: -1 })
    .lean()) as unknown as Array<{
    _id: string;
    type: string;
    productId?: { name: string; brand: string | null };
    qty: number;
    price?: number;
    createdAt: Date;
  }>;

  let totalQuantity = 0;
  let totalRevenue = 0;

  const formattedSales = sales.map((s) => {
    const subtotal = (s.price || 0) * s.qty;
    totalQuantity += s.qty;
    totalRevenue += subtotal;

    return {
      productName: s.productId?.name || 'Desconocido',
      productBrand: s.productId?.brand || null,
      qty: s.qty,
      price: s.price || null,
      subtotal,
      createdAt: s.createdAt,
    };
  });

  return {
    sales: formattedSales,
    totalQuantity,
    totalRevenue,
  };
}
