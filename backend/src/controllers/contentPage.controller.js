const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Helper function to create slug from title
const createSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * @desc    Get all content pages (with filters)
 * @route   GET /api/admin/content-pages
 * @access  Private (Admin)
 */
const getAllContentPages = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    type, 
    language, 
    isActive, 
    isPublished,
    search 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {};
  
  if (type) where.type = type;
  if (language) where.language = language;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (isPublished !== undefined) where.isPublished = isPublished === 'true';
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [pages, total] = await Promise.all([
    prisma.contentPage.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.contentPage.count({ where })
  ]);

  paginatedResponse(res, pages, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Content pages retrieved successfully');
});

/**
 * @desc    Get content page by ID
 * @route   GET /api/admin/content-pages/:id
 * @access  Private (Admin)
 */
const getContentPageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const page = await prisma.contentPage.findUnique({
    where: { id: parseInt(id) },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      updater: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!page) {
    return errorResponse(res, 'Content page not found', 404);
  }

  // Parse JSON fields
  if (page.socialMedia) {
    try {
      page.socialMedia = typeof page.socialMedia === 'string' 
        ? JSON.parse(page.socialMedia) 
        : page.socialMedia;
    } catch (e) {
      page.socialMedia = null;
    }
  }

  successResponse(res, page, 'Content page retrieved successfully');
});

/**
 * @desc    Get content page by type and language (Public)
 * @route   GET /api/content/:type
 * @access  Public
 */
const getContentPageByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { language = 'ar' } = req.query;

  const page = await prisma.contentPage.findFirst({
    where: {
      type: type.toUpperCase(),
      language,
      isActive: true,
      isPublished: true
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!page) {
    return errorResponse(res, 'Content page not found', 404);
  }

  // Parse JSON fields
  if (page.socialMedia) {
    try {
      page.socialMedia = typeof page.socialMedia === 'string' 
        ? JSON.parse(page.socialMedia) 
        : page.socialMedia;
    } catch (e) {
      page.socialMedia = null;
    }
  }

  // Increment view count
  await prisma.contentPage.update({
    where: { id: page.id },
    data: { views: { increment: 1 } }
  });

  successResponse(res, page, 'Content page retrieved successfully');
});

/**
 * @desc    Create content page
 * @route   POST /api/admin/content-pages
 * @access  Private (Admin)
 */
