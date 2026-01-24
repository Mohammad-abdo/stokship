const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider
} = require('../controllers/slider.controller');

// Public routes
router.get('/', getSliders);
router.get('/:id', getSliderById);

// Admin routes
router.post('/', protect, authorize('ADMIN'), createSlider);
router.put('/:id', protect, authorize('ADMIN'), updateSlider);
router.delete('/:id', protect, authorize('ADMIN'), deleteSlider);

module.exports = router;



