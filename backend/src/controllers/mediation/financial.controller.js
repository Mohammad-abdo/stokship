const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
// PDFDocument is optional - install with: npm install pdfkit
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  console.warn('PDFKit not installed. Invoice generation will be limited.');
  PDFDocument = null;
}
const fs = require('fs');
const path = require('path');

/**
 * @desc    Process Payment (Client pays platform)
 * @route   POST /api/deals/:dealId/payments
 * @access  Private (Client)
 */
const processPayment = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const { amount, method, transactionId, receiptUrl } = req.body;

  if (!amount || !method) {
    return errorResponse(res, 'Please provide amount and payment method', 400);
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(dealId),
      clientId: req.user.id,
      status: { in: ['APPROVED', 'PAID'] }
    },
    include: {
      trader: {
        include: {
          employee: true
        }
      },
      employee: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot process payment', 404);
  }

  if (!deal.negotiatedAmount) {
    return errorResponse(res, 'Deal amount not negotiated yet', 400);
  }

  if (parseFloat(amount) !== parseFloat(deal.negotiatedAmount)) {
    return errorResponse(res, `Payment amount must be ${deal.negotiatedAmount}`, 400);
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      dealId: deal.id,
      clientId: req.user.id,
      amount: parseFloat(amount),
      method,
      status: 'PENDING',
      transactionId: transactionId || null,
      receiptUrl: receiptUrl || null
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'CLIENT',
      action: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Client initiated payment for deal ${deal.dealNumber}`,
      metadata: JSON.stringify({
        amount,
        method,
        transactionId
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify employee
  await prisma.notification.create({
    data: {
      userId: deal.employeeId,
      userType: 'EMPLOYEE',
      type: 'PAYMENT',
      title: 'Payment Received',
      message: `Client paid ${amount} for deal ${deal.dealNumber}`,
      relatedEntityType: 'PAYMENT',
      relatedEntityId: payment.id
    }
  });

  successResponse(res, payment, 'Payment processed successfully', 201);
});

/**
 * @desc    Verify Payment (Employee verifies payment receipt)
 * @route   PUT /api/employees/payments/:id/verify
 * @access  Private (Employee)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verified, notes } = req.body;

  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(id) },
    include: {
      deal: {
        include: {
          trader: {
            include: {
              employee: true
            }
          },
          employee: true
        }
      }
    }
  });

  if (!payment) {
    return errorResponse(res, 'Payment not found', 404);
  }

  // Verify employee is the guarantor
  if (payment.deal.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to verify this payment', 403);
  }

  if (payment.status !== 'PENDING') {
    return errorResponse(res, 'Payment already processed', 400);
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: verified ? 'COMPLETED' : 'FAILED',
      verifiedAt: verified ? new Date() : null,
      verifiedBy: verified ? req.user.id : null,
      notes: notes || null
    }
  });

  if (verified) {
    // Update deal status
    await prisma.deal.update({
      where: { id: payment.dealId },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });

    // Create status history
    await prisma.dealStatusHistory.create({
      data: {
        dealId: payment.dealId,
        status: 'PAID',
        description: 'Payment verified and received',
        changedBy: req.user.id,
        changedByType: 'EMPLOYEE'
      }
    });

    // Calculate and distribute commissions
    await calculateAndDistributeCommissions(payment.deal, payment);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userType: 'EMPLOYEE',
        action: 'PAYMENT_VERIFIED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        description: `Employee verified payment for deal ${payment.deal.dealNumber}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Notify client and trader
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: payment.deal.clientId,
          userType: 'CLIENT',
          type: 'PAYMENT',
          title: 'Payment Verified',
          message: `Your payment for deal ${payment.deal.dealNumber} has been verified`,
          relatedEntityType: 'PAYMENT',
          relatedEntityId: payment.id
        }
      }),
      prisma.notification.create({
        data: {
          userId: payment.deal.traderId,
          userType: 'TRADER',
          type: 'PAYMENT',
          title: 'Payment Received',
          message: `Payment for deal ${payment.deal.dealNumber} has been verified`,
          relatedEntityType: 'PAYMENT',
          relatedEntityId: payment.id
        }
      })
    ]);
  }

  successResponse(res, updatedPayment, `Payment ${verified ? 'verified' : 'rejected'} successfully`);
});

/**
 * @desc    Calculate and distribute commissions
 * @private
 */
