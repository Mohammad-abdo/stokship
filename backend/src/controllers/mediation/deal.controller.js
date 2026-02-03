const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { notifyDealCreated, notifyDealStatusChanged, createNotification } = require('../../utils/notificationHelper');
const { generateDealQRCode } = require('../../services/qrcode.service');

/**
 * @desc    Request Negotiation (Create Deal) - Client
 * @route   POST /api/offers/:offerId/request-negotiation
 * @access  Private (Client)
 */
const requestNegotiation = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const { notes } = req.body;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
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
  let employee = null;
  if (offer.trader.employeeId) {
    employee = await prisma.employee.findUnique({
      where: { id: offer.trader.employeeId }
    });
  }

  // If trader doesn't have an employee, try to find a default employee or assign one
  if (!employee) {
    // Try to find any active employee as fallback
    employee = await prisma.employee.findFirst({
      where: { isActive: true }
    });

    // If still no employee found, return error
    if (!employee) {
      return errorResponse(res, 'No employee available to process this deal. Please contact support.', 500);
    }
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
  const activityLogData = {
    userType: 'CLIENT',
    action: 'DEAL_CREATED',
    entityType: 'DEAL',
    dealId: deal.id,
    description: `Client requested negotiation for offer: ${offer.title}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  activityLogData.clientId = req.user.id;
  await prisma.activityLog.create({ data: activityLogData });

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
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const query = req.query || {};
  const notes = body.notes;

  const deal = await prisma.deal.findFirst({
    where: {
      id: id,
      traderId: req.user.id,
      status: 'NEGOTIATION'
    },
    include: {
      items: {
        include: { offerItem: true }
      }
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot be approved', 404);
  }

  const parseAmount = (val) => {
    if (val == null || val === '') return null;
    const parsed = parseFloat(String(val).replace(/,/g, '').trim());
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
  };

  let amountToUse = null;
  if (deal.items && deal.items.length > 0) {
    const calculated = deal.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      let unitPrice = item.negotiatedPrice != null ? parseFloat(item.negotiatedPrice) : 0;
      if (unitPrice <= 0 && item.offerItem && item.offerItem.unitPrice != null) {
        unitPrice = parseFloat(item.offerItem.unitPrice);
      }
      return total + (quantity * unitPrice);
    }, 0);
    if (calculated > 0) amountToUse = calculated;
  }
  if (amountToUse == null || amountToUse <= 0) {
    amountToUse = parseAmount(body.negotiatedAmount)
      ?? parseAmount(query.negotiatedAmount)
      ?? parseAmount(req.get && req.get('X-Negotiated-Amount'));
  }
  if (amountToUse == null || amountToUse <= 0) {
    return errorResponse(res, 'Provide negotiatedAmount in body, query (?negotiatedAmount=5000), or header. Received: query=' + JSON.stringify(query) + ' bodyKeys=' + Object.keys(body || {}).join(',') + ' header=' + (req.get && req.get('X-Negotiated-Amount') || 'none'), 400);
  }

  // Calculate totals from items (safe: handle undefined/null/Decimal)
  let totalCartons = 0;
  let totalCBM = 0;
  if (deal.items && deal.items.length > 0) {
    deal.items.forEach((item) => {
      totalCartons += Number(item.cartons) || 0;
      totalCBM += Number(item.cbm) || 0;
    });
  }

  // Generate unique invoice number (Deal.invoiceNumber has @unique constraint)
  const year = new Date().getFullYear();
  const dealSuffix = deal.id.replace(/-/g, '').substring(0, 12).toUpperCase();
  const invoiceNumber = `INV-${year}-${dealSuffix}`;

  // Generate barcode and QR code
  const barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  let qrCodeUrl = null;
  try {
    // Use QR code service
    const dealForQR = {
      id: deal.id,
      dealNumber: deal.dealNumber,
      invoiceNumber,
      barcode,
      status: 'APPROVED'
    };
    qrCodeUrl = await generateDealQRCode(dealForQR);
  } catch (qrError) {
    console.error('Error generating QR code for deal:', qrError);
    // Continue without QR code - it's not critical
  }

  // Optional shipping type: LAND (بري) or SEA (بحري)
  const shippingType = body.shippingType === 'SEA' || body.shippingType === 'LAND' ? body.shippingType : undefined;

  // Update deal
  const updatedDeal = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      status: 'APPROVED',
      negotiatedAmount: amountToUse,
      totalCartons,
      totalCBM,
      ...(shippingType && { shippingType }),
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
  const activityLogData = {
    userType: 'TRADER',
    action: 'DEAL_APPROVED',
    entityType: 'DEAL',
    dealId: deal.id,
    description: `Trader approved deal: ${deal.dealNumber}`,
    metadata: JSON.stringify({
      negotiatedAmount: amountToUse,
      totalCartons,
      totalCBM
    }),
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  activityLogData.traderId = req.user.id;
  await prisma.activityLog.create({ data: activityLogData });

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
    where: { id: id },
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
          employeeCode: true,
          commissionRate: true
        }
      },
      shippingCompany: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          avatar: true,
          address: true,
          contactName: true,
          phone: true,
          email: true
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

  // Check authorization (ADMIN has access to all deals)
  if (req.userType !== 'ADMIN') {
    if (req.userType === 'CLIENT' && req.user?.id !== deal.clientId) {
      return errorResponse(res, 'Not authorized', 403);
    }
    if (req.userType === 'TRADER' && req.user?.id !== deal.traderId) {
      return errorResponse(res, 'Not authorized', 403);
    }
    if (req.userType === 'EMPLOYEE' && req.user?.id !== deal.employeeId) {
      return errorResponse(res, 'Not authorized', 403);
    }
  }

  // Auto-cancel deal if 72 hours passed since quote was sent and client did not approve
  let dealToReturn = deal;
  if (deal.status === 'NEGOTIATION' && deal.quoteSentAt) {
    const sentAt = new Date(deal.quoteSentAt).getTime();
    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    if (Date.now() - sentAt > seventyTwoHoursMs) {
      const reason = 'Deal cancelled: 72 hours passed without client approval.';
      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason }
      });
      await prisma.dealStatusHistory.create({
        data: {
          dealId: deal.id,
          status: 'CANCELLED',
          description: reason,
          changedBy: null,
          changedByType: 'SYSTEM'
        }
      });
      dealToReturn = { ...deal, status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason };
    }
  }

  // Fetch platform settings for commission display (wrap in try-catch to prevent errors)
  let platformSettings = null;
  try {
    platformSettings = await prisma.platformSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
  } catch (settingsError) {
    // Log error but don't block the response
    console.error('Failed to fetch platform settings:', settingsError);
  }

  successResponse(res, { deal: dealToReturn, platformSettings }, 'Deal retrieved successfully');
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
        items: {
          include: {
            offerItem: true
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

  // Calculate negotiatedAmount from items or get from latest negotiation message if not set
  const dealsWithAmount = await Promise.all(
    deals.map(async (deal) => {
      // If deal already has negotiatedAmount, use it
      if (deal.negotiatedAmount && parseFloat(deal.negotiatedAmount) > 0) {
        return deal;
      }

      // Calculate from items if available
      if (deal.items && deal.items.length > 0) {
        const calculatedAmount = deal.items.reduce((total, item) => {
          const quantity = item.quantity || 0;
          const unitPrice = item.negotiatedPrice ? parseFloat(item.negotiatedPrice) : 0;
          return total + (quantity * unitPrice);
        }, 0);

        if (calculatedAmount > 0) {
          return {
            ...deal,
            negotiatedAmount: calculatedAmount
          };
        }
      }

      // If still no amount, try to get from latest negotiation message
      try {
        const latestNegotiation = await prisma.dealNegotiation.findFirst({
          where: {
            dealId: deal.id,
            proposedPrice: { not: null }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (latestNegotiation && latestNegotiation.proposedPrice) {
          return {
            ...deal,
            negotiatedAmount: parseFloat(latestNegotiation.proposedPrice)
          };
        }
      } catch (error) {
        console.error(`Error fetching latest negotiation for deal ${deal.id}:`, error);
      }

      return deal;
    })
  );

  paginatedResponse(res, dealsWithAmount, {
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
      id: id,
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
        id: item.offerItemId,
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
  const activityLogData = {
    userType: req.userType,
    action: 'DEAL_ITEMS_UPDATED',
    entityType: 'DEAL',
    dealId: deal.id,
    description: `${req.userType} updated deal items`,
    metadata: JSON.stringify({
      itemCount: dealItems.length,
      totalCartons,
      totalCBM
    }),
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Set the appropriate user ID field based on userType
  if (req.userType === 'CLIENT') {
    activityLogData.clientId = req.user.id;
  } else if (req.userType === 'TRADER') {
    activityLogData.traderId = req.user.id;
  } else if (req.userType === 'EMPLOYEE') {
    activityLogData.employeeId = req.user.id;
  } else if (req.userType === 'ADMIN') {
    activityLogData.adminId = req.user.id;
  }
  
  await prisma.activityLog.create({ data: activityLogData });

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
    where: { id: id },
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
    where: { id: id },
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
  const activityLogData = {
    userType: req.userType,
    action: 'DEAL_SETTLED',
    entityType: 'DEAL',
    dealId: deal.id,
    description: `${req.userType} settled deal ${deal.dealNumber}`,
    metadata: JSON.stringify({
      dealNumber: deal.dealNumber,
      amount: deal.negotiatedAmount
    }),
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Set the appropriate user ID field based on userType
  if (req.userType === 'CLIENT') {
    activityLogData.clientId = req.user.id;
  } else if (req.userType === 'TRADER') {
    activityLogData.traderId = req.user.id;
  } else if (req.userType === 'EMPLOYEE') {
    activityLogData.employeeId = req.user.id;
  } else if (req.userType === 'ADMIN') {
    activityLogData.adminId = req.user.id;
  }
  
  await prisma.activityLog.create({ data: activityLogData });

  // Create audit trail
  const auditTrailData = {
    userType: req.userType,
    action: 'DEAL_SETTLED',
    entityType: 'DEAL',
    dealId: deal.id,
    oldValue: JSON.stringify({ status: deal.status }),
    newValue: JSON.stringify({ status: 'SETTLED', settledAt: new Date() }),
    description: `Deal ${deal.dealNumber} settled by ${req.userType}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success: true
  };
  
  // Set the appropriate user ID field based on userType
  if (req.userType === 'CLIENT') {
    auditTrailData.clientId = req.user.id;
  } else if (req.userType === 'TRADER') {
    auditTrailData.traderId = req.user.id;
  } else if (req.userType === 'EMPLOYEE') {
    auditTrailData.employeeId = req.user.id;
  } else if (req.userType === 'ADMIN') {
    auditTrailData.adminId = req.user.id;
  }
  
  await prisma.auditTrail.create({ data: auditTrailData });

  // Create status history
  await prisma.dealStatusHistory.create({
    data: {
      dealId: deal.id,
      status: 'SETTLED',
      description: 'Deal settled and completed',
      changedBy: req.user.id,
      changedByType: (req.userType || 'ADMIN').toUpperCase() // Ensure uppercase and default to ADMIN
    }
  });

  // Notify all parties about status change
  try {
    await notifyDealStatusChanged(settledDeal, 'SETTLED', req.userType);
  } catch (notifyError) {
    console.error('Error sending notifications:', notifyError);
    // Don't fail the request if notifications fail
  }

  successResponse(res, settledDeal, 'Deal settled successfully');
});

