const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  requestPrice,
  getPriceRequests,
  getPriceRequestById,
  respondToPriceRequest
} = require('../controllers/priceRequest.controller');

router.post('/products/:id/request-price', protect, requestPrice);
router.get('/', protect, getPriceRequests);
router.get('/:id', protect, getPriceRequestById);
router.put('/:id/respond', protect, respondToPriceRequest);

module.exports = router;



