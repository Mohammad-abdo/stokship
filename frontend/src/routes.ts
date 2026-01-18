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
  
  // Payment pages
  PAYMENT_ONE: "/PaymentPageOne",
  REQUEST_SENT: "/RequestSent",
  
  // Other pages
  NOTIFICATION: "/Notification",
  COMPANY_PROFILE: "/CompanyProfilePage",
  TERMS_AND_POLICIES: "/TermsAndPolicies",
  
  // Seller page (placeholder - can be created later)
  SELLER: "/seller",
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

