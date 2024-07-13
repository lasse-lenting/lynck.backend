import mongoose, { Schema, Document } from 'mongoose';

interface Rep {
  positive: number;
  neutral: number;
  negative: number;
}

export interface IShop extends Document {
  username: string;
  avatar: string;
  discord: string;
  feedbacks: Rep[];
  createdAt: Date;
  lastUpdated: Date;
}

const ShopSchema: Schema = new Schema({
  username: { type: String, required: true },
  avatar: { type: String, required: true },
  discord: { type: String, required: false },
  feedbacks: [{ type: Schema.Types.Mixed, required: false }],
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

const Shop = mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;