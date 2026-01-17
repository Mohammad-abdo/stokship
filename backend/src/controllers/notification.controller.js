const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { 
    userId: req.user.id,
    userType: req.userType // Add userType filter
  };
  if (unread === 'true') {
    where.isRead = false;
  }
  if (type) {
    where.type = type;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where })
  ]);

  paginatedResponse(res, notifications, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Notifications retrieved successfully');
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id,
      userType: req.userType // Add userType check
    }
  });

  if (!notification) {
    return errorResponse(res, 'Notification not found', 404);
  }

  const updated = await prisma.notification.update({
    where: { id: parseInt(id) },
    data: { isRead: true }
  });

  successResponse(res, updated, 'Notification marked as read');
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      userType: req.userType, // Add userType filter
      isRead: false
    },
    data: { isRead: true, readAt: new Date() }
  });

  successResponse(res, null, 'All notifications marked as read');
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user.id,
      userType: req.userType, // Add userType filter
      isRead: false
    }
  });

  successResponse(res, { count }, 'Unread count retrieved successfully');
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id,
      userType: req.userType
    }
  });

  if (!notification) {
    return errorResponse(res, 'Notification not found', 404);
  }

  await prisma.notification.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Notification deleted successfully');
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const count = await prisma.notification.deleteMany({
    where: {
      userId: req.user.id,
      userType: req.userType
    }
  });

  successResponse(res, { deletedCount: count }, 'All notifications deleted successfully');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications
};