const createContentPage = asyncHandler(async (req, res) => {
  const {
    type,
    title,
    slug,
    content,
    excerpt,
    metaTitle,
    metaDescription,
    metaKeywords,
    language = 'ar',
    order = 0,
    isActive = true,
    isPublished = false,
    email,
    phone,
    address,
    workingHours,
    socialMedia,
    category,
    priority
  } = req.body;

  // Validation
  if (!type || !title || !content) {
    return errorResponse(res, 'Type, title, and content are required', 400);
  }

  // Validate ContentPageType enum
  const validTypes = [
    'SUPPORT_CENTER',
    'CONTACT_US',
    'TERMS_AND_CONDITIONS',
    'PRIVACY_POLICY',
    'ABOUT_COMPANY',
    'SUPPORT_TEXT',
    'FAQ',
    'HELP',
    'OTHER'
  ];

  if (!validTypes.includes(type.toUpperCase())) {
    return errorResponse(res, 'Invalid content page type', 400);
  }

  // Generate slug if not provided
  let finalSlug = slug || createSlug(title);
  
  // Ensure slug is unique
  const existingPage = await prisma.contentPage.findUnique({
    where: { slug: finalSlug }
  });

  if (existingPage) {
    finalSlug = `${finalSlug}-${Date.now()}`;
  }

  // Prepare data
  const data = {
    type: type.toUpperCase(),
    title: title.trim(),
    slug: finalSlug,
    content: content.trim(),
    excerpt: excerpt?.trim() || null,
    metaTitle: metaTitle?.trim() || null,
    metaDescription: metaDescription?.trim() || null,
    metaKeywords: metaKeywords?.trim() || null,
    language: language || 'ar',
    order: parseInt(order) || 0,
    isActive: isActive !== undefined ? isActive : true,
    isPublished: isPublished || false,
    publishedAt: isPublished ? new Date() : null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    workingHours: workingHours?.trim() || null,
    socialMedia: socialMedia ? (typeof socialMedia === 'string' ? socialMedia : JSON.stringify(socialMedia)) : null,
    category: category?.trim() || null,
    priority: priority?.trim() || null,
    createdBy: req.user.id
  };

  const page = await prisma.contentPage.create({
    data,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType || 'ADMIN',
      action: 'CONTENT_PAGE_CREATED',
      entityType: 'CONTENT_PAGE',
      entityId: page.id,
      description: `Admin created content page: ${page.title} (${page.type})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: JSON.stringify({
        type: page.type,
        language: page.language,
        isPublished: page.isPublished
      })
    }
  });

  successResponse(res, page, 'Content page created successfully', 201);
});

/**
 * @desc    Update content page
 * @route   PUT /api/admin/content-pages/:id
 * @access  Private (Admin)
 */
const updateContentPage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    type,
    title,
    slug,
    content,
    excerpt,
    metaTitle,
    metaDescription,
    metaKeywords,
    language,
    order,
    isActive,
    isPublished,
    email,
    phone,
    address,
    workingHours,
    socialMedia,
    category,
    priority
  } = req.body;

  const existingPage = await prisma.contentPage.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingPage) {
    return errorResponse(res, 'Content page not found', 404);
  }

  // Prepare update data
  const data = {};
  
  if (type) {
    const validTypes = [
      'SUPPORT_CENTER',
      'CONTACT_US',
      'TERMS_AND_CONDITIONS',
      'PRIVACY_POLICY',
      'ABOUT_COMPANY',
      'SUPPORT_TEXT',
      'FAQ',
      'HELP',
      'OTHER'
    ];
    if (!validTypes.includes(type.toUpperCase())) {
      return errorResponse(res, 'Invalid content page type', 400);
    }
    data.type = type.toUpperCase();
  }
  
  if (title !== undefined) data.title = title.trim();
  if (slug !== undefined) {
    // Ensure slug is unique (except for current page)
    const slugExists = await prisma.contentPage.findFirst({
      where: {
        slug: slug.trim(),
        id: { not: parseInt(id) }
      }
    });
    if (slugExists) {
      return errorResponse(res, 'Slug already exists', 400);
    }
    data.slug = slug.trim();
  }
  if (content !== undefined) data.content = content.trim();
  if (excerpt !== undefined) data.excerpt = excerpt?.trim() || null;
  if (metaTitle !== undefined) data.metaTitle = metaTitle?.trim() || null;
  if (metaDescription !== undefined) data.metaDescription = metaDescription?.trim() || null;
  if (metaKeywords !== undefined) data.metaKeywords = metaKeywords?.trim() || null;
  if (language !== undefined) data.language = language;
  if (order !== undefined) data.order = parseInt(order) || 0;
  if (isActive !== undefined) data.isActive = isActive;
  if (isPublished !== undefined) {
    data.isPublished = isPublished;
    // Set publishedAt if publishing for the first time
    if (isPublished && !existingPage.isPublished) {
      data.publishedAt = new Date();
    } else if (!isPublished) {
      data.publishedAt = null;
    }
  }
  if (email !== undefined) data.email = email?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (address !== undefined) data.address = address?.trim() || null;
  if (workingHours !== undefined) data.workingHours = workingHours?.trim() || null;
  if (socialMedia !== undefined) {
    data.socialMedia = socialMedia ? (typeof socialMedia === 'string' ? socialMedia : JSON.stringify(socialMedia)) : null;
  }
  if (category !== undefined) data.category = category?.trim() || null;
  if (priority !== undefined) data.priority = priority?.trim() || null;
  
  data.updatedBy = req.user.id;

  const page = await prisma.contentPage.update({
    where: { id: parseInt(id) },
    data,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      updater: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType || 'ADMIN',
      action: 'CONTENT_PAGE_UPDATED',
      entityType: 'CONTENT_PAGE',
      entityId: page.id,
      description: `Admin updated content page: ${page.title} (${page.type})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: JSON.stringify({
        type: page.type,
        language: page.language,
        isPublished: page.isPublished,
        changes: Object.keys(data).filter(key => key !== 'updatedBy' && key !== 'updatedAt')
      })
    }
  });

  successResponse(res, page, 'Content page updated successfully');
});

/**
 * @desc    Delete content page
 * @route   DELETE /api/admin/content-pages/:id
 * @access  Private (Admin)
 */
