const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCompanyProfile,
  getCompanyProducts,
  getCompanyAds,
  getCompanyProfileDetails,
  updateCompanyProfile
} = require('../controllers/company.controller');

router.get('/:id', getCompanyProfile);
router.get('/:id/products', getCompanyProducts);
router.get('/:id/ads', getCompanyAds);
router.get('/:id/profile', getCompanyProfileDetails);
router.put('/:id/profile', protect, updateCompanyProfile);

module.exports = router;