/**
 * @desc    Assign Shipping Company to Deal - Admin/Employee
 * @route   PUT /api/deals/:id/assign-shipping
 * @access  Private (Admin, Employee)
 */
const assignShippingCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { shippingCompanyId } = req.body;

  console.log('🚢 Assign Shipping Company - Deal ID:', id, 'Shipping Company ID:', shippingCompanyId);

  const deal = await prisma.deal.findUnique({
    where: { id: id }
  });

  if (!deal) {
    console.log('❌ Deal not found:', id);
    return errorResponse(res, 'Deal not found', 404);
  }

  // If shippingCompanyId is provided, validate it exists
  if (shippingCompanyId) {
    const shippingCompany = await prisma.shippingCompany.findUnique({
      where: { id: shippingCompanyId }
    });

    if (!shippingCompany) {
      console.log('❌ Shipping company not found:', shippingCompanyId);
      return errorResponse(res, 'Shipping company not found', 404);
    }

    if (shippingCompany.status !== 'ACTIVE') {
      console.log('❌ Shipping company is not active:', shippingCompanyId, 'Status:', shippingCompany.status);
      return errorResponse(res, 'Cannot assign inactive shipping company', 400);
    }
  }

  // Update deal with shipping company assignment
  try {
    const updatedDeal = await prisma.deal.update({
      where: { id: id },
      data: {
        shippingCompanyId: shippingCompanyId || null
      },
      include: {
        shippingCompany: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            avatar: true,
            address: true,
            contactName: true,
            phone: true,
            email: true
          }
        }
      }
    });
    console.log('✅ Deal updated successfully with shipping company');

    // Log activity
    try {
      const activityLogData = {
        userType: req.userType,
        action: 'DEAL_SHIPPING_ASSIGNED',
        entityType: 'DEAL',
        dealId: deal.id,
        description: shippingCompanyId 
          ? `${req.userType} assigned shipping company to deal ${deal.dealNumber}`
          : `${req.userType} removed shipping company assignment from deal ${deal.dealNumber}`,
        metadata: JSON.stringify({
          dealNumber: deal.dealNumber,
          shippingCompanyId: shippingCompanyId || null
        }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };
      
      // Set the appropriate user ID field based on userType
      if (req.userType === 'CLIENT') {
        activityLogData.clientId = req.user.id;
      } else if (req.userType === 'TRADER') {
        activityLogData.traderId = req.user.id;
      } else if (req.userType === 'EMPLOYEE') {
        activityLogData.employeeId = req.user.id;
      } else if (req.userType === 'ADMIN') {
        activityLogData.adminId = req.user.id;
      }
      
      await prisma.activityLog.create({ data: activityLogData });
      console.log('✅ Activity log created successfully');
    } catch (logError) {
      console.error('⚠️ Failed to create activity log:', logError);
      // Don't fail the request if logging fails
    }

    successResponse(res, updatedDeal, shippingCompanyId 
      ? 'Shipping company assigned successfully' 
      : 'Shipping company assignment removed successfully');
  } catch (updateError) {
    console.error('❌ Error updating deal:', updateError);
    throw updateError; // Let asyncHandler handle it
  }
});

