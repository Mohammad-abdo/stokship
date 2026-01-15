# Stockship Database Diagram

## Complete Database Schema Visualization

This document provides a visual representation of the Stockship database structure using Mermaid diagrams.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Core Entities
    User ||--o{ Cart : has
    User ||--o{ Order : places
    User ||--o{ Payment : makes
    User ||--o{ Wishlist : owns
    User ||--o{ UserWallet : has
    User ||--o{ PointSystem : has
    User ||--o{ Notification : receives
    User ||--o{ SupportTicket : creates
    User ||--o{ ProductReview : writes
    User ||--o{ ActivityLog : performs
    User ||--o{ UserSession : has

    Vendor ||--o{ Product : creates
    Vendor ||--o{ Order : receives
    Vendor ||--o{ VendorWallet : has
    Vendor ||--o{ ProductOffer : creates
    Vendor ||--o{ Coupon : creates
    Vendor ||--o{ PointSystem : has
    Vendor }o--|| Admin : approved_by

    Admin ||--o{ Product : approves
    Admin ||--o{ Vendor : approves
    Admin ||--o{ SiteSettings : manages
    Admin ||--o{ GlobalSEO : manages
    Admin ||--o{ ContentPage : manages
    Admin ||--o{ WishlistTemplate : creates

    %% Product Management
    Product ||--o{ ProductImage : has
    Product ||--o{ ProductSubCategory : has
    Product ||--o{ OrderItem : in
    Product ||--o{ CartItem : in
    Product ||--o{ WishlistItem : in
    Product ||--o{ ProductReview : reviewed
    Product ||--o{ ProductOffer : has_offers
    Product }o--|| Category : belongs_to
    Product }o--|| Vendor : created_by
    Product }o--|| Admin : approved_by

    Category ||--o{ Product : contains
    Category ||--o{ ProductSubCategory : has
    Category ||--o{ ProductOffer : has
    Category }o--|| Category : parent_of

    %% Order Management
    Order ||--o{ OrderItem : contains
    Order ||--o{ OrderStatusHistory : has
    Order ||--o{ OrderAcceptance : has
    Order ||--o{ Payment : has
    Order ||--o{ OrderTracking : tracked_by
    Order }o--|| User : placed_by
    Order }o--|| Vendor : received_by

    %% Cart & Checkout
    Cart ||--o{ CartItem : contains
    Cart ||--o{ SavedCart : saved_as
    Cart }o--|| User : belongs_to
    Cart }o--o| CheckoutSession : converts_to

    CheckoutSession ||--o{ CheckoutItem : contains
    CheckoutSession }o--|| User : initiated_by
    CheckoutSession }o--o| Order : creates

    %% Payment System
    Payment }o--|| Order : for
    Payment }o--|| User : made_by
    Payment ||--o{ PaymentTermsAcceptance : requires

    %% Wallet System
    VendorWallet ||--o{ WalletTransaction : has
    VendorWallet ||--o{ PayoutRequest : generates
    VendorWallet }o--|| Vendor : belongs_to
    VendorWallet }o--o| Admin : frozen_by

    UserWallet ||--o{ WalletTransaction : has
    UserWallet }o--|| User : belongs_to

    MainWallet ||--o{ WalletTransaction : has

    WalletTransaction }o--o| Vendor : related_to
    WalletTransaction }o--o| User : related_to
    WalletTransaction }o--o| Admin : processed_by

    PayoutRequest }o--|| Vendor : requested_by
    PayoutRequest }o--|| VendorWallet : from
    PayoutRequest }o--|| BankAccount : to
    PayoutRequest }o--o| Admin : approved_by

    %% Wishlist System
    Wishlist ||--o{ WishlistItem : contains
    Wishlist ||--o{ WishlistCollaborator : has
    Wishlist ||--o{ WishlistActivity : has
    Wishlist ||--o{ WishlistHistory : has
    Wishlist }o--|| User : owned_by
    Wishlist }o--o| WishlistTemplate : created_from

    WishlistItem }o--|| Wishlist : belongs_to
    WishlistItem }o--|| Product : references
    WishlistItem ||--o{ WishlistNotification : has

    WishlistCollaborator }o--|| Wishlist : collaborates_on
    WishlistCollaborator }o--|| User : is_user

    %% Point System
    PointSystem ||--o{ PointTransaction : has
    PointSystem }o--o| User : belongs_to
    PointSystem }o--o| Vendor : belongs_to

    PointTransaction }o--|| PointSystem : belongs_to
    PointTransaction }o--o| Admin : processed_by

    PointRule }o--o| Admin : created_by

    %% Offers & Coupons
    ProductOffer }o--|| Vendor : created_by
    ProductOffer }o--o| Product : applies_to
    ProductOffer }o--o| Category : applies_to
    ProductOffer }o--o| Admin : approved_by

    Coupon }o--o| Vendor : created_by
    Coupon }o--o| Admin : created_by
    Coupon ||--o{ CouponUsage : has

    CouponUsage }o--|| Coupon : uses
    CouponUsage }o--|| User : used_by
    CouponUsage }o--o| Order : applied_to

    %% SEO & Content
    GlobalSEO }o--o| Admin : managed_by
    ContentPage }o--o| Admin : created_by
    ContentPage }o--o| Admin : updated_by

    SEOAnalytics }o--o| Admin : viewed_by

    TranslationKey }o--o| Admin : managed_by

    %% Search & Analytics
    SavedSearch }o--|| User : saved_by
    SearchHistory }o--o| User : searched_by
    SearchAnalytics }o--o| User : tracked_for

    %% Activity & Audit
    ActivityLog }o--o| User : performed_by
    ActivityLog }o--o| Vendor : performed_by
    ActivityLog }o--o| Admin : performed_by

    AuditTrail }o--o| User : created_by
    AuditTrail }o--o| Vendor : created_by
    AuditTrail }o--o| Admin : created_by

    %% Export & Import
    ExportHistory }o--o| User : exported_by
    ExportHistory }o--o| Vendor : exported_by
    ExportHistory }o--o| Admin : exported_by

    ImportHistory }o--o| User : imported_by
    ImportHistory }o--o| Vendor : imported_by
    ImportHistory }o--o| Admin : imported_by
    ImportHistory }o--o| ImportHistory : rolled_back_from

    %% Security
    UserSession }o--o| User : belongs_to
    UserSession }o--o| Vendor : belongs_to
    UserSession }o--o| Admin : belongs_to

    LoginHistory }o--o| User : logged_by
    LoginHistory }o--o| Vendor : logged_by
    LoginHistory }o--o| Admin : logged_by
    LoginHistory }o--o| UserSession : creates

    TwoFactorAuth }o--o| User : belongs_to
    TwoFactorAuth }o--o| Vendor : belongs_to
    TwoFactorAuth }o--o| Admin : belongs_to

    SocialAuth }o--o| User : belongs_to
    SocialAuth }o--o| Vendor : belongs_to
    SocialAuth }o--o| Admin : belongs_to
