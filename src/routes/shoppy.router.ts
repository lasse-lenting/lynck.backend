import express from 'express';
const router = express.Router();

import ShoppyController from '@/controllers/shoppy.controller';

router.get('/', ShoppyController.getAllShoppyShops);
router.get('/:name', ShoppyController.getShoppyShopByName);
router.post('/add', ShoppyController.addShoppyShop);
export default router;