const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Get Platform Settings
 * @route   GET /api/admin/platform-settings
 * @access  Private (Admin)
 */
const getPlatformSettings = asyncHandler(async (req, res) => {
  let settings = await prisma.platformSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
    include: {
      updater: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // If no settings exist, return defaults
  if (!settings) {
    settings = {
      id: null,
      platformCommissionRate: 2.5,
      cbmRate: null,
      taxRate: 0,
      currency: 'SAR',
      platformName: 'Stockship',
      platformEmail: null,
      platformPhone: null,
      platformAddress: null,
      defaultLanguage: 'ar',
      timezone: 'Asia/Riyadh',
      commissionMethod: 'PERCENTAGE',
      updatedBy: null,
      updatedAt: null,
      createdAt: null,
      updater: null
    };
  }

  successResponse(res, settings, 'Platform settings retrieved successfully');
});

/**
 * @desc    Update Platform Settings
 * @route   PUT /api/admin/platform-settings
 * @access  Private (Admin)
 */
const updatePlatformSettings = asyncHandler(async (req, res) => {
  const {
    platformCommissionRate,
    cbmRate,
    taxRate,
    currency,
    platformName,
    platformEmail,
    platformPhone,
    platformAddress,
    defaultLanguage,
    timezone,
    commissionMethod
  } = req.body;

  // Validate commissionMethod
  if (commissionMethod && !['PERCENTAGE', 'CBM', 'BOTH'].includes(commissionMethod)) {
    return errorResponse(res, 'Invalid commission method. Must be PERCENTAGE, CBM, or BOTH', 400);
  }

  // Validate that cbmRate is set if commissionMethod is CBM or BOTH
  if ((commissionMethod === 'CBM' || commissionMethod === 'BOTH') && (!cbmRate || parseFloat(cbmRate) <= 0)) {
    return errorResponse(res, 'CBM Rate must be set and greater than 0 when commission method is CBM or BOTH', 400);
  }

  let settings = await prisma.platformSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  const data = {};
  if (platformCommissionRate !== undefined) {
    data.platformCommissionRate = parseFloat(platformCommissionRate);
  }
  if (cbmRate !== undefined) {
    data.cbmRate = parseFloat(cbmRate) || null;
  }
  if (taxRate !== undefined) {
    data.taxRate = parseFloat(taxRate) || null;
  }
  if (currency !== undefined) {
    data.currency = currency;
  }
  if (platformName !== undefined) {
    data.platformName = platformName;
  }
  if (platformEmail !== undefined) {
    data.platformEmail = platformEmail;
  }
  if (platformPhone !== undefined) {
    data.platformPhone = platformPhone;
  }
  if (platformAddress !== undefined) {
    data.platformAddress = platformAddress;
  }
  if (defaultLanguage !== undefined) {
    data.defaultLanguage = defaultLanguage;
  }
  if (timezone !== undefined) {
    data.timezone = timezone;
  }
  if (commissionMethod !== undefined) {
    data.commissionMethod = commissionMethod;
  }
  
  data.updatedBy = req.user.id;

  if (settings) {
    // Update existing settings
    settings = await prisma.platformSettings.update({
      where: { id: settings.id },
      data,
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  } else {
    // Create new settings with defaults
    settings = await prisma.platformSettings.create({
      data: {
        ...data,
        platformCommissionRate: data.platformCommissionRate || 2.5,
        currency: data.currency || 'SAR',
        platformName: data.platformName || 'Stockship',
        defaultLanguage: data.defaultLanguage || 'ar',
        timezone: data.timezone || 'Asia/Riyadh',
        commissionMethod: data.commissionMethod || 'PERCENTAGE'
      },
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PLATFORM_SETTINGS',
      entityId: settings.id,
      description: `Platform settings updated by ${req.userType}`,
      changes: JSON.stringify(data),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, settings, 'Platform settings updated successfully');
});

module.exports = {
  getPlatformSettings,
  updatePlatformSettings
};





