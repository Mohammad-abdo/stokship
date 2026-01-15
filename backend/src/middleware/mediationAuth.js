const prisma = require('../config/database');
const { errorResponse } = require('../utils/response');

/**
 * Check if Employee is linked to Trader (for offer validation, etc.)
 */
const checkEmployeeTraderRelation = async (req, res, next) => {
  try {
    const { id } = req.params; // Offer ID or Trader ID

    if (req.userType !== 'EMPLOYEE') {
      return next(); // Let other middleware handle authorization
    }

    // Check if it's an offer validation
    if (req.path.includes('/offers/') && req.method === 'PUT') {
      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(id) },
        include: {
          trader: true
        }
      });

      if (!offer) {
        return errorResponse(res, 'Offer not found', 404);
      }

      if (offer.trader.employeeId !== req.user.id) {
        return errorResponse(res, 'Not authorized to validate offers from this trader', 403);
      }
    }

    // Check if it's a trader-related operation
    if (req.path.includes('/traders/')) {
      const traderId = req.params.id || req.params.traderId;
      if (traderId) {
        const trader = await prisma.trader.findUnique({
          where: { id: parseInt(traderId) }
        });

        if (!trader) {
          return errorResponse(res, 'Trader not found', 404);
        }

        if (trader.employeeId !== req.user.id) {
          return errorResponse(res, 'Not authorized to access this trader', 403);
        }
      }
    }

    next();
  } catch (error) {
    console.error('Employee-Trader relation check error:', error);
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

/**
 * Check if Employee is guarantor for Deal
 */
const checkEmployeeDealRelation = async (req, res, next) => {
  try {
    const dealId = req.params.id || req.params.dealId;

    if (!dealId) {
      return next();
    }

    if (req.userType !== 'EMPLOYEE' && req.userType !== 'ADMIN') {
      return next(); // Let other middleware handle authorization
    }

    const deal = await prisma.deal.findUnique({
      where: { id: parseInt(dealId) }
    });

    if (!deal) {
      return errorResponse(res, 'Deal not found', 404);
    }

    // Admin can access all deals
    if (req.userType === 'ADMIN') {
      return next();
    }

    // Employee can only access deals they guarantee
    if (deal.employeeId !== req.user.id) {
      return errorResponse(res, 'Not authorized to access this deal', 403);
    }

    next();
  } catch (error) {
    console.error('Employee-Deal relation check error:', error);
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

/**
 * Check if Trader owns the resource
 */
const checkTraderOwnership = async (req, res, next) => {
  try {
    if (req.userType !== 'TRADER') {
      return next();
    }

    const resourceId = req.params.id;
    const resourceType = req.path.split('/')[2]; // e.g., 'offers', 'deals'

    if (resourceType === 'offers') {
      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(resourceId) }
      });

      if (!offer) {
        return errorResponse(res, 'Offer not found', 404);
      }

      if (offer.traderId !== req.user.id) {
        return errorResponse(res, 'Not authorized to access this offer', 403);
      }
    } else if (resourceType === 'deals') {
      const deal = await prisma.deal.findUnique({
        where: { id: parseInt(resourceId) }
      });

      if (!deal) {
        return errorResponse(res, 'Deal not found', 404);
      }

      if (deal.traderId !== req.user.id) {
        return errorResponse(res, 'Not authorized to access this deal', 403);
      }
    }

    next();
  } catch (error) {
    console.error('Trader ownership check error:', error);
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

/**
 * Check if Client owns the resource
 */
const checkClientOwnership = async (req, res, next) => {
  try {
    if (req.userType !== 'CLIENT') {
      return next();
    }

    const dealId = req.params.id || req.params.dealId;

    if (dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: parseInt(dealId) }
      });

      if (!deal) {
        return errorResponse(res, 'Deal not found', 404);
      }

      if (deal.clientId !== req.user.id) {
        return errorResponse(res, 'Not authorized to access this deal', 403);
      }
    }

    next();
  } catch (error) {
    console.error('Client ownership check error:', error);
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

module.exports = {
  checkEmployeeTraderRelation,
  checkEmployeeDealRelation,
  checkTraderOwnership,
  checkClientOwnership
};