async function calculateAndDistributeCommissions(deal, payment) {
  // Get site settings for commission rates
  // Assuming you have a SiteSettings table or configuration
  const platformCommissionRate = 2.5; // 2.5% default
  const employeeCommissionRate = deal.employee.commissionRate || 1.0; // Employee's rate

  const amount = parseFloat(payment.amount);

  // Calculate commissions
  const platformCommission = (amount * platformCommissionRate) / 100;
  const employeeCommission = (amount * employeeCommissionRate) / 100;
  const traderAmount = amount - platformCommission - employeeCommission;

  // Create financial transaction
  const transaction = await prisma.financialTransaction.create({
    data: {
      dealId: deal.id,
      paymentId: payment.id,
      type: 'DEPOSIT',
      amount,
      status: 'COMPLETED',
      description: `Payment for deal ${deal.dealNumber}`,
      platformCommission,
      employeeCommission,
      traderAmount,
      employeeId: deal.employeeId,
      traderId: deal.traderId,
      processedBy: deal.employeeId, // Employee who verified
      processedAt: new Date()
    }
  });

  // Create ledger entries
  const ledgerEntries = [
    // Client payment (DEBIT from client, CREDIT to platform)
    {
      transactionId: transaction.id,
      entryType: 'DEBIT',
      accountType: 'CLIENT',
      accountId: deal.clientId,
      amount,
      balanceBefore: 0, // Would need to track client balance
      balanceAfter: 0,
      description: `Payment for deal ${deal.dealNumber}`,
      reference: deal.dealNumber
    },
    // Platform commission (CREDIT to platform)
    {
      transactionId: transaction.id,
      entryType: 'CREDIT',
      accountType: 'PLATFORM',
      accountId: null,
      amount: platformCommission,
      balanceBefore: 0, // Would need to track platform balance
      balanceAfter: 0,
      description: `Platform commission for deal ${deal.dealNumber}`,
      reference: deal.dealNumber
    },
    // Employee commission (CREDIT to employee)
    {
      transactionId: transaction.id,
      entryType: 'CREDIT',
      accountType: 'EMPLOYEE',
      accountId: deal.employeeId,
      amount: employeeCommission,
      balanceBefore: 0, // Would need to track employee balance
      balanceAfter: 0,
      description: `Employee commission for deal ${deal.dealNumber}`,
      reference: deal.dealNumber
    },
    // Trader payout (CREDIT to trader)
    {
      transactionId: transaction.id,
      entryType: 'CREDIT',
      accountType: 'TRADER',
      accountId: deal.traderId,
      amount: traderAmount,
      balanceBefore: 0, // Would need to track trader balance
      balanceAfter: 0,
      description: `Trader payout for deal ${deal.dealNumber}`,
      reference: deal.dealNumber
    }
  ];

  await prisma.financialLedger.createMany({
    data: ledgerEntries
  });

  // Generate invoice
  await generateInvoice(deal, payment, transaction);

  return transaction;
}

/**
 * @desc    Generate Invoice
 * @private
 */
