const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const bcrypt = require('bcryptjs');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [clients, traders, employees, offers, deals, payments] = await Promise.all([
    prisma.client.count(),
    prisma.trader.count(),
    prisma.employee.count(),
    prisma.offer.count(),
    prisma.deal.count(),
    prisma.payment.count()
  ]);

  // Calculate total revenue from completed payments
  const totalRevenueResult = await prisma.payment.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { amount: true }
  });

  // Calculate total commission from financial transactions
  const totalCommissionResult = await prisma.financialTransaction.aggregate({
    where: { type: 'COMMISSION' },
    _sum: { amount: true }
  });

  const stats = {
    clients,
    traders,
    employees,
    offers,
    deals,
    payments,
    totalRevenue: totalRevenueResult._sum.amount || 0,
    totalCommission: totalCommissionResult._sum.amount || 0,
    walletBalance: 0 // Not applicable in mediation platform
  };

  successResponse(res, stats, 'Dashboard stats retrieved successfully');
});

// @desc    Get all users (clients)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.isActive = status === 'active';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        city: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.client.count({ where })
  ]);

  paginatedResponse(res, users, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Users retrieved successfully');
});

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private (Admin)
const getVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        companyName: true,
        phone: true,
        country: true,
        city: true,
        status: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.vendor.count({ where })
  ]);

  paginatedResponse(res, vendors, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Vendors retrieved successfully');
});

// @desc    Approve vendor
// @route   PUT /api/admin/vendors/:id/approve
// @access  Private (Admin)
const approveVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  const updated = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.id
    }
  });

  successResponse(res, updated, 'Vendor approved successfully');
});

// @desc    Reject vendor
// @route   PUT /api/admin/vendors/:id/reject
// @access  Private (Admin)
const rejectVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  const updated = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: req.user.id,
      rejectionReason: reason || null
    }
  });

  successResponse(res, updated, 'Vendor rejected successfully');
});

// @desc    Get vendor by ID
// @route   GET /api/admin/vendors/:id
// @access  Private (Admin)
const getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) },
    include: {
      bankAccounts: true,
      _count: {
        select: {
          products: true,
          orders: true
        }
      }
    }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  successResponse(res, vendor, 'Vendor retrieved successfully');
});

// @desc    Create vendor
// @route   POST /api/admin/vendors
// @access  Private (Admin)
const createVendor = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    companyName,
    businessName,
    phone,
    countryCode,
    country,
    city,
    businessLicense,
    taxId,
    website,
    description,
    paymentTerms,
    shippingTerms,
    leadTime,
    language,
    isActive
  } = req.body;

  if (!email || !password || !companyName || !phone) {
    return errorResponse(res, 'Please provide email, password, companyName, and phone', 400);
  }

  // Check if vendor exists
  const existingVendor = await prisma.vendor.findUnique({
    where: { email }
  });

  if (existingVendor) {
    return errorResponse(res, 'Vendor with this email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const vendor = await prisma.vendor.create({
    data: {
      email,
      password: hashedPassword,
      companyName,
      businessName: businessName || null,
      phone,
      countryCode: countryCode || null,
      country: country || null,
      city: city || null,
      businessLicense: businessLicense || null,
      taxId: taxId || null,
      website: website || null,
      description: description || null,
      paymentTerms: paymentTerms || null,
      shippingTerms: shippingTerms || null,
      leadTime: leadTime || null,
      language: language || 'ar',
      isActive: isActive !== undefined ? isActive : true,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.id
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      businessName: true,
      phone: true,
      country: true,
      city: true,
      status: true,
      isVerified: true,
      isActive: true,
      createdAt: true
    }
  });

  successResponse(res, vendor, 'Vendor created successfully', 201);
});

// @desc    Update vendor
// @route   PUT /api/admin/vendors/:id
// @access  Private (Admin)
const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    businessName,
    phone,
    country,
    city,
    description,
    paymentTerms,
    shippingTerms,
    leadTime,
    isActive
  } = req.body;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  const updateData = {};
  if (companyName !== undefined) updateData.companyName = companyName;
  if (businessName !== undefined) updateData.businessName = businessName;
  if (phone !== undefined) updateData.phone = phone;
  if (country !== undefined) updateData.country = country;
  if (city !== undefined) updateData.city = city;
  if (description !== undefined) updateData.description = description;
  if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
  if (shippingTerms !== undefined) updateData.shippingTerms = shippingTerms;
  if (leadTime !== undefined) updateData.leadTime = leadTime;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      bankAccounts: true
    }
  });

  successResponse(res, updated, 'Vendor updated successfully');
});

// @desc    Delete vendor
// @route   DELETE /api/admin/vendors/:id
// @access  Private (Admin)
const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  await prisma.vendor.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Vendor deleted successfully');
});

// @desc    Suspend vendor
// @route   PUT /api/admin/vendors/:id/suspend
// @access  Private (Admin)
const suspendVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  const updated = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: {
      status: 'SUSPENDED',
      isActive: false,
      suspendedAt: new Date(),
      suspendedBy: req.user.id,
      suspensionReason: reason || null
    }
  });

  successResponse(res, updated, 'Vendor suspended successfully');
});

