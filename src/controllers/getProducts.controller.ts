import { Request, Response } from 'express';
import Product from '@/modals/product.modal';

// get all products with limit with pagination and filtering
const getAllProducts = async (req: Request, res: Response) => {
  // Parse and validate the limit query parameter, default to 12
  const limit = parseInt(req.query.limit as string) || 12;
  // Parse and validate the page query parameter, default to 1
  const page = parseInt(req.query.page as string) || 1;

  // Ensure limit and page are positive
  const limitNumber = Math.max(limit, 1);
  const pageNumber = Math.max(page, 1);

  // Calculate skip
  const skip = (pageNumber - 1) * limitNumber;

  // Extract filter options from query parameters
  const sort = req.query.Sorting as string;
  const price = Array.isArray(req.query.Price) ? req.query.Price : req.query.Price ? [req.query.Price] : [];
  const platform = Array.isArray(req.query.Platform) ? req.query.Platform : req.query.Platform ? [req.query.Platform] : [];
  console.log(req.query);
  // Build query object
  const query: any = {};

  // Filter by price
  if (price && price.length) {
    const priceConditions = price.map((range) => {
      if (range === 'Under $10') return { price: { $lt: 10 } };
      if (range === '$10 - $50') return { price: { $gte: 10, $lte: 50 } };
      if (range === '$50 - $100') return { price: { $gte: 50, $lte: 100 } };
      if (range === 'Over $100') return { price: { $gt: 100 } };
      return {};
    });
    query.$or = priceConditions;
  }

  // Filter by platform (multiple platforms can be selected) also can be empty and uppercase
  if (platform && platform.length) {
    query.platform = { $in: platform.map((p: string) => p.toLowerCase()) };
  }
  

  // Build sort object
  const sortOptions: any = {};
  if (sort) {
    if (sort === 'Newest') sortOptions.createdAt = -1;
    if (sort === 'Oldest') sortOptions.createdAt = 1;
    if (sort === 'Price: Low to High') sortOptions.price = 1;
    if (sort === 'Price: High to Low') sortOptions.price = -1;
  }

  try {
    // Fetch products with filters, sorting, and pagination, also add the shop details per product and get the shop by product.shopId
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate('shopId', 'name avatar feedbacks');

    // Assuming you have a way to calculate the total number of products
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      products,
      pagination: {
        limit: limitNumber,
        filters: sortOptions,
        page: pageNumber,
        totalPages: Math.ceil(totalProducts / limitNumber),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error });
  }
};

// find product by id
async function getProductById(req: Request, res: Response) {
  // search for product by id
  const { id } = req.params;
  try {
    const product = await Product.findOne({ id });
    if (product) {
      res.status(200).json({ product });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error });
  }
}

export const ProductController = {
  getAllProducts,
  getProductById,
};
