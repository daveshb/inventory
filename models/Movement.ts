import mongoose from 'mongoose';

export type MovementType = 'SALE' | 'RESTOCK' | 'ADJUST';

export interface ITelegramData {
  chatId: number;
  userId: number;
  messageId: number;
}

export interface IMovement {
  _id: mongoose.Types.ObjectId;
  type: MovementType;
  productId: mongoose.Types.ObjectId;
  qty: number;
  price: number | null;
  rawText: string;
  telegram: ITelegramData;
  createdAt: Date;
}

const telegramDataSchema = new mongoose.Schema<ITelegramData>(
  {
    chatId: { type: Number, required: true },
    userId: { type: Number, required: true },
    messageId: { type: Number, required: true },
  },
  { _id: false }
);

const movementSchema = new mongoose.Schema<IMovement>(
  {
    type: { type: String, enum: ['SALE', 'RESTOCK', 'ADJUST'], required: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    qty: { type: Number, required: true, min: 0 },
    price: { type: Number, default: null },
    rawText: { type: String, required: true },
    telegram: { type: telegramDataSchema, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Índices para búsquedas frecuentes
movementSchema.index({ createdAt: -1 });
movementSchema.index({ productId: 1, createdAt: -1 });
movementSchema.index({ type: 1, createdAt: -1 });

export const Movement =
  mongoose.models.Movement ||
  mongoose.model<IMovement>('Movement', movementSchema);
