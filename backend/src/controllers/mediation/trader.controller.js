const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const QRCode = require('qrcode');

/**
 * @desc    Create Trader (Employee only)
 * @route   POST /api/employees/:employeeId/traders
 * @access  Private (Employee)
 */
const createTrader = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { email, password, name, companyName, phone, countryCode, country, city } = req.body;

  if (!email || !password || !name || !companyName) {
    return errorResponse(res, 'Please provide email, password, name, and company name', 400);
  }

  // Verify employee exists and user is that employee
  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(employeeId) }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  if (req.userType !== 'EMPLOYEE' || req.user.id !== employee.id) {
    return errorResponse(res, 'Not authorized to create traders for this employee', 403);
  }

  // Check if email exists as trader
  const existingTrader = await prisma.trader.findUnique({
    where: { email }
  });

  if (existingTrader) {
    return errorResponse(res, 'Trader with this email already exists', 400);
  }

  // Check if client exists with the same email - link them
  const existingClient = await prisma.client.findUnique({
    where: { email }
  });

  // Note: If client exists, we'll link them via clientId after trader creation

  // Generate trader code
  const traderCount = await prisma.trader.count({
    where: { employeeId: parseInt(employeeId) }
  });
  const traderCode = `TRD-${String(traderCount + 1).padStart(4, '0')}`;

  // Generate barcode (simple numeric for now)
  const barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // Generate QR code
  const qrCodeData = JSON.stringify({
    type: 'TRADER',
    traderCode,
    barcode
  });
  const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

  // Hash password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  const trader = await prisma.trader.create({
    data: {
      email,
      password: hashedPassword,
      name,
      companyName,
      phone: phone || existingClient?.phone || null,
      countryCode: countryCode || existingClient?.countryCode || null,
      country: country || existingClient?.country || null,
      city: city || existingClient?.city || null,
      traderCode,
      barcode,
      qrCodeUrl,
      employeeId: parseInt(employeeId),
      clientId: existingClient ? existingClient.id : null, // Link to client if exists
      isActive: true,
      isVerified: false
    },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      traderCode: true,
      barcode: true,
      qrCodeUrl: true,
      isActive: true,
      createdAt: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'EMPLOYEE',
      action: 'TRADER_CREATED',
      entityType: 'TRADER',
      entityId: trader.id,
      description: `Employee created trader: ${trader.name} (${traderCode})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, trader, 'Trader created successfully', 201);
});

/**
 * @desc    Get Trader details
 * @route   GET /api/traders/:id
 * @access  Private (Employee/Admin/Trader)
 */
const getTraderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const traderId = parseInt(id);
    
    // First, get basic trader info with counts
    const trader = await prisma.trader.findUnique({
      where: { id: traderId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            employeeCode: true,
            isActive: true,
            createdAt: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            country: true,
            city: true,
            countryCode: true,
            isActive: true,
            isEmailVerified: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            offers: true,
            deals: true
          }
        }
      }
    });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  // Check authorization
  if (req.userType === 'TRADER' && req.user.id !== trader.id) {
    return errorResponse(res, 'Not authorized', 403);
  }
    if (req.userType === 'EMPLOYEE' && req.user.id !== trader.employeeId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    // Fetch offers separately
    const offers = await prisma.offer.findMany({
      where: { traderId: traderId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        totalCartons: true,
        totalCBM: true,
        companyName: true,
        proformaInvoiceNo: true,
        validatedAt: true,
        createdAt: true
      }
    }).catch(() => []);

    // Add counts to offers
    const offersWithCounts = await Promise.all(
      offers.map(async (offer) => {
        try {
          const [itemsCount, dealsCount] = await Promise.all([
            prisma.offerItem.count({ where: { offerId: offer.id } }).catch(() => 0),
            prisma.deal.count({ where: { offerId: offer.id } }).catch(() => 0)
          ]);
          return {
            ...offer,
            _count: {
              items: itemsCount,
              deals: dealsCount
            }
          };
        } catch (error) {
          return {
            ...offer,
            _count: { items: 0, deals: 0 }
          };
        }
      })
    );

    // Fetch deals separately with related data
    const deals = await prisma.deal.findMany({
      where: { traderId: traderId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        offer: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        items: {
          take: 5,
          include: {
            offerItem: {
              select: {
                id: true,
                productName: true,
                quantity: true
              }
            }
          }
        },
        payments: {
          take: 5,
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true,
            verifiedAt: true
          }
        }
      }
    }).catch(() => []);

    // Add counts to deals
    const dealsWithCounts = await Promise.all(
      deals.map(async (deal) => {
        try {
          const [itemsCount, paymentsCount, negotiationsCount] = await Promise.all([
            prisma.dealItem.count({ where: { dealId: deal.id } }).catch(() => 0),
            prisma.payment.count({ where: { dealId: deal.id } }).catch(() => 0),
            prisma.dealNegotiation.count({ where: { dealId: deal.id } }).catch(() => 0)
          ]);
          return {
            ...deal,
            _count: {
              items: itemsCount,
              payments: paymentsCount,
              negotiations: negotiationsCount
            }
          };
        } catch (error) {
          return {
            ...deal,
            _count: { items: 0, payments: 0, negotiations: 0 }
          };
        }
      })
    );

    // Add offers and deals to trader object
    const traderWithRelations = {
      ...trader,
      offers: offersWithCounts,
      deals: dealsWithCounts
    };

    // Calculate additional statistics
  const stats = await Promise.all([
    // Total offers by status
    prisma.offer.groupBy({
      by: ['status'],
      where: { traderId: parseInt(id) },
      _count: { status: true }
    }).catch(() => []), // Return empty array on error
    // Total deals by status
    prisma.deal.groupBy({
      by: ['status'],
      where: { traderId: parseInt(id) },
      _count: { status: true },
      _sum: {
        totalCartons: true,
        totalCBM: true,
        negotiatedAmount: true
      }
    }).catch(() => []), // Return empty array on error
    // Total payments - get deals first, then sum payments
    (async () => {
      try {
        const dealIds = await prisma.deal.findMany({
          where: { traderId: parseInt(id) },
          select: { id: true }
        }).then(deals => deals.map(d => d.id));

        if (!dealIds || dealIds.length === 0) {
          return { _sum: { amount: null }, _count: { id: 0 } };
        }

        const result = await prisma.payment.aggregate({
          where: {
            dealId: { in: dealIds }
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        });
        return result || { _sum: { amount: null }, _count: { id: 0 } };
      } catch (error) {
        console.error('Error calculating payments stats:', error);
        return { _sum: { amount: null }, _count: { id: 0 } };
      }
    })(),
    // Total financial transactions - use OR condition for traderId or dealIds
    (async () => {
      try {
        const dealIds = await prisma.deal.findMany({
          where: { traderId: parseInt(id) },
          select: { id: true }
        }).then(deals => deals.map(d => d.id));

        // Build where clause - include transactions where traderId matches OR dealId is in trader's deals
        let whereClause;
        if (dealIds && dealIds.length > 0) {
          whereClause = {
            OR: [
              { traderId: parseInt(id) },
              { dealId: { in: dealIds } }
            ]
          };
        } else {
          whereClause = { traderId: parseInt(id) };
        }

        const result = await prisma.financialTransaction.aggregate({
          where: whereClause,
          _sum: {
            amount: true,
            traderAmount: true
          },
          _count: {
            id: true
          }
        });
        return result || { _sum: { amount: null, traderAmount: null }, _count: { id: 0 } };
      } catch (error) {
        console.error('Error calculating transaction stats:', error);
        return { _sum: { amount: null, traderAmount: null }, _count: { id: 0 } };
      }
    })()
  ]);

  const [offersByStatus, dealsByStatus, paymentsStats, transactionsStats] = stats;

  // Safely extract statistics values
  const totalPayments = paymentsStats?._sum?.amount ? parseFloat(paymentsStats._sum.amount.toString()) : 0;
  const paymentCount = paymentsStats?._count?.id || 0;
  const totalTransactions = transactionsStats?._sum?.amount ? parseFloat(transactionsStats._sum.amount.toString()) : 0;
  const totalTraderAmount = transactionsStats?._sum?.traderAmount ? parseFloat(transactionsStats._sum.traderAmount.toString()) : 0;
  const transactionCount = transactionsStats?._count?.id || 0;

    // Add statistics to trader object
    const traderWithStats = {
      ...traderWithRelations,
      statistics: {
        offersByStatus: offersByStatus || [],
        dealsByStatus: dealsByStatus || [],
        totalPayments,
        paymentCount,
        totalTransactions,
        totalTraderAmount,
        transactionCount
      }
    };

    successResponse(res, traderWithStats, 'Trader retrieved successfully');
  } catch (error) {
    console.error('Error in getTraderById:', error);
    throw error; // Let asyncHandler handle it
  }
});

/**
 * @desc    Get Trader's Offers
 * @route   GET /api/traders/:id/offers
 * @access  Private (Employee/Admin/Trader)
 */
const getTraderOffers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const trader = await prisma.trader.findUnique({
    where: { id: parseInt(id) }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  // Check authorization
  if (req.userType === 'TRADER' && req.user.id !== trader.id) {
    return errorResponse(res, 'Not authorized', 403);
  }
  if (req.userType === 'EMPLOYEE' && req.user.id !== trader.employeeId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const where = { traderId: parseInt(id) };
  if (status) where.status = status;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            items: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Offers retrieved successfully');
});

/**
 * @desc    Update Trader
 * @route   PUT /api/traders/:id
 * @access  Private (Employee/Admin)
 */
const updateTrader = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, companyName, phone, countryCode, country, city, isActive, isVerified } = req.body;

  const trader = await prisma.trader.findUnique({
    where: { id: parseInt(id) }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  // Check authorization
  // Check authorization - Admin can update any, Employee only their own, Moderator can update specific fields
  if (req.userType === 'EMPLOYEE' && req.user.id !== trader.employeeId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const updateData = {};
  
  // Specific permissions for MODERATOR
  if (req.userType === 'MODERATOR') {
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified === 'true' || isVerified === true;
      if (updateData.isVerified && !trader.isVerified) {
        updateData.verifiedAt = new Date();
      }
    }
    // Moderators can strictly only verify/unverify and assign (handled in separate route/logic)
    // If they send other fields, we can ignore or allow small edits. user asked for 'verify'.
  } else {
    // Admin and Employee can update profile details
    if (name) updateData.name = name;
    if (companyName) updateData.companyName = companyName;
    if (phone !== undefined) updateData.phone = phone;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    
    // Only Admin can verify directly? Or Employee? Usually verification is higher level.
    // Let's assume Admin can do everything.
    if (req.userType === 'ADMIN') {
        if (isVerified !== undefined) {
            updateData.isVerified = isVerified === 'true' || isVerified === true;
            if (updateData.isVerified && !trader.isVerified) {
              updateData.verifiedAt = new Date();
            }
        }
    }
  }

  // If no data to update return
  if (Object.keys(updateData).length === 0) {
      return successResponse(res, trader, 'No changes made');
  }

  const updated = await prisma.trader.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      traderCode: true,
      isActive: true,
      isVerified: true,
      updatedAt: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'TRADER_UPDATED',
      entityType: 'TRADER',
      entityId: updated.id,
      description: `${req.userType} updated trader: ${updated.name}`,
      changes: JSON.stringify(updateData),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, updated, 'Trader updated successfully');
});

/**
 * @desc    Assign Trader to Employee (Moderator/Admin)
 * @route   PUT /api/traders/:id/assign
 * @access  Private (Admin/Moderator)
 */
const assignTrader = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeId } = req.body;

  if (!employeeId) {
    return errorResponse(res, 'Employee ID is required', 400);
  }

  const trader = await prisma.trader.findUnique({
    where: { id: parseInt(id) }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(employeeId) }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  const updated = await prisma.trader.update({
    where: { id: parseInt(id) },
    data: { employeeId: parseInt(employeeId) },
    select: {
      id: true,
      name: true,
      employee: {
        select: { id: true, name: true }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'TRADER_ASSIGNED',
      entityType: 'TRADER',
      entityId: updated.id,
      description: `${req.userType} assigned trader ${updated.name} to employee ${employee.name}`,
      changes: JSON.stringify({ employeeId }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, updated, 'Trader assigned to employee successfully');
});

/**
 * @desc    Get All Traders (Admin/Moderator)
 * @route   GET /api/admin/traders
 * @access  Private (Admin/Moderator)
 */
const getAllTraders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, employeeId, isVerified } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (isVerified !== undefined) where.isVerified = isVerified === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { traderCode: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) {
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'verified') where.isVerified = true;
    if (status === 'unverified') where.isVerified = false;
  }
  if (employeeId) where.employeeId = parseInt(employeeId);

  const [traders, total] = await Promise.all([
    prisma.trader.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true
          }
        },
        _count: {
          select: {
            offers: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.trader.count({ where })
  ]);

  paginatedResponse(res, traders, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Traders retrieved successfully');
});

/**
 * @desc    Delete Trader (Admin only)
 * @route   DELETE /api/admin/traders/:id
 * @access  Private (Admin)
 */
const deleteTrader = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trader = await prisma.trader.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          offers: true,
          deals: true
        }
      }
    }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  // Check if trader has active offers or deals
  if (trader._count.offers > 0 || trader._count.deals > 0) {
    return errorResponse(res, 'Cannot delete trader with existing offers or deals. Please deactivate instead.', 400);
  }

  await prisma.trader.delete({
    where: { id: parseInt(id) }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'ADMIN',
      action: 'TRADER_DELETED',
      entityType: 'TRADER',
      entityId: parseInt(id),
      description: `Admin deleted trader: ${trader.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, null, 'Trader deleted successfully');
});