async function generateInvoice(deal, payment, transaction) {
  // Get invoice data
  const invoiceData = {
    invoiceNumber: deal.invoiceNumber || `INV-${Date.now()}`,
    dealNumber: deal.dealNumber,
    trader: deal.trader,
    client: deal.client,
    items: deal.items,
    subtotal: transaction.traderAmount,
    platformCommission: transaction.platformCommission,
    employeeCommission: transaction.employeeCommission,
    total: payment.amount,
    date: new Date()
  };

  // Create invoice record
  const invoice = await prisma.invoice.create({
    data: {
      dealId: deal.id,
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceUrl: `/invoices/${invoiceData.invoiceNumber}.pdf`, // Will be generated
      status: 'SENT',
      subtotal: invoiceData.subtotal,
      platformCommission: invoiceData.platformCommission,
      employeeCommission: invoiceData.employeeCommission,
      traderAmount: invoiceData.subtotal,
      total: invoiceData.total,
      issuedAt: new Date()
    }
  });

  // Generate PDF invoice using PDFKit (if available)
  if (PDFDocument) {
    try {
      const doc = new PDFDocument();
      const invoicePath = path.join(__dirname, '../../uploads/invoices', `${invoiceData.invoiceNumber}.pdf`);
      const writeStream = fs.createWriteStream(invoicePath);
      doc.pipe(writeStream);
      
      // Add invoice content
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice Number: ${invoiceData.invoiceNumber}`);
      doc.text(`Deal Number: ${invoiceData.dealNumber}`);
      doc.text(`Date: ${invoiceData.date.toLocaleDateString()}`);
      doc.moveDown();
      doc.text(`Trader: ${invoiceData.trader.companyName}`);
      doc.text(`Client: ${invoiceData.client.name}`);
      doc.moveDown();
      doc.text(`Subtotal: $${invoiceData.subtotal}`);
      doc.text(`Platform Commission: $${invoiceData.platformCommission}`);
      doc.text(`Employee Commission: $${invoiceData.employeeCommission}`);
      doc.fontSize(14).text(`Total: $${invoiceData.total}`, { align: 'right' });
      
      doc.end();
      
      // Update invoice URL
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { invoiceUrl: `/uploads/invoices/${invoiceData.invoiceNumber}.pdf` }
      });
    } catch (error) {
      console.error('Error generating PDF invoice:', error);
      // Continue without PDF
    }
  }

  return invoice;
}

/**
 * @desc    Get Financial Transactions
 * @route   GET /api/financial/transactions
 * @access  Private (Admin/Employee)
 */
const getFinancialTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status, dealId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (type) where.type = type;
  if (status) where.status = status;
  if (dealId) where.dealId = parseInt(dealId);

  // Filter by user role - for employees, filter by deals they're responsible for
  if (req.userType === 'EMPLOYEE') {
    // Get all deals for this employee
    const employeeDeals = await prisma.deal.findMany({
      where: { employeeId: req.user.id },
      select: { id: true }
    });
    const dealIds = employeeDeals.map(d => d.id);
    
    if (dealIds.length === 0) {
      return paginatedResponse(res, [], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }, 'Financial transactions retrieved successfully');
    }
    
    where.dealId = { in: dealIds };
  }

  const [transactions, total] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        payment: {
          include: {
            deal: {
              select: {
                id: true,
                dealNumber: true,
                trader: {
                  select: {
                    id: true,
                    name: true,
                    companyName: true
                  }
                },
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        deal: {
          select: {
            id: true,
            dealNumber: true,
            trader: {
              select: {
                id: true,
                name: true,
                companyName: true
              }
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.financialTransaction.count({ where })
  ]);

  paginatedResponse(res, transactions, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Financial transactions retrieved successfully');
});

/**
 * @desc    Get Financial Ledger
 * @route   GET /api/financial/ledger
 * @access  Private (Admin)
 */
const getFinancialLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, accountType, accountId, startDate, endDate } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (accountType) where.accountType = accountType;
  if (accountId) where.accountId = parseInt(accountId);
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [entries, total] = await Promise.all([
    prisma.financialLedger.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        // Include transaction details if needed
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.financialLedger.count({ where })
  ]);

  paginatedResponse(res, entries, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Ledger entries retrieved successfully');
});

/**
 * @desc    Settle Deal (Finalize after payment)
 * @route   PUT /api/deals/:id/settle
 * @access  Private (Employee/Admin)
 */
const settleDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deal = await prisma.deal.findFirst({
    where: {
      id: parseInt(id),
      status: 'PAID'
    },
    include: {
      payments: {
        where: {
          status: 'COMPLETED'
        }
      }
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot be settled', 404);
  }

  if (deal.payments.length === 0) {
    return errorResponse(res, 'No completed payments found', 400);
  }

  // Update deal status
  const updatedDeal = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      status: 'SETTLED',
      settledAt: new Date()
    }
  });

  // Create status history
  await prisma.dealStatusHistory.create({
    data: {
      dealId: deal.id,
      status: 'SETTLED',
      description: 'Deal settled and completed',
      changedBy: req.user.id,
      changedByType: req.userType
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'DEAL_SETTLED',
      entityType: 'DEAL',
      entityId: deal.id,
      description: `${req.userType} settled deal ${deal.dealNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify all parties
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: deal.clientId,
        userType: 'CLIENT',
        type: 'DEAL',
        title: 'Deal Settled',
        message: `Deal ${deal.dealNumber} has been settled`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      }
    }),
    prisma.notification.create({
      data: {
        userId: deal.traderId,
        userType: 'TRADER',
        type: 'DEAL',
        title: 'Deal Settled',
        message: `Deal ${deal.dealNumber} has been settled`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      }
    }),
    prisma.notification.create({
      data: {
        userId: deal.employeeId,
        userType: 'EMPLOYEE',
        type: 'DEAL',
        title: 'Deal Settled',
        message: `Deal ${deal.dealNumber} has been settled`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      }
    })
  ]);

  successResponse(res, updatedDeal, 'Deal settled successfully');
});

module.exports = {
  processPayment,
  verifyPayment,
  getFinancialTransactions,
  getFinancialLedger,
  settleDeal
};

