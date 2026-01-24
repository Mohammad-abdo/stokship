const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/response');

const prisma = new PrismaClient();

/**
 * @desc    Create offer update request (Trader)
 * @route   POST /api/mediation/traders/offers/:offerId/update-request
 * @access  Private (Trader)
 */
const createUpdateRequest = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const { offerId } = req.params;
  const {
    title,
    description,
    images,
    country,
    city,
    categoryId,
    acceptsNegotiation
  } = req.body;

  // Check if offer exists and belongs to trader
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { trader: true }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  if (offer.traderId !== traderId) {
    return errorResponse(res, 'Not authorized to update this offer', 403);
  }

  // Only allow edit requests for ACTIVE offers
  if (offer.status !== 'ACTIVE') {
    return errorResponse(res, 'Can only request edits for active offers', 400);
  }

  // Check if there's a pending request for this offer
  const pendingRequest = await prisma.offerUpdateRequest.findFirst({
    where: {
      offerId,
      status: 'PENDING'
    }
  });

  if (pendingRequest) {
    return errorResponse(res, 'You already have a pending update request for this offer. Please wait for review.', 400);
  }

  // Prepare requested data
  const requestedData = {};
  if (title !== undefined) requestedData.title = title;
  if (description !== undefined) requestedData.description = description;
  if (images !== undefined) {
    requestedData.images = Array.isArray(images) ? images : images;
  }
  if (country !== undefined) requestedData.country = country;
  if (city !== undefined) requestedData.city = city;
  if (categoryId !== undefined) requestedData.categoryId = categoryId;
  if (acceptsNegotiation !== undefined) requestedData.acceptsNegotiation = acceptsNegotiation;

  if (Object.keys(requestedData).length === 0) {
    return errorResponse(res, 'No changes provided', 400);
  }

  // Create update request
  const updateRequest = await prisma.offerUpdateRequest.create({
    data: {
      offerId,
      requestedData,
      status: 'PENDING'
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true,
          trader: {
            select: {
              id: true,
              name: true,
              companyName: true,
              traderCode: true
            }
          }
        }
      }
    }
  });

  return successResponse(res, updateRequest, 'Update request created successfully', 201);
});

/**
 * @desc    Get trader's offer update requests
 * @route   GET /api/mediation/traders/offers/update-requests
 * @access  Private (Trader)
 */
