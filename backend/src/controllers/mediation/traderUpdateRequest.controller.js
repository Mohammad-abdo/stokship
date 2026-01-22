const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/response');

const prisma = new PrismaClient();

/**
 * @desc    Create update request (Trader)
 * @route   POST /api/mediation/traders/update-request
 * @access  Private (Trader)
 */
const createUpdateRequest = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const {
    name,
    phone,
    country,
    city,
    companyName,
    companyAddress,
    bankAccountName,
    bankAccountNumber,
    bankName,
    bankAddress,
    bankCode,
    swiftCode
  } = req.body;

  // Check if trader exists
  const trader = await prisma.trader.findUnique({
    where: { id: traderId }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  // Check if there's a pending request
  const pendingRequest = await prisma.traderUpdateRequest.findFirst({
    where: {
      traderId,
      status: 'PENDING'
    }
  });

  if (pendingRequest) {
    return errorResponse(res, 'You already have a pending update request. Please wait for review.', 400);
  }

  // Prepare requested data
  const requestedData = {};
  if (name !== undefined) requestedData.name = name;
  if (phone !== undefined) requestedData.phone = phone;
  if (country !== undefined) requestedData.country = country;
  if (city !== undefined) requestedData.city = city;
  if (companyName !== undefined) requestedData.companyName = companyName;
  if (companyAddress !== undefined) requestedData.companyAddress = companyAddress;
  if (bankAccountName !== undefined) requestedData.bankAccountName = bankAccountName;
  if (bankAccountNumber !== undefined) requestedData.bankAccountNumber = bankAccountNumber;
  if (bankName !== undefined) requestedData.bankName = bankName;
  if (bankAddress !== undefined) requestedData.bankAddress = bankAddress;
  if (bankCode !== undefined) requestedData.bankCode = bankCode;
  if (swiftCode !== undefined) requestedData.swiftCode = swiftCode;

  if (Object.keys(requestedData).length === 0) {
    return errorResponse(res, 'No changes provided', 400);
  }

  // Create update request
  const updateRequest = await prisma.traderUpdateRequest.create({
    data: {
      traderId,
      requestedData,
      status: 'PENDING'
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      }
    }
  });

  return successResponse(res, updateRequest, 'Update request created successfully', 201);
});

/**
 * @desc    Get trader's update requests
 * @route   GET /api/mediation/traders/update-requests
 * @access  Private (Trader)
 */
const getTraderUpdateRequests = asyncHandler(async (req, res) => {
  const traderId = req.user.id;

  const requests = await prisma.traderUpdateRequest.findMany({
    where: { traderId },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return successResponse(res, requests);
});

/**
 * @desc    Get all update requests (Admin/Employee)
 * @route   GET /api/mediation/admin/trader-update-requests
 * @access  Private (Admin, Employee)
 */
const getAllUpdateRequests = asyncHandler(async (req, res) => {
  const { status, traderId } = req.query;
  const userId = req.user.id;
  const userType = req.userType;

  let where = {};

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by trader ID
  if (traderId) {
    where.traderId = traderId;
  }

  // Employee can only see requests for their assigned traders
  if (userType === 'EMPLOYEE') {
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      include: {
        traders: {
          select: { id: true }
        }
      }
    });

    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const traderIds = employee.traders.map(t => t.id);
    if (traderIds.length === 0) {
      return successResponse(res, []);
    }

    where.traderId = { in: traderIds };
  }

  const requests = await prisma.traderUpdateRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true,
          email: true,
          phone: true,
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true
            }
          }
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return successResponse(res, requests);
});

/**
 * @desc    Get update request by ID
 * @route   GET /api/mediation/admin/trader-update-requests/:id
 * @access  Private (Admin, Employee)
 */
const getUpdateRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.userType;

  const request = await prisma.traderUpdateRequest.findUnique({
    where: { id },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true,
          email: true,
          phone: true,
          country: true,
          city: true,
          companyAddress: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankName: true,
          bankAddress: true,
          bankCode: true,
          swiftCode: true,
          employeeId: true,
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true
            }
          }
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  if (!request) {
    return errorResponse(res, 'Update request not found', 404);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (request.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to view this request', 403);
    }
  }

  return successResponse(res, request);
});

/**
 * @desc    Approve update request
 * @route   PUT /api/mediation/admin/trader-update-requests/:id/approve
 * @access  Private (Admin, Employee)
 */
const approveUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  const userId = req.user.id;
  const userType = req.userType;

  const request = await prisma.traderUpdateRequest.findUnique({
    where: { id },
    include: {
      trader: true
    }
  });

  if (!request) {
    return errorResponse(res, 'Update request not found', 404);
  }

  if (request.status !== 'PENDING') {
    return errorResponse(res, `Request is already ${request.status.toLowerCase()}`, 400);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (request.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to approve this request', 403);
    }
  }

  // Update trader data
  const requestedData = request.requestedData;
  const updateData = {};

  if (requestedData.name !== undefined) updateData.name = requestedData.name;
  if (requestedData.phone !== undefined) updateData.phone = requestedData.phone;
  if (requestedData.country !== undefined) updateData.country = requestedData.country;
  if (requestedData.city !== undefined) updateData.city = requestedData.city;
  if (requestedData.companyName !== undefined) updateData.companyName = requestedData.companyName;
  if (requestedData.companyAddress !== undefined) updateData.companyAddress = requestedData.companyAddress;
  if (requestedData.bankAccountName !== undefined) updateData.bankAccountName = requestedData.bankAccountName;
  if (requestedData.bankAccountNumber !== undefined) updateData.bankAccountNumber = requestedData.bankAccountNumber;
  if (requestedData.bankName !== undefined) updateData.bankName = requestedData.bankName;
  if (requestedData.bankAddress !== undefined) updateData.bankAddress = requestedData.bankAddress;
  if (requestedData.bankCode !== undefined) updateData.bankCode = requestedData.bankCode;
  if (requestedData.swiftCode !== undefined) updateData.swiftCode = requestedData.swiftCode;

  // Update trader
  await prisma.trader.update({
    where: { id: request.traderId },
    data: updateData
  });

  // Update request status
  // Save reviewer ID (Employee ID or Admin ID)
  const reviewerId = (userType === 'EMPLOYEE' || userType === 'ADMIN') ? userId : null;
  const updatedRequest = await prisma.traderUpdateRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedByType: userType,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return successResponse(res, updatedRequest, 'Update request approved successfully');
});

/**
 * @desc    Reject update request
 * @route   PUT /api/mediation/admin/trader-update-requests/:id/reject
 * @access  Private (Admin, Employee)
 */
const rejectUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  const userId = req.user.id;
  const userType = req.userType;

  const request = await prisma.traderUpdateRequest.findUnique({
    where: { id },
    include: {
      trader: true
    }
  });

  if (!request) {
    return errorResponse(res, 'Update request not found', 404);
  }

  if (request.status !== 'PENDING') {
    return errorResponse(res, `Request is already ${request.status.toLowerCase()}`, 400);
  }

  // Check authorization for Employee
  if (userType === 'EMPLOYEE') {
    if (request.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to reject this request', 403);
    }
  }

  if (!reviewNotes) {
    return errorResponse(res, 'Review notes are required when rejecting a request', 400);
  }

  // Update request status
  // Save reviewer ID (Employee ID or Admin ID)
  const reviewerId = (userType === 'EMPLOYEE' || userType === 'ADMIN') ? userId : null;
  const updatedRequest = await prisma.traderUpdateRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedByType: userType,
      reviewedAt: new Date(),
      reviewNotes
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return successResponse(res, updatedRequest, 'Update request rejected');
});

/**
 * @desc    Cancel update request (Trader)
 * @route   PUT /api/mediation/traders/update-requests/:id/cancel
 * @access  Private (Trader)
 */
const cancelUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const traderId = req.user.id;

  const request = await prisma.traderUpdateRequest.findUnique({
    where: { id }
  });

  if (!request) {
    return errorResponse(res, 'Update request not found', 404);
  }

  if (request.traderId !== traderId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (request.status !== 'PENDING') {
    return errorResponse(res, 'Only pending requests can be cancelled', 400);
  }

  const updatedRequest = await prisma.traderUpdateRequest.update({
    where: { id },
    data: {
      status: 'CANCELLED'
    }
  });

  return successResponse(res, updatedRequest, 'Update request cancelled');
});

module.exports = {
  createUpdateRequest,
  getTraderUpdateRequests,
  getAllUpdateRequests,
  getUpdateRequestById,
  approveUpdateRequest,
  rejectUpdateRequest,
  cancelUpdateRequest
};

