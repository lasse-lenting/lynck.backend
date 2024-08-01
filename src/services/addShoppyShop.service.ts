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
            console.log(shopData.rep);
            // Update existing shop
            shop.avatar = shopData.avatar;
            shop.lastUpdated = new Date();
        } else {
            throw new Error('Shop can only be refreshed every 2 hours');
        }
    } else {
        // Fetch shop data for new shop creation
        shopData = await fetchShop(username);
        // Create new shop
        try {
        shop = new Shop({
            platform: 'shoppy',
            feedbacks: {
                positive: shopData.rep.positive,
                neutral:  shopData.rep.neutral,
                negative: shopData.rep.negative,
            },
            createdAt: new Date(),
            lastUpdated: new Date(),
            username,
            avatar: shopData.avatar,
        });
    } catch (error) {
        console.log(error);
    }
    }

    await shop.save();

    // Save products separately, ensure shopData is defined
    if (shopData && shopData.products) {
        await saveProducts(shop._id as mongoose.Types.ObjectId, shopData.products, shopData.discord, username);
    }

    return shop;
};

const saveProducts = async (shopId: mongoose.Types.ObjectId, products: any[], discord: string, username: string) => {
    // Remove existing products for the shop
    await Product.deleteMany({ shopId });

    // Fetch detailed product information and insert new products
    const productDocs = await Promise.all(products.map(async (product) => {
        const detailedProduct = await fetchProductDetails(product.id);
        console.log(detailedProduct);
        const gateways = detailedProduct.cashier.paymentMethods.map(method => method.name.toLowerCase());
        // discord into socials object from shopData.discord 

        const discordSocial = {
            platform: 'discord',
            link: discord,
        };
        return {
            platform: 'shoppy',
            shopName: username,
            title: detailedProduct.title,
            id: detailedProduct.id,
            image: detailedProduct.image ? {
                url: detailedProduct.image.url,
                path: detailedProduct.image.path,
            }: null,
            socials: [discordSocial],
            quantity: {
                min: detailedProduct.quantity.min,
                max: detailedProduct.quantity.max,
            },
            url: "https://shoppy.gg/product/"+detailedProduct.id,
            stats: {
                rating: detailedProduct.rating,
                totalFeedbacks: detailedProduct.totalFeedbacks,
            },
            price: detailedProduct.price,
            currency: detailedProduct.currency,
            stock: detailedProduct.stock,
            sold: detailedProduct.sold,
            gateways,
            shopId,
            createdAt: new Date(),
        };
    }));

    await Product.insertMany(productDocs);
};
