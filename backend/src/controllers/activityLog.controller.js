const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get activity logs (admin)
// @route   GET /api/audit/logs
// @access  Private (Admin)
const getActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    userId,
    userType,
    action,
    entityType,
    entityId,
    startDate,
    endDate
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (userId) where.userId = parseInt(userId);
  if (userType) where.userType = userType;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = parseInt(entityId);
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      // Note: ActivityLog has polymorphic relations, no direct user relation
      orderBy: { createdAt: 'desc' }
    }),
    prisma.activityLog.count({ where })
  ]);

  paginatedResponse(res, logs, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Activity logs retrieved successfully');
});

// @desc    Get specific log entry
// @route   GET /api/audit/logs/:id
// @access  Private (Admin)
const getLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await prisma.activityLog.findUnique({
    where: { id: parseInt(id) }
    // Note: ActivityLog has polymorphic relations, no direct user relation
  });

  if (!log) {
    return errorResponse(res, 'Log entry not found', 404);
  }

  successResponse(res, log, 'Log entry retrieved successfully');
});

// @desc    Get user activity logs
// @route   GET /api/audit/user/:userId
// @access  Private (Admin)
const getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: parseInt(userId) },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.activityLog.count({ where: { userId: parseInt(userId) } })
  ]);

  paginatedResponse(res, logs, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'User activity logs retrieved successfully');
});

// @desc    Get entity change history
// @route   GET /api/audit/entity/:type/:id
// @access  Private (Admin)
const getEntityHistory = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  const logs = await prisma.activityLog.findMany({
    where: {
      entityType: type,
      entityId: parseInt(id)
    },
    // Note: ActivityLog has polymorphic relations, no direct user relation
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, logs, 'Entity history retrieved successfully');
});

// @desc    Export audit logs (admin)
// @route   GET /api/audit/export
// @access  Private (Admin)
const exportAuditLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const logs = await prisma.activityLog.findMany({
    where,
    // Note: ActivityLog has polymorphic relations, no direct user relation
    orderBy: { createdAt: 'desc' }
  });

  if (format === 'csv') {
    const csv = logs.map(log => {
      const changes = log.changes ? JSON.parse(log.changes) : {};
      return [
        log.id,
        log.userId || '',
        log.userType,
        log.action,
        log.entityType || '',
        log.entityId || '',
        log.description || '',
        JSON.stringify(changes),
        log.ipAddress || '',
        log.createdAt
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    return res.send(`ID,User ID,User Type,Action,Entity Type,Entity ID,Description,Changes,IP Address,Created At\n${csv}`);
  }

  successResponse(res, logs, 'Audit logs exported successfully');
});

// @desc    Get security audit logs (admin)
// @route   GET /api/audit/security
// @access  Private (Admin)
const getSecurityAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, startDate, endDate } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    OR: [
      { action: { contains: 'login', mode: 'insensitive' } },
      { action: { contains: 'password', mode: 'insensitive' } },
      { action: { contains: 'permission', mode: 'insensitive' } },
      { action: { contains: 'security', mode: 'insensitive' } }
    ]
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditTrail.findMany({
      where,
      skip,
      take: parseInt(limit),
      // Note: AuditTrail has polymorphic relations, no direct user relation
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditTrail.count({ where })
  ]);

  paginatedResponse(res, logs, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Security audit logs retrieved successfully');
});

module.exports = {
  getActivityLogs,
  getLogById,
  getUserActivityLogs,
  getEntityHistory,
  exportAuditLogs,
  getSecurityAuditLogs
};



