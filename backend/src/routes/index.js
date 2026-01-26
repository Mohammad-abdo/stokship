const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vendorRoutes = require('./vendor.routes');
const adminRoutes = require('./admin.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const cartRoutes = require('./cart.routes');
const wishlistRoutes = require('./wishlist.routes');
const paymentRoutes = require('./payment.routes');
const walletRoutes = require('./wallet.routes');
const notificationRoutes = require('./notification.routes');
const supportRoutes = require('./support.routes');
const searchRoutes = require('./search.routes');
const seoRoutes = require('./seo.routes');
const exportImportRoutes = require('./exportImport.routes');
const analyticsRoutes = require('./analytics.routes');
const negotiationRoutes = require('./negotiation.routes');
const priceRequestRoutes = require('./priceRequest.routes');
const orderAcceptanceRoutes = require('./orderAcceptance.routes');
const reviewRoutes = require('./review.routes');
const shippingRoutes = require('./shipping.routes');
const inventoryRoutes = require('./inventory.routes');
const supplierRoutes = require('./supplier.routes');
const checkoutRoutes = require('./checkout.routes');
const pointRoutes = require('./point.routes');
const offerRoutes = require('./offer.routes');
const couponRoutes = require('./coupon.routes');
const listingRoutes = require('./listing.routes');
const homepageRoutes = require('./homepage.routes');
const companyRoutes = require('./company.routes');
const contentRoutes = require('./content.routes');
const contentPageRoutes = require('./contentPage.routes');
const translationRoutes = require('./translation.routes');
const uploadRoutes = require('./upload.routes');
const activityLogRoutes = require('./activityLog.routes');
const securityRoutes = require('./security.routes');
const realtimeRoutes = require('./realtime.routes');
const mediationRoutes = require('./mediation.routes');
const sliderRoutes = require('./slider.routes');
const videoAdRoutes = require('./videoAd.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallets', walletRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/search', searchRoutes);
router.use('/seo', seoRoutes);
router.use('/export', exportImportRoutes);
router.use('/import', exportImportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/negotiations', negotiationRoutes);
// Price requests are handled in product routes
// Order acceptance is handled in order routes
router.use('/reviews', reviewRoutes);
router.use('/shipping', shippingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/points', pointRoutes);
router.use('/coupons', couponRoutes);
router.use('/listings', listingRoutes);
router.use('/home', homepageRoutes);
router.use('/companies', companyRoutes);
router.use('/content', contentRoutes);
// Mediation platform routes - mount BEFORE /offers to ensure proper matching
// This ensures /traders/support-tickets is matched before /offers routes
router.use('/', mediationRoutes);
router.use('/offers', offerRoutes); // Using mediation controller for getOfferById
router.use('/', contentPageRoutes); // Content pages and activity logs routes
router.use('/translations', translationRoutes);
router.use('/upload', uploadRoutes);
router.use('/audit', activityLogRoutes);
router.use('/security', securityRoutes);
router.use('/realtime', realtimeRoutes);
router.use('/sliders', sliderRoutes);
router.use('/video-ads', videoAdRoutes);

module.exports = router;

