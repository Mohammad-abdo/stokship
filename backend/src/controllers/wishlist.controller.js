const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get user's wishlists
// @route   GET /api/wishlist
// @access  Private (User)
const getWishlists = asyncHandler(async (req, res) => {
  const wishlists = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: { imageOrder: 'asc' }
              }
            }
          }
        }
      },
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, wishlists, 'Wishlists retrieved successfully');
});

// @desc    Create wishlist
// @route   POST /api/wishlist
// @access  Private (User)
const createWishlist = asyncHandler(async (req, res) => {
  const { name, description, privacy, isGiftRegistry } = req.body;

  const wishlist = await prisma.wishlist.create({
    data: {
      userId: req.user.id,
      name: name || 'My Wishlist',
      description: description || null,
      privacy: privacy || 'PRIVATE',
      isGiftRegistry: isGiftRegistry || false
    }
  });

  successResponse(res, wishlist, 'Wishlist created successfully', 201);
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:id/products/:productId
// @access  Private (User)
const addProductToWishlist = asyncHandler(async (req, res) => {
  const { id, productId } = req.params;
  const { notes, priority, notifyOnSale, notifyOnStock } = req.body;

  // Verify wishlist ownership
  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    }
  });

  if (!wishlist) {
    return errorResponse(res, 'Wishlist not found', 404);
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check if already in wishlist
  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: parseInt(id),
      productId: parseInt(productId)
    }
  });

  if (existingItem) {
    return errorResponse(res, 'Product already in wishlist', 400);
  }

  const wishlistItem = await prisma.wishlistItem.create({
    data: {
      wishlistId: parseInt(id),
      productId: parseInt(productId),
      notes: notes || null,
      priority: priority || 'NICE_TO_HAVE',
      notifyOnSale: notifyOnSale || false,
      notifyOnStock: notifyOnStock || false,
      priceWhenAdded: product.price,
      currentPrice: product.price
    },
    include: {
      product: {
        include: {
          images: {
            take: 1,
            orderBy: { imageOrder: 'asc' }
          }
        }
      }
    }
  });

  successResponse(res, wishlistItem, 'Product added to wishlist successfully', 201);
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:id/products/:productId
// @access  Private (User)
const removeProductFromWishlist = asyncHandler(async (req, res) => {
  const { id, productId } = req.params;

  // Verify wishlist ownership
  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    }
  });

  if (!wishlist) {
    return errorResponse(res, 'Wishlist not found', 404);
  }

  const wishlistItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: parseInt(id),
      productId: parseInt(productId)
    }
  });

  if (!wishlistItem) {
    return errorResponse(res, 'Product not in wishlist', 404);
  }

  await prisma.wishlistItem.delete({
    where: { id: wishlistItem.id }
  });

  successResponse(res, null, 'Product removed from wishlist successfully');
});

// @desc    Move items from wishlist to cart
// @route   POST /api/wishlist/:id/to-cart
// @access  Private (User)
const moveToCart = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemIds } = req.body; // Optional: specific items, otherwise all items

  // Verify wishlist ownership
  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    },
    include: {
      items: {
        where: itemIds ? { id: { in: itemIds.map(id => parseInt(id)) } } : undefined,
        include: {
          product: true
        }
      }
    }
  });

  if (!wishlist) {
    return errorResponse(res, 'Wishlist not found', 404);
  }

  if (wishlist.items.length === 0) {
    return errorResponse(res, 'No items to move', 400);
  }

  // Get or create cart
  let cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });
  }

  // Add items to cart
  const cartItems = [];
  for (const item of wishlist.items) {
    // Check if already in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: item.productId
      }
    });

    if (existingCartItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + 1,
          addedFromWishlist: true,
          wishlistId: parseInt(id)
        }
      });
    } else {
      // Create new cart item
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          quantity: 1,
          addedFromWishlist: true,
          wishlistId: parseInt(id)
        }
      });
      cartItems.push(cartItem);
    }

    // Update wishlist item
    await prisma.wishlistItem.update({
      where: { id: item.id },
      data: { addedToCartAt: new Date() }
    });
  }

  successResponse(res, { cartItems, count: cartItems.length }, 'Items moved to cart successfully');
});

module.exports = {
  getWishlists,
  createWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  moveToCart
};



