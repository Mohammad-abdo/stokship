const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getTerms,
  getPrivacy,
  getDeliveryInfo,
  updateContent,
  getContentSEO,
  updateContentSEO
} = require('../controllers/content.controller');

router.get('/terms', getTerms);
router.get('/privacy', getPrivacy);
router.get('/delivery-info', getDeliveryInfo);
router.put('/:type', protect, isAdmin, updateContent);
router.get('/:type/seo', getContentSEO);
router.put('/:type/seo', protect, isAdmin, updateContentSEO);

module.exports = router;

