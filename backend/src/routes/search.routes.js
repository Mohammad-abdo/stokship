const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  searchProducts,
  autocomplete,
  searchCategories,
  searchVendors,
  searchOrders,
  globalSearch,
  imageSearch,
  getSearchHistory,
  clearSearchHistory,
  saveSearch,
  getSavedSearches,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchAnalytics,
  getPopularSearches
} = require('../controllers/search.controller');

router.get('/products', searchProducts);
router.get('/autocomplete', autocomplete);
router.get('/categories', searchCategories);
router.get('/vendors', searchVendors);
router.get('/orders', protect, searchOrders);
router.get('/global', globalSearch);
router.post('/image', imageSearch);
router.get('/history', protect, getSearchHistory);
router.delete('/history', protect, clearSearchHistory);
router.post('/saved', protect, saveSearch);
router.get('/saved', protect, getSavedSearches);
router.put('/saved/:id', protect, updateSavedSearch);
router.delete('/saved/:id', protect, deleteSavedSearch);
router.get('/analytics', protect, isAdmin, getSearchAnalytics);
router.get('/popular', getPopularSearches);

module.exports = router;
