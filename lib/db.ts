import mongoose from 'mongoose';
import { getEnv } from './env';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const mongooseCache: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = mongooseCache;
}

export async function connectDB(): Promise<typeof mongoose> {
  const env = getEnv();

  if (mongooseCache.conn) {
    console.log('[DB] Usando conexión cached');
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose
      .connect(env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 2,
      })
      .then(() => {
        console.log('[DB] Conectado a MongoDB');
        return mongoose;
      })
      .catch((err) => {
        console.error('[DB] Error conectando a MongoDB:', err);
        mongooseCache.promise = null;
        throw err;
      });
  }

  mongooseCache.conn = await mongooseCache.promise;
  return mongooseCache.conn;
}

export async function disconnectDB(): Promise<void> {
  if (mongooseCache.conn) {
    await mongooseCache.conn.disconnect();
    mongooseCache.conn = null;
    mongooseCache.promise = null;
    console.log('[DB] Desconectado de MongoDB');
  }
}
