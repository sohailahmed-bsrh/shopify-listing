import { Router } from 'express';
import {
  getStores,
  addStore,
  deleteStore,
  testConnection,
  getStoreCollections,
  getStoreProducts
} from '../controllers/shopifyController.js';

const router = Router();

router.get('/stores', getStores);
router.post('/stores', addStore);
router.delete('/stores/:id', deleteStore);
router.post('/stores/test', testConnection);
router.get('/stores/:id/collections', getStoreCollections);
router.get('/stores/:id/products', getStoreProducts);

export default router;
