# Stockship Database - Entity Relationship Diagram

## Complete ERD

```mermaid
erDiagram
    %% Core User Entities
    User ||--o{ Cart : has
    User ||--o{ Order : places
    User ||--o{ Payment : makes
    User ||--o{ ShippingAddress : has
    User ||--o{ Wishlist : has
    User ||--o{ WishlistItem : has_items
    User ||--o{ Notification : receives
    User ||--o{ SupportTicket : creates
    User ||--o{ Review : writes
    User ||--o{ Negotiation : initiates
    User ||--o{ PriceRequest : requests
    User ||--o{ BankAccount : has
    User ||--o{ UserWallet : has
    User ||--o{ CreditTransaction : has
    User ||--o{ PaymentTermsAcceptance : accepts
    User ||--o{ PointSystem : has
    User ||--o{ PointTransaction : earns
    User ||--o{ CouponUsage : uses
    User ||--o{ OrderTracking : tracks
    User ||--o{ SavedSearch : saves
    User ||--o{ SearchHistory : searches
    User ||--o{ ActivityLog : performs
    User ||--o{ UserSession : has_sessions
    User ||--o{ LoginHistory : logs_in
    User ||--o{ TwoFactorAuth : has_2fa
    User ||--o{ SocialAuth : has_social
    User ||--o{ ExportHistory : exports
    User ||--o{ ImportHistory : imports

    Vendor ||--o{ Product : creates
    Vendor ||--o{ Order : receives
    Vendor ||--o{ VendorWallet : has
    Vendor ||--o{ BankAccount : has
    Vendor ||--o{ ProductListing : creates
    Vendor ||--o{ Negotiation : responds_to
    Vendor ||--o{ PriceRequest : responds_to
    Vendor ||--o{ OrderAcceptance : manages
    Vendor ||--o{ Review : receives
    Vendor ||--o{ PayoutRequest : requests
    Vendor ||--o{ WalletTransaction : has
    Vendor ||--o{ ProductOffer : creates
    Vendor ||--o{ Coupon : creates
    Vendor ||--o{ PointSystem : has
    Vendor ||--o{ PointTransaction : earns
    Vendor ||--o{ OrderTracking : updates
    Vendor ||--o{ ActivityLog : performs
    Vendor ||--o{ UserSession : has_sessions
    Vendor ||--o{ LoginHistory : logs_in
    Vendor ||--o{ TwoFactorAuth : has_2fa
    Vendor ||--o{ SocialAuth : has_social
    Vendor ||--o{ ExportHistory : exports
    Vendor ||--o{ ImportHistory : imports
    Vendor }o--|| Admin : approved_by
    Vendor }o--|| Admin : suspended_by

    Admin ||--o{ Product : approves
    Admin ||--o{ Vendor : approves
    Admin ||--o{ Vendor : suspends
    Admin ||--o{ VendorWallet : manages
    Admin ||--o{ PayoutRequest : approves
    Admin ||--o{ WalletTransaction : processes
    Admin ||--o{ SiteSettings : updates
    Admin ||--o{ AdminPermission : grants
    Admin ||--o{ Admin : creates
    Admin ||--o{ SupportTicketMessage : responds
    Admin ||--o{ ProductOffer : approves
    Admin ||--o{ Coupon : creates
    Admin ||--o{ PointRule : creates
    Admin ||--o{ PointTransaction : adjusts
    Admin ||--o{ OrderTracking : manages
    Admin ||--o{ ProductReview : reviews
    Admin ||--o{ GlobalSEO : manages
    Admin ||--o{ ContentPage : manages
    Admin ||--o{ SEOAnalytics : views
    Admin ||--o{ ActivityLog : performs
    Admin ||--o{ AuditTrail : creates
    Admin ||--o{ UserSession : has_sessions
    Admin ||--o{ LoginHistory : logs_in
    Admin ||--o{ TwoFactorAuth : has_2fa
    Admin ||--o{ SocialAuth : has_social
    Admin ||--o{ ExportHistory : exports
    Admin ||--o{ ImportHistory : imports
    Admin ||--o{ TranslationKey : manages

    %% Product Related
    Product ||--o{ ProductImage : has
    Product ||--o{ ProductSubCategory : has_subcategories
    Product ||--o{ ProductOffer : has_offers
    Product ||--o{ ProductReview : reviewed
    Product ||--o{ OrderItem : included_in
    Product ||--o{ CartItem : added_to
    Product ||--o{ CheckoutItem : in_checkout
    Product ||--o{ WishlistItem : favorited_in
    Product ||--o{ Negotiation : negotiated
    Product ||--o{ PriceRequest : requested
    Product ||--o{ SEOAnalytics : has_seo_analytics
    Product ||--o{ TranslationKey : has_translations
    Product }o--|| Category : belongs_to_main
    Product }o--|| Vendor : created_by
    Product }o--|| Admin : approved_by
    Product }o--|| Admin : rejected_by
    Product }o--o| ProductListing : linked_to

    Category ||--o{ Product : contains_main
    Category ||--o{ ProductSubCategory : contains_subcategories
    Category ||--o{ ProductListing : contains
    Category ||--o{ Category : parent_of
    Category ||--o{ SEOAnalytics : has_seo_analytics
    Category ||--o{ TranslationKey : has_translations
    Category }o--|| Category : child_of

    ProductListing }o--|| Vendor : created_by
    ProductListing }o--|| Category : belongs_to

    %% Order Related
    Order ||--o{ OrderItem : contains
    Order ||--o{ OrderStatusHistory : tracks
    Order ||--o{ Payment : paid_by
    Order ||--o{ OrderAcceptance : requires
    Order ||--o{ PaymentTermsAcceptance : requires
    Order ||--o{ OrderTracking : tracked_by
    Order ||--o{ CouponUsage : uses_coupon
    Order ||--o{ ProductReview : generates_review
    Order }o--|| User : placed_by
    Order }o--|| Vendor : received_by
    Order }o--o| CheckoutSession : creates

    OrderItem }o--|| Order : belongs_to
    OrderItem }o--|| Product : references

    OrderStatusHistory }o--|| Order : tracks

    OrderAcceptance }o--|| Order : for
    OrderAcceptance }o--|| Vendor : by

    %% Cart and Checkout
    Cart ||--o{ CartItem : contains
    Cart ||--o{ SavedCart : saved_as
    Cart }o--|| User : belongs_to
    Cart }o--o| CheckoutSession : converts_to
    Cart }o--o| Order : converts_to
    Cart }o--o| DiscountCode : uses

    CartItem }o--|| Cart : belongs_to
    CartItem }o--|| Product : references
    CartItem }o--o| Wishlist : added_from

    SavedCart }o--|| Cart : saves
    SavedCart }o--|| User : saved_by

    CheckoutSession ||--o{ CheckoutItem : contains
    CheckoutSession }o--|| User : initiated_by
    CheckoutSession }o--o| Cart : from
    CheckoutSession }o--o| Order : creates

    CheckoutItem }o--|| CheckoutSession : belongs_to
    CheckoutItem }o--|| Product : references

    Wishlist ||--o{ WishlistItem : contains
    Wishlist ||--o{ WishlistCollaborator : has_collaborators
    Wishlist ||--o{ WishlistActivity : has_activities
    Wishlist ||--o{ WishlistHistory : has_history
    Wishlist }o--|| User : owned_by
    Wishlist }o--o| WishlistTemplate : created_from

    WishlistItem }o--|| Wishlist : belongs_to
    WishlistItem }o--|| Product : references
    WishlistItem }o--o| User : added_by
    WishlistItem }o--o| User : purchased_by
    WishlistItem ||--o{ WishlistNotification : has_notifications

    WishlistCollaborator }o--|| Wishlist : collaborates_on
    WishlistCollaborator }o--|| User : is_user
    WishlistCollaborator }o--|| User : invited_by

    WishlistActivity }o--|| Wishlist : tracks
    WishlistActivity }o--|| User : performed_by

    WishlistHistory }o--|| Wishlist : version_of
    WishlistHistory }o--o| User : created_by

    WishlistNotification }o--|| WishlistItem : notifies_about
    WishlistNotification }o--|| User : sent_to

    WishlistTemplate }o--o| Admin : created_by

    %% Payment Related
    Payment }o--|| Order : for
    Payment }o--|| User : made_by
    Payment ||--o{ PaymentTermsAcceptance : requires

    PaymentTermsAcceptance }o--|| Payment : for
    PaymentTermsAcceptance }o--|| Order : for
    PaymentTermsAcceptance }o--|| User : accepted_by

    CreditTransaction }o--|| User : belongs_to
    CreditTransaction }o--o| Order : related_to

    %% Wallet System
    VendorWallet }o--|| Vendor : belongs_to
    VendorWallet }o--o| Admin : frozen_by
    VendorWallet ||--o{ WalletTransaction : has
    VendorWallet ||--o{ PayoutRequest : generates

    UserWallet }o--|| User : belongs_to
    UserWallet ||--o{ WalletTransaction : has

    MainWallet ||--o{ WalletTransaction : has

    WalletTransaction }o--o| Vendor : related_to
    WalletTransaction }o--o| User : related_to
    WalletTransaction }o--o| Admin : processed_by

    PayoutRequest }o--|| Vendor : requested_by
    PayoutRequest }o--o| Admin : approved_by
    PayoutRequest }o--o| Admin : rejected_by
    PayoutRequest }o--o| BankAccount : to

    %% Other Relationships
    Review }o--o| Product : for
    Review }o--o| Vendor : for

    Negotiation }o--|| Product : for
    Negotiation }o--|| User : initiated_by
    Negotiation }o--|| Vendor : responded_by

    PriceRequest }o--|| Product : for
    PriceRequest }o--|| User : requested_by
    PriceRequest }o--|| Vendor : responded_by

    SupportTicket ||--o{ SupportTicketMessage : contains
    SupportTicket }o--|| User : created_by

    SupportTicketMessage }o--|| SupportTicket : belongs_to
    SupportTicketMessage }o--|| User : sent_by

    %% Entity Definitions
    User {
        int id PK
        string email UK
        string password
        string name
        string phone
        string countryCode
        string country
        string city
        boolean isGuest
        boolean isActive
        boolean isEmailVerified
        boolean termsAccepted
        datetime termsAcceptedAt
        string language
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    Vendor {
        int id PK
        string email UK
        string password
        string name
        string businessName
        string companyName
        string phone
        string countryCode
        string country
        string city
        string verificationNumber
        decimal rating
        int reviewCount
        string activities
        string paymentTerms
        string shippingTerms
        int peakSeasonLeadTime
        int offPeakSeasonLeadTime
        enum status
        boolean isVerified
        boolean isActive
        datetime approvedAt
        int approvedBy FK
        datetime suspendedAt
        int suspendedBy FK
        string suspensionReason
        datetime createdAt
        datetime updatedAt
    }

    Admin {
        int id PK
        string email UK
        string password
        string name
        enum role
        string permissions
        boolean isActive
        datetime lastLoginAt
        int createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    Product {
        int id PK
        string name
        string description
        string sku UK
        decimal price
        int quantity
        int quantityPerCarton
        decimal cbm
        int minStockLevel
        enum status
        boolean isFeatured
        int categoryId FK
        int vendorId FK
        string country
        string city
        boolean acceptsNegotiation
        decimal rating
        int reviewCount
        datetime approvedAt
        int approvedBy FK
        datetime rejectedAt
        int rejectedBy FK
        string rejectionReason
        string metaTitle
        string metaDescription
        string metaKeywords
        string slug UK
        string canonicalUrl
        string ogTitle
        string ogDescription
        string ogImage
        string twitterCardTitle
        string twitterCardDescription
        string twitterCardImage
        string structuredData
        datetime createdAt
        datetime updatedAt
    }

    ProductImage {
        int id PK
        int productId FK
        string imageUrl
        int imageOrder
        boolean isPrimary
        string altText
        datetime createdAt
    }

    Category {
        int id PK
        string name UK
        string nameAr
        string description
        string icon
        string imageUrl
        int parentId FK
        int level
        int displayOrder
        boolean isActive
        int productCount
        string breadcrumb
        string metaTitle
        string metaDescription
        string metaKeywords
        string slug UK
        string canonicalUrl
        string ogTitle
        string ogDescription
        string ogImage
        string twitterCardTitle
        string twitterCardDescription
        string twitterCardImage
        string structuredData
        string pageDescription
        datetime createdAt
        datetime updatedAt
    }

    Order {
        int id PK
        string orderNumber UK
        int userId FK
        int vendorId FK
        datetime orderDate
        enum status
        decimal totalAmount
        decimal subtotal
        decimal tax
        decimal deliveryCharge
        decimal siteCommission
        decimal vendorCommission
        decimal discountAmount
        string discountCode
        string shippingAddress
        string shippingCountry
        string shippingCity
        enum shippingMethod
        boolean customsClearance
        string shippingCarrier
        string trackingNumber
        int estimatedDeliveryDays
        string notes
        datetime cancelledAt
        int cancelledBy FK
        string cancellationReason
        datetime createdAt
        datetime updatedAt
    }

    Cart {
        int id PK
        int userId FK
        string name
        string discountCode
        int discountCodeId FK
        enum status
        boolean isActive
        string shareToken UK
        datetime shareExpiresAt
        decimal subtotal
        decimal tax
        decimal delivery
        decimal commission
        decimal total
        datetime lastActivityAt
        datetime expiresAt
        datetime convertedToOrderAt
        int convertedToOrderId FK
        datetime createdAt
        datetime updatedAt
    }

    CartItem {
        int id PK
        int cartId FK
        int productId FK
        int quantity
        decimal negotiatedPrice
        int negotiatedQuantity
        string notes
        boolean addedFromWishlist
        int wishlistId FK
        datetime createdAt
        datetime updatedAt
    }

    SavedCart {
        int id PK
        int userId FK
        int cartId FK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    Wishlist {
        int id PK
        int userId FK
        string name
        string description
        boolean isDefault
        enum privacy
        boolean isGiftRegistry
        string coverImage
        string shareToken UK
        datetime shareExpiresAt
        decimal budget
        decimal budgetSpent
        string categories
        int templateId FK
        int itemCount
        decimal totalValue
        datetime expiresAt
        boolean isActive
        int version
        datetime createdAt
        datetime updatedAt
    }

    WishlistItem {
        int id PK
        int wishlistId FK
        int productId FK
        string notes
        enum priority
        int position
        boolean notifyOnSale
        boolean notifyOnStock
        decimal priceWhenAdded
        decimal currentPrice
        boolean isPurchased
        int purchasedBy FK
        datetime purchasedAt
        datetime addedToCartAt
        int addedBy FK
        datetime createdAt
        datetime updatedAt
    }

    WishlistCollaborator {
        int id PK
        int wishlistId FK
        int userId FK
        enum permission
        enum status
        int invitedBy FK
        datetime invitedAt
        datetime acceptedAt
        datetime declinedAt
        datetime removedAt
        datetime createdAt
        datetime updatedAt
    }

    WishlistTemplate {
        int id PK
        string name
        string description
        string category
        boolean isDefault
        boolean isPublic
        string productIds
        string categoryIds
        string coverImage
        int createdBy FK
        int usageCount
        datetime createdAt
        datetime updatedAt
    }

    WishlistActivity {
        int id PK
        int wishlistId FK
        int userId FK
        enum action
        string entityType
        int entityId
        string description
        string metadata
        datetime createdAt
    }

    WishlistHistory {
        int id PK
        int wishlistId FK
        int version
        string snapshot
        int itemCount
        decimal totalValue
        int createdBy FK
        datetime createdAt
    }

    WishlistNotification {
        int id PK
        int wishlistItemId FK
        int userId FK
        enum type
        string title
        string message
        decimal oldPrice
        decimal newPrice
        decimal discountPercentage
        boolean isRead
        datetime readAt
        datetime createdAt
    }

    Payment {
        int id PK
        int orderId FK
        int userId FK
        enum method
        enum status
        decimal amount
        decimal tax
        decimal siteCommission
        decimal creditDiscount
        string transactionId
        string cardLast4
        string cardBrand
        string bankName
        string iban
        string beneficiary
        string receiptUrl
        boolean receiptVerified
        decimal refundAmount
        boolean isHeld
        datetime heldUntil
        datetime createdAt
        datetime updatedAt
    }

    VendorWallet {
        int id PK
        int vendorId FK UK
        decimal balance
        decimal totalEarnings
        decimal totalCommission
        decimal totalPayouts
        boolean isFrozen
        datetime frozenAt
        int frozenBy FK
        string freezeReason
        datetime lastUpdated
        datetime createdAt
        datetime updatedAt
    }

    MainWallet {
        int id PK
        decimal balance
        decimal totalRevenue
        decimal totalCommission
        decimal totalRefunds
        datetime lastUpdated
        datetime createdAt
        datetime updatedAt
    }

    UserWallet {
        int id PK
        int userId FK UK
        decimal balance
        decimal totalCredits
        decimal totalSpent
        datetime lastUpdated
        datetime createdAt
        datetime updatedAt
    }

    WalletTransaction {
        int id PK
        enum walletType
        int walletId
        int vendorId FK
        int userId FK
        enum type
        decimal amount
        decimal balanceBefore
        decimal balanceAfter
        string description
        int relatedId
        string relatedType
        enum status
        int processedBy FK
        datetime createdAt
        datetime updatedAt
    }

    CheckoutSession {
        int id PK
        string sessionId UK
        int userId FK
        int cartId FK
        enum status
        string shippingAddress
        string shippingCountry
        string shippingCity
        enum shippingMethod
        boolean customsClearance
        string discountCode
        decimal subtotal
        decimal tax
        decimal deliveryCharge
        decimal siteCommission
        decimal discountAmount
        decimal totalAmount
        enum paymentMethod
        int orderId FK
        datetime expiresAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    PointSystem {
        int id PK
        int userId FK
        int vendorId FK
        enum pointType
        int balance
        int totalEarned
        int totalRedeemed
        int totalExpired
        datetime lastUpdated
        datetime createdAt
        datetime updatedAt
    }

    PointTransaction {
        int id PK
        int pointSystemId FK
        int userId FK
        int vendorId FK
        enum type
        int points
        int balanceBefore
        int balanceAfter
        string description
        int relatedId
        string relatedType
        datetime expiresAt
        int processedBy FK
        datetime createdAt
    }

    PointRule {
        int id PK
        enum ruleType
        enum pointType
        int points
        decimal multiplier
        decimal minPurchaseAmount
        int maxPointsPerTransaction
        boolean isActive
        datetime validFrom
        datetime validUntil
        int createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    ProductOffer {
        int id PK
        int vendorId FK
        int productId FK
        int categoryId FK
        string title
        string description
        enum offerType
        decimal discountValue
        decimal minPurchaseAmount
        decimal maxDiscountAmount
        int minQuantity
        int maxQuantity
        int buyQuantity
        int getQuantity
        enum status
        datetime startDate
        datetime endDate
        int usageLimit
        int usedCount
        boolean isVisible
        datetime approvedAt
        int approvedBy FK
        datetime rejectedAt
        int rejectedBy FK
        string rejectionReason
        datetime createdAt
        datetime updatedAt
    }

    Coupon {
        int id PK
        string code UK
        int vendorId FK
        int createdBy FK
        enum couponType
        decimal discountValue
        decimal minPurchaseAmount
        decimal maxDiscountAmount
        enum applicableTo
        string productIds
        string categoryIds
        string vendorIds
        enum userEligibility
        string userIds
        int usageLimit
        int usageLimitPerUser
        int usedCount
        datetime validFrom
        datetime validUntil
        enum status
        boolean isVisible
        datetime approvedAt
        int approvedBy FK
        datetime createdAt
        datetime updatedAt
    }

    CouponUsage {
        int id PK
        int couponId FK
        int userId FK
        int orderId FK
        decimal discountAmount
        datetime usedAt
        datetime createdAt
    }

    ProductReview {
        int id PK
        int productId FK
        int userId FK
        int vendorId FK
        int rating
        string title
        string comment
        boolean isVerifiedPurchase
        int orderId FK
        enum status
        string vendorResponse
        datetime vendorResponseAt
        boolean adminReviewed
        int adminReviewedBy FK
        datetime adminReviewedAt
        int helpfulCount
        datetime createdAt
        datetime updatedAt
    }

    OrderTracking {
        int id PK
        int orderId FK
        enum status
        string description
        string location
        string trackingNumber
        string carrier
        datetime estimatedDelivery
        int updatedBy FK
        enum updatedByType
        datetime createdAt
    }

    ProductSubCategory {
        int id PK
        int productId FK
        int categoryId FK
        datetime createdAt
    }

    GlobalSEO {
        int id PK
        string siteTitle
        string siteDescription
        string siteKeywords
        string ogImage
        string twitterCardImage
        string robotsTxt
        string sitemapUrl
        datetime sitemapLastGenerated
        datetime sitemapLastSubmitted
        string googleVerificationCode
        string bingVerificationCode
        int updatedBy FK
        datetime createdAt
        datetime updatedAt
    }

    ContentPage {
        int id PK
        enum type
        string title
        string content
        string slug UK
        boolean isActive
        string metaTitle
        string metaDescription
        string metaKeywords
        string canonicalUrl
        string ogTitle
        string ogDescription
        string ogImage
        string twitterCardTitle
        string twitterCardDescription
        string twitterCardImage
        string structuredData
        int createdBy FK
        int updatedBy FK
        datetime createdAt
        datetime updatedAt
    }

    SEOAnalytics {
        int id PK
        enum entityType
        int entityId
        int seoScore
        string missingFields
        datetime lastChecked
        datetime createdAt
        datetime updatedAt
    }

    TranslationKey {
        int id PK
        string key UK
        string namespace
        string entityType
        int entityId
        string fieldName
        boolean isSystem
        datetime createdAt
        datetime updatedAt
    }

    SavedSearch {
        int id PK
        int userId FK
        string name
        string searchQuery
        string filters
        enum entityType
        boolean emailAlerts
        enum alertFrequency
        datetime lastAlertSent
        int resultCount
        datetime createdAt
        datetime updatedAt
    }

    SearchHistory {
        int id PK
        int userId FK
        string sessionId
        string searchQuery
        enum entityType
        string filters
        int resultCount
        string ipAddress
        string userAgent
        datetime createdAt
    }

    ActivityLog {
        int id PK
        int userId FK
        enum userType
        string action
        string entityType
        int entityId
        string description
        string changes
        string ipAddress
        string userAgent
        string location
        string metadata
        datetime createdAt
    }

    AuditTrail {
        int id PK
        int userId FK
        enum userType
        string action
        string entityType
        int entityId
        string oldValue
        string newValue
        string reason
        string ipAddress
        string userAgent
        boolean success
        string errorMessage
        datetime createdAt
    }

    ExportHistory {
        int id PK
        int userId FK
        enum exportType
        enum format
        string filters
        string fields
        string fileUrl
        int fileSize
        int recordCount
        enum status
        string errorMessage
        datetime expiresAt
        datetime createdAt
        datetime completedAt
    }

    ImportHistory {
        int id PK
        int userId FK
        enum importType
        enum format
        string fileUrl
        int fileSize
        int totalRecords
        int successfulRecords
        int failedRecords
        enum status
        string errors
        string previewData
        int rollbackId FK
        datetime createdAt
        datetime completedAt
    }

    UserSession {
        int id PK
        int userId FK
        enum userType
        string sessionToken UK
        string refreshToken UK
        string ipAddress
        string userAgent
        string deviceInfo
        string location
        boolean isActive
        datetime lastActivityAt
        datetime expiresAt
        datetime createdAt
        datetime revokedAt
    }

    LoginHistory {
        int id PK
        int userId FK
        string email
        enum userType
        boolean success
        string failureReason
        string ipAddress
        string userAgent
        string location
        boolean twoFactorUsed
        int sessionId FK
        datetime createdAt
    }

    TwoFactorAuth {
        int id PK
        int userId FK
        enum userType
        enum method
        string secret
        string phoneNumber
        boolean isEnabled
        string backupCodes
        datetime lastVerifiedAt
        datetime createdAt
        datetime updatedAt
    }

    SocialAuth {
        int id PK
        int userId FK
        enum provider
        string providerId
        string email
        string accessToken
        string refreshToken
        string profileData
        datetime createdAt
        datetime updatedAt
    }

    SearchAnalytics {
        int id PK
        string searchQuery
        enum entityType
        int resultCount
        boolean hasResults
        boolean clickedResult
        int resultId
        int userId FK
        string sessionId
        string ipAddress
        datetime createdAt
    }
```


