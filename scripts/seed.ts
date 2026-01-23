import mongoose from 'mongoose';
import { Product } from '@/models/Product';
import { normalizeText } from '@/lib/parser';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida');
  process.exit(1);
}

const seedProducts = [
  {
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    stock: 12,
  },
  {
    name: 'Samsung Galaxy A54',
    brand: 'Samsung',
    stock: 25,
  },
  {
    name: 'MacBook Pro 16"',
    brand: 'Apple',
    stock: 5,
  },
  {
    name: 'AirPods Pro',
    brand: 'Apple',
    stock: 30,
  },
  {
    name: 'iPad Air',
    brand: 'Apple',
    stock: 8,
  },
  {
    name: 'Galaxy Watch 6',
    brand: 'Samsung',
    stock: 15,
  },
  {
    name: 'Pixel 8',
    brand: 'Google',
    stock: 18,
  },
  {
    name: 'PlayStation 5',
    brand: 'Sony',
    stock: 3,
  },
  {
    name: 'Xbox Series X',
    brand: 'Microsoft',
    stock: 4,
  },
  {
    name: 'AirPods Max',
    brand: 'Apple',
    stock: 10,
  },
];

async function seed() {
  try {
    console.log('🌱 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('✅ Conectado');

    console.log('🗑️  Limpiando productos existentes...');
    await Product.deleteMany({});
    console.log('✅ Base de datos limpia');

    console.log('📦 Creando productos semilla...');
    const products = seedProducts.map((p) => ({
      ...p,
      nameNormalized: normalizeText(p.name),
      brandNormalized: normalizeText(p.brand),
      sku: nanoid(8),
      lastMovementAt: new Date(),
    }));

    const created = await Product.insertMany(products);
    console.log(`✅ ${created.length} productos creados`);

    console.log('\n📊 Productos creados:');
    created.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.brand}) - Stock: ${p.stock} - SKU: ${p.sku}`);
    });

    console.log('\n✨ Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
