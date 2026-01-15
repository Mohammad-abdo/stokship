const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get real-time notifications (SSE)
// @route   GET /api/realtime/notifications
// @access  Private
const getRealtimeNotifications = asyncHandler(async (req, res) => {
  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = req.user.id;
  const userType = req.userType;

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notification stream' })}\n\n`);

  // This would typically use Redis pub/sub or similar for real-time updates
  // For now, just keep connection open
  req.on('close', () => {
    // Clean up when client disconnects
  });
});

// @desc    Get real-time order updates (SSE)
// @route   GET /api/realtime/orders/:id
// @access  Private
const getRealtimeOrderUpdates = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify order access
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(id),
      OR: [
        { userId: req.user.id },
        { vendorId: req.user.id }
      ]
    }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial order data
  res.write(`data: ${JSON.stringify({ type: 'order', data: order })}\n\n`);

  // This would subscribe to order updates via Redis pub/sub
  req.on('close', () => {
    // Clean up when client disconnects
  });
});

// WebSocket connection handler (would be in a separate WebSocket server file)
// This is just a placeholder controller
const handleWebSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user room
    socket.on('join', (data) => {
      if (data.userId) {
        socket.join(`user:${data.userId}`);
      }
      if (data.vendorId) {
        socket.join(`vendor:${data.vendorId}`);
      }
      if (data.adminId) {
        socket.join('admin');
      }
    });

    // Handle order updates
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = {
  getRealtimeNotifications,
  getRealtimeOrderUpdates,
  handleWebSocketConnection
};



