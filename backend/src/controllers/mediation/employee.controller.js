const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Create Employee (Admin only)
 * @route   POST /api/admin/employees
 * @access  Private (Admin)
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { email, password, name, phone, commissionRate } = req.body;

  if (!email || !password || !name) {
    return errorResponse(res, 'Please provide email, password, and name', 400);
  }

  // Check if email exists
  const existingEmployee = await prisma.employee.findUnique({
    where: { email }
  });

  if (existingEmployee) {
    return errorResponse(res, 'Employee with this email already exists', 400);
  }

  // Generate employee code
  const employeeCount = await prisma.employee.count();
  const employeeCode = `EMP-${String(employeeCount + 1).padStart(4, '0')}`;

  // Hash password (assuming you have bcrypt)
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      employeeCode,
      commissionRate: commissionRate ? parseFloat(commissionRate) : 1.0,
      createdBy: req.user.id, // Admin ID
      isActive: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      employeeCode: true,
      commissionRate: true,
      isActive: true,
      createdAt: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'ADMIN',
      action: 'EMPLOYEE_CREATED',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      description: `Admin created employee: ${employee.name} (${employeeCode})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, employee, 'Employee created successfully', 201);
});

/**
 * @desc    Get all Employees (Admin only)
 * @route   GET /api/admin/employees
 * @access  Private (Admin)
 */
const getAllEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { employeeCode: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            traders: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.employee.count({ where })
  ]);

  paginatedResponse(res, employees, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Employees retrieved successfully');
});

/**
 * @desc    Get Employee details
 * @route   GET /api/admin/employees/:id
 * @access  Private (Admin/Employee)
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate that id is a valid integer (not "offers", "traders", etc.)
  const employeeId = parseInt(id);
  if (isNaN(employeeId)) {
    return errorResponse(res, 'Invalid employee ID', 400);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) },
    include: {
      createdByAdmin: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      traders: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true,
          isActive: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          traders: true,
          deals: true
        }
      }
    }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  // Check if employee can view (admin or self)
  if (req.userType !== 'ADMIN' && req.user.id !== employee.id) {
    return errorResponse(res, 'Not authorized to view this employee', 403);
  }

  successResponse(res, employee, 'Employee retrieved successfully');
});

/**
 * @desc    Update Employee
 * @route   PUT /api/admin/employees/:id
 * @access  Private (Admin)
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, commissionRate, isActive } = req.body;

  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (commissionRate !== undefined) updateData.commissionRate = parseFloat(commissionRate);
  if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

  const updated = await prisma.employee.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      employeeCode: true,
      commissionRate: true,
      isActive: true,
      updatedAt: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'ADMIN',
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: updated.id,
      description: `Admin updated employee: ${updated.name}`,
      changes: JSON.stringify(updateData),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, updated, 'Employee updated successfully');
});

/**
 * @desc    Get Employee's Traders
 * @route   GET /api/employees/:id/traders
 * @access  Private (Admin/Employee)
 */
const getEmployeeTraders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Verify employee exists and user has access
  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  // Check authorization
  if (req.userType !== 'ADMIN' && req.user.id !== employee.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const where = { employeeId: parseInt(id) };
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [traders, total] = await Promise.all([
    prisma.trader.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
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
 * @desc    Get Employee's Deals
 * @route   GET /api/employees/:id/deals
 * @access  Private (Admin/Employee)
 */
const getEmployeeDeals = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Verify employee exists and user has access
  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  // Check authorization
  if (req.userType !== 'ADMIN' && req.user.id !== employee.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const where = { employeeId: parseInt(id) };
  // Only filter by status if it's a valid deal status (not payment status)
  if (status && ['NEGOTIATION', 'APPROVED', 'PAID', 'SETTLED', 'CANCELLED'].includes(status)) {
    where.status = status;
  }

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
        offer: {
          select: {
            id: true,
            title: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            receiptUrl: true,
            verifiedAt: true,
            verifiedBy: true,
            notes: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
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
 * @desc    Get Employee Dashboard Stats
 * @route   GET /api/employees/:id/dashboard
 * @access  Private (Admin/Employee)
 */
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) }
  });

  if (!employee) {
    return errorResponse(res, 'Employee not found', 404);
  }

  // Check authorization
  if (req.userType !== 'ADMIN' && req.user.id !== employee.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const [
    traderCount,
    activeDealsCount,
    totalDealsCount,
    totalCommission,
    recentDeals
  ] = await Promise.all([
    prisma.trader.count({ where: { employeeId: parseInt(id), isActive: true } }),
    prisma.deal.count({ where: { employeeId: parseInt(id), status: { in: ['NEGOTIATION', 'APPROVED', 'PAID'] } } }),
    prisma.deal.count({ where: { employeeId: parseInt(id) } }),
    prisma.financialTransaction.aggregate({
      where: {
        employeeId: parseInt(id),
        type: 'EMPLOYEE_COMMISSION',
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    }),
    prisma.deal.findMany({
      where: { employeeId: parseInt(id) },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        trader: {
          select: {
            name: true,
            companyName: true
          }
        },
        client: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  successResponse(res, {
    employee: {
      id: employee.id,
      name: employee.name,
      employeeCode: employee.employeeCode,
      commissionRate: employee.commissionRate
    },
    stats: {
      traderCount: traderCount || 0,
      activeDealsCount: activeDealsCount || 0,
      totalDealsCount: totalDealsCount || 0,
      totalCommission: totalCommission._sum?.amount ? parseFloat(totalCommission._sum.amount) : 0
    },
    recentDeals
  }, 'Dashboard data retrieved successfully');
});

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  getEmployeeTraders,
  getEmployeeDeals,
  getEmployeeDashboard
};

