import { Router } from 'express';
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  publishListing,
  bulkPublishListings
} from '../controllers/listingController.js';

const router = Router();

router.get('/', getListings);
router.post('/', createListing);
router.post('/bulk-publish', bulkPublishListings);
router.get('/:id', getListingById);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);
router.post('/:id/publish', publishListing);

export default router;