```

## Database Tables Overview

### Core Entities (3 tables)
- **User** - Buyers/Customers
- **Vendor** - Sellers/Suppliers
- **Admin** - Platform Administrators

### Product Management (5 tables)
- **Product** - Main product table with translation keys
- **ProductImage** - Product images
- **ProductSubCategory** - Product sub-category assignments
- **Category** - Product categories with hierarchy
- **ProductListing** - Product advertisements/listings

### Order Management (5 tables)
- **Order** - Customer orders
- **OrderItem** - Order line items
- **OrderStatusHistory** - Order status change history
- **OrderAcceptance** - Vendor order acceptance
- **OrderTracking** - Order tracking for all roles

### Cart & Checkout (5 tables)
- **Cart** - Shopping carts
- **CartItem** - Cart items
- **SavedCart** - Saved cart configurations
- **CheckoutSession** - Checkout sessions
- **CheckoutItem** - Checkout items

### Payment System (3 tables)
- **Payment** - Payment transactions
- **PaymentTermsAcceptance** - Payment terms acceptance
- **CreditTransaction** - Credit transactions

### Wallet System (5 tables)
- **MainWallet** - Platform main wallet
- **VendorWallet** - Vendor wallets
- **UserWallet** - User wallets
- **WalletTransaction** - All wallet transactions
- **PayoutRequest** - Vendor payout requests

### User Features (8 tables)
- **BankAccount** - Bank account information
- **ShippingAddress** - User shipping addresses
- **Review** - Vendor reviews
- **ProductReview** - Product reviews
- **Notification** - User notifications
- **SupportTicket** - Support tickets
- **SupportTicketMessage** - Support ticket messages

### Wishlist System (7 tables)
- **Wishlist** - User wishlists
- **WishlistItem** - Wishlist items
- **WishlistCollaborator** - Wishlist collaborators
- **WishlistTemplate** - Wishlist templates
- **WishlistActivity** - Wishlist activity log
- **WishlistHistory** - Wishlist version history
- **WishlistNotification** - Wishlist notifications

### Point System (3 tables)
- **PointSystem** - User/Vendor point accounts
- **PointTransaction** - Point transactions
- **PointRule** - Point earning rules

### Offers & Coupons (3 tables)
- **ProductOffer** - Product offers
- **Coupon** - Discount coupons
- **CouponUsage** - Coupon usage tracking

### Business Logic (4 tables)
- **Negotiation** - Price/quantity negotiations
- **PriceRequest** - Price requests
- **DiscountCode** - Discount codes
- **Configuration** - System configuration

### SEO & Content Management (4 tables)
- **GlobalSEO** - Global SEO settings
- **ContentPage** - Content pages (Terms, Privacy, etc.)
- **SEOAnalytics** - SEO analytics
- **TranslationKey** - Translation key management

### Search & Analytics (3 tables)
- **SavedSearch** - Saved search queries
- **SearchHistory** - Search history
- **SearchAnalytics** - Search analytics

### Activity & Audit (2 tables)
- **ActivityLog** - Activity logging
- **AuditTrail** - Security audit trail

### Export & Import (2 tables)
- **ExportHistory** - Export operations
- **ImportHistory** - Import operations with rollback

### Security & Authentication (4 tables)
- **UserSession** - User sessions
- **LoginHistory** - Login history
- **TwoFactorAuth** - Two-factor authentication
- **SocialAuth** - Social authentication

### System Management (4 tables)
- **SiteSettings** - Site configuration
- **AdminPermission** - Admin permissions
- **Banner** - Site banners
- **BusinessService** - Business services

## Total: 70+ Tables

## Key Features

### Translation System (i18n)
- Uses translation keys instead of storing translations in database
- Translation keys stored in `TranslationKey` table
- Actual translations in JSON files (`locales/{language}/translation.json`)
- Keeps database lightweight and supports unlimited languages

### Multi-Role System
- Separate tables for User, Vendor, and Admin
- Role-based access control
- Permission-based access control for admins

### Comprehensive Tracking
- Activity logs for all user actions
- Audit trails for security
- Order tracking for all roles
- Search analytics
- Wishlist activity tracking

### Advanced Features
- Multi-currency support
- Multi-language support (i18n)
- Wallet system (Main, Vendor, User)
- Point/loyalty system
- Product offers and coupons
- Wishlist collaboration
- Export/import functionality
- Real-time features support

## Database Relationships

### One-to-Many Relationships
- User → Orders, Carts, Wishlists, Payments
- Vendor → Products, Orders, Offers
- Product → Images, Reviews, Offers
- Order → Items, Status History, Payments

### Many-to-Many Relationships
- Product ↔ Category (via ProductSubCategory)
- User ↔ Product (via WishlistItem)
- User ↔ Wishlist (via WishlistCollaborator)

### Self-Referencing Relationships
- Category → Category (parent-child hierarchy)

## Indexes and Constraints

### Unique Constraints
- User.email
- Vendor.email
- Admin.email
- Product.sku
- Product.nameKey
- Category.nameKey
- Order.orderNumber
- Cart.shareToken
- Wishlist.shareToken
- Coupon.code

### Foreign Key Constraints
- All foreign keys have proper cascade/restrict rules
- Most relations use `onDelete: Cascade` for data integrity
- Critical relations use `onDelete: Restrict` to prevent accidental deletion

## Performance Considerations

### Indexed Fields
- All foreign keys are automatically indexed
- Unique fields are indexed
- Frequently queried fields should have additional indexes:
  - Product.status, categoryId, vendorId
  - Order.status, userId, vendorId
  - Cart.userId, status
  - Wishlist.userId, privacy

### Cached Fields
- Product.reviewCount, rating
- Category.productCount
- Wishlist.itemCount, totalValue
- Cart.subtotal, tax, total

## Migration Strategy

1. **Initial Migration**: Create all core tables
2. **Add Features**: Incrementally add feature tables
3. **Add Indexes**: Add performance indexes
4. **Add Constraints**: Add business logic constraints
5. **Seed Data**: Populate initial data (admin users, categories, etc.)

## Prisma Usage

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Migrations
```bash
npx prisma migrate dev --name init
```

### View Database
```bash
npx prisma studio
```

### Format Schema
```bash
npx prisma format
```

## Notes

- All monetary values use `Decimal` type for precision
- All text fields that may contain large content use `@db.Text`
- All date/time fields use `DateTime` type
- Translation keys follow pattern: `{entity}.{field}.{id}`
- JSON fields stored as `String` with `@db.Text` for flexibility
- Enums used for status fields and type fields
- Soft deletes implemented via `isActive` flags where needed

