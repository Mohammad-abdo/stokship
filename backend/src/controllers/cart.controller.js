const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (User)
const getCart = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: { imageOrder: 'asc' }
              },
              vendor: {
                select: {
                  id: true,
                  companyName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!cart) {
    // Create empty cart if doesn't exist
    const newCart = await prisma.cart.create({
      data: {
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        items: true
      }
    });
    return successResponse(res, newCart, 'Cart retrieved successfully');
  }

  successResponse(res, cart, 'Cart retrieved successfully');
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private (User)
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, negotiatedPrice, negotiatedQuantity, notes } = req.body;

  if (!productId || !quantity) {
    return errorResponse(res, 'Please provide product ID and quantity', 400);
  }

  // Check if product exists and is available
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (product.status !== 'AVAILABLE') {
    return errorResponse(res, 'Product is not available', 400);
  }

  if (product.quantity < parseInt(quantity)) {
    return errorResponse(res, 'Insufficient stock', 400);
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

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: parseInt(productId)
    }
  });

  if (existingItem) {
    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + parseInt(quantity),
        ...(negotiatedPrice && { negotiatedPrice: parseFloat(negotiatedPrice) }),
        ...(negotiatedQuantity && { negotiatedQuantity: parseInt(negotiatedQuantity) }),
        ...(notes && { notes })
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

    return successResponse(res, updatedItem, 'Cart item updated successfully');
  }

  // Create new cart item
  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      negotiatedPrice: negotiatedPrice ? parseFloat(negotiatedPrice) : null,
      negotiatedQuantity: negotiatedQuantity ? parseInt(negotiatedQuantity) : null,
      notes: notes || null
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

  successResponse(res, cartItem, 'Item added to cart successfully', 201);
});

// @desc    Update cart item
// @route   PUT /api/cart/items/:id
// @access  Private (User)
const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, negotiatedPrice, negotiatedQuantity, notes } = req.body;

  // Find cart item and verify ownership
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: parseInt(id),
      cart: {
        userId: req.user.id,
        status: 'ACTIVE'
      }
    },
    include: {
      product: true
    }
  });

  if (!cartItem) {
    return errorResponse(res, 'Cart item not found', 404);
  }

  // Check stock availability if quantity is being updated
  if (quantity && parseInt(quantity) > cartItem.product.quantity) {
    return errorResponse(res, 'Insufficient stock', 400);
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: parseInt(id) },
    data: {
      ...(quantity && { quantity: parseInt(quantity) }),
      ...(negotiatedPrice !== undefined && { negotiatedPrice: negotiatedPrice ? parseFloat(negotiatedPrice) : null }),
      ...(negotiatedQuantity !== undefined && { negotiatedQuantity: negotiatedQuantity ? parseInt(negotiatedQuantity) : null }),
      ...(notes !== undefined && { notes })
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

  successResponse(res, updatedItem, 'Cart item updated successfully');
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private (User)
const removeCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find cart item and verify ownership
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: parseInt(id),
      cart: {
        userId: req.user.id,
        status: 'ACTIVE'
      }
    }
  });

  if (!cartItem) {
    return errorResponse(res, 'Cart item not found', 404);
  }

  await prisma.cartItem.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Item removed from cart successfully');
});

// @desc    Clear cart
// @route   POST /api/cart/clear
// @access  Private (User)
const clearCart = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    }
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
  }

  successResponse(res, null, 'Cart cleared successfully');
});

// @desc    Get cart summary
// @route   GET /api/cart/summary
// @access  Private (User)
const getCartSummary = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    return successResponse(res, {
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      delivery: 0,
      commission: 0,
      total: 0
    }, 'Cart summary retrieved successfully');
  }

  // Calculate totals
  let subtotal = 0;
  let totalCBM = 0;

  cart.items.forEach(item => {
    const price = item.negotiatedPrice || item.product.price;
    const qty = item.negotiatedQuantity || item.quantity;
    subtotal += price * qty;
    if (item.product.cbm) {
      totalCBM += item.product.cbm * qty;
    }
  });

  // Get site settings for commission and tax
  const siteSettings = await prisma.siteSettings.findFirst();
  const commissionRate = siteSettings?.siteCommissionPercentage || 2.5;
  const taxRate = siteSettings?.taxRate || 0;

  const commission = (subtotal * commissionRate) / 100;
  const tax = (subtotal * taxRate) / 100;
  const delivery = 0; // Calculate based on shipping method
  const total = subtotal + tax + delivery + commission;

  successResponse(res, {
    itemCount: cart.items.length,
    subtotal,
    tax,
    delivery,
    commission,
    total,
    totalCBM
  }, 'Cart summary retrieved successfully');
});

// @desc    Apply discount code
// @route   POST /api/cart/apply-discount
// @access  Private (User)
const applyDiscountCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return errorResponse(res, 'Please provide discount code', 400);
  }

  // Find active coupon
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      status: 'ACTIVE',
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() }
    }
  });

  if (!coupon) {
    return errorResponse(res, 'Invalid or expired discount code', 400);
  }

  // Check usage limits
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return errorResponse(res, 'Discount code has reached usage limit', 400);
  }

  // Check per-user limit
  if (coupon.usageLimitPerUser) {
    const userUsage = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: req.user.id
      }
    });

    if (userUsage >= coupon.usageLimitPerUser) {
      return errorResponse(res, 'You have reached the usage limit for this code', 400);
    }
  }

  // Get cart
  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    return errorResponse(res, 'Cart is empty', 400);
  }

  // Calculate subtotal
  let subtotal = 0;
  cart.items.forEach(item => {
    const price = item.negotiatedPrice || item.product.price;
    const qty = item.negotiatedQuantity || item.quantity;
    subtotal += price * qty;
  });

  // Check minimum purchase amount
  if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
    return errorResponse(res, `Minimum purchase amount of ${coupon.minPurchaseAmount} required`, 400);
  }

  // Apply discount code to cart
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      discountCode: coupon.code,
      discountCodeId: coupon.id
    }
  });

  successResponse(res, { coupon }, 'Discount code applied successfully');
});

// @desc    Remove discount code
// @route   DELETE /api/cart/discount
// @access  Private (User)
const removeDiscountCode = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    }
  });

  if (cart) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        discountCode: null,
        discountCodeId: null
      }
    });
  }

  successResponse(res, null, 'Discount code removed successfully');
});

// @desc    Save cart for later
// @route   POST /api/cart/save
// @access  Private (User)
const saveCart = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    }
  });

  if (!cart) {
    return errorResponse(res, 'Cart is empty', 400);
  }

  // Update cart status
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      status: 'SAVED',
      name: name || 'Saved Cart'
    }
  });

  // Create saved cart record
  const savedCart = await prisma.savedCart.create({
    data: {
      userId: req.user.id,
      cartId: cart.id,
      name: name || 'Saved Cart',
      description: description || null
    }
  });

  successResponse(res, savedCart, 'Cart saved successfully');
});

// @desc    Get saved carts
// @route   GET /api/cart/saved
// @access  Private (User)
const getSavedCarts = asyncHandler(async (req, res) => {
  const savedCarts = await prisma.savedCart.findMany({
    where: { userId: req.user.id },
    include: {
      cart: {
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
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, savedCarts, 'Saved carts retrieved successfully');
});

module.exports = {
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
};



