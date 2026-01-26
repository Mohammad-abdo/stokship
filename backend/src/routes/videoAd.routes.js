const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVideoAds,
  getVideoAdById,
  createVideoAd,
  updateVideoAd,
  deleteVideoAd
} = require('../controllers/videoAd.controller');

// Public routes
router.get('/', getVideoAds);
router.get('/:id', getVideoAdById);

// Admin routes
router.post('/', protect, authorize('ADMIN'), createVideoAd);
router.put('/:id', protect, authorize('ADMIN'), updateVideoAd);
router.delete('/:id', protect, authorize('ADMIN'), deleteVideoAd);

module.exports = router;
