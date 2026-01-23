const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkEmployeeTraderRelation, checkEmployeeDealRelation } = require('../middleware/mediationAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for Excel uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/offers');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `offer-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Import controllers
const employeeController = require('../controllers/mediation/employee.controller');
const traderController = require('../controllers/mediation/trader.controller');
const traderUpdateRequestController = require('../controllers/mediation/traderUpdateRequest.controller');
const offerController = require('../controllers/mediation/offer.controller');
const dealController = require('../controllers/mediation/deal.controller');
const negotiationController = require('../controllers/mediation/negotiation.controller');
const financialController = require('../controllers/mediation/financial.controller');
const invoiceController = require('../controllers/mediation/invoice.controller');
const shippingTrackingController = require('../controllers/mediation/shippingTracking.controller');

// ============================================
// EMPLOYEE ROUTES
// ============================================

// Admin routes
router.post('/admin/employees', protect, authorize('ADMIN'), employeeController.createEmployee);
router.get('/admin/employees', protect, authorize('ADMIN', 'MODERATOR'), employeeController.getAllEmployees); // Added MODERATOR
router.get('/admin/employees/:id', protect, authorize('ADMIN'), employeeController.getEmployeeById);
router.put('/admin/employees/:id', protect, authorize('ADMIN'), employeeController.updateEmployee);

// Employee routes (self-access)
// IMPORTANT: Specific routes must come BEFORE parameterized routes to avoid route conflicts
// Employee offers route (specific) - must come before /employees/:id
router.get('/employees/offers', protect, authorize('EMPLOYEE'), offerController.getEmployeeOffers);
router.put('/employees/offers/:id/validate', protect, authorize('EMPLOYEE'), checkEmployeeTraderRelation, offerController.validateOffer);
router.put('/employees/offers/:id', protect, authorize('EMPLOYEE'), checkEmployeeTraderRelation, offerController.updateOffer);
router.delete('/employees/offers/:id', protect, authorize('EMPLOYEE'), checkEmployeeTraderRelation, offerController.deleteOffer);
router.post('/employees/offers/:id/upload-excel', protect, authorize('EMPLOYEE'), checkEmployeeTraderRelation, upload.single('excelFile'), offerController.uploadOfferExcelEmployee);
// Employee shipping tracking route
router.get('/employees/shipping-tracking', protect, authorize('EMPLOYEE'), shippingTrackingController.getEmployeeShippingTracking);

// Employee general routes (parameterized) - must come AFTER specific routes
router.get('/employees/:id', protect, authorize('ADMIN', 'EMPLOYEE'), employeeController.getEmployeeById);
router.get('/employees/:id/traders', protect, authorize('ADMIN', 'EMPLOYEE'), employeeController.getEmployeeTraders);
router.get('/employees/:id/deals', protect, authorize('ADMIN', 'EMPLOYEE'), employeeController.getEmployeeDeals);
router.get('/employees/:id/dashboard', protect, authorize('ADMIN', 'EMPLOYEE'), employeeController.getEmployeeDashboard);

// ============================================
// TRADER ROUTES
// ============================================

// Admin routes
router.get('/admin/traders', protect, authorize('ADMIN', 'MODERATOR'), traderController.getAllTraders); // Added MODERATOR
router.delete('/admin/traders/:id', protect, authorize('ADMIN'), traderController.deleteTrader);

// Employee creates trader
router.post('/employees/:employeeId/traders', protect, authorize('EMPLOYEE'), traderController.createTrader);

// ============================================
// TRADER UPDATE REQUEST ROUTES (Must come before /traders/:id routes)
// ============================================

// Trader routes
router.post('/traders/update-request', protect, authorize('TRADER'), traderUpdateRequestController.createUpdateRequest);
router.get('/traders/update-requests', protect, authorize('TRADER'), traderUpdateRequestController.getTraderUpdateRequests);
router.put('/traders/update-requests/:id/cancel', protect, authorize('TRADER'), traderUpdateRequestController.cancelUpdateRequest);

// Admin/Employee routes for trader update requests
router.get('/admin/trader-update-requests', protect, authorize('ADMIN', 'EMPLOYEE'), traderUpdateRequestController.getAllUpdateRequests);
router.get('/admin/trader-update-requests/:id', protect, authorize('ADMIN', 'EMPLOYEE'), traderUpdateRequestController.getUpdateRequestById);
router.put('/admin/trader-update-requests/:id/approve', protect, authorize('ADMIN', 'EMPLOYEE'), traderUpdateRequestController.approveUpdateRequest);
router.put('/admin/trader-update-requests/:id/reject', protect, authorize('ADMIN', 'EMPLOYEE'), traderUpdateRequestController.rejectUpdateRequest);

// Trader routes (general - must come after specific routes)
router.post('/traders/register', protect, authorize('CLIENT'), traderController.registerTrader); // New registration route
router.get('/traders/check-linked', protect, authorize('CLIENT'), traderController.checkLinkedTrader);
router.get('/traders/:id', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'MODERATOR'), traderController.getTraderById); // Added MODERATOR
router.get('/traders/:id/offers', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'MODERATOR'), traderController.getTraderOffers); // Added MODERATOR
router.put('/traders/:id', protect, authorize('ADMIN', 'EMPLOYEE', 'MODERATOR'), traderController.updateTrader); // Added MODERATOR for verification
router.put('/traders/:id/assign', protect, authorize('ADMIN', 'MODERATOR'), traderController.assignTrader); // New route for assignment

// Public trader routes
router.get('/traders/:id/public', traderController.getTraderByIdPublic);
router.get('/traders/:id/offers/public', traderController.getTraderOffersPublic);

// ============================================
// OFFER ROUTES
// ============================================

// Admin routes
router.get('/admin/offers', protect, authorize('ADMIN'), offerController.getAllOffers);

// Public routes
// Note: /offers/:id, /offers/recommended, and /offers/by-category routes are now handled by offerRoutes in index.js to avoid route conflicts
// These routes have been moved to offer.routes.js to ensure proper route ordering
// router.get('/offers/:id', offerController.getOfferById); // Removed - handled by offerRoutes
// router.get('/offers/recommended', offerController.getRecommendedOffers); // Removed - handled by offerRoutes
// router.get('/offers/by-category/:categoryId', offerController.getOffersByCategory); // Removed - handled by offerRoutes

// Trader routes
router.post('/traders/offers', protect, authorize('TRADER'), offerController.createOffer);
router.post('/traders/offers/:id/upload-excel', protect, authorize('TRADER'), upload.single('excelFile'), offerController.uploadOfferExcel);

// Employee offer management routes moved above to prevent route conflicts

// ============================================
// DEAL ROUTES
// ============================================

// Client routes
router.post('/offers/:offerId/request-negotiation', protect, authorize('CLIENT'), dealController.requestNegotiation);
router.post('/offers/:offerId/request-negotiation/public', dealController.requestNegotiationPublic);
router.get('/deals', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), dealController.getDeals);

// ============================================
// NEGOTIATION ROUTES (must come before /deals/:id to avoid route conflicts)
// ============================================

// IMPORTANT: These routes MUST come before /deals/:id to avoid route conflicts
// Express matches routes in order, so more specific routes must come first
router.post('/deals/:dealId/negotiations', protect, authorize('CLIENT', 'TRADER', 'EMPLOYEE'), async (req, res, next) => {
  console.log('✅ NEGOTIATIONS ROUTE HIT!', req.method, req.path, req.params);
  console.log('✅ User Type:', req.userType);
  console.log('✅ User ID:', req.user?.id);
  return negotiationController.sendNegotiationMessage(req, res, next);
});
router.get('/deals/:dealId/negotiations', protect, authorize('ADMIN', 'EMPLOYEE', 'CLIENT', 'TRADER'), negotiationController.getNegotiationMessages);
router.put('/deals/:dealId/negotiations/read', protect, authorize('CLIENT', 'TRADER'), negotiationController.markMessagesAsRead);

// ============================================
// DEAL ROUTES (more specific routes first)
// ============================================

// Shipping Tracking routes (must come before /deals/:id)
router.get('/deals/:dealId/shipping-tracking', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), shippingTrackingController.getShippingTracking);
router.post('/deals/:dealId/shipping-tracking', protect, authorize('ADMIN', 'EMPLOYEE'), checkEmployeeDealRelation, shippingTrackingController.createOrUpdateShippingTracking);
router.put('/deals/:dealId/shipping-tracking/status', protect, authorize('ADMIN', 'EMPLOYEE'), checkEmployeeDealRelation, shippingTrackingController.updateShippingStatus);

// Financial routes (must come before /deals/:id)
router.post('/deals/:dealId/payments', protect, authorize('CLIENT'), financialController.processPayment);
router.get('/deals/:dealId/invoices', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), invoiceController.getInvoicesByDeal);

// Deal item routes (must come before /deals/:id)
router.post('/deals/:id/items', protect, authorize('CLIENT', 'TRADER'), dealController.addDealItems);

// Deal action routes (must come before /deals/:id)
router.put('/deals/:id/settle', protect, authorize('ADMIN', 'EMPLOYEE'), checkEmployeeDealRelation, dealController.settleDeal);
router.put('/deals/:id/assign-shipping', protect, authorize('ADMIN', 'EMPLOYEE'), checkEmployeeDealRelation, dealController.assignShippingCompany);

// Trader routes
router.put('/traders/deals/:id/approve', protect, authorize('TRADER'), dealController.approveDeal);

// General deal routes (must come last)
router.get('/deals/:id', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), dealController.getDealById);

// ============================================
// FINANCIAL ROUTES
// ============================================

// Employee routes
router.put('/employees/payments/:id/verify', protect, authorize('EMPLOYEE'), checkEmployeeDealRelation, financialController.verifyPayment);

// Admin/Employee routes
router.get('/financial/transactions', protect, authorize('ADMIN', 'EMPLOYEE'), financialController.getFinancialTransactions);
router.get('/financial/ledger', protect, authorize('ADMIN'), financialController.getFinancialLedger);

// ============================================
// INVOICE ROUTES
// ============================================

router.get('/invoices/:id', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), invoiceController.getInvoiceById);
router.get('/invoices/:id/download', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), invoiceController.downloadInvoicePDF);
router.get('/deals/:dealId/invoices', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), invoiceController.getInvoicesByDeal);

module.exports = router;

