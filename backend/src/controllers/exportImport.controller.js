const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// @desc    Export products
// @route   POST /api/export/products
// @access  Private (Admin/Vendor)
const exportProducts = asyncHandler(async (req, res) => {
  const { format = 'excel', filters } = req.body;

  const where = {};
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }
  if (filters) {
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = parseInt(filters.categoryId);
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      },
      images: {
        take: 1,
        orderBy: { imageOrder: 'asc' }
      }
    }
  });

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name Key', key: 'nameKey', width: 30 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'CBM', key: 'cbm', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 30 }
    ];

    products.forEach(product => {
      worksheet.addRow({
        id: product.id,
        nameKey: product.nameKey,
        sku: product.sku,
        price: product.price,
        quantity: product.quantity,
        cbm: product.cbm,
        status: product.status,
        category: product.category?.nameKey || '',
        vendor: product.vendor?.companyName || ''
      });
    });

    const filePath = path.join('./exports', `products-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    // Record export history
    await prisma.exportHistory.create({
      data: {
        userId: req.user.id,
        exportType: 'PRODUCTS',
        format: 'EXCEL',
        fileUrl: filePath,
        recordCount: products.length,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    res.download(filePath);
  } else if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=products-${Date.now()}.json`);
    return res.json(products);
  } else {
    return errorResponse(res, 'Invalid format. Use excel or json', 400);
  }
});

// @desc    Export orders
// @route   POST /api/export/orders
// @access  Private (Admin/Vendor)
const exportOrders = asyncHandler(async (req, res) => {
  const { format = 'excel', filters } = req.body;

  const where = {};
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }
  if (filters) {
    if (filters.status) where.status = filters.status;
    if (filters.startDate) where.orderDate = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.orderDate = { lte: new Date(filters.endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              sku: true,
              nameKey: true
            }
          }
        }
      }
    }
  });

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order Number', key: 'orderNumber', width: 20 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Vendor', key: 'vendor', width: 30 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Order Date', key: 'orderDate', width: 20 }
    ];

    orders.forEach(order => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        customer: order.user?.name || '',
        vendor: order.vendor?.companyName || '',
        status: order.status,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate
      });
    });

    const filePath = path.join('./exports', `orders-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    await prisma.exportHistory.create({
      data: {
        userId: req.user.id,
        exportType: 'ORDERS',
        format: 'EXCEL',
        fileUrl: filePath,
        recordCount: orders.length,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    res.download(filePath);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.json`);
    return res.json(orders);
  }
});

// @desc    Export users (admin only)
// @route   POST /api/export/users
// @access  Private (Admin)
const exportUsers = asyncHandler(async (req, res) => {
  const { format = 'excel' } = req.body;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      isActive: true,
      createdAt: true
    }
  });

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Active', key: 'isActive', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    users.forEach(user => {
      worksheet.addRow(user);
    });

    const filePath = path.join('./exports', `users-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    await prisma.exportHistory.create({
      data: {
        userId: req.user.id,
        exportType: 'USERS',
        format: 'EXCEL',
        fileUrl: filePath,
        recordCount: users.length,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    res.download(filePath);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.json`);
    return res.json(users);
  }
});

// @desc    Export vendors (admin only)
// @route   POST /api/export/vendors
// @access  Private (Admin)
const exportVendors = asyncHandler(async (req, res) => {
  const { format = 'excel' } = req.body;

  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      companyName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      status: true,
      isVerified: true,
      createdAt: true
    }
  });

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vendors');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Verified', key: 'isVerified', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    vendors.forEach(vendor => {
      worksheet.addRow(vendor);
    });

    const filePath = path.join('./exports', `vendors-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    await prisma.exportHistory.create({
      data: {
        userId: req.user.id,
        exportType: 'VENDORS',
        format: 'EXCEL',
        fileUrl: filePath,
        recordCount: vendors.length,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    res.download(filePath);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=vendors-${Date.now()}.json`);
    return res.json(vendors);
  }
});

// @desc    Download export template
// @route   GET /api/export/templates/:type
// @access  Private
const downloadTemplate = asyncHandler(async (req, res) => {
  const { type } = req.params;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(type);

  // Define columns based on type
  if (type === 'products') {
    worksheet.columns = [
      { header: 'Name Key', key: 'nameKey', width: 30 },
      { header: 'Description Key', key: 'descriptionKey', width: 50 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'CBM', key: 'cbm', width: 15 },
      { header: 'Category ID', key: 'categoryId', width: 15 }
    ];
  } else if (type === 'users') {
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'City', key: 'city', width: 20 }
    ];
  }

  const filePath = path.join('./templates', `${type}-template.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  res.download(filePath);
});

// @desc    Import products
// @route   POST /api/import/products
// @access  Private (Admin/Vendor)
const importProducts = asyncHandler(async (req, res) => {
  // This would process the uploaded Excel file
  // For now, return a placeholder response
  successResponse(res, {
    message: 'Product import endpoint',
    note: 'File processing would be implemented here'
  }, 'Import initiated');
});

// @desc    Import users (admin only)
// @route   POST /api/import/users
// @access  Private (Admin)
const importUsers = asyncHandler(async (req, res) => {
  successResponse(res, {
    message: 'User import endpoint',
    note: 'File processing would be implemented here'
  }, 'Import initiated');
});

// @desc    Import vendors (admin only)
// @route   POST /api/import/vendors
// @access  Private (Admin)
const importVendors = asyncHandler(async (req, res) => {
  successResponse(res, {
    message: 'Vendor import endpoint',
    note: 'File processing would be implemented here'
  }, 'Import initiated');
});

// @desc    Preview import data
// @route   GET /api/import/preview
// @access  Private
const previewImport = asyncHandler(async (req, res) => {
  const { fileUrl, type } = req.query;

  // This would read and preview the file
  successResponse(res, {
    message: 'Import preview endpoint',
    note: 'File preview would be implemented here'
  }, 'Preview data');
});

// @desc    Get import history
// @route   GET /api/import/history
// @access  Private
const getImportHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (req.userType === 'VENDOR') {
    where.userId = req.user.id;
  }

  const [history, total] = await Promise.all([
    prisma.importHistory.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.importHistory.count({ where })
  ]);

  paginatedResponse(res, history, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Import history retrieved successfully');
});

// @desc    Get import details
// @route   GET /api/import/history/:id
// @access  Private
const getImportDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const importRecord = await prisma.importHistory.findUnique({
    where: { id: parseInt(id) }
  });

  if (!importRecord) {
    return errorResponse(res, 'Import record not found', 404);
  }

  successResponse(res, importRecord, 'Import details retrieved successfully');
});

module.exports = {
  exportProducts,
  exportOrders,
  exportUsers,
  exportVendors,
  downloadTemplate,
  importProducts,
  importUsers,
  importVendors,
  previewImport,
  getImportHistory,
  getImportDetails
};



