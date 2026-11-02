import { Router } from 'express';
import {
  getStores,
  addStore,
  deleteStore,
  getShopifyStatus,
  testConnection,
  getStoreCollections,
  getStoreProducts,
  startOAuth,
  handleOAuthCallback
} from '../controllers/shopifyController.js';

const router = Router();

router.get('/status', getShopifyStatus);
router.get('/stores', getStores);
router.post('/stores', addStore);
router.delete('/stores/:id', deleteStore);
router.post('/stores/test', testConnection);
router.get('/stores/:id/collections', getStoreCollections);
router.get('/stores/:id/products', getStoreProducts);

// 1-Click Automated OAuth flow
router.get('/auth', startOAuth);
router.get('/oauth/callback', handleOAuthCallback);

export default router;

