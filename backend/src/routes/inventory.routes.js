const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addStock,
  removeStock,
  getStockLevels,
  getLowStockProducts,
  updateProductStatus
} = require('../controllers/inventory.controller');

router.post('/add', protect, addStock);
router.post('/remove', protect, removeStock);
router.get('/stock-levels', protect, getStockLevels);
router.get('/low-stock', protect, getLowStockProducts);
router.put('/products/:id/status', protect, updateProductStatus);

module.exports = router;



