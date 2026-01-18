const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkEmployeeTraderRelation, checkEmployeeDealRelation } = require('../middleware/mediationAuth');
const multer = require('multer');
const path = require('path');

// Multer configuration for Excel uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/offers');
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
const offerController = require('../controllers/mediation/offer.controller');
const dealController = require('../controllers/mediation/deal.controller');
const negotiationController = require('../controllers/mediation/negotiation.controller');
const financialController = require('../controllers/mediation/financial.controller');

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

// Trader routes
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
router.get('/deals', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), dealController.getDeals);
router.get('/deals/:id', protect, authorize('ADMIN', 'EMPLOYEE', 'TRADER', 'CLIENT'), dealController.getDealById);
router.post('/deals/:id/items', protect, authorize('CLIENT', 'TRADER'), dealController.addDealItems);

// Trader routes
router.put('/traders/deals/:id/approve', protect, authorize('TRADER'), dealController.approveDeal);

// Employee/Admin routes
router.put('/deals/:id/settle', protect, authorize('ADMIN', 'EMPLOYEE'), checkEmployeeDealRelation, dealController.settleDeal);

// ============================================
// NEGOTIATION ROUTES
// ============================================

router.post('/deals/:dealId/negotiations', protect, authorize('CLIENT', 'TRADER'), negotiationController.sendNegotiationMessage);
router.get('/deals/:dealId/negotiations', protect, authorize('ADMIN', 'EMPLOYEE', 'CLIENT', 'TRADER'), negotiationController.getNegotiationMessages);
router.put('/deals/:dealId/negotiations/read', protect, authorize('CLIENT', 'TRADER'), negotiationController.markMessagesAsRead);

// ============================================
// FINANCIAL ROUTES
// ============================================

// Client routes
router.post('/deals/:dealId/payments', protect, authorize('CLIENT'), financialController.processPayment);

// Employee routes
router.put('/employees/payments/:id/verify', protect, authorize('EMPLOYEE'), checkEmployeeDealRelation, financialController.verifyPayment);

// Admin/Employee routes
router.get('/financial/transactions', protect, authorize('ADMIN', 'EMPLOYEE'), financialController.getFinancialTransactions);
router.get('/financial/ledger', protect, authorize('ADMIN'), financialController.getFinancialLedger);

module.exports = router;

