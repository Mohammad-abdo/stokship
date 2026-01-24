const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

const prisma = new PrismaClient();

/**
 * @desc    Create offer support ticket (Trader)
 * @route   POST /api/mediation/traders/offers/:offerId/support-tickets
 * @access  Private (Trader)
 */
const createTicket = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const { offerId } = req.params;
  const { subject, message, priority } = req.body;

  if (!subject || !message) {
    return errorResponse(res, 'Subject and message are required', 400);
  }

  // Check if offer exists and belongs to trader
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { trader: true }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  if (offer.traderId !== traderId) {
    return errorResponse(res, 'Not authorized to create ticket for this offer', 403);
  }

  // Get the employee assigned to this trader
  const trader = await prisma.trader.findUnique({
    where: { id: traderId },
    select: { employeeId: true }
  });

  // Create ticket with first message
  const ticket = await prisma.offerSupportTicket.create({
    data: {
      offerId,
      traderId,
      employeeId: trader?.employeeId || null, // Auto-assign to trader's employee if exists
      subject,
      status: 'OPEN',
      priority: priority || 'MEDIUM',
      messages: {
        create: {
          senderId: traderId,
          senderType: 'TRADER',
          message
        }
      }
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return successResponse(res, ticket, 'Support ticket created successfully', 201);
});

/**
 * @desc    Get trader's offer support tickets
 * @route   GET /api/mediation/traders/offers/:offerId/support-tickets
 * @route   GET /api/mediation/traders/support-tickets
 * @access  Private (Trader)
 */
const getTraderTickets = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const { offerId } = req.query;
  const { page = 1, limit = 20, status, priority } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let where = { traderId };

  if (offerId) {
    where.offerId = offerId;
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  const [tickets, total] = await Promise.all([
    prisma.offerSupportTicket.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offerSupportTicket.count({ where })
  ]);

  return paginatedResponse(res, tickets, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Tickets retrieved successfully');
});

/**
 * @desc    Get offer support ticket by ID (Trader)
 * @route   GET /api/mediation/traders/support-tickets/:id
 * @access  Private (Trader)
 */
const getTraderTicketById = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const { id } = req.params;

  const ticket = await prisma.offerSupportTicket.findFirst({
    where: {
      id,
      traderId
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true,
          description: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          phone: true
        }
      },
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  return successResponse(res, ticket, 'Ticket retrieved successfully');
});

/**
 * @desc    Add message to ticket (Trader)
 * @route   POST /api/mediation/traders/support-tickets/:id/messages
 * @access  Private (Trader)
 */
const addTraderMessage = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const { id } = req.params;
  const { message, attachments } = req.body;

  if (!message || !message.trim()) {
    return errorResponse(res, 'Message is required', 400);
  }

  const ticket = await prisma.offerSupportTicket.findFirst({
    where: {
      id,
      traderId
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  if (ticket.status === 'CLOSED') {
    return errorResponse(res, 'Cannot add message to closed ticket', 400);
  }

  // Create message
  const ticketMessage = await prisma.offerSupportTicketMessage.create({
    data: {
      ticketId: id,
      senderId: traderId,
      senderType: 'TRADER',
      message: message.trim(),
      attachments: attachments ? JSON.stringify(attachments) : null
    }
  });

  // Update ticket status if it was resolved
  if (ticket.status === 'RESOLVED') {
    await prisma.offerSupportTicket.update({
      where: { id },
      data: { status: 'OPEN' }
    });
  }

  // Update ticket updatedAt
  await prisma.offerSupportTicket.update({
    where: { id },
    data: { updatedAt: new Date() }
  });

  return successResponse(res, ticketMessage, 'Message added successfully', 201);
});

/**
 * @desc    Create offer support ticket (Employee)
 * @route   POST /api/mediation/employees/offers/:offerId/support-tickets
 * @access  Private (Employee)
 */
const createEmployeeTicket = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { offerId } = req.params;
  const { subject, message, priority } = req.body;

  if (!subject || !message) {
    return errorResponse(res, 'Subject and message are required', 400);
  }

  // Check if offer exists and belongs to a trader assigned to this employee
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { 
      trader: {
        select: {
          id: true,
          employeeId: true
        }
      }
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  // Check if trader is assigned to this employee
  if (offer.trader.employeeId !== employeeId) {
    return errorResponse(res, 'Not authorized to create ticket for this offer', 403);
  }

  // Create ticket with first message
  const ticket = await prisma.offerSupportTicket.create({
    data: {
      offerId,
      traderId: offer.trader.id,
      employeeId, // Assign to current employee
      subject,
      status: 'OPEN',
      priority: priority || 'MEDIUM',
      messages: {
        create: {
          senderId: employeeId,
          senderType: 'EMPLOYEE',
          message
        }
      }
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return successResponse(res, ticket, 'Support ticket created successfully', 201);
});

/**
 * @desc    Get all offer support tickets (Employee/Admin)
 * @route   GET /api/mediation/admin/offer-support-tickets
 * @access  Private (Admin, Employee)
 */
const getAllTickets = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userType = req.userType || req.user?.role || 'ADMIN';
  const { page = 1, limit = 20, status, priority, offerId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!userId) {
    return errorResponse(res, 'User not authenticated', 401);
  }

  let where = {};

  // Employee can only see tickets for offers from their assigned traders
  if (userType === 'EMPLOYEE') {
    // Get all traders assigned to this employee
    const traders = await prisma.trader.findMany({
      where: { employeeId: userId },
      select: { id: true }
    });

    if (traders.length === 0) {
      return paginatedResponse(res, [], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }, 'Tickets retrieved successfully');
    }

    const traderIds = traders.map(t => t.id);
    where.traderId = { in: traderIds };
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (offerId) {
    where.offerId = offerId;
  }

  const [tickets, total] = await Promise.all([
    prisma.offerSupportTicket.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true,
            traderCode: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offerSupportTicket.count({ where })
  ]);

  return paginatedResponse(res, tickets, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Tickets retrieved successfully');
});

/**
 * @desc    Get offer support ticket by ID (Employee/Admin)
 * @route   GET /api/mediation/admin/offer-support-tickets/:id
 * @access  Private (Admin, Employee)
 */
const getTicketById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.userType;
  const { id } = req.params;

  let ticket = await prisma.offerSupportTicket.findUnique({
    where: { id },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true,
          description: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true,
          email: true,
          phone: true,
          employeeId: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          phone: true
        }
      },
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (ticket.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to view this ticket', 403);
    }
  }

  return successResponse(res, ticket, 'Ticket retrieved successfully');
});

