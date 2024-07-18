import express from 'express';
const router = express.Router();

import ShoppyController from '@/controllers/sellpass.controller';

router.get('/', ShoppyController.getAllSellpassShops);
router.get('/:name', ShoppyController.getSellpassShopByName);
router.post('/add', ShoppyController.addSellpassShop);
export default router;