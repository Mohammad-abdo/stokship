const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/response');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Get invoice by ID
 * @route   GET /api/mediation/invoices/:id
 * @access  Private (Admin, Employee, Trader, Client)
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.userType;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      deal: {
        include: {
          trader: {
            select: {
              id: true,
              name: true,
              companyName: true,
              email: true,
              phone: true,
              companyAddress: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              city: true,
              country: true
            }
          },
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true
            }
          },
          items: {
            include: {
              offerItem: true
            }
          }
        }
      }
    }
  });

  if (!invoice) {
    return errorResponse(res, 'Invoice not found', 404);
  }

  // Check authorization
  if (userType === 'CLIENT' && invoice.deal.clientId !== userId) {
    return errorResponse(res, 'Not authorized to view this invoice', 403);
  }

  if (userType === 'TRADER' && invoice.deal.traderId !== userId) {
    return errorResponse(res, 'Not authorized to view this invoice', 403);
  }

  if (userType === 'EMPLOYEE' && invoice.deal.employeeId !== userId) {
    return errorResponse(res, 'Not authorized to view this invoice', 403);
  }

  return successResponse(res, invoice, 'Invoice retrieved successfully');
});

/**
 * @desc    Download invoice PDF
 * @route   GET /api/mediation/invoices/:id/download
 * @access  Private (Admin, Employee, Trader, Client)
 */
const downloadInvoicePDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.userType;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      deal: {
        include: {
          trader: true,
          client: true,
          employee: true,
          items: {
            include: {
              offerItem: true
            }
          }
        }
      }
    }
  });

  if (!invoice) {
    return errorResponse(res, 'Invoice not found', 404);
  }

  // Check authorization
  if (userType === 'CLIENT' && invoice.deal.clientId !== userId) {
    return errorResponse(res, 'Not authorized to download this invoice', 403);
  }

  if (userType === 'TRADER' && invoice.deal.traderId !== userId) {
    return errorResponse(res, 'Not authorized to download this invoice', 403);
  }

  if (userType === 'EMPLOYEE' && invoice.deal.employeeId !== userId) {
    return errorResponse(res, 'Not authorized to download this invoice', 403);
  }

  // Get PDF path
  const pdfPath = path.join(__dirname, '../../uploads/invoices', `${invoice.invoiceNumber}.pdf`);

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    return errorResponse(res, 'Invoice PDF not found. Please contact support.', 404);
  }

  // Send PDF file
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  
  const fileStream = fs.createReadStream(pdfPath);
  fileStream.pipe(res);
});

/**
 * @desc    Get invoices by deal ID
 * @route   GET /api/mediation/deals/:dealId/invoices
 * @access  Private (Admin, Employee, Trader, Client)
 */
const getInvoicesByDeal = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const userId = req.user.id;
  const userType = req.userType;

  // Check if deal exists and user has access
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      traderId: true,
      clientId: true,
      employeeId: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found', 404);
  }

  // Check authorization
  if (userType === 'CLIENT' && deal.clientId !== userId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (userType === 'TRADER' && deal.traderId !== userId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (userType === 'EMPLOYEE' && deal.employeeId !== userId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const invoices = await prisma.invoice.findMany({
    where: { dealId },
    orderBy: { createdAt: 'desc' },
    include: {
      deal: {
        select: {
          dealNumber: true,
          trader: {
            select: {
              companyName: true
            }
          },
          client: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  return successResponse(res, invoices, 'Invoices retrieved successfully');
});

module.exports = {
  getInvoiceById,
  downloadInvoicePDF,
  getInvoicesByDeal
};


