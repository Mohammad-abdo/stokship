const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Create negotiation request
// @route   POST /api/negotiations
// @access  Private (User)
const createNegotiation = asyncHandler(async (req, res) => {
  const { productId, negotiatedPrice, negotiatedQuantity, notes } = req.body;

  if (!productId || !negotiatedPrice || !negotiatedQuantity) {
    return errorResponse(res, 'Please provide product ID, negotiated price, and quantity', 400);
  }

  // Check if product exists and accepts negotiation
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
    include: { vendor: true }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (!product.acceptsNegotiation) {
    return errorResponse(res, 'This product does not accept negotiation', 400);
  }

  // Create negotiation
  const negotiation = await prisma.negotiation.create({
    data: {
      productId: parseInt(productId),
      buyerId: req.user.id,
      vendorId: product.vendorId,
      negotiatedPrice: parseFloat(negotiatedPrice),
      negotiatedQuantity: parseInt(negotiatedQuantity),
      status: 'PENDING',
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
      },
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      }
    }
  });

  successResponse(res, negotiation, 'Negotiation request created successfully', 201);
});

// @desc    Get user's negotiations
// @route   GET /api/negotiations
// @access  Private (User/Vendor)
const getNegotiations = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (req.userType === 'USER') {
    where.buyerId = req.user.id;
  } else if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }
  if (status) where.status = status;

  const [negotiations, total] = await Promise.all([
    prisma.negotiation.findMany({
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
        },
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.negotiation.count({ where })
  ]);

  paginatedResponse(res, negotiations, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Negotiations retrieved successfully');
});

// @desc    Get negotiation details
// @route   GET /api/negotiations/:id
// @access  Private (User/Vendor)
const getNegotiationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const where = { id: parseInt(id) };
  if (req.userType === 'USER') {
    where.buyerId = req.user.id;
  } else if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  const negotiation = await prisma.negotiation.findFirst({
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
          email: true,
          phone: true
        }
      }
    }
  });

  if (!negotiation) {
    return errorResponse(res, 'Negotiation not found', 404);
  }

  successResponse(res, negotiation, 'Negotiation retrieved successfully');
});

// @desc    Respond to negotiation
// @route   PUT /api/negotiations/:id/respond
// @access  Private (Vendor)
const respondToNegotiation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
    return errorResponse(res, 'Please provide valid status (ACCEPTED or REJECTED)', 400);
  }

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id,
      status: 'PENDING'
    }
  });

  if (!negotiation) {
    return errorResponse(res, 'Negotiation not found or already responded', 404);
  }

  const updated = await prisma.negotiation.update({
    where: { id: parseInt(id) },
    data: {
      status,
      notes: notes || negotiation.notes,
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

  successResponse(res, updated, 'Negotiation response submitted successfully');
});

// @desc    Update negotiation status
// @route   PUT /api/negotiations/:id/status
// @access  Private (User/Vendor)
const updateNegotiationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return errorResponse(res, 'Please provide status', 400);
  }

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      id: parseInt(id),
      OR: [
        { buyerId: req.user.id },
        { vendorId: req.user.id }
      ]
    }
  });

  if (!negotiation) {
    return errorResponse(res, 'Negotiation not found', 404);
  }

  const updated = await prisma.negotiation.update({
    where: { id: parseInt(id) },
    data: { status }
  });

  successResponse(res, updated, 'Negotiation status updated successfully');
});

module.exports = {
  createNegotiation,
  getNegotiations,
  getNegotiationById,
  respondToNegotiation,
  updateNegotiationStatus
};



