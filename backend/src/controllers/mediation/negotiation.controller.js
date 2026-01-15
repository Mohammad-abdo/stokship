const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

/**
 * @desc    Send negotiation message
 * @route   POST /api/deals/:dealId/negotiations
 * @access  Private (Client/Trader)
 */
const sendNegotiationMessage = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const { message, messageType, proposedPrice, proposedQuantity } = req.body;

  if (!message && !proposedPrice && !proposedQuantity) {
    return errorResponse(res, 'Please provide message, price, or quantity', 400);
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(dealId),
      OR: [
        { clientId: req.user.id },
        { traderId: req.user.id }
      ],
      status: { in: ['NEGOTIATION', 'APPROVED'] } // Can negotiate even after approval
    },
    include: {
      trader: true,
      client: true,
      employee: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot send message', 404);
  }

  // Determine sender
  const isClient = req.user.id === deal.clientId;
  const senderId = isClient ? deal.clientId : deal.traderId;
  const senderType = isClient ? 'CLIENT' : 'TRADER';

  // Create negotiation message
  const negotiation = await prisma.dealNegotiation.create({
    data: {
      dealId: deal.id,
      traderId: deal.traderId,
      clientId: deal.clientId,
      messageType: messageType || 'TEXT',
      message: message || null,
      proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
      proposedQuantity: proposedQuantity ? parseInt(proposedQuantity) : null,
      isRead: false
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true
        }
      },
      client: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Mark as read for sender (they just sent it)
  await prisma.dealNegotiation.update({
    where: { id: negotiation.id },
    data: { isRead: true, readAt: new Date() }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: senderType,
      action: 'NEGOTIATION_MESSAGE',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `${senderType} sent negotiation message`,
      metadata: JSON.stringify({
        messageType: negotiation.messageType,
        hasPrice: !!proposedPrice,
        hasQuantity: !!proposedQuantity
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify recipient and employee
  const recipientId = isClient ? deal.traderId : deal.clientId;
  const recipientType = isClient ? 'TRADER' : 'CLIENT';

  await Promise.all([
    // Notify recipient
    prisma.notification.create({
      data: {
        userId: recipientId,
        userType: recipientType,
        type: 'NEGOTIATION',
        title: 'New Negotiation Message',
        message: `You have a new message in deal ${deal.dealNumber}`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      }
    }),
    // Notify employee (guarantor)
    prisma.notification.create({
      data: {
        userId: deal.employeeId,
        userType: 'EMPLOYEE',
        type: 'NEGOTIATION',
        title: 'New Negotiation Message',
        message: `New message in deal ${deal.dealNumber} between trader and client`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      }
    })
  ]);

  successResponse(res, negotiation, 'Message sent successfully', 201);
});

/**
 * @desc    Get negotiation messages
 * @route   GET /api/deals/:dealId/negotiations
 * @access  Private (Client/Trader/Employee)
 */
const getNegotiationMessages = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(dealId),
      OR: [
        { clientId: req.user.id },
        { traderId: req.user.id },
        { employeeId: req.user.id }
      ]
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or not authorized', 404);
  }

  const [messages, total] = await Promise.all([
    prisma.dealNegotiation.findMany({
      where: { dealId: parseInt(dealId) },
      skip,
      take: parseInt(limit),
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.dealNegotiation.count({
      where: { dealId: parseInt(dealId) }
    })
  ]);

  // Mark messages as read for current user
  if (req.userType === 'CLIENT' || req.userType === 'TRADER') {
    await prisma.dealNegotiation.updateMany({
      where: {
        dealId: parseInt(dealId),
        isRead: false,
        ...(req.userType === 'CLIENT' 
          ? { clientId: req.user.id }
          : { traderId: req.user.id }
        )
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  paginatedResponse(res, messages.reverse(), { // Reverse to show oldest first
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Negotiation messages retrieved successfully');
});

/**
 * @desc    Mark messages as read
 * @route   PUT /api/deals/:dealId/negotiations/read
 * @access  Private (Client/Trader)
 */
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { dealId } = req.params;

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(dealId),
      OR: [
        { clientId: req.user.id },
        { traderId: req.user.id }
      ]
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or not authorized', 404);
  }

  const where = {
    dealId: parseInt(dealId),
    isRead: false
  };

  if (req.userType === 'CLIENT') {
    where.clientId = req.user.id;
  } else if (req.userType === 'TRADER') {
    where.traderId = req.user.id;
  }

  const updated = await prisma.dealNegotiation.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  successResponse(res, { count: updated.count }, 'Messages marked as read');
});

module.exports = {
  sendNegotiationMessage,
  getNegotiationMessages,
  markMessagesAsRead
};



