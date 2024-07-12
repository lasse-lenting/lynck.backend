let express = require('express');
let bodyparser = require("body-parser")
let uuid = require('uuid').v4;
const { MongoClient } = require('mongodb');
let dotenv = require("dotenv")

dotenv.config()

let app = express();

const HOST = "https://74131d66-b30e-4d32-9640-38542ad5907a-00-mv5a9tnzfpp6.kirk.replit.dev/"

var products;
var tokens
MongoClient.connect("mongodb+srv://kookschap:RlGV0cBcu2KquM30@cluster0.fwzqbnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useUnifiedTopology: true })
    .then(client => {
        products = client.db("lynck").collection("products");
        tokens = client.db("lynck").collection("tokens");
        console.log("Connected to database");
        app.use(bodyparser.json());
        app.use(bodyparser.urlencoded({ extended: true }));
        app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            next();
        })

        app.get("/getSellixShop/:shop", async (req, res) => {
            let got = (await import("got")).got
            await got.get(`${HOST}/getSellixShop/${req.params.shop}`).then((response) => {
                let getShop = JSON.parse(response.body)
                console.log(getShop)
                let shopInfo = getShop.common.shopInfo.shop
                let productInfo = getShop.common.shopInfo.items
                console.log(productInfo)
                productInfo.forEach(async (product) => {
                    if (product.item_type == "GROUP") {

                        product.products_bound.forEach(async (item) => {
                            let productImage = `https://imagedelivery.net/95QNzrEeP7RU5l5WdbyrKw/${item.cloudflare_image_id || product.cloudflare_image_id}/shopitem`
                            console.log(productImage)
                            await products.update(
                                { uniqid: item.uniqid },
                                {
                                    $set: {
                                        platform: "sellix",
                                        shop: shopInfo.name,
                                        shopId: shopInfo.id,
                                        shopScore: shopInfo.average_score,
                                        productName: item.title,
                                        productDescription: item.description,
                                        productImage: productImage,
                                        productPrice: item.price,
                                        productPriceDisplay: item.price_display,
                                        productPriceDiscount: item.price_discount,
                                        gateways: item.gateways,
                                        isPromoted: false,
                                        promotedAt: null,
                                        promotedToken: null,
                                    }
                                }, { upsert: true },
                                (err, result) => {
                                    if (err) throw new Error(err)
                                    console.log("Product Added - GROUPED")
                                })
                        })
                    } else if (product.item_type == "PRODUCT") {
                        let productImage = `https://imagedelivery.net/95QNzrEeP7RU5l5WdbyrKw/${product.cloudflare_image_id}/shopitem`
                        await products.updateOne(
                            { uniqid: product.uniqid },
                            {
                                $set: {
                                    platform: "sellix",
                                    shop: shopInfo.name,
                                    shopScore: shopInfo.average_score,
                                    shopId: shopInfo.id,
                                    productName: product.title,
                                    productDescription: product.description,
                                    productImage: productImage,
                                    productPrice: product.price,
                                    productPriceDisplay: product.price_display,
                                    productPriceDiscount: product.price_discount,
                                    gateways: product.gateways,
                                    isPromoted: false,
                                    promotedAt: null,
                                    promotedToken: null,
                                }
                            },
                            { upsert: true }, (err, result) => {
                                if (err) throw new Error(err)
                                console.log("Product Added - UNGROUPED")
                            })
                    }
                })
                res.json({ message: "Product Updated Successfully" });
            })
        })

        app.get("/shoppy/:shop", async (req, res) => {
            let got = (await import("got")).got
            let request = await got.get(`${HOST}/getShoppyShop/${req.params.shop}`)
            let shopData = JSON.parse(request.body)
            let shopInfo = shopData.user

            let productInfo = shopData.user.products
            let score = (shopData.user.rep["positive"] * 5) + (shopData.user.rep["neutral"] * 2.5) + (shopData.user.rep["negative"] * 0)
            console.log(score)
            let score1 = score / (shopData.user.rep["negative"] + shopData.user.rep["neutral"] + shopData.user.rep["positive"])
            console.log(score1)
            productInfo.forEach(async (product) => {
                let request = await got.get(`https://shoppy.gg/api/v1/public/products/` + product.id + "?cashier=true")
                let shopData = JSON.parse(request.body)

                function transformData(data) {
                    // Access the paymentMethods array within the cashier object
                    let paymentMethodsArray = data.cashier.paymentMethods;

                    // Map over the array to extract the title of each payment method
                    let titlesArray = paymentMethodsArray.map(method => method.title.toUpperCase());

                    // Join the titles into a comma-separated string
                    let titlesString = titlesArray.join(',');

                    return titlesString;
                }

                let description = shopData.description
                await products.updateOne(
                    { uniqid: product.id },
                    {
                        $set: {
                            platform: "shoppy",
                            shop: shopInfo.username,
                            productName: product.title,
                            productDescription: description,
                            productImage: product.image?.url,
                            productPriceDisplay: product.price,
                            shopScore: score1.toString().split('.'),
                            gateways: transformData(shopData),  // Only set gateways once, using transformData
                            productPrice: product.price,
                            isPromoted: false,
                            promotedAt: null,
                            promotedToken: null,
                        }
                    },
                    { upsert: true }, (err, result) => {
                        if (err) throw new Error(err)
                        console.log("Product Added - UNGROUPED")
                    })
            })
            res.json({ message: "Product Updated Successfully" });
        })

        app.get("/products", async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const pageSize = 16;
                const skip = (page - 1) * pageSize;

                const totalProducts = await products.countDocuments({});
                const totalPages = Math.ceil(totalProducts / pageSize);

                let allProducts = await products.find({}).skip(skip).limit(pageSize).toArray();

                res.json({
                    products: allProducts,
                    totalPages: totalPages
                });
            } catch (error) {
                console.error(error);
                res.status(500).send('Server Error');
            }
        });


        app.get("/products/search/:query", async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const pageSize = 16;
                const skip = (page - 1) * pageSize;

                let allProducts, totalProducts, totalPages, regex;

                if (req.params.query === '') {
                    // If the query is empty, return a default listing of products
                    totalProducts = await products.countDocuments();
                    totalPages = Math.ceil(totalProducts / pageSize);
                    allProducts = await products.find().skip(skip).limit(pageSize).toArray();
                } else {
                    // If the query is not empty, perform a search
                    regex = new RegExp([req.params.query].join(""), "i");
                    totalProducts = await products.countDocuments(
                        {
                            $or: [
                                { productName: { $regex: regex } },
                                { productDescription: { $regex: regex } },
                                { shop: { $regex: regex } }
                            ]
                        }
                    );
                    totalPages = Math.ceil(totalProducts / pageSize);
                    allProducts = await products.find(
                        {
                            $or: [
                                { productName: { $regex: regex } },
                                { productDescription: { $regex: regex } },
                                { shop: { $regex: regex } }
                            ]
                        }
                    ).skip(skip).limit(pageSize).toArray();
                }

                // Log variables for debugging
                console.log('Regex:', regex);
                console.log('Skip:', skip);
                console.log('Page Size:', pageSize);
                console.log('Total Products:', totalProducts);
                console.log('All Products:', allProducts);
                console.log('Total Pages:', totalPages);

                res.json({
                    products: allProducts,
                    totalPages: totalPages
                });
            } catch (error) {
                console.error(error);
                res.status(500).send('Server Error');
            }
        });




        app.get("/products/productById/:productId", async (req, res) => {
            let allProducts = await products.find({ uniqid: req.params.productId }).toArray()
            if (allProducts.length > 0) {
                res.json(allProducts[0]);
            } else {
                res.json({ message: "Product Not Found" });
            }
        })

        app.get("/products/getPromotedProducts", async (req, res) => {
            let allProducts = await products.find(
                {
                    isPromoted: true,
                    promotedAt: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
                    promotedToken: { $ne: null }
                }).toArray()
            res.json(allProducts);
        })

        app.post("/products/promoteProduct", async (req, res) => {
            let uniqid = req.body.uniqid
            let token = req.body.token
            await tokens.findOne({ token: token }, async (err, result) => {
                if (err) throw err;
                if (result) {
                    if (result.isActive == true || result.activatedAt > new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))) {
                        res.json({ message: "Token is already in use or expired" }).end();
                    } else {
                        await products.updateOne(
                            { uniqid: uniqid },
                            {
                                $set: {
                                    isPromoted: true,
                                    promotedAt: new Date(),
                                    promotedToken: token,
                                }
                            }, (err, result) => {
                                if (err) throw err;

                            }
                        )
                        await tokens.updateOne(
                            { token: token },
                            {
                                $set: {
                                    isActive: true,
                                    activatedAt: new Date(),
                                    activatedOnProduct: uniqid,
                                }
                            }, (err, result) => {
                                if (err) throw err
                                res.json({ message: "Product Promoted Successfully", error: 0 }).end();
                            })

                    }
                } else {
                    res.json({ message: "Invalid Token" }).end();
                }
            })
        })

        app.get("/generateToken/secret/:numberOfTokens", async (req, res) => {
            let numberOfTokens = parseInt(req.params.numberOfTokens)
            let tokensToCreate = []
            for (let i = 0; i < numberOfTokens; i++) {
                let token = uuid()
                tokensToCreate.push({
                    token: token,
                    isActive: false,
                    activatedAt: null,
                    activatedOnProduct: null
                })
            }
            await tokens.insertMany(tokensToCreate)
            res.send(numberOfTokens + " Tokens Generated")
        })



    })
    .catch(err => {
        throw err;
    });


app.listen(6999, (w) => {
    console.log('Server is running on port 6999', w);
})