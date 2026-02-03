const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVideoAds,
  getVideoAdById,
  toggleLike,
  toggleDislike,
  getComments,
  addComment,
  incrementLinkClick,
  createVideoAd,
  updateVideoAd,
  deleteVideoAd
} = require('../controllers/videoAd.controller');

// Public routes — more specific first
router.get('/', getVideoAds);
router.get('/:id/comments', getComments);
router.post('/:id/like', toggleLike);
router.post('/:id/dislike', toggleDislike);
router.post('/:id/comments', addComment);
router.post('/:id/link-click', incrementLinkClick);
router.get('/:id', getVideoAdById);

// Admin routes
router.post('/', protect, authorize('ADMIN'), createVideoAd);
router.put('/:id', protect, authorize('ADMIN'), updateVideoAd);
router.delete('/:id', protect, authorize('ADMIN'), deleteVideoAd);

module.exports = router;
