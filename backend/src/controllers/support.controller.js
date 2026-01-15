const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get support tickets
// @route   GET /api/support/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { userId: req.user.id };
  if (status) where.status = status;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.supportTicket.count({ where })
  ]);

  paginatedResponse(res, tickets, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Tickets retrieved successfully');
});

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, priority } = req.body;

  if (!subject || !message) {
    return errorResponse(res, 'Please provide subject and message', 400);
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.id,
      subject,
      status: 'OPEN',
      priority: priority || 'MEDIUM',
      messages: {
        create: {
          userId: req.user.id,
          message,
          isAdmin: false
        }
      }
    },
    include: {
      messages: true
    }
  });

  successResponse(res, ticket, 'Ticket created successfully', 201);
});

// @desc    Get ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    },
    include: {
      messages: {
        include: {
          user: {
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

// @desc    Add message to ticket
// @route   POST /api/support/tickets/:id/messages
// @access  Private
const addMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return errorResponse(res, 'Please provide message', 400);
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    }
  });

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  const ticketMessage = await prisma.supportTicketMessage.create({
    data: {
      ticketId: parseInt(id),
      userId: req.user.id,
      message,
      isAdmin: false
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
  getTickets,
  createTicket,
  getTicketById,
  addMessage
};