const getTraderOfferUpdateRequests = asyncHandler(async (req, res) => {
  const traderId = req.user.id;
  const { offerId } = req.query;

  let where = {};
  
  // Get offers for this trader
  const traderOffers = await prisma.offer.findMany({
    where: { traderId },
    select: { id: true }
  });
  
  const offerIds = traderOffers.map(o => o.id);
  
  if (offerIds.length === 0) {
    return successResponse(res, []);
  }

  where.offerId = { in: offerIds };
  
  if (offerId) {
    where.offerId = offerId;
  }

  const requests = await prisma.offerUpdateRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true
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
 * @desc    Get all offer update requests (Admin/Employee)
 * @route   GET /api/mediation/admin/offer-update-requests
 * @access  Private (Admin, Employee)
 */
const getAllUpdateRequests = asyncHandler(async (req, res) => {
  const { status, offerId } = req.query;
  const userId = req.user.id;
  const userType = req.userType;

  let where = {};

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by offer ID
  if (offerId) {
    where.offerId = offerId;
  }

  // Employee can only see requests for offers from their assigned traders
  if (userType === 'EMPLOYEE') {
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      include: {
        traders: {
          select: { id: true },
          include: {
            offers: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const offerIds = [];
    employee.traders.forEach(trader => {
      trader.offers.forEach(offer => {
        offerIds.push(offer.id);
      });
    });

    if (offerIds.length === 0) {
      return successResponse(res, []);
    }

    where.offerId = { in: offerIds };
  }

  const requests = await prisma.offerUpdateRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true,
          trader: {
            select: {
              id: true,
              name: true,
              companyName: true,
              traderCode: true,
              employeeId: true,
              employee: {
                select: {
                  id: true,
                  name: true,
                  employeeCode: true
                }
              }
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
 * @desc    Get offer update request by ID
 * @route   GET /api/mediation/admin/offer-update-requests/:id
 * @access  Private (Admin, Employee)
 */
const getUpdateRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.userType;

  const request = await prisma.offerUpdateRequest.findUnique({
    where: { id },
    include: {
      offer: {
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
              employeeId: true,
              employee: {
                select: {
                  id: true,
                  name: true,
                  employeeCode: true
                }
              }
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
    if (request.offer.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to view this request', 403);
    }
  }

  return successResponse(res, request);
});

/**
 * @desc    Approve offer update request
 * @route   PUT /api/mediation/admin/offer-update-requests/:id/approve
 * @access  Private (Admin, Employee)
 */
const approveUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  const userId = req.user.id;
  const userType = req.userType;

  const request = await prisma.offerUpdateRequest.findUnique({
    where: { id },
    include: {
      offer: {
        include: {
          trader: true
        }
      }
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
    if (request.offer.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to approve this request', 403);
    }
  }

  // Update offer data
  const requestedData = request.requestedData;
  const updateData = {};

  if (requestedData.title !== undefined) updateData.title = requestedData.title;
  if (requestedData.description !== undefined) updateData.description = requestedData.description;
  if (requestedData.images !== undefined) {
    updateData.images = Array.isArray(requestedData.images) 
      ? JSON.stringify(requestedData.images) 
      : requestedData.images;
  }
  if (requestedData.country !== undefined) updateData.country = requestedData.country;
  if (requestedData.city !== undefined) updateData.city = requestedData.city;
  if (requestedData.categoryId !== undefined) updateData.categoryId = requestedData.categoryId;
  if (requestedData.acceptsNegotiation !== undefined) {
    updateData.acceptsNegotiation = requestedData.acceptsNegotiation === true || requestedData.acceptsNegotiation === 'true';
  }

  // Update offer
  await prisma.offer.update({
    where: { id: request.offerId },
    data: updateData
  });

  // Update request status
  const reviewerId = (userType === 'EMPLOYEE' || userType === 'ADMIN') ? userId : null;
  const updatedRequest = await prisma.offerUpdateRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedByType: userType,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true,
          trader: {
            select: {
              id: true,
              name: true,
              companyName: true,
              traderCode: true
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

  return successResponse(res, updatedRequest, 'Update request approved successfully');
});

/**
 * @desc    Reject offer update request
 * @route   PUT /api/mediation/admin/offer-update-requests/:id/reject
 * @access  Private (Admin, Employee)
 */
const rejectUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  const userId = req.user.id;
  const userType = req.userType;

  const request = await prisma.offerUpdateRequest.findUnique({
    where: { id },
    include: {
      offer: {
        include: {
          trader: true
        }
      }
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
    if (request.offer.trader.employeeId !== userId) {
      return errorResponse(res, 'Not authorized to reject this request', 403);
    }
  }

  if (!reviewNotes) {
    return errorResponse(res, 'Review notes are required when rejecting a request', 400);
  }

  // Update request status
  const reviewerId = (userType === 'EMPLOYEE' || userType === 'ADMIN') ? userId : null;
  const updatedRequest = await prisma.offerUpdateRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedByType: userType,
      reviewedAt: new Date(),
      reviewNotes
    },
    include: {
      offer: {
        select: {
          id: true,
          title: true,
          status: true,
          trader: {
            select: {
              id: true,
              name: true,
              companyName: true,
              traderCode: true
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

  return successResponse(res, updatedRequest, 'Update request rejected');
});

/**
 * @desc    Cancel offer update request (Trader)
 * @route   PUT /api/mediation/traders/offers/update-requests/:id/cancel
 * @access  Private (Trader)
 */
const cancelUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const traderId = req.user.id;

  const request = await prisma.offerUpdateRequest.findUnique({
    where: { id },
    include: {
      offer: true
    }
  });

  if (!request) {
    return errorResponse(res, 'Update request not found', 404);
  }

  if (request.offer.traderId !== traderId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (request.status !== 'PENDING') {
    return errorResponse(res, 'Only pending requests can be cancelled', 400);
  }

  const updatedRequest = await prisma.offerUpdateRequest.update({
    where: { id },
    data: {
      status: 'CANCELLED'
    }
  });

  return successResponse(res, updatedRequest, 'Update request cancelled');
});

module.exports = {
  createUpdateRequest,
  getTraderOfferUpdateRequests,
  getAllUpdateRequests,
  getUpdateRequestById,
  approveUpdateRequest,
  rejectUpdateRequest,
  cancelUpdateRequest
};
