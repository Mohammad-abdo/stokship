const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  publishListing,
  unpublishListing,
  downloadExcelTemplate,
  bulkUploadListings
} = require('../controllers/listing.controller');

router.post('/', protect, createListing);
router.get('/', getListings);
router.get('/:id', getListingById);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);
router.post('/:id/publish', protect, publishListing);
router.post('/:id/unpublish', protect, unpublishListing);
router.get('/excel-template', protect, downloadExcelTemplate);
router.post('/bulk-upload', protect, bulkUploadListings);

module.exports = router;



