import { Router } from 'express';
import {
  getProducts,
  getProductById,
  publishProductToShopifyDirect,
  checkShopifyLink
} from '../controllers/productController.js';

const router = Router();

// GET /api/products (list live EMS products from MySQL products table)
router.get('/', getProducts);

// GET /api/products/:id (get single EMS product by ID)
router.get('/:id', getProductById);

// POST /api/products/shopify/publish (publish EMS product directly to Shopify)
router.post('/shopify/publish', publishProductToShopifyDirect);

// GET /api/products/shopify/link-check/:id (check live storefront link)
router.get('/shopify/link-check/:id', checkShopifyLink);

export default router;
