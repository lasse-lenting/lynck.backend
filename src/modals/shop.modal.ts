import mongoose, { Schema, Document } from 'mongoose';

interface Rep {
  positive: number;
  neutral: number;
  negative: number;
}

export interface IShop extends Document {
  username: string;
  avatar: string;
  createdAt: Date;
  feedbacks: Rep[];
  lastUpdated: Date;
}

const ShopSchema: Schema = new Schema({
  platform: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String, required: true },
  feedbacks: {
    positive: { type: Number, required: true },
    neutral: { type: Number, required: true },
    negative: { type: Number, required: true },
  },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

const Shop = mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;