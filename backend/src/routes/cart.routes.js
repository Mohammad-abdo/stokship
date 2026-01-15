const express = require('express');
const router = express.Router();
const { protect, isUser } = require('../middleware/auth');
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartSummary,
  applyDiscountCode,
  removeDiscountCode,
  saveCart,
  getSavedCarts
} = require('../controllers/cart.controller');

// Cart routes
router.get('/', protect, isUser, getCart);
router.get('/summary', protect, isUser, getCartSummary);

// Cart item routes
router.post('/items', protect, isUser, addItemToCart);
router.put('/items/:id', protect, isUser, updateCartItem);
router.delete('/items/:id', protect, isUser, removeCartItem);

// Cart actions
router.post('/clear', protect, isUser, clearCart);
router.post('/apply-discount', protect, isUser, applyDiscountCode);
router.delete('/discount', protect, isUser, removeDiscountCode);
router.post('/save', protect, isUser, saveCart);
router.get('/saved', protect, isUser, getSavedCarts);

module.exports = router;