// @desc    Activate vendor
// @route   PUT /api/admin/vendors/:id/activate
// @access  Private (Admin)
const activateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  const updated = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: {
      isActive: true,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null
    }
  });

  successResponse(res, updated, 'Vendor activated successfully');
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.client.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      country: true,
      city: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  successResponse(res, user, 'User retrieved successfully');
});

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, phone, country, city } = req.body;

  if (!email || !password || !name) {
    return errorResponse(res, 'Please provide email, password, and name', 400);
  }

  // Check if user exists
  const existingUser = await prisma.client.findUnique({
    where: { email }
  });

  if (existingUser) {
    return errorResponse(res, 'User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.client.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      country: country || null,
      city: city || null
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      country: true,
      city: true,
      isActive: true,
      createdAt: true
    }
  });

  successResponse(res, user, 'User created successfully', 201);
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone, countryCode, country, city, language, isActive } = req.body;

  const user = await prisma.client.findUnique({
    where: { id: parseInt(id) }
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await prisma.client.findUnique({
      where: { email }
    });
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 400);
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (countryCode !== undefined) updateData.countryCode = countryCode;
  if (country !== undefined) updateData.country = country;
  if (city !== undefined) updateData.city = city;
  if (language !== undefined) updateData.language = language;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  // Handle password update
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.client.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      countryCode: true,
      country: true,
      city: true,
      language: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  successResponse(res, updated, 'User updated successfully');
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.client.findUnique({
    where: { id: parseInt(id) }
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  await prisma.client.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'User deleted successfully');
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return errorResponse(res, 'Please provide valid status (active/inactive)', 400);
  }

  const user = await prisma.client.findUnique({
    where: { id: parseInt(id) }
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  const updated = await prisma.client.update({
    where: { id: parseInt(id) },
    data: { isActive: status === 'active' },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      updatedAt: true
    }
  });

  successResponse(res, updated, 'User status updated successfully');
});

// @desc    Get all payments (Admin only)
// @route   GET /api/admin/payments
// @access  Private (Admin)
const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (method) where.method = method;
  if (search) {
    where.OR = [
      { transactionId: { contains: search, mode: 'insensitive' } },
      { deal: { dealNumber: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        deal: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            trader: {
              select: {
                id: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payment.count({ where })
  ]);

  paginatedResponse(res, payments, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Payments retrieved successfully');
});

// @desc    Get payment by ID (Admin only)
// @route   GET /api/admin/payments/:id
// @access  Private (Admin)
const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(id) },
    include: {
      deal: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          trader: {
            select: {
              id: true,
              companyName: true,
              traderCode: true,
              email: true,
              phone: true
            }
          },
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!payment) {
    return errorResponse(res, 'Payment not found', 404);
  }

  successResponse(res, payment, 'Payment retrieved successfully');
});

// @desc    Get all wallets (Admin only) - Using Financial Ledger for mediation platform
// @route   GET /api/admin/wallets
// @access  Private (Admin)
const getAllWallets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // In mediation platform, we use FinancialLedger instead of wallets
  // Return empty for now as wallet concept doesn't apply to mediation
  const wallets = [];
  const total = 0;

  paginatedResponse(res, wallets, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Wallets retrieved successfully');
});

// @desc    Get all support tickets (Admin only)
// @route   GET /api/admin/support/tickets
// @access  Private (Admin)
const getAllSupportTickets = asyncHandler(async (req, res) => {
  // Support tickets may not exist in mediation schema
  // Return empty for now
  const tickets = [];
  const total = 0;

  paginatedResponse(res, tickets, {
    page: 1,
    limit: 20,
    total,
    pages: 0
  }, 'Support tickets retrieved successfully');
});

// @desc    Get support ticket by ID (Admin only)
// @route   GET /api/admin/support/tickets/:id
// @access  Private (Admin)
const getSupportTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  successResponse(res, ticket, 'Ticket retrieved successfully');
});

// @desc    Update support ticket status (Admin only)
// @route   PUT /api/admin/support/tickets/:id/status
// @access  Private (Admin)
const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority } = req.body;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parseInt(id) }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  const updated = await prisma.supportTicket.update({
    where: { id: parseInt(id) },
    data: {
      ...(status && { status }),
      ...(priority && { priority })
    }
  });

  successResponse(res, updated, 'Ticket updated successfully');
});

// @desc    Add admin message to ticket
// @route   POST /api/admin/support/tickets/:id/messages
// @access  Private (Admin)
const addAdminMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return errorResponse(res, 'Please provide message', 400);
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parseInt(id) }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  const ticketMessage = await prisma.supportTicketMessage.create({
    data: {
      ticketId: parseInt(id),
      userId: req.user.id,
      message,
      isAdmin: true
    }
  });

  // Update ticket status if it was closed
  if (ticket.status === 'CLOSED') {
    await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: { status: 'OPEN' }
    });
  }

  successResponse(res, ticketMessage, 'Message added successfully', 201);
});

module.exports = {
  getDashboardStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
  suspendVendor,
  activateVendor,
  getAllPayments,
  getPayment,
  getAllWallets,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  addAdminMessage
};


