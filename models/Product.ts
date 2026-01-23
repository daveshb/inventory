import mongoose from 'mongoose';

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  nameNormalized: string;
  brand: string | null;
  brandNormalized: string | null;
  sku?: string;
  stock: number;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    nameNormalized: { type: String, required: true, lowercase: true },
    brand: { type: String, default: null, trim: true },
    brandNormalized: { type: String, default: null, lowercase: true },
    sku: { type: String, sparse: true },
    stock: { type: Number, default: 0, min: 0 },
    lastMovementAt: { type: Date },
  },
  { timestamps: true }
);

// Índice único en nombre y marca normalizados
productSchema.index(
  { nameNormalized: 1, brandNormalized: 1 },
  { unique: true, sparse: true }
);
productSchema.index({ lastMovementAt: -1 });

export const Product =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
