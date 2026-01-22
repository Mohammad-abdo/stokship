const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get all shipping companies
// @route   GET /api/admin/shipping-companies
// @access  Private (Admin)
const getShippingCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { nameAr: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [companies, total] = await Promise.all([
    prisma.shippingCompany.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { deals: true }
        }
      }
    }),
    prisma.shippingCompany.count({ where })
  ]);

  paginatedResponse(res, companies, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Shipping companies retrieved successfully');
});

// @desc    Get all active shipping companies (for dropdowns)
// @route   GET /api/admin/shipping-companies/active
// @access  Private (Admin/Employee)
const getActiveShippingCompanies = asyncHandler(async (req, res) => {
  const companies = await prisma.shippingCompany.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      avatar: true,
      phone: true,
      email: true
    },
    orderBy: { nameEn: 'asc' }
  });

  successResponse(res, companies, 'Active shipping companies retrieved successfully');
});

// @desc    Get shipping company by ID
// @route   GET /api/admin/shipping-companies/:id
// @access  Private (Admin)
const getShippingCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const company = await prisma.shippingCompany.findUnique({
    where: { id },
    include: {
      _count: {
        select: { 
          deals: true,
          shippingTracks: true
        }
      },
      shippingTracks: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          deal: {
            select: {
              id: true,
              dealNumber: true,
              status: true,
              negotiatedAmount: true,
              trader: {
                select: {
                  name: true,
                  companyName: true
                }
              },
              client: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      }
    }
  });

  if (!company) {
    return errorResponse(res, 'Shipping company not found', 404);
  }

  successResponse(res, company, 'Shipping company retrieved successfully');
});

// @desc    Create shipping company
// @route   POST /api/admin/shipping-companies
// @access  Private (Admin)
const createShippingCompany = asyncHandler(async (req, res) => {
  const {
    nameAr,
    nameEn,
    avatar,
    address,
    contactName,
    phone,
    email,
    notes,
    status
  } = req.body;

  if (!nameAr || !nameEn) {
    return errorResponse(res, 'Company name in both Arabic and English is required', 400);
  }

  const company = await prisma.shippingCompany.create({
    data: {
      nameAr,
      nameEn,
      avatar: avatar || null,
      address: address || null,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
      status: status || 'ACTIVE'
    }
  });

  successResponse(res, company, 'Shipping company created successfully', 201);
});

// @desc    Update shipping company
// @route   PUT /api/admin/shipping-companies/:id
// @access  Private (Admin)
const updateShippingCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nameAr,
    nameEn,
    avatar,
    address,
    contactName,
    phone,
    email,
    notes,
    status
  } = req.body;

  const existingCompany = await prisma.shippingCompany.findUnique({
    where: { id }
  });

  if (!existingCompany) {
    return errorResponse(res, 'Shipping company not found', 404);
  }

  const data = {};
  if (nameAr !== undefined) data.nameAr = nameAr;
  if (nameEn !== undefined) data.nameEn = nameEn;
  if (avatar !== undefined) data.avatar = avatar;
  if (address !== undefined) data.address = address;
  if (contactName !== undefined) data.contactName = contactName;
  if (phone !== undefined) data.phone = phone;
  if (email !== undefined) data.email = email;
  if (notes !== undefined) data.notes = notes;
  if (status !== undefined) data.status = status;

  const updatedCompany = await prisma.shippingCompany.update({
    where: { id },
    data
  });

  successResponse(res, updatedCompany, 'Shipping company updated successfully');
});

// @desc    Delete shipping company
// @route   DELETE /api/admin/shipping-companies/:id
// @access  Private (Admin)
const deleteShippingCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const company = await prisma.shippingCompany.findUnique({
    where: { id },
    include: {
      _count: {
        select: { deals: true }
      }
    }
  });

  if (!company) {
    return errorResponse(res, 'Shipping company not found', 404);
  }

  // Check if company is assigned to any deals
  if (company._count.deals > 0) {
    return errorResponse(res, 'Cannot delete shipping company that is assigned to deals', 400);
  }

  await prisma.shippingCompany.delete({
    where: { id }
  });

  successResponse(res, null, 'Shipping company deleted successfully');
});

module.exports = {
  getShippingCompanies,
  getActiveShippingCompanies,
  getShippingCompanyById,
  createShippingCompany,
  updateShippingCompany,
  deleteShippingCompany
};

