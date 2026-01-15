const express = require('express');
const router = express.Router();
const { protect, isUser } = require('../middleware/auth');
const {
  getWishlists,
  createWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  moveToCart
} = require('../controllers/wishlist.controller');

// Wishlist routes
router.get('/', protect, isUser, getWishlists);
router.post('/', protect, isUser, createWishlist);

// Wishlist item routes
router.post('/:id/products/:productId', protect, isUser, addProductToWishlist);
router.delete('/:id/products/:productId', protect, isUser, removeProductFromWishlist);

// Actions
router.post('/:id/to-cart', protect, isUser, moveToCart);

module.exports = router;