/**
 * @desc    Check if client has linked trader profile
 * @route   GET /api/traders/check-linked
 * @access  Private (CLIENT)
 */
const checkLinkedTrader = asyncHandler(async (req, res) => {
  if (req.userType !== 'CLIENT') {
    return errorResponse(res, 'Only clients can check for linked trader profiles', 403);
  }

  // Check if trader exists with same email
  const client = await prisma.client.findUnique({
    where: { id: req.user.id }
  });

  if (!client) {
    return errorResponse(res, 'Client not found', 404);
  }

  // Check if trader exists with same email
  const trader = await prisma.trader.findUnique({
    where: { email: client.email },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      traderCode: true,
      isActive: true,
      isVerified: true,
      clientId: true
    }
  });

  if (trader && trader.clientId === client.id) {
    // Trader is linked to this client
    successResponse(res, {
      hasLinkedTrader: true,
      trader: trader
    }, 'Linked trader profile found');
  } else if (trader) {
    // Trader exists but not linked (shouldn't happen, but handle it)
    successResponse(res, {
      hasLinkedTrader: false,
      canLink: true,
      message: 'Trader profile exists with same email but not linked'
    }, 'Trader profile found but not linked');
  } else {
    // No trader profile exists
    successResponse(res, {
      hasLinkedTrader: false,
      canRequest: true,
      message: 'No trader profile found. Contact an employee to create one.'
    }, 'No linked trader profile');
  }
});

