const express = require('express');
const router = express.Router();
const { protect, isAdmin, protectOptional } = require('../middleware/auth');
const {
  createOffer,
  getVendorOffers,
  updateOffer,
  deleteOffer,
  getAllOffers,
  approveOffer,
  rejectOffer,
  createPlatformOffer,
  getOfferAnalytics
} = require('../controllers/offer.controller');
// Use mediation controller for offers (new schema)
const { getOfferById, getActiveOffers, getRecommendedOffers, getOffersByCategory } = require('../controllers/mediation/offer.controller');

// IMPORTANT: More specific routes must come BEFORE parameterized routes (/:id)
// Admin routes (most specific)
router.get('/admin/all', protect, isAdmin, getAllOffers);
router.get('/admin/analytics', protect, isAdmin, getOfferAnalytics);
router.put('/admin/:id/approve', protect, isAdmin, approveOffer);
router.put('/admin/:id/reject', protect, isAdmin, rejectOffer);
router.post('/admin', protect, isAdmin, createPlatformOffer);

// Vendor routes
router.post('/vendor', protect, createOffer);
router.get('/vendor', protect, getVendorOffers);
router.put('/vendor/:id', protect, updateOffer);
router.delete('/vendor/:id', protect, deleteOffer);

// Public routes (use mediation controller)
// IMPORTANT: These specific routes must come BEFORE /:id
router.get('/recommended', getRecommendedOffers);
router.get('/by-category/:categoryId', getOffersByCategory);
router.get('/', getActiveOffers);
// Get offer by ID - public but with optional authorization checks inside controller
// This must be LAST - it's a catch-all for /:id
// Uses optional authentication - sets req.user if token exists, but allows public access if no token
router.get('/:id', protectOptional, getOfferById);

module.exports = router;

