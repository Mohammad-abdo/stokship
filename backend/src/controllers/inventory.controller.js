const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Add stock to product
// @route   POST /api/inventory/add
// @access  Private (Vendor/Admin)
const addStock = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;

  if (!productId || !quantity) {
    return errorResponse(res, 'Please provide product ID and quantity', 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check authorization
  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to update this product', 403);
  }

  const updated = await prisma.product.update({
    where: { id: parseInt(productId) },
    data: {
      quantity: product.quantity + parseInt(quantity),
      status: product.quantity + parseInt(quantity) > 0 ? 'AVAILABLE' : 'SOLD_OUT'
    }
  });

  successResponse(res, updated, 'Stock added successfully');
});

// @desc    Remove stock from product
// @route   POST /api/inventory/remove
// @access  Private (Vendor/Admin)
const removeStock = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;

  if (!productId || !quantity) {
    return errorResponse(res, 'Please provide product ID and quantity', 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check authorization
  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to update this product', 403);
  }

  if (product.quantity < parseInt(quantity)) {
    return errorResponse(res, 'Insufficient stock to remove', 400);
  }

  const newQuantity = product.quantity - parseInt(quantity);
  const updated = await prisma.product.update({
    where: { id: parseInt(productId) },
    data: {
      quantity: newQuantity,
      status: newQuantity > 0 ? 'AVAILABLE' : 'SOLD_OUT'
    }
  });

  successResponse(res, updated, 'Stock removed successfully');
});

// @desc    Get stock levels
// @route   GET /api/inventory/stock-levels
// @access  Private (Vendor/Admin)
const getStockLevels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, vendorId, lowStock } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  } else if (vendorId) {
    where.vendorId = parseInt(vendorId);
  }

  if (lowStock === 'true') {
    where.minStockLevel = { not: null };
    where.quantity = { lte: prisma.raw('minStockLevel') };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        nameKey: true,
        sku: true,
        quantity: true,
        minStockLevel: true,
        status: true,
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: { quantity: 'asc' }
    }),
    prisma.product.count({ where })
  ]);

  paginatedResponse(res, products, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Stock levels retrieved successfully');
});

// @desc    Get low stock products
// @route   GET /api/inventory/low-stock
// @access  Private (Vendor/Admin)
const getLowStockProducts = asyncHandler(async (req, res) => {
  const where = {};
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  where.minStockLevel = { not: null };
  where.quantity = { lte: prisma.raw('minStockLevel') };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      nameKey: true,
      sku: true,
      quantity: true,
      minStockLevel: true,
      status: true,
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      }
    },
    orderBy: { quantity: 'asc' }
  });

  successResponse(res, products, 'Low stock products retrieved successfully');
});

// @desc    Update product availability status
// @route   PUT /api/inventory/products/:id/status
// @access  Private (Vendor/Admin)
const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return errorResponse(res, 'Please provide status', 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check authorization
  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to update this product', 403);
  }

  const updated = await prisma.product.update({
    where: { id: parseInt(id) },
    data: { status }
  });

  successResponse(res, updated, 'Product status updated successfully');
});

module.exports = {
  addStock,
  removeStock,
  getStockLevels,
  getLowStockProducts,
  updateProductStatus
};



