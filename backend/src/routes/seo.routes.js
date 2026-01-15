const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getGlobalSEOSettings,
  updateGlobalSEOSettings,
  getProductSEO,
  updateProductSEO,
  getCategorySEO,
  updateCategorySEO,
  getContentSEO,
  updateContentSEO,
  generateSlug,
  validateSlug,
  getSitemap,
  getRobotsTxt,
  updateRobotsTxt,
  getStructuredData,
  getSEOAnalytics,
  checkSEOCompleteness,
  bulkUpdateSEO
} = require('../controllers/seo.controller');

router.get('/settings', getGlobalSEOSettings);
router.put('/settings', protect, isAdmin, updateGlobalSEOSettings);
router.get('/products/:id', getProductSEO);
router.put('/products/:id', protect, updateProductSEO);
router.get('/categories/:id', getCategorySEO);
router.put('/categories/:id', protect, isAdmin, updateCategorySEO);
router.get('/content/:type', getContentSEO);
router.put('/content/:type', protect, isAdmin, updateContentSEO);
router.post('/generate-slug', protect, generateSlug);
router.get('/validate-slug', validateSlug);
router.get('/sitemap', getSitemap);
router.get('/robots-txt', getRobotsTxt);
router.put('/robots-txt', protect, isAdmin, updateRobotsTxt);
router.get('/structured-data/:type/:id', getStructuredData);
router.get('/analytics', protect, isAdmin, getSEOAnalytics);
router.get('/check', protect, isAdmin, checkSEOCompleteness);
router.post('/bulk-update', protect, isAdmin, bulkUpdateSEO);

module.exports = router;