## Table Count Summary

The database consists of **65+ tables** organized into the following categories:

### Core Entities (3 tables)
- User
- Vendor
- Admin

### Product Management (5 tables)
- Product
- ProductImage
- ProductSubCategory
- Category
- ProductListing

### Order Management (4 tables)
- Order
- OrderItem
- OrderStatusHistory
- OrderAcceptance

### Cart & Checkout (5 tables)
- Cart
- CartItem
- SavedCart
- CheckoutSession
- CheckoutItem

### Payment System (3 tables)
- Payment
- PaymentTermsAcceptance
- CreditTransaction

### Wallet System (5 tables)
- MainWallet
- VendorWallet
- UserWallet
- WalletTransaction
- PayoutRequest

### User Features (15 tables)
- BankAccount
- ShippingAddress
- Review
- Wishlist
- WishlistItem
- WishlistCollaborator
- WishlistTemplate
- WishlistActivity
- WishlistHistory
- WishlistNotification
- Notification
- SupportTicket
- SupportTicketMessage

### Business Logic (4 tables)
- Negotiation
- PriceRequest
- DiscountCode
- Configuration

### Point System (3 tables)
- PointSystem
- PointTransaction
- PointRule

### Offers & Coupons (3 tables)
- ProductOffer
- Coupon
- CouponUsage