/**
 * @desc    Request Negotiation (Public) - For non-authenticated users
 * @route   POST /api/offers/:offerId/request-negotiation/public
 * @access  Public
 */
const requestNegotiationPublic = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const { email, phone, name, notes, items } = req.body; // items: [{offerItemId, quantity, negotiatedPrice}]

  if (!email && !phone) {
    return errorResponse(res, 'Please provide email or phone number', 400);
  }

  if (!name) {
    return errorResponse(res, 'Please provide your name', 400);
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      trader: {
        include: {
          employee: true
        }
      }
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  if (offer.status !== 'ACTIVE') {
    return errorResponse(res, 'Offer is not active', 400);
  }

  // Check if client exists, if not create one
  let client = await prisma.client.findFirst({
    where: {
      OR: [
        { email: email || undefined },
        { phone: phone || undefined }
      ]
    }
  });

  if (!client) {
    // Create new client account
    client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        isActive: true
      }
    });
  } else {
    // Update client info if provided
    await prisma.client.update({
      where: { id: client.id },
      data: {
        name: name || client.name,
        email: email || client.email,
        phone: phone || client.phone
      }
    });
  }

  // Get trader's employee or find a default one
  let employee = null;
  if (offer.trader.employeeId) {
    employee = await prisma.employee.findUnique({
      where: { id: offer.trader.employeeId }
    });
  }

  // If trader doesn't have an employee, try to find a default employee
  if (!employee) {
    employee = await prisma.employee.findFirst({
      where: { isActive: true }
    });

    // If still no employee found, return error
    if (!employee) {
      return errorResponse(res, 'No employee available to process this deal. Please contact support.', 500);
    }
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
      clientId: client.id,
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

  // Add deal items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    const dealItems = [];
    for (const item of items) {
      const offerItem = await prisma.offerItem.findUnique({
        where: { id: item.offerItemId }
      });

      if (offerItem && offerItem.offerId === offer.id) {
        dealItems.push({
          dealId: deal.id,
          offerItemId: item.offerItemId,
          quantity: parseInt(item.quantity) || offerItem.quantity,
          cartons: Math.ceil((parseInt(item.quantity) || offerItem.quantity) / (offerItem.packageQuantity || 1)),
          negotiatedPrice: parseFloat(item.negotiatedPrice) || parseFloat(offerItem.unitPrice) || 0,
          notes: item.notes || null
        });
      }
    }

    if (dealItems.length > 0) {
      await prisma.dealItem.createMany({
        data: dealItems
      });

      // Calculate totals - fetch all offer items first
      const offerItemIds = dealItems.map(item => item.offerItemId);
      const offerItemsData = await prisma.offerItem.findMany({
        where: { id: { in: offerItemIds } }
      });
      const offerItemsMap = new Map(offerItemsData.map(item => [item.id, item]));

      const totalCartons = dealItems.reduce((sum, item) => sum + item.cartons, 0);
      const totalCBM = dealItems.reduce((sum, item) => {
        const offerItem = offerItemsMap.get(item.offerItemId);
        if (!offerItem) return sum;
        const itemCBM = parseFloat(offerItem.totalCBM || 0);
        const ratio = item.quantity / (offerItem.quantity || 1);
        return sum + (itemCBM * ratio);
      }, 0);

      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          totalCartons,
          totalCBM: totalCBM
        }
      });
    }
  }

  // Create initial status history
  await prisma.dealStatusHistory.create({
    data: {
      dealId: deal.id,
      status: 'NEGOTIATION',
      description: 'Deal created - negotiation started (public request)',
      changedBy: client.id,
      changedByType: 'CLIENT'
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      clientId: client.id,
      userType: 'CLIENT',
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      dealId: deal.id,
      description: `Client (${name}) requested negotiation for offer: ${offer.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify trader and employee
  await notifyDealCreated(deal, client, deal.trader, offer.trader.employee);

  successResponse(res, {
    deal,
    message: 'Negotiation request created successfully. You will be contacted soon.'
  }, 'Negotiation request created successfully', 201);
});

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
const QUOTE_EXPIRED_REASON = 'Deal cancelled: 72 hours passed without client approval.';

/**
 * @desc    Client accepts price quote (deal → APPROVED, then client can pay)
 * @route   PUT /api/deals/:id/client-accept
 * @access  Private (Client)
 */
const clientAcceptDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deal = await prisma.deal.findFirst({
    where: { id, clientId: req.user.id, status: 'NEGOTIATION' },
    include: { items: { include: { offerItem: true } } }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or you cannot accept this deal', 404);
  }

  if (deal.quoteSentAt) {
    const sentAt = new Date(deal.quoteSentAt).getTime();
    if (Date.now() - sentAt > SEVENTY_TWO_HOURS_MS) {
      await prisma.deal.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: QUOTE_EXPIRED_REASON }
      });
      return errorResponse(res, 'This quote has expired (72 hours passed). The deal has been cancelled.', 400);
    }
  }

  const amountFromItems = deal.items && deal.items.length
    ? deal.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.negotiatedPrice) || 0), 0)
    : 0;
  const negotiatedAmount = deal.negotiatedAmount && parseFloat(deal.negotiatedAmount) > 0
    ? parseFloat(deal.negotiatedAmount)
    : amountFromItems;

  if (!negotiatedAmount || negotiatedAmount <= 0) {
    return errorResponse(res, 'Deal has no negotiated amount', 400);
  }

  const updatedDeal = await prisma.deal.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      negotiatedAmount
    },
    include: {
      trader: { select: { id: true, name: true, companyName: true } },
      client: { select: { id: true, name: true, email: true } },
      employee: { select: { id: true, name: true } },
      offer: { select: { id: true, title: true } },
      items: { include: { offerItem: true } }
    }
  });

  await prisma.dealStatusHistory.create({
    data: {
      dealId: id,
      status: 'APPROVED',
      description: 'Client accepted the price quote.',
      changedBy: req.user.id,
      changedByType: 'CLIENT'
    }
  });

  await notifyDealStatusChanged(updatedDeal, 'APPROVED', 'CLIENT');

  successResponse(res, updatedDeal, 'Deal accepted. You can proceed to payment.');
});

/**
 * @desc    Client rejects price quote
 * @route   PUT /api/deals/:id/client-reject
 * @access  Private (Client)
 */
const clientRejectDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  const deal = await prisma.deal.findFirst({
    where: { id, clientId: req.user.id, status: 'NEGOTIATION' }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or you cannot reject this deal', 404);
  }

  const cancellationReason = (reason && String(reason).trim()) || 'Client rejected the price quote.';

  await prisma.deal.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason }
  });

  await prisma.dealStatusHistory.create({
    data: {
      dealId: id,
      status: 'CANCELLED',
      description: cancellationReason,
      changedBy: req.user.id,
      changedByType: 'CLIENT'
    }
  });

  await notifyDealStatusChanged({ ...deal, status: 'CANCELLED', cancelledAt: new Date(), cancellationReason }, 'CANCELLED', 'CLIENT');

  successResponse(res, null, 'Deal rejected.');
});

/**
 * @desc    Client cancels the deal
 * @route   PUT /api/deals/:id/client-cancel
 * @access  Private (Client)
 */
const clientCancelDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  const deal = await prisma.deal.findFirst({
    where: { id, clientId: req.user.id, status: 'NEGOTIATION' }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or you cannot cancel this deal', 404);
  }

  const cancellationReason = (reason && String(reason).trim()) || 'Client cancelled the deal.';

  await prisma.deal.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason }
  });

  await prisma.dealStatusHistory.create({
    data: {
      dealId: id,
      status: 'CANCELLED',
      description: cancellationReason,
      changedBy: req.user.id,
      changedByType: 'CLIENT'
    }
  });

  await notifyDealStatusChanged({ ...deal, status: 'CANCELLED', cancelledAt: new Date(), cancellationReason }, 'CANCELLED', 'CLIENT');

  successResponse(res, null, 'Deal cancelled.');
});

/**
 * @desc    Send price quote to client (notify client to view quote)
 * @route   POST /api/deals/:id/send-quote-to-client
 * @access  Private (Employee/Admin)
 */
const sendQuoteToClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      trader: { select: { name: true, companyName: true } }
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found', 404);
  }

  if (req.userType === 'EMPLOYEE' && deal.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to send quote for this deal', 403);
  }

  if (!deal.clientId) {
    return errorResponse(res, 'Deal has no client', 400);
  }

  const shippingType = req.body?.shippingType === 'SEA' || req.body?.shippingType === 'LAND' ? req.body.shippingType : undefined;
  await prisma.deal.update({
    where: { id },
    data: {
      quoteSentAt: new Date(),
      ...(shippingType && { shippingType })
    }
  });

  await createNotification({
    userIds: deal.clientId,
    userType: 'CLIENT',
    type: 'PRICE_QUOTE',
    title: 'عرض السعر جاهز',
    message: `تم إعداد عرض السعر لصفقتك ${deal.dealNumber}. اضغط لعرض التفاصيل.`,
    relatedEntityType: 'DEAL',
    relatedEntityId: deal.id
  });

  successResponse(res, { sent: true }, 'Price quote sent to client');
});

module.exports = {
  requestNegotiation,
  requestNegotiationPublic,
  approveDeal,
  getDealById,
  getDeals,
  addDealItems,
  settleDeal,
  assignShippingCompany,
  sendQuoteToClient,
  clientAcceptDeal,
  clientRejectDeal,
  clientCancelDeal
};

