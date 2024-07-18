import mongoose from 'mongoose';

import Shop, { IShop } from '@/modals/shop.modal';
import Product, { IProduct } from '@/modals/product.modal';

// Fetch listing paths from Sellpass
async function fetchProductListingPaths(username: string) {
    console.log(`https://dev.sellpass.io/v2/public/shops/${username}.sellpass.io/listings`);
    const data = await fetch(`https://dev.sellpass.io/v2/public/shops/${username}.sellpass.io/listings`);
    if (!data.ok) throw new Error(`Failed to fetch data for user id: ${username} from Sellpass API`);

    const response = await data.json();
    const listings = response.data.listings;

    // Flatten listings to include products within groups
    const listingPaths = [];
    for (const listing of listings) {
        if (listing.group && listing.group.listings) {
            listingPaths.push(...listing.group.listings.map((item: any) => item.path));
        } else {
            listingPaths.push(listing.path);
        }
    }
    return listingPaths;
}

// Fetch detailed product data from Sellpass for a specific listing path
async function fetchProductDetails(username: string, listingPath: string) {
    console.log(`https://dev.sellpass.io/v2/public/shops/${username}.sellpass.io/listings/${listingPath}`);
    const data = await fetch(`https://dev.sellpass.io/v2/public/shops/${username}.sellpass.io/listings/${listingPath}`);
    if (!data.ok) throw new Error(`Failed to fetch detailed product data for listing path: ${listingPath} from Sellpass API`);

    const response = await data.json();
    return response.data.listing;
}

// Fetch shop data from Shoppy API
async function fetchShop(username: string) {
    const data = await fetch(`https://dev.sellpass.io/v2/public/shops/${username}.sellpass.io/main`);
    if (!data.ok) throw new Error('Failed to fetch data from Shoppy API');

    const response = await data.json();
    return response.data;
}

export const saveShop = async (username: string): Promise<IShop> => {
    let shop: IShop | null = await Shop.findOne({ username: username });
    let shopData: any; // Define shopData outside the if-else scope
    try {
    if (shop) {
        const hours = process.env.DEV === 'true' ? 0 : 2;
        const twoHoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

        if (shop.lastUpdated <= twoHoursAgo) {
            // Fetch shop data only if last update was more than 2 hours ago
            const fetchedShop = await fetchShop(username);
            shopData = fetchedShop.user;
            // Update existing shop
            shop.avatar = "a";
            shop.lastUpdated = new Date();
        } else {
            throw new Error('Shop can only be refreshed every 2 hours');
        }
    } else {
        // Fetch shop data for new shop creation
        const fetchedShop = await fetchShop(username);
        shopData = fetchedShop.shop;
        console.log(shopData.statistics);
        // Create new shop
        shop = new Shop({
            platform: 'sellpass',
            username: username,
            avatar: "a",
            feedbacks: {
                positive: shopData.statistics.totalFeedbacks || 0,
                neutral: 0,
                negative: 0,
            },

            createdAt: new Date(),
            lastUpdated: new Date(),
        });

        await shop.save();
    }

    // Save products separately, ensure shopData is defined
    console.log('Fetching shop for username:', username);
    const fetchedShop = await fetchShop(username).catch(error => {
        console.error('Error fetching shop:', error);
        return null; // Ensure the rest of the code can handle this case.
    }).then(async data => {
        await saveProducts(username, shop._id as mongoose.Types.ObjectId);
        return data;
    });

    return shop;
    } catch (error) {
        console.error('Error saving shop:', error);
        return shop;
    }
};

function translateGateway(gateway: number) {
    switch (gateway) {
        case 0:
            return 'coinbasecommerce';
        case 1:
            return 'stripe';
        case 2:
            return 'paypal';
        case 3:
            return 'cashapp';
        case 4:
            return 'paypalff';
        case 5:
            return 'virtualpayments';
        case 6:
            return 'square';
        default:
            return 'unknown';
    }
}

const saveProducts = async (username: string, shopId: mongoose.Types.ObjectId) => {
    try {
        await Product.deleteMany({ shopId });
        const listingPaths = await fetchProductListingPaths(username);

        const productDetailsPromises = listingPaths.map((listing: any) =>
            fetchProductDetails(username, listing)
        );

        const detailedProducts = await Promise.all(productDetailsPromises);

        function getStats(product: any): { stock: number, min: number, max: number } {
            if (product.productType === 0) {
                return {
                    stock: product.asSerials.stock || "unlimited",
                    min: product.asSerials.minAmount || 0,
                    max: product.asSerials.maxAmount || "unlimited",
                };
            } else if (product.productType === 2) {
                return {
                    stock: product.asDynamic.stock,
                    min: product.asDynamic.minAmount,
                    max: product.asDynamic.maxAmount,
                }
            } else if (product.productType === 3) {
                return {
                    stock: product.asService.stock || "unlimited",
                    min: product.asService.minAmount || 0,
                    max: product.asService.maxAmount || "unlimited",
                }
            } else {
                // Handle cases where productType does not match expected values or stock information is missing
                console.error("Invalid product type or missing stock information", product);
                return {
                    stock: 0,
                    min: 0,
                    max: 0,
                }
            }
        }
        var productDocs = detailedProducts.map((detailedProduct, index) => {
            // Log the product type here
            return {
                platform: 'sellpass',
                title: detailedProduct.product.title,
                id: detailedProduct.product.id,
                image: detailedProduct.image ? {
                    url: detailedProduct.image.url,
                    path: detailedProduct.image.path,
                } : null,
                quantity: {
                    min: getStats(detailedProduct.product.variants[0]).min,
                    max: getStats(detailedProduct.product.variants[0]).max,
                },
                socials: detailedProduct.socials,
                price: detailedProduct.minPriceDetails.amount,
                currency: detailedProduct.minPriceDetails.currency,
                stock: getStats(detailedProduct.product.variants[0]).stock,
                stats: {
                    rating: detailedProduct.product.statistics.rating,
                    totalFeedbacks: detailedProduct.product.statistics.totalFeedbacks || 0,
                },
                sold: detailedProduct.product.statistics.productsSold,
                gateways: [],
                shopId,
            }
        });


        await Product.insertMany(productDocs);
    } catch (error) {
        console.error('Error saving products:', error);
    }
    };
