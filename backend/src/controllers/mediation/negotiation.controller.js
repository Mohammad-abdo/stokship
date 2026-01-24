const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { notifyNegotiationMessage } = require('../../utils/notificationHelper');

/**
 * @desc    Send negotiation message
 * @route   POST /api/deals/:dealId/negotiations
 * @access  Private (Client/Trader)
 */
const sendNegotiationMessage = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const { message, content, messageType, proposedPrice, proposedQuantity } = req.body;

  // Support both 'message' and 'content' for backward compatibility
  const messageContent = message || content;

  if (!messageContent && !proposedPrice && !proposedQuantity) {
    return errorResponse(res, 'Please provide message, price, or quantity', 400);
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId, // Deal.id is String (UUID), not Int
      OR: [
        { clientId: req.user.id },
        { traderId: req.user.id },
        { employeeId: req.user.id } // Allow employee to send messages
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
  const isEmployee = req.user.id === deal.employeeId;
  const senderId = isClient ? deal.clientId : (isEmployee ? deal.employeeId : deal.traderId);
  const senderType = isClient ? 'CLIENT' : (isEmployee ? 'EMPLOYEE' : 'TRADER');

  // Create negotiation message
  const negotiation = await prisma.dealNegotiation.create({
    data: {
      dealId: deal.id,
      traderId: deal.traderId,
      clientId: deal.clientId,
      senderId: senderId, // ID of the user who sent the message
      senderType: senderType, // 'CLIENT' or 'TRADER'
      messageType: messageType || 'TEXT',
      message: messageContent || null,
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
  const activityLogData = {
    userType: senderType,
    action: 'NEGOTIATION_MESSAGE',
    entityType: 'DEAL',
    dealId: deal.id,
    description: `${senderType} sent negotiation message`,
    metadata: JSON.stringify({
      messageType: negotiation.messageType,
      hasPrice: !!proposedPrice,
      hasQuantity: !!proposedQuantity
    }),
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Set the appropriate user ID field based on senderType
  if (senderType === 'CLIENT') {
    activityLogData.clientId = req.user.id;
  } else if (senderType === 'TRADER') {
    activityLogData.traderId = req.user.id;
  } else if (senderType === 'EMPLOYEE') {
    activityLogData.employeeId = req.user.id;
  }
  
  await prisma.activityLog.create({ data: activityLogData });

  // Notify recipient and employee
  await notifyNegotiationMessage(deal, req.user.id, senderType);

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
      id: dealId, // Deal.id is String (UUID), not Int
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
      where: { dealId: dealId }, // Deal.id is String (UUID), not Int
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
      where: { dealId: dealId } // Deal.id is String (UUID), not Int
    })
  ]);

  // Mark messages as read for current user
  if (req.userType === 'CLIENT' || req.userType === 'TRADER') {
    await prisma.dealNegotiation.updateMany({
      where: {
        dealId: dealId, // Deal.id is String (UUID), not Int
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

  // Transform messages to include content for frontend compatibility
  const transformedMessages = messages.reverse().map(msg => ({
    ...msg,
    content: msg.message || '' // Add content field for frontend compatibility (use message field)
  }));

  paginatedResponse(res, transformedMessages, { // Reverse to show oldest first
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
      id: dealId, // Deal.id is String (UUID), not Int
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
    dealId: dealId, // Deal.id is String (UUID), not Int
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