/**
 * @desc    Get Trader details (Public)
 * @route   GET /api/traders/:id/public
 * @access  Public
 */
const getTraderByIdPublic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trader = await prisma.trader.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      companyName: true,
      traderCode: true,
      country: true,
      city: true,
      isActive: true,
      isVerified: true,
      verifiedAt: true,
      createdAt: true,
      _count: {
        select: {
          offers: {
            where: { status: 'ACTIVE' }
          },
          deals: {
            where: { status: { in: ['APPROVED', 'PAID', 'SETTLED'] } }
          }
        }
      }
    }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  if (!trader.isActive) {
    return errorResponse(res, 'Trader not found', 404);
  }

  successResponse(res, trader, 'Trader retrieved successfully');
});

/**
 * @desc    Get Trader offers (Public)
 * @route   GET /api/traders/:id/offers/public
 * @access  Public
 */
const getTraderOffersPublic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const trader = await prisma.trader.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, isActive: true }
  });

  if (!trader || !trader.isActive) {
    return errorResponse(res, 'Trader not found', 404);
  }

  const where = {
    traderId: parseInt(id),
    status: 'ACTIVE'
  };

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            items: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  // Parse JSON fields
  const parsedOffers = offers.map(offer => {
    if (offer.images) {
      try {
        offer.images = typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images;
      } catch (e) {
        offer.images = [];
      }
    }
    return offer;
  });

  paginatedResponse(res, parsedOffers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Trader offers retrieved successfully');
});

module.exports = {
  createTrader,
  getTraderById,
  getTraderOffers,
  getTraderByIdPublic,
  getTraderOffersPublic,
  updateTrader,
  getAllTraders,
  deleteTrader,
  checkLinkedTrader,
  assignTrader
};