### Enhanced Features (2 tables)
- ProductReview (Enhanced with vendor/admin review)
- OrderTracking (Enhanced tracking for all roles)

### System Management (4 tables)
- Banner
- BusinessService
- SiteSettings
- AdminPermission

### SEO & Content Management (4 tables)
- GlobalSEO
- ContentPage
- SEOAnalytics
- TranslationKey

### Search & Analytics (3 tables)
- SavedSearch
- SearchHistory
- SearchAnalytics

### Activity & Audit (2 tables)
- ActivityLog
- AuditTrail

### Export & Import (2 tables)
- ExportHistory
- ImportHistory

### Security & Authentication (4 tables)
- UserSession
- LoginHistory
- TwoFactorAuth
- SocialAuth

## Key Relationships

1. **User → Order → Payment**: Users place orders and make payments
2. **Vendor → Product → Order**: Vendors create products that are ordered
3. **Admin → Vendor/Product**: Admins approve vendors and products
4. **Vendor → VendorWallet → PayoutRequest**: Vendors have wallets and can request payouts
5. **Order → OrderItem → Product**: Orders contain items that reference products
6. **Cart → CheckoutSession → Order**: Cart converts to checkout session which creates order
7. **Payment → Order**: Payments are linked to orders
8. **WalletTransaction**: Tracks all wallet movements across all wallet types

## Notes

- All tables include `createdAt` and `updatedAt` timestamps
- Foreign keys are properly defined for referential integrity
- Unique constraints on email fields and SKU
- Enum types for status fields provide data consistency
- Soft deletes can be implemented using `isActive` flags
- Audit trails maintained through approval/rejection fields with admin references

