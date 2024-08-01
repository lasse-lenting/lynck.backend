// src/models/product.model.ts

import mongoose, { Schema, Document } from 'mongoose';
interface Image {
    url: string;
    path: string;
}
interface Social {
    platform: string;
    link: string;
}
export interface IProduct extends Document {
    platform: string;
    shopName: string;
    title: string;
    id: string;
    image: Image;
    quantity: {
        min: number;
        // number or "unlimited"
        max: number | string;
    },
    stats: {
        rating: number;
        totalFeedbacks: number;
    }
    socials: Social[];
    price: number;
    currency: string;
    stock: number | string;
    url: string;
    gateways: string[];
    sold: number;
    shopId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ProductSchema: Schema = new Schema({
    platform: { type: String, required: true },
    shopName: { type: String, required: true },
    title: { type: String, required: true },
    id: { type: String, required: true },
    image: {
        url: { type: String, required: false },
        path: { type: String, required: false },
    },
    quantity: {
        min: { type: Number, required: true },
        max: { type: Schema.Types.Mixed, required: true },
    },
    url: { type: String, required: true },
    stats: {
        rating: { type: Number, required: false },
        totalFeedbacks: { type: Number, required: false },
    },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    stock: { type: Schema.Types.Mixed, required: true },
    sold: { type: Number, required: false },
    gateways: [{ type: String, required: false }],
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;