import mongoose from 'mongoose';

import Shop, { IShop } from '@/modals/shop.modal';
import Product, { IProduct } from '@/modals/product.modal';

// Fetch detailed product data from Shoppy API
async function fetchProductDetails(productId: string) {
    const data = await fetch(`https://shoppy.gg/api/v1/public/products/${productId}?cashier=true`);
    if (!data.ok) throw new Error(`Failed to fetch data for product ID: ${productId} from Shoppy API`);

    const response = await data.json();
    return response;
}

// Fetch shop data from Shoppy API
async function fetchShop(username: string) {
    const data = await fetch(`https://shoppy.gg/api/v1/public/seller/${username}`);
    if (!data.ok) throw new Error('Failed to fetch data from Shoppy API');

    const response = await data.json();
    console.log(response.user);
    return response.user;
}

export const saveShop = async (username: string): Promise<IShop> => {
    let shop: IShop | null = await Shop.findOne({ username: username });
    let shopData: any; // Define shopData outside the if-else scope

    if (shop) {
        const hours = process.env.DEV === 'true' ? 0 : 2;
        const twoHoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

        if (shop.lastUpdated <= twoHoursAgo) {
            // Fetch shop data only if last update was more than 2 hours ago
            shopData = await fetchShop(username);
            // Update existing shop
            shop.avatar = shopData.avatar;
            shop.discord = shopData.discord;
            shop.feedbacks = shopData.feedbacks;
            shop.lastUpdated = new Date();
        } else {
            throw new Error('Shop can only be refreshed every 2 hours');
        }
    } else {
        // Fetch shop data for new shop creation
        shopData = await fetchShop(username);
        // Create new shop
        shop = new Shop({
            ...shopData,
            createdAt: new Date(),
            lastUpdated: new Date(),
        });
    }

    await shop.save();

    // Save products separately, ensure shopData is defined
    if (shopData && shopData.products) {
        await saveProducts(shop._id as mongoose.Types.ObjectId, shopData.products);
    }

    return shop;
};

const saveProducts = async (shopId: mongoose.Types.ObjectId, products: any[]) => {
    // Remove existing products for the shop
    await Product.deleteMany({ shopId });

    // Fetch detailed product information and insert new products
    const productDocs = await Promise.all(products.map(async (product) => {
        const detailedProduct = await fetchProductDetails(product.id);
        const gateways = detailedProduct.cashier.paymentMethods.map(method => method.name.toLowerCase());
        return {
            title: detailedProduct.title,
            id: detailedProduct.id,
            image: detailedProduct.image ? {
                url: detailedProduct.image.url,
                path: detailedProduct.image.path,
            }: null,
            quantity: {
                min: detailedProduct.quantity.min,
                max: detailedProduct.quantity.max,
            },
            price: detailedProduct.price,
            currency: detailedProduct.currency,
            stock: detailedProduct.stock,
            gateways,
            shopId,
        };
    }));

    await Product.insertMany(productDocs);
};
