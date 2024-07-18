import { Request, Response } from 'express';
import Shop from '@/modals/shop.modal';
import { saveShop } from '../services/addSellpassShop.service';

// get all shops with limit
const getAllSellpassShops = (req: Request, res: Response) => {
  // Parse the limit query parameter
  const limit = req.query.limit;
  // Validate the limit query parameter
  const limitNumber = limit ? parseInt(limit as string) : 0;
  
  Shop.find()
    .limit(limitNumber) // Use the parsed and validated limit
    .then((shops) => {
      res.status(200).json({ shops, limit: limitNumber });
    })
    .catch((error) => {
      res.status(500).json({ message: 'Failed to fetch shops', error });
    });
};

// find shop by name
async function getSellpassShopByName(req: Request, res: Response) {
  const { name } = req.params;
  try {
    const shop = await Shop.findOne({ name });
    if (shop) {
      res.status(200).json({ shop });
    } else {
      res.status(404).json({ message: 'Shop not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch shop', error });
  }
}

// add shop
async function addSellpassShop(req: Request, res: Response) {
  const { username } = req.body;
  try {
    const shop = await saveShop(username);
    res.status(201).json({ shop });
  } catch (error) {
    // Handle errors specifically thrown by saveShop, such as when the shop can only be refreshed every 2 hours
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    } else {
      // Generic error handling
      return res.status(500).json({ message: 'An unexpected error occurred', error });
    }
  }
}

// Group the functions in an object
const SellpassController = {
  getAllSellpassShops,
  getSellpassShopByName,
  addSellpassShop
};

// Export the object
export default SellpassController;