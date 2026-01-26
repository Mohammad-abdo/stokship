/**
 * Route constants for the application
 * Use these constants instead of hardcoded strings to ensure consistency
 */

export const ROUTES = {
  // Main pages
  HOME: "/",
  HOME_ALT: "/home",
  
  // Product pages
  PRODUCT_DETAILS: "/ProductDetails",
  PRODUCTS_LIST: "/ProductsListPage",
  SELLER_PRODUCTS: "/SellerProducts",
  OFFER_DETAILS: "/offers",
  VIDEO_AD_DETAILS: "/video-ads",
  
  // Auth pages
  LOGIN: "/login",
  MULTI_LOGIN: "/multi-login",
  SIGNUP: "/signup",
  SIGNUP_BANK_INFO: "/SignupBankInfoFormPage",
  
  // Order pages
  ORDERS: "/OrdersPage",
  ORDER_CHECKOUT: "/OrderCheckout",
  ORDER_CHECKOUT_TWO: "/OrderCheckoutPageTwo",
  ORDER_TRACKING: "/OrderTrackingCardPage",
  NEGOTIATIONS: "/NegotiationsPage",
  NEGOTIATION_DETAIL: "/NegotiationDetail",
  
  // Payment pages
  PAYMENT_ONE: "/PaymentPageOne",
  REQUEST_SENT: "/RequestSent",
  
  // Other pages
  NOTIFICATION: "/Notification",
  COMPANY_PROFILE: "/CompanyProfilePage",
  COMPANY_PROFILE_WITH_ID: "/CompanyProfilePage/:traderId",
  TERMS_AND_POLICIES: "/TermsAndPolicies",
  
  // Seller page (placeholder - can be created later)
  SELLER: "/seller",
  TRADER_DASHBOARD: "/trader-dashboard",
  TRADER_OFFERS: "/trader-dashboard/offers",
  TRADER_OFFER_DETAILS: "/trader-dashboard/offers/:id",
  TRADER_DEALS: "/trader-dashboard/deals",
  TRADER_DEAL_DETAILS: "/trader-dashboard/deals/:id",
  PUBLISH_AD: "/PublishAd",
  
  // Profile page
  PROFILE: "/profile",

  // Moderator page
  MODERATOR_DASHBOARD: "/moderator-dashboard",
  
  // 404 page
  NOT_FOUND: "/404",
} as const;

/**
 * Helper function to generate product details URL
 */
export function getProductDetailsUrl(productId: string | number): string {
  return `${ROUTES.PRODUCT_DETAILS}/${productId}`;
}

/**
 * Helper function to generate order tracking URL
 */
export function getOrderTrackingUrl(orderId: string | number): string {
  return `${ROUTES.ORDER_TRACKING}/${orderId}`;
}

/**
 * Helper function to generate seller products URL
 */
export function getSellerProductsUrl(sellerId: string | number): string {
  return `${ROUTES.SELLER_PRODUCTS}/${sellerId}`;
}

/**
 * Helper function to generate company profile URL
 */
export function getCompanyProfileUrl(traderId: string | number): string {
  return `${ROUTES.COMPANY_PROFILE}/${traderId}`;
}
