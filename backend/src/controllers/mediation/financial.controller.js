const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { notifyPaymentVerified } = require('../../utils/notificationHelper');
const { generateInvoiceWithQRCode } = require('../../services/invoice.service');
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
      id: dealId,
      clientId: req.user.id,
      status: { in: ['APPROVED', 'PAID'] }
    },
    include: {
      trader: {
        include: {
          employee: true
        }
      },
      client: true,
      employee: true,
      items: {
        include: {
          offerItem: true
        }
      }
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found or cannot process payment', 404);
  }

  if (!deal.negotiatedAmount) {
    return errorResponse(res, 'Deal amount not negotiated yet', 400);
  }

  // Parse amounts safely (Prisma Decimal may be object or string)
  const toNum = (v) => {
    if (v == null) return NaN;
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    const n = parseFloat(String(v));
    return Number.isNaN(n) ? NaN : n;
  };

  // Calculate total amount including commissions
  const platformSettings = await prisma.platformSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  const platformCommissionRate = toNum(platformSettings?.platformCommissionRate) || 2.5;
  const shippingCommissionRate = toNum(platformSettings?.shippingCommissionRate) || 5.0;
  const employeeCommissionRate = toNum(deal.employee?.commissionRate) || 1.0;

  const dealAmount = toNum(deal.negotiatedAmount);
  if (Number.isNaN(dealAmount) || dealAmount <= 0) {
    return errorResponse(res, 'Deal amount not negotiated yet', 400);
  }
  const platformCommission = (dealAmount * platformCommissionRate) / 100;
  const shippingCommission = (dealAmount * shippingCommissionRate) / 100;
  const employeeCommission = (dealAmount * employeeCommissionRate) / 100;
  const totalAmount = Math.round((dealAmount + platformCommission + shippingCommission + employeeCommission) * 100) / 100;
  const amountNum = Math.round(toNum(amount) * 100) / 100;

  if (Number.isNaN(amountNum) || Math.abs(amountNum - totalAmount) > 0.02) {
    return errorResponse(res, `Payment amount must be ${totalAmount.toFixed(2)} (includes commissions)`, 400);
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      dealId: deal.id,
      clientId: req.user.id,
      amount: amountNum,
      method,
      status: 'PENDING',
      transactionId: transactionId || null,
      receiptUrl: receiptUrl || null
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      clientId: req.user.id,
      userType: 'CLIENT',
      action: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      dealId: deal.id,
      description: `Client initiated payment for deal ${deal.dealNumber}`,
      metadata: JSON.stringify({
        paymentId: payment.id,
        amount,
        method,
        transactionId
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify employee (payment initiated - visible in employee dashboard)
  await prisma.notification.create({
    data: {
      userId: deal.employeeId,
      userType: 'EMPLOYEE',
      type: 'PAYMENT',
      title: 'تم استلام طلب الدفع',
      message: `العميل أرسل طلب دفع للمبلغ ${amount} لصفقة ${deal.dealNumber} - بانتظار التحقق`,
      relatedEntityType: 'PAYMENT',
      relatedEntityId: payment.id
    }
  });

  // Notify client (payment submitted - visible for client)
  await prisma.notification.create({
    data: {
      userId: deal.clientId,
      userType: 'CLIENT',
      type: 'PAYMENT',
      title: 'تم إرسال طلب الدفع',
      message: `تم إرسال طلب الدفع بنجاح لصفقة ${deal.dealNumber} - بانتظار تحقق الموظف`,
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
    where: { id },
    include: {
      deal: {
        include: {
          trader: {
            include: {
              employee: true
            }
          },
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

  if (!payment) {
    return errorResponse(res, 'Payment not found', 404);
  }

  // Verify employee is the guarantor
  if (payment.deal.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to verify this payment', 403);
  }

  if (payment.status !== 'PENDING') {
    return errorResponse(res, `Payment already ${payment.status === 'COMPLETED' ? 'verified' : 'processed'}. Cannot verify again.`, 400);
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
        employeeId: req.user.id,
        userType: 'EMPLOYEE',
        action: 'PAYMENT_VERIFIED',
        entityType: 'PAYMENT',
        dealId: payment.dealId,
        description: `Employee verified payment for deal ${payment.deal.dealNumber}`,
        metadata: JSON.stringify({ paymentId: payment.id }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Notify client, trader, and employee
    await notifyPaymentVerified(payment, payment.deal);
  }

  successResponse(res, updatedPayment, `Payment ${verified ? 'verified' : 'rejected'} successfully`);
});

/**
 * @desc    Calculate and distribute commissions
 * @private
 */
async function calculateAndDistributeCommissions(deal, payment) {
  // Get platform settings for commission rates
  let platformSettings = await prisma.platformSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  // Default values if no settings found
  const platformCommissionRate = platformSettings?.platformCommissionRate 
    ? parseFloat(platformSettings.platformCommissionRate) 
    : 2.5; // 2.5% default
  const shippingCommissionRate = platformSettings?.shippingCommissionRate 
    ? parseFloat(platformSettings.shippingCommissionRate) 
    : 5.0; // 5% default for shipping commission
  const cbmRate = platformSettings?.cbmRate 
    ? parseFloat(platformSettings.cbmRate) 
    : null; // No CBM rate by default
  const commissionMethod = platformSettings?.commissionMethod || 'PERCENTAGE'; // PERCENTAGE, CBM, BOTH
  const employeeCommissionRate = deal.employee?.commissionRate != null ? parseFloat(deal.employee.commissionRate) : 1.0; // Employee's rate

  // The deal amount (negotiated amount) - this is what the buyer pays for the products
  const dealAmount = parseFloat(deal.negotiatedAmount) || parseFloat(payment.amount);
  const totalCBM = parseFloat(deal.totalCBM) || 0;

  // Calculate platform commission based on method (based on deal amount)
  let platformCommission = 0;
  let cbmBasedCommission = null;
  let usedMethod = commissionMethod;

  if (commissionMethod === 'PERCENTAGE') {
    // Use percentage-based commission only
    platformCommission = (dealAmount * platformCommissionRate) / 100;
  } else if (commissionMethod === 'CBM' && cbmRate) {
    // Use CBM-based commission only
    cbmBasedCommission = totalCBM * cbmRate;
    platformCommission = cbmBasedCommission;
  } else if (commissionMethod === 'BOTH' && cbmRate) {
    // Use both methods and take the higher value
    const percentageCommission = (dealAmount * platformCommissionRate) / 100;
    cbmBasedCommission = totalCBM * cbmRate;
    platformCommission = Math.max(percentageCommission, cbmBasedCommission);
    usedMethod = percentageCommission >= cbmBasedCommission ? 'PERCENTAGE' : 'CBM';
  } else {
    // Fallback to percentage if CBM rate not set
    platformCommission = (dealAmount * platformCommissionRate) / 100;
    usedMethod = 'PERCENTAGE';
  }

  // Calculate shipping commission (5% of deal amount, paid by buyer)
  const shippingCommission = (dealAmount * shippingCommissionRate) / 100;

  // Calculate employee commission (based on deal amount)
  const employeeCommission = (dealAmount * employeeCommissionRate) / 100;

  // Total amount buyer pays = deal amount + all commissions
  const totalAmount = dealAmount + platformCommission + shippingCommission + employeeCommission;

  // Trader receives only the deal amount (all commissions are deducted)
  const traderAmount = dealAmount;

  // Create financial transaction (schema: no totalCBM, cbmBasedCommission, cbmRate, commissionMethod)
  const transaction = await prisma.financialTransaction.create({
    data: {
      dealId: deal.id,
      paymentId: payment.id,
      type: 'DEPOSIT',
      amount: totalAmount,
      status: 'COMPLETED',
      description: `Payment for deal ${deal.dealNumber} (includes commissions)`,
      platformCommission,
      employeeCommission,
      traderAmount,
      employeeId: deal.employeeId,
      traderId: deal.traderId,
      processedBy: deal.employeeId,
      processedAt: new Date()
    }
  });

  // Create ledger entries
  const ledgerEntries = [
    // Client payment (DEBIT from client, CREDIT to platform) - Total amount including all commissions
    {
      transactionId: transaction.id,
      entryType: 'DEBIT',
      accountType: 'CLIENT',
      accountId: deal.clientId,
      amount: totalAmount,
      balanceBefore: 0, // Would need to track client balance
      balanceAfter: 0,
      description: `Payment for deal ${deal.dealNumber} (includes all commissions)`,
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
    // Shipping commission (CREDIT to platform - shipping commission goes to platform)
    {
      transactionId: transaction.id,
      entryType: 'CREDIT',
      accountType: 'PLATFORM',
      accountId: null,
      amount: shippingCommission,
      balanceBefore: 0,
      balanceAfter: 0,
      description: `Shipping commission for deal ${deal.dealNumber} (paid by buyer)`,
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
    // Trader payout (CREDIT to trader) - Only the deal amount
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
  try {
    // Get platform settings for company info
    const platformSettings = await prisma.platformSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    const platformInfo = platformSettings ? {
      name: platformSettings.platformName || 'Stockship',
      email: platformSettings.platformEmail || null,
      phone: platformSettings.platformPhone || null,
      address: platformSettings.platformAddress || null
    } : null;

    // Generate invoice number if not exists
    const invoiceNumber = deal.invoiceNumber || (() => {
      const year = new Date().getFullYear();
      return `INV-${year}-${String(Date.now()).slice(-6)}`;
    })();

    // Calculate shipping commission from platform settings (already fetched above)
    const shippingCommissionRate = platformSettings?.shippingCommissionRate || 5.0;
    const dealAmount = parseFloat(deal.negotiatedAmount) || parseFloat(payment.amount);
    const shippingCommission = (dealAmount * shippingCommissionRate) / 100;

    // Create invoice record first
    const invoice = await prisma.invoice.create({
      data: {
        dealId: deal.id,
        invoiceNumber,
        invoiceUrl: `/uploads/invoices/${invoiceNumber}.pdf`, // Will be updated
        status: 'SENT',
        subtotal: dealAmount, // Deal amount (product price)
        platformCommission: transaction.platformCommission,
        shippingCommission: shippingCommission, // Shipping commission (paid by buyer)
        employeeCommission: transaction.employeeCommission,
        traderAmount: transaction.traderAmount,
        total: payment.amount, // Total amount paid by buyer (including all commissions)
        issuedAt: new Date()
      }
    });

    // Get deal with all relations for invoice generation
    const dealWithRelations = await prisma.deal.findUnique({
      where: { id: deal.id },
      include: {
        trader: true,
        client: true,
        items: {
          include: {
            offerItem: true
          }
        }
      }
    });

    // Generate invoice PDF with QR code
    const invoiceResult = await generateInvoiceWithQRCode(invoice, dealWithRelations, platformInfo);

    // Update invoice with QR code URL and correct PDF URL
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        qrCodeUrl: invoiceResult.qrCodeUrl,
        invoiceUrl: invoiceResult.pdfUrl
      }
    });

    return updatedInvoice;
  } catch (error) {
    console.error('Error generating invoice:', error);
    // Return invoice even if PDF generation fails
    // But invoice might not be defined if error occurred before creation
    if (typeof invoice !== 'undefined') {
      return invoice;
    }
    throw error;
  }
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