/**
 * @desc    Add message to ticket (Employee/Admin)
 * @route   POST /api/mediation/admin/offer-support-tickets/:id/messages
 * @access  Private (Admin, Employee)
 */
const addMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.userType;
  const { id } = req.params;
  const { message, attachments } = req.body;

  if (!message || !message.trim()) {
    return errorResponse(res, 'Message is required', 400);
  }

  let ticket = await prisma.offerSupportTicket.findUnique({
    where: { id },
    include: {
      trader: {
        select: {
          id: true,
          employeeId: true
        }
      }
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (ticket.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to add message to this ticket', 403);
    }
  }

  if (ticket.status === 'CLOSED') {
    return errorResponse(res, 'Cannot add message to closed ticket', 400);
  }

  // Auto-assign ticket to employee if not assigned
  if (userType === 'EMPLOYEE' && !ticket.employeeId) {
    await prisma.offerSupportTicket.update({
      where: { id },
      data: { employeeId: userId }
    });
  }

  // Create message
  const ticketMessage = await prisma.offerSupportTicketMessage.create({
    data: {
      ticketId: id,
      senderId: userId,
      senderType: userType === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
      message: message.trim(),
      attachments: attachments ? JSON.stringify(attachments) : null
    }
  });

  // Update ticket status if it was resolved
  if (ticket.status === 'RESOLVED') {
    await prisma.offerSupportTicket.update({
      where: { id },
      data: { status: 'OPEN' }
    });
  }

  // Update ticket updatedAt
  await prisma.offerSupportTicket.update({
    where: { id },
    data: { updatedAt: new Date() }
  });

  return successResponse(res, ticketMessage, 'Message added successfully', 201);
});

/**
 * @desc    Update ticket status (Employee/Admin)
 * @route   PUT /api/mediation/admin/offer-support-tickets/:id/status
 * @access  Private (Admin, Employee)
 */
const updateTicketStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.userType;
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
    return errorResponse(res, 'Invalid status', 400);
  }

  let ticket = await prisma.offerSupportTicket.findUnique({
    where: { id },
    include: {
      trader: {
        select: {
          id: true,
          employeeId: true
        }
      }
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (ticket.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to update this ticket', 403);
    }
  }

  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (status === 'RESOLVED' && !ticket.resolvedAt) {
    updateData.resolvedAt = new Date();
  }

  if (status === 'CLOSED' && !ticket.closedAt) {
    updateData.closedAt = new Date();
  }

  // Auto-assign ticket to employee if not assigned
  if (userType === 'EMPLOYEE' && !ticket.employeeId) {
    updateData.employeeId = userId;
  }

  const updatedTicket = await prisma.offerSupportTicket.update({
    where: { id },
    data: updateData,
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return successResponse(res, updatedTicket, 'Ticket status updated successfully');
});

/**
 * @desc    Assign ticket to employee (Admin/Employee)
 * @route   PUT /api/mediation/admin/offer-support-tickets/:id/assign
 * @access  Private (Admin, Employee)
 */
const assignTicket = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.userType;
  const { id } = req.params;
  const { employeeId } = req.body;

  let ticket = await prisma.offerSupportTicket.findUnique({
    where: { id },
    include: {
      trader: {
        select: {
          id: true,
          employeeId: true
        }
      }
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (ticket.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to assign this ticket', 403);
    }
    // Employee can only assign to themselves
    if (employeeId && employeeId !== userId) {
      return errorResponse(res, 'You can only assign tickets to yourself', 403);
    }
  }

  // Verify employee exists if provided
  if (employeeId) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }
  }

  const updatedTicket = await prisma.offerSupportTicket.update({
    where: { id },
    data: {
      employeeId: employeeId || userId,
      status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
      updatedAt: new Date()
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return successResponse(res, updatedTicket, 'Ticket assigned successfully');
});

module.exports = {
  createTicket,
  createEmployeeTicket,
  getTraderTickets,
  getTraderTicketById,
  addTraderMessage,
  getAllTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
  assignTicket
};