const deleteContentPage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const page = await prisma.contentPage.findUnique({
    where: { id: parseInt(id) }
  });

  if (!page) {
    return errorResponse(res, 'Content page not found', 404);
  }

  // Log activity before deletion
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType || 'ADMIN',
      action: 'CONTENT_PAGE_DELETED',
      entityType: 'CONTENT_PAGE',
      entityId: page.id,
      description: `Admin deleted content page: ${page.title} (${page.type})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: JSON.stringify({
        type: page.type,
        language: page.language,
        title: page.title
      })
    }
  });

  await prisma.contentPage.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Content page deleted successfully');
});

/**
 * @desc    Get employee activity logs
 * @route   GET /api/admin/activity-logs
 * @access  Private (Admin)
 */
const getActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    userType,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    search
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (userType) where.userType = userType.toUpperCase();
  // ActivityLog uses separate fields for different user types (adminId, employeeId, traderId, clientId)
  if (userId && userType) {
    const userTypeUpper = userType.toUpperCase();
    if (userTypeUpper === 'ADMIN') where.adminId = userId;
    else if (userTypeUpper === 'EMPLOYEE') where.employeeId = userId;
    else if (userTypeUpper === 'TRADER') where.traderId = userId;
    else if (userTypeUpper === 'CLIENT') where.clientId = userId;
  }
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (entityType) where.entityType = entityType.toUpperCase();
  // ActivityLog uses separate fields for different entity types (dealId, offerId)
  if (entityId && entityType) {
    const entityTypeUpper = entityType.toUpperCase();
    if (entityTypeUpper === 'DEAL') where.dealId = entityId;
    else if (entityTypeUpper === 'OFFER') where.offerId = entityId;
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { entityType: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true
          }
        },
        trader: {
          select: {
            id: true,
            name: true,
            email: true,
            traderCode: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
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

/**
 * @desc    Get activity log by ID
 * @route   GET /api/admin/activity-logs/:id
 * @access  Private (Admin)
 */
const getActivityLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await prisma.activityLog.findUnique({
    where: { id: id }, // ActivityLog.id is String (UUID), not Int
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeCode: true
        }
      },
      trader: {
        select: {
          id: true,
          name: true,
          email: true,
          traderCode: true
        }
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      deal: {
        select: {
          id: true,
          dealNumber: true,
          status: true
        }
      },
      offer: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });

  if (!log) {
    return errorResponse(res, 'Activity log not found', 404);
  }

  // Parse JSON fields
  if (log.changes) {
    try {
      log.changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
    } catch (e) {
      log.changes = null;
    }
  }
  if (log.metadata) {
    try {
      log.metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
    } catch (e) {
      log.metadata = null;
    }
  }

  successResponse(res, log, 'Activity log retrieved successfully');
});

/**
 * @desc    Get activity logs by user
 * @route   GET /api/admin/activity-logs/user/:userId
 * @access  Private (Admin)
 */
const getActivityLogsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { userType, page = 1, limit = 20 } = req.query;

  if (!userType) {
    return errorResponse(res, 'User type is required', 400);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const userTypeUpper = userType.toUpperCase();
  const where = {
    userType: userTypeUpper
  };
  
  // ActivityLog uses separate fields for different user types
  if (userTypeUpper === 'ADMIN') where.adminId = userId;
  else if (userTypeUpper === 'EMPLOYEE') where.employeeId = userId;
  else if (userTypeUpper === 'TRADER') where.traderId = userId;
  else if (userTypeUpper === 'CLIENT') where.clientId = userId;
  else {
    return errorResponse(res, 'Invalid user type', 400);
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: parseInt(limit),
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

/**
 * @desc    Get activity logs by entity
 * @route   GET /api/admin/activity-logs/entity/:entityType/:entityId
 * @access  Private (Admin)
 */
const getActivityLogsByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const entityTypeUpper = entityType.toUpperCase();
  const where = {
    entityType: entityTypeUpper
  };
  
  // ActivityLog uses separate fields for different entity types
  if (entityTypeUpper === 'DEAL') where.dealId = entityId;
  else if (entityTypeUpper === 'OFFER') where.offerId = entityId;
  else {
    return errorResponse(res, 'Invalid entity type. Supported types: DEAL, OFFER', 400);
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true
          }
        },
        trader: {
          select: {
            id: true,
            name: true,
            email: true,
            traderCode: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
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

module.exports = {
  // Content Pages
  getAllContentPages,
  getContentPageById,
  getContentPageByType,
  createContentPage,
  updateContentPage,
  deleteContentPage,
  // Activity Logs
  getActivityLogs,
  getActivityLogById,
  getActivityLogsByUser,
  getActivityLogsByEntity
};

