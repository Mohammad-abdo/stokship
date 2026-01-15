const express = require('express');
const router = express.Router();
const {
  getTopRatedProducts,
  getBestSellers,
  getRecentlyAddedProducts,
  getMostPurchasedProducts,
  getPopularCategories,
  getBusinessServices,
  getBanners
} = require('../controllers/homepage.controller');

router.get('/top-rated', getTopRatedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/recently-added', getRecentlyAddedProducts);
router.get('/most-purchased', getMostPurchasedProducts);
router.get('/popular-categories', getPopularCategories);
router.get('/business-services', getBusinessServices);
router.get('/banners', getBanners);

module.exports = router;



