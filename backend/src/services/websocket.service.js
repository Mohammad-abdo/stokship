const { Server } = require('socket.io');
const { logger } = require('../utils/logger');

let io = null;

// Initialize WebSocket server
const initWebSocket = (server) => {
  if (process.env.WEBSOCKET_ENABLED === 'true') {
    io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      path: '/socket.io'
    });

    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join user room
      socket.on('join', (data) => {
        if (data.userId) {
          socket.join(`user:${data.userId}`);
          logger.info(`User ${data.userId} joined room`);
        }
        if (data.vendorId) {
          socket.join(`vendor:${data.vendorId}`);
          logger.info(`Vendor ${data.vendorId} joined room`);
        }
        if (data.adminId) {
          socket.join('admin');
          logger.info('Admin joined room');
        }
      });

      // Handle order updates
      socket.on('order:subscribe', (orderId) => {
        socket.join(`order:${orderId}`);
        logger.info(`Socket ${socket.id} subscribed to order ${orderId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    logger.info('WebSocket server initialized');
    return io;
  }
  return null;
};

// Emit to user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to vendor
const emitToVendor = (vendorId, event, data) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit(event, data);
  }
};

// Emit to admin
const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

// Emit to order room
const emitToOrder = (orderId, event, data) => {
  if (io) {
    io.to(`order:${orderId}`).emit(event, data);
  }
};

// Emit to all
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initWebSocket,
  emitToUser,
  emitToVendor,
  emitToAdmin,
  emitToOrder,
  emitToAll,
  getIO: () => io
};



