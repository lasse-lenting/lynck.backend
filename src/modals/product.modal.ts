// src/models/product.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import path from 'path';
interface Image {
    url: string;
    path: string;
}
export interface IProduct extends Document {
    title: string;
    id: string;
    image: Image;
    quantity: {
        min: number;
        max: number;
    },
    price: number;
    currency: string;
    stock: number;
    gateways: string[];
    shopId: mongoose.Types.ObjectId;
}

const ProductSchema: Schema = new Schema({
    title: { type: String, required: true },
    id: { type: String, required: true },
    image: {
        url: { type: String, required: false },
        path: { type: String, required: false },
    },
    quantity: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
    },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    stock: { type: Number, required: true },
    gateways: [{ type: String, required: false }],
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
});

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;