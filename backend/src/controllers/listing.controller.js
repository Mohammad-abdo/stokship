const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Create product listing/advertisement
// @route   POST /api/listings
// @access  Private (Vendor)
const createListing = asyncHandler(async (req, res) => {
  const {
    productId,
    title,
    description,
    country,
    city,
    categoryId,
    acceptsNegotiation
  } = req.body;

  if (!title || !description || !country || !city || !categoryId) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  const listing = await prisma.productListing.create({
    data: {
      vendorId: req.user.id,
      productId: productId ? parseInt(productId) : null,
      title,
      description,
      country,
      city,
      categoryId: parseInt(categoryId),
      acceptsNegotiation: acceptsNegotiation || false,
      status: 'DRAFT'
    },
    include: {
      category: true,
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      }
    }
  });

  successResponse(res, listing, 'Product listing created successfully', 201);
});

// @desc    Get product listings
// @route   GET /api/listings
// @access  Public
const getListings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, vendorId, categoryId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  else where.status = 'PUBLISHED';
  if (vendorId) where.vendorId = parseInt(vendorId);
  if (categoryId) where.categoryId = parseInt(categoryId);

  const [listings, total] = await Promise.all([
    prisma.productListing.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        },
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { imageOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productListing.count({ where })
  ]);

  paginatedResponse(res, listings, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Product listings retrieved successfully');
});

// @desc    Get listing details
// @route   GET /api/listings/:id
// @access  Public
const getListingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const listing = await prisma.productListing.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      vendor: {
        include: {
          bankAccounts: {
            where: { isDefault: true },
            take: 1
          }
        }
      },
      product: {
        include: {
          images: true,
          category: true
        }
      }
    }
  });

  if (!listing) {
    return errorResponse(res, 'Listing not found', 404);
  }

  successResponse(res, listing, 'Listing retrieved successfully');
});

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private (Vendor)
const updateListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const listing = await prisma.productListing.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!listing) {
    return errorResponse(res, 'Listing not found', 404);
  }

  const data = {};
  if (updateData.title) data.title = updateData.title;
  if (updateData.description) data.description = updateData.description;
  if (updateData.country) data.country = updateData.country;
  if (updateData.city) data.city = updateData.city;
  if (updateData.categoryId) data.categoryId = parseInt(updateData.categoryId);
  if (updateData.acceptsNegotiation !== undefined) data.acceptsNegotiation = updateData.acceptsNegotiation;

  const updated = await prisma.productListing.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Listing updated successfully');
});

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private (Vendor)
const deleteListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const listing = await prisma.productListing.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!listing) {
    return errorResponse(res, 'Listing not found', 404);
  }

  await prisma.productListing.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Listing deleted successfully');
});

// @desc    Publish listing
// @route   POST /api/listings/:id/publish
// @access  Private (Vendor)
const publishListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const listing = await prisma.productListing.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!listing) {
    return errorResponse(res, 'Listing not found', 404);
  }

  const updated = await prisma.productListing.update({
    where: { id: parseInt(id) },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  });

  successResponse(res, updated, 'Listing published successfully');
});

// @desc    Unpublish listing
// @route   POST /api/listings/:id/unpublish
// @access  Private (Vendor)
const unpublishListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const listing = await prisma.productListing.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!listing) {
    return errorResponse(res, 'Listing not found', 404);
  }

  const updated = await prisma.productListing.update({
    where: { id: parseInt(id) },
    data: {
      status: 'UNPUBLISHED'
    }
  });

  successResponse(res, updated, 'Listing unpublished successfully');
});

// @desc    Download Excel template for listings
// @route   GET /api/listings/excel-template
// @access  Private (Vendor)
const downloadExcelTemplate = asyncHandler(async (req, res) => {
  // This would generate and return an Excel template
  // For now, return a message
  successResponse(res, {
    message: 'Excel template download endpoint',
    url: '/templates/product-listing-template.xlsx'
  }, 'Template download information');
});

// @desc    Bulk upload listings via Excel
// @route   POST /api/listings/bulk-upload
// @access  Private (Vendor)
const bulkUploadListings = asyncHandler(async (req, res) => {
  // This would process Excel file upload
  // For now, return a message
  successResponse(res, {
    message: 'Bulk upload processing endpoint',
    note: 'File processing would be implemented here'
  }, 'Bulk upload initiated');
});

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  publishListing,
  unpublishListing,
  downloadExcelTemplate,
  bulkUploadListings
};



