import express from 'express';
const router = express.Router();
import { authenticate } from '@/middlewares/auth.middleware';
import { ProductController } from '@/controllers/getProducts.controller';

router.get('/', ProductController.getAllProducts);
// Protect the route with the authenticate middleware
router.get('/:id', ProductController.getProductById);

export default router;