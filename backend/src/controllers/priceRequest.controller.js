const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Request price for product
// @route   POST /api/products/:id/request-price
// @access  Private (User)
const requestPrice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { requestedQuantity, message } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { vendor: true }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  const priceRequest = await prisma.priceRequest.create({
    data: {
      productId: parseInt(id),
      buyerId: req.user.id,
      vendorId: product.vendorId,
      requestedQuantity: requestedQuantity ? parseInt(requestedQuantity) : null,
      message: message || null,
      status: 'PENDING'
    },
    include: {
      product: {
        include: {
          images: {
            take: 1,
            orderBy: { imageOrder: 'asc' }
          }
        }
      },
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      }
    }
  });

  successResponse(res, priceRequest, 'Price request created successfully', 201);
});

// @desc    Get price requests (vendor view)
// @route   GET /api/price-requests
// @access  Private (Vendor)
const getPriceRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { vendorId: req.user.id };
  if (status) where.status = status;

  const [priceRequests, total] = await Promise.all([
    prisma.priceRequest.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { imageOrder: 'asc' }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.priceRequest.count({ where })
  ]);

  paginatedResponse(res, priceRequests, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Price requests retrieved successfully');
});

// @desc    Get price request details
// @route   GET /api/price-requests/:id
// @access  Private (User/Vendor)
const getPriceRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const where = { id: parseInt(id) };
  if (req.userType === 'USER') {
    where.buyerId = req.user.id;
  } else if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  const priceRequest = await prisma.priceRequest.findFirst({
    where,
    include: {
      product: {
        include: {
          images: true,
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      vendor: {
        select: {
          id: true,
          companyName: true,
          email: true
        }
      }
    }
  });

  if (!priceRequest) {
    return errorResponse(res, 'Price request not found', 404);
  }

  successResponse(res, priceRequest, 'Price request retrieved successfully');
});

// @desc    Respond to price request
// @route   PUT /api/price-requests/:id/respond
// @access  Private (Vendor)
const respondToPriceRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { responsePrice, response, status } = req.body;

  if (!responsePrice || !response) {
    return errorResponse(res, 'Please provide response price and response message', 400);
  }

  const priceRequest = await prisma.priceRequest.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id,
      status: 'PENDING'
    }
  });

  if (!priceRequest) {
    return errorResponse(res, 'Price request not found or already responded', 404);
  }

  const updated = await prisma.priceRequest.update({
    where: { id: parseInt(id) },
    data: {
      responsePrice: parseFloat(responsePrice),
      response,
      status: status || 'RESPONDED',
      respondedAt: new Date()
    },
    include: {
      product: true,
      buyer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  successResponse(res, updated, 'Price request response submitted successfully');
});

module.exports = {
  requestPrice,
  getPriceRequests,
  getPriceRequestById,
  respondToPriceRequest
};



