const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { notifyDealCreated, notifyDealStatusChanged } = require('../../utils/notificationHelper');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

/**
 * @desc    Request Negotiation (Create Deal) - Client
 * @route   POST /api/offers/:offerId/request-negotiation
 * @access  Private (Client)
 */
const requestNegotiation = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const { notes } = req.body;

  const offer = await prisma.offer.findUnique({
    where: { id: parseInt(offerId) },
    include: {
      trader: true
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  if (offer.status !== 'ACTIVE') {
    return errorResponse(res, 'Offer is not active', 400);
  }

  // Get trader's employee
  const employee = await prisma.employee.findUnique({
    where: { id: offer.trader.employeeId }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found for this trader', 500);
  }

  // Generate deal number
  const dealCount = await prisma.deal.count();
  const dealNumber = `DEAL-${new Date().getFullYear()}-${String(dealCount + 1).padStart(6, '0')}`;

  // Create deal
  const deal = await prisma.deal.create({
    data: {
      dealNumber,
      offerId: offer.id,
      traderId: offer.traderId,
      clientId: req.user.id,
      employeeId: employee.id,
      status: 'NEGOTIATION',
      notes: notes || null,
      totalCartons: 0,
      totalCBM: 0
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      },
      offer: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  // Create initial status history
  await prisma.dealStatusHistory.create({
    data: {
      dealId: deal.id,
      status: 'NEGOTIATION',
      description: 'Deal created - negotiation started',
      changedBy: req.user.id,
      changedByType: 'CLIENT'
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'CLIENT',
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `Client requested negotiation for offer: ${offer.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify trader and employee
  await notifyDealCreated(deal, req.user, deal.trader, employee);

  successResponse(res, deal, 'Negotiation request created successfully', 201);
});

/**
 * @desc    Approve Deal - Trader
 * @route   PUT /api/traders/deals/:id/approve
 * @access  Private (Trader)
 */
const approveDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { negotiatedAmount, notes } = req.body;

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(id),
      traderId: req.user.id,
      status: 'NEGOTIATION'
    },
    include: {
      items: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot be approved', 404);
  }

  if (!negotiatedAmount) {
    return errorResponse(res, 'Please provide negotiated amount', 400);
  }

  // Calculate totals from items
  let totalCartons = 0;
  let totalCBM = 0;
  deal.items.forEach(item => {
    totalCartons += item.cartons;
    totalCBM += item.cbm;
  });

  // Generate invoice number
  const invoiceCount = await prisma.invoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

  // Generate barcode and QR code
  const barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const qrCodeData = JSON.stringify({
    type: 'DEAL',
    dealNumber: deal.dealNumber,
    invoiceNumber,
    barcode
  });
  const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

  // Update deal
  const updatedDeal = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      status: 'APPROVED',
      negotiatedAmount: parseFloat(negotiatedAmount),
      totalCartons,
      totalCBM,
      invoiceNumber,
      barcode,
      qrCodeUrl,
      approvedAt: new Date(),
      notes: notes || deal.notes
    },
    include: {
      trader: true,
      client: true,
      employee: true,
      offer: true,
      items: {
        include: {
          offerItem: true
        }
      }
    }
  });

  // Create status history
  await prisma.dealStatusHistory.create({
    data: {
      dealId: deal.id,
      status: 'APPROVED',
      description: 'Deal approved by trader',
      changedBy: req.user.id,
      changedByType: 'TRADER'
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'TRADER',
      action: 'DEAL_APPROVED',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `Trader approved deal: ${deal.dealNumber}`,
      metadata: JSON.stringify({
        negotiatedAmount,
        totalCartons,
        totalCBM
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify client and employee about status change
  await notifyDealStatusChanged(deal, 'APPROVED', 'TRADER');

  successResponse(res, updatedDeal, 'Deal approved successfully');
});

/**
 * @desc    Get Deal details
 * @route   GET /api/deals/:id
 * @access  Private (Client/Trader/Employee/Admin)
 */
const getDealById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deal = await prisma.deal.findUnique({
    where: { id: parseInt(id) },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      },
      offer: {
        select: {
          id: true,
          title: true,
          description: true
        }
      },
      items: {
        include: {
          offerItem: true
        }
      },
      negotiations: {
        orderBy: { createdAt: 'asc' },
        take: 50 // Last 50 messages
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' }
      },
      payments: {
        orderBy: { createdAt: 'desc' }
      },
      invoices: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found', 404);
  }

  // Check authorization
  if (req.userType === 'CLIENT' && req.user.id !== deal.clientId) {
    return errorResponse(res, 'Not authorized', 403);
  }
  if (req.userType === 'TRADER' && req.user.id !== deal.traderId) {
    return errorResponse(res, 'Not authorized', 403);
  }
  if (req.userType === 'EMPLOYEE' && req.user.id !== deal.employeeId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  successResponse(res, deal, 'Deal retrieved successfully');
});

/**
 * @desc    Get Deals (filtered by user role)
 * @route   GET /api/deals
 * @access  Private
 */
const getDeals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  // Filter by user role
  if (req.userType === 'CLIENT') {
    where.clientId = req.user.id;
  } else if (req.userType === 'TRADER') {
    where.traderId = req.user.id;
  } else if (req.userType === 'EMPLOYEE') {
    where.employeeId = req.user.id;
  }
  // Admin can see all

  if (status) where.status = status;

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true,
            traderCode: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true
          }
        },
        offer: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            items: true,
            negotiations: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.deal.count({ where })
  ]);

  paginatedResponse(res, deals, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Deals retrieved successfully');
});

/**
 * @desc    Add items to Deal (during negotiation)
 * @route   POST /api/deals/:id/items
 * @access  Private (Client/Trader)
 */
const addDealItems = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body; // Array of { offerItemId, quantity, cartons, negotiatedPrice }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse(res, 'Please provide items array', 400);
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(id),
      OR: [
        { clientId: req.user.id },
        { traderId: req.user.id }
      ],
      status: 'NEGOTIATION'
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot be modified', 404);
  }

  // Validate and create deal items
  const dealItems = [];
  for (const item of items) {
    const offerItem = await prisma.offerItem.findFirst({
      where: {
        id: parseInt(item.offerItemId),
        offerId: deal.offerId
      }
    });

    if (!offerItem) {
      return errorResponse(res, `Offer item ${item.offerItemId} not found`, 404);
    }

    const quantity = parseInt(item.quantity) || offerItem.quantity;
    const cartons = parseInt(item.cartons) || offerItem.cartons;
    const cbm = offerItem.cbm * quantity;

    dealItems.push({
      dealId: deal.id,
      offerItemId: offerItem.id,
      quantity,
      cartons,
      cbm,
      negotiatedPrice: item.negotiatedPrice ? parseFloat(item.negotiatedPrice) : null,
      notes: item.notes || null
    });
  }

  // Delete existing items and create new ones
  await prisma.dealItem.deleteMany({
    where: { dealId: deal.id }
  });

  await prisma.dealItem.createMany({
    data: dealItems
  });

  // Recalculate totals
  const totalCartons = dealItems.reduce((sum, item) => sum + item.cartons, 0);
  const totalCBM = dealItems.reduce((sum, item) => sum + item.cbm, 0);

  const updatedDeal = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      totalCartons,
      totalCBM
    },
    include: {
      items: {
        include: {
          offerItem: true
        }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'DEAL_ITEMS_UPDATED',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `${req.userType} updated deal items`,
      metadata: JSON.stringify({
        itemCount: dealItems.length,
        totalCartons,
        totalCBM
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, updatedDeal, 'Deal items updated successfully');
});

/**
 * @desc    Settle Deal (Mark as completed) - Employee/Admin
 * @route   PUT /api/deals/:id/settle
 * @access  Private (Employee, Admin)
 */
const settleDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deal = await prisma.deal.findUnique({
    where: { id: parseInt(id) },
    include: {
      offer: true,
      trader: true,
      client: true,
      employee: true,
      items: {
        include: {
          offerItem: true
        }
      },
      payments: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found', 404);
  }

  if (deal.status !== 'PAID') {
    return errorResponse(res, 'Deal must be paid before settlement', 400);
  }

  // Update deal status
  const settledDeal = await prisma.deal.update({
    where: { id: parseInt(id) },
    data: {
      status: 'SETTLED',
      settledAt: new Date()
    },
    include: {
      offer: true,
      trader: true,
      client: true,
      employee: true,
      items: {
        include: {
          offerItem: true
        }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'DEAL_SETTLED',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `${req.userType} settled deal ${deal.dealNumber}`,
      metadata: JSON.stringify({
        dealNumber: deal.dealNumber,
        amount: deal.negotiatedAmount
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Create audit trail
  await prisma.auditTrail.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'DEAL_SETTLED',
      entityType: 'DEAL',
      entityId: deal.id,
      oldValue: JSON.stringify({ status: deal.status }),
      newValue: JSON.stringify({ status: 'SETTLED', settledAt: new Date() }),
      description: `Deal ${deal.dealNumber} settled by ${req.userType}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    }
  });

  successResponse(res, settledDeal, 'Deal settled successfully');
});

module.exports = {
  requestNegotiation,
  approveDeal,
  getDealById,
  getDeals,
  addDealItems,
  settleDeal
};

