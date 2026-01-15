# Stockship Backend Project

## Project Overview
Stockship is a comprehensive B2B e-commerce platform designed for commercial brokerage between factories and traders. The platform facilitates wholesale product display, direct negotiation between buyers and sellers, secure transaction completion, shipping tracking, and payment protection. The backend will support all features outlined in the provided Figma design, focusing on robust API endpoints, efficient data management, and secure operations.

## Technologies
The backend will be built using the following technologies:
- **Node.js**: For the server-side application runtime.
- **Prisma**: As the ORM (Object-Relational Mapper) for database interactions.
- **MySQL**: As the primary relational database.

## Figma Design Reference
Please refer to the Figma design for the complete user interface and user experience specifications, which will guide the backend API development to ensure seamless integration with the frontend.

[Figma Design Link](https://www.figma.com/design/Bh4tvoFOTPdyZM2LQ4hJvV/Stockship?node-id=509-2593&t=jIs3GFRJ53jRxwFH-1)

**Important**: All backend API endpoints, data models, and business logic should align with the features and workflows defined in the Figma design. Please review the design thoroughly to understand:
- User roles and permissions
- Data entities and their relationships
- User flows and interactions
- Required API responses and data structures

## Backend Requirements

### 1. User Authentication and Authorization
- User registration (email, password, name, phone with country code)
- User login (email, password)
- Guest login option
- Vendor/Seller registration with business details
- Admin account creation (super admin only)
- JWT-based authentication for secure API access
- Password hashing (bcrypt)
- Password reset functionality
- Remember me functionality
- Role-based authorization with three separate entities:
  - **User** (Buyer) - Regular customers
  - **Vendor** (Seller) - Sellers with extended permissions
  - **Admin** - Platform administrators with full access
- Permission-based access control
- Terms and conditions acceptance tracking

### 2. User Profile Management
- Complete user profile (full name, business name, phone, email, country, city)
- Bank account information (account name, account number, bank name, bank address, bank code, SWIFT code)
- Company address
- Profile update functionality
- Seller profile with company details

### 3. Product Management
- CRUD operations for products/items
- Product attributes:
  - Name, description, SKU/item number
  - Price per unit
  - Quantity available
  - Quantity per carton/package
  - CBM (Cubic Meter) for shipping calculations
  - Category assignment (main category and sub-categories)
  - Seller/Supplier association
  - Product images (multiple images per product, max 10)
  - Product status (Available, Sold Out, Pending Approval, Rejected)
  - Location (Country, City)
  - Negotiation acceptance toggle (price and quantity)
- **SEO for Products:**
  - Meta title (customizable for each product)
  - Meta description
  - Meta keywords
  - SEO-friendly URL slug
  - Open Graph tags (OG title, OG description, OG image)
  - Twitter Card tags
  - Canonical URL
  - Structured data (JSON-LD for products)
  - Alt text for product images
  - Product schema markup
- Bulk product upload via Excel template
- Product ratings and reviews
- Product search with image search capability
- Product filtering by category, sub-category, price, seller, ratings
- Related products recommendations
- **Wishlist/Favorites Functionality:**
  - Add products to wishlist
  - Remove products from wishlist
  - View wishlist
  - Move items from wishlist to cart
  - Share wishlist
  - Create multiple wishlists (e.g., "Favorites", "For Later", "Gift Ideas")
  - Wishlist notes/comments per item
  - Wishlist privacy settings (public/private)
  - Get notified when wishlist items go on sale
  - Get notified when wishlist items are back in stock
  - **Wishlist Collaboration:**
    - Invite others to contribute to wishlist (collaborative wishlists)
    - Accept/decline collaboration requests
    - View who contributed to wishlist
    - Set collaboration permissions (view-only, can add items, can remove items)
    - Remove collaborators
  - **Wishlist Organization:**
    - Wishlist categories/tags
    - Sort wishlist items (by date added, price, name, priority)
    - Filter wishlist items (by category, price range, availability, vendor)
    - Group items by category or vendor
    - Wishlist priority/ranking for items
    - Mark items as "Must Have", "Nice to Have", "Maybe Later"
  - **Wishlist Features:**
    - Compare products in wishlist side-by-side
    - Wishlist budget tracking (set budget, track total cost)
    - Wishlist recommendations (suggest similar products based on wishlist items)
    - Wishlist templates/presets (quick create from templates)
    - Wishlist expiration/auto-cleanup (remove items after X days)
    - Wishlist import/export (CSV, JSON)
    - Wishlist statistics (total items, total value, oldest item, etc.)
    - Wishlist activity feed (track changes, additions, removals)
    - Wishlist versioning/history (view previous versions)
    - Duplicate wishlist
    - Merge multiple wishlists
    - Wishlist comments at list level (not just item level)
    - Wishlist cover image/thumbnail
    - Wishlist description/notes
    - Set wishlist as gift registry
    - Mark items as purchased (for gift registries)
    - Wishlist search (search within wishlist)
    - Bulk operations (add multiple products, remove multiple, move to cart)
    - Wishlist analytics for user (most added categories, average price, etc.)
- **Admin Wishlist Management:**
  - View all user wishlists
  - View specific user's wishlist
  - View most wishlisted products
  - Wishlist analytics (popular products, wishlist-to-cart conversion)
  - Export wishlist data
  - View collaborative wishlists
  - View wishlist collaboration statistics
  - Manage wishlist templates
  - View wishlist trends (most popular categories, price ranges)
  - Wishlist health metrics (abandoned wishlists, inactive wishlists)
  - Bulk wishlist operations
  - Wishlist moderation (flag inappropriate wishlists)
  - View wishlist activity logs
- **Vendor Wishlist Management:**
  - View how many users wishlisted their products
  - See which products are most wishlisted
  - Wishlist analytics for their products
  - Get notified when users add their products to wishlist
  - View wishlist trends for their products (which categories are most wishlisted)
  - See wishlist-to-purchase conversion for their products
  - View wishlist demographics (which user segments wishlist their products)
  - Wishlist-based product recommendations
  - Create special offers for wishlisted products
  - View wishlist activity for their products (additions, removals, moves to cart)
- **Vendor Product Management:**
  - Vendors can add/create their own products
  - Vendors can view and manage all their products
  - Vendors can review their product listings
  - Vendors can update product details, prices, quantities
  - Vendors can activate/deactivate their products
  - Vendors can see product performance metrics
  - Vendors can view product reviews and ratings
  - Vendors can respond to product reviews
- **Admin Product Review:**
  - Admins can review all products
  - Admins can approve/reject products
  - Admins can view product details and vendor information
  - Admins can see product review history
  - Admins can manage product status
  - Admins can feature/unfeature products
  - Admins can see product analytics and performance

### 4. Seller/Supplier Management
- Seller registration and onboarding
- Company profile management
- Seller ratings and reviews
- Company verification number
- Payment terms (LC, T/T, D/P, PayPal, Western Union)
- Shipping terms and lead times
- Activities and specialties
- Seller product listings
- Seller advertisements/offers
- Company profile page with tabs (Company Profile, Product Description)
- Company ads management
- Company information display (trade name, activities, payment terms, shipping terms, lead times)
- View all products from a specific seller/company

### 5. Order Management
- Create new orders
- Order status tracking with timeline:
  - Order Received (with timestamp and confirmation message)
  - Payment Confirmed (with timestamp and confirmation)
  - In Preparation (with team follow-up message)
  - In Shipping (with current location, e.g., "Currently in Dubai")
  - Ready for Pickup/Shipping
  - Completed
  - Cancelled
  - Awaiting Company Response
- Order filtering by status (All, Awaiting company response, In delivery, Completed)
- Order history for users
- Order details with full breakdown:
  - Order summary table with columns: Serial, Item Number, Quantity, Price, CBM
  - Total calculations (quantity, price, CBM)
  - Site commission percentage display
- Order notes/comments
- Link orders to users and products
- Order tracking with shipping carrier integration (e.g., DHL)
- Order acceptance workflow (seller accepts/rejects orders)
- Order acceptance notifications
- Order number generation (e.g., SHR1234556789)
- Shipping method display (e.g., "Within 5-7 working days")
- **Order Tracking for Users:**
  - Users can track their own orders
  - Real-time order status updates
  - Order timeline with detailed history
  - Shipping location tracking
  - Estimated delivery date
  - Order notifications
- **Order Tracking for Vendors:**
  - Vendors can track orders for their products
  - View all orders received
  - Order status management
  - Update order status (In Preparation, In Shipping, etc.)
  - Add shipping tracking information
  - View order details and customer information
  - Order fulfillment tracking
- **Order Tracking for Admins:**
  - Admins can track all orders in the system
  - View orders by user, vendor, status, date range
  - Order analytics and statistics
  - Order intervention capabilities
  - Order cancellation and refund management
  - Order dispute resolution
  - Complete order audit trail

### 6. Negotiation System
- Price negotiation requests
- Quantity negotiation requests
- Per-product negotiation fields:
  - Negotiation quantity input
  - Negotiation price input (per unit)
  - Display of negotiated totals (quantity, CBM, price)
- Negotiation status tracking
- Seller response to negotiations
- Negotiation history
- Negotiation notes/comments
- Bulk negotiation requests (multiple products in one request)

### 7. Shopping Cart and Checkout
- **User Cart Management:**
  - Add products to cart
  - Update cart item quantities
  - Remove items from cart
  - Clear entire cart
  - View cart summary (subtotal, tax, delivery, commission, total)
  - Apply discount codes
  - Remove discount codes
  - Save cart for later
  - Restore saved cart
  - Cart expiration (abandoned cart handling)
  - Cart item notes/comments
  - Move items from wishlist to cart
  - Cart sharing (share cart with others)
  - Multiple carts support (save different cart configurations)
- **Admin Cart Management:**
  - View all user carts
  - View specific user's cart
  - View abandoned carts
  - View cart analytics (average cart value, cart abandonment rate)
  - Manage user carts (add/remove items, update quantities)
  - Clear user carts
  - Export cart data
  - Cart recovery campaigns
  - View cart history per user
- **Vendor Cart Management:**
  - View carts containing their products
  - See how many carts include their products
  - View potential orders (carts with their products)
  - Cart analytics for their products (how often products are added to cart)
  - Abandoned cart notifications (when user abandons cart with their products)
  - Product performance in carts (which products are most added to cart)
- Order summary table with columns:
  - Serial number
  - Item number
  - Quantity
  - Price
  - CBM (Cubic Meter)
  - Total row with aggregated values
- Order summary calculation:
  - Subtotal
  - Delivery charges
  - Tax calculation
  - Site commission (2.5% or 4% configurable, displayed as percentage)
  - Total amount
- Shipping address management:
  - Address input
  - Country selection (required, marked with *)
  - City selection (required, marked with *)
- Shipping method selection:
  - Option 1: Use site's trusted shipping intermediaries (radio button)
  - Option 2: Use custom shipping agent (radio button)
- Customs clearance checkbox:
  - "Provide customs clearance under your responsibility"
- Complete purchase flow
- Order notes/comments field

### 8. Payment System
- Payment method selection:
  - Bank Card (Visa, Mastercard, Maestro, American Express)
  - Bank Transfer with receipt upload
- Payment processing integration
- Payment gateway integration
- Bank transfer verification:
  - Bank details (FAB, IBAN, Beneficiary name - e.g., "Mazadat Abu Dhabi LLC")
  - Receipt image upload (max 10MB, drag and drop support)
  - Payment verification workflow
  - Bank account information display for transfers
- Payment status tracking
- Payment holding/escrow system:
  - Amount remains pending in Stockship account until shipping policy arrives
  - Amount remains pending until quality confirmation via logistics
  - Transfer to buyer after confirmation
- Refund processing:
  - Refund policies (without tax, commercial penalties, visa usage fee)
  - Cancellation after payment refund rules
  - Pending amount management
- Payment terms configuration
- Site commission calculation and tracking (2.5% or 4% configurable)
- Credit discount system (2.5% discount when using credit)
- Tax calculation and display
- Payment amount breakdown (amount name, tax, total payment)

### 9. Shipping Management
- Shipping address collection (address, country, city)
- Shipping method selection
- Shipping intermediaries management
- Custom shipping agent support
- Shipping tracking integration
- CBM calculations for shipping
- Shipping policy management
- Delivery time estimates (e.g., 5-7 working days)

### 10. Inventory Management
- Stock level tracking
- Add/remove stock operations
- Low stock alerts
- Sold out status management
- Inventory updates

### 11. Categories Management
- Category CRUD operations
- **Hierarchical Category System:**
  - Main categories (parent categories)
  - Sub-categories (child categories)
  - Multi-level category hierarchy support
  - Category tree structure
  - Category breadcrumb generation
  - Category depth management
- Category icons and images
- Product categorization (can assign to main category and sub-categories)
- **SEO for Categories:**
  - Category meta title
  - Category meta description
  - Category meta keywords
  - SEO-friendly category URL slug
  - Category canonical URL
  - Category structured data (JSON-LD)
  - Category Open Graph tags
  - Category page description
- Category display order/sorting
- Category visibility (active/inactive)
- Category product count

### 12. Notifications System
- User notifications
- Order status notifications
- Payment notifications
- Negotiation notifications
- Notification preferences

### 13. Support System
- Support tickets creation and management
- Support center functionality
- Return center management
- Customer support workflows
- **User Support:**
  - Users can create support tickets
  - Users can view their ticket history
  - Users can add messages to tickets
  - Users can track ticket status
  - Users receive notifications for ticket updates
- **Vendor Support:**
  - Vendors can create support tickets
  - Vendors can view their ticket history
  - Vendors can communicate with support team
  - Vendors can track ticket resolution
- **Admin Support Management:**
  - Admins can view all support tickets
  - Admins can assign tickets to support staff
  - Admins can respond to tickets
  - Admins can close/resolve tickets
  - Admins can view support analytics
  - Admins can manage ticket priorities
  - Admins can escalate tickets
  - Support ticket categories and tags
  - Support ticket search and filtering

### 14. Content Management
- Terms and Conditions content
- Privacy Policy content
- Delivery Information
- Static content management
- Company information pages
- **SEO for Content Pages:**
  - Meta title for each content page
  - Meta description for each content page
  - Meta keywords for each content page
  - SEO-friendly URL slugs for content pages
  - Canonical URLs
  - Open Graph tags for content sharing
  - Twitter Card tags
  - Structured data for content pages
  - Content page schema markup

### 15. SEO Management System
- **Global SEO Settings:**
  - Site-wide meta title template
  - Site-wide meta description template
  - Default meta keywords
  - Site-wide Open Graph image
  - Site-wide Twitter Card image
  - Robots.txt management
  - Sitemap generation (XML sitemap)
  - Sitemap submission tracking
- **Product SEO:**
  - Individual product meta titles
  - Individual product meta descriptions
  - Product-specific keywords
  - Product URL slugs (auto-generated or custom)
  - Product structured data (JSON-LD)
  - Product schema markup (Product, Offer, AggregateRating)
  - Product image alt text management
  - Product breadcrumb schema
- **Category SEO:**
  - Category-specific meta titles
  - Category-specific meta descriptions
  - Category keywords
  - Category URL slugs
  - Category structured data
  - Category breadcrumb schema
- **Content Page SEO:**
  - Page-specific meta titles
  - Page-specific meta descriptions
  - Page keywords
  - Page URL slugs
  - Page structured data
- **SEO Analytics:**
  - Track SEO performance
  - Monitor meta tag usage
  - URL slug uniqueness validation
  - SEO score calculation
  - Missing SEO fields detection
- **SEO Tools:**
  - Auto-generate SEO-friendly slugs from titles
  - SEO suggestions and recommendations
  - Duplicate content detection
  - Meta tag preview
  - SEO validation

### 16. Advanced Search and Filtering System
- **Full-Text Search:**
  - Product search by name, description, SKU, tags
  - Category search
  - Vendor/seller search
  - Order search by order number, customer name, product name
  - User search by name, email, phone
  - Support ticket search
  - Full-text search across all translatable fields
  - Search suggestions/autocomplete
  - Search history per user
  - Saved searches
  - Search analytics (popular searches, no results queries)
- **Image Search:**
  - Reverse image search capability
  - Visual similarity search
  - Image-based product discovery
- **Advanced Product Filtering:**
  - By category and sub-category (multi-select)
  - By price range (min/max with currency)
  - By seller/supplier (multi-select)
  - By ratings (star rating range)
  - By location (country, city - multi-select)
  - By availability status
  - By product status (available, sold out, etc.)
  - By vendor verification status
  - By negotiation acceptance
  - By featured products
  - By date range (created, updated)
  - By quantity available
  - By CBM range
  - By tags/keywords
  - Combined filters (AND/OR logic)
- **Advanced Order Filtering:**
  - By order status (multi-select)
  - By payment status
  - By date range (created, updated, delivery)
  - By customer (user)
  - By vendor
  - By order amount range
  - By shipping country/city
  - By payment method
- **Advanced User/Vendor Filtering:**
  - By registration date
  - By account status (active, suspended, etc.)
  - By verification status
  - By country/city
  - By account type
  - By activity level
- **Advanced Category Filtering:**
  - By parent category
  - By level (main, sub-category)
  - By active status
  - By product count range
- **Sorting Options:**
  - Products: price (asc/desc), rating, date added, popularity, name, quantity, CBM
  - Orders: date, amount, status, customer name
  - Users: registration date, name, activity
  - Categories: name, product count, display order
- **Pagination and Results:**
  - Configurable page size (10, 20, 50, 100)
  - Cursor-based pagination for large datasets
  - Total count and page information
  - Result highlighting for search terms
- **Search Performance:**
  - Search result caching
  - Indexed search fields
  - Search result ranking algorithm
  - Fuzzy search for typos
  - Search result export

### 16. Reporting and Analytics
- Current stock levels
- Sales data (total orders, total revenue)
- Seller performance metrics
- Product popularity tracking
- Order statistics

### 17. Modern Internationalization (i18n) System
- **Translation Key System (Modern Approach):**
  - Use translation keys instead of storing translations in database
  - Store only translation keys in database fields (e.g., `nameKey: "product.name.123"`)
  - Translations stored in JSON files or translation service (i18next, react-i18next)
  - Database remains lightweight - no duplicate content per language
  - Example: Product name stored as `nameKey: "product.name.123"` instead of `name: "Product Name"` and `nameAr: "اسم المنتج"`
  - Translation files structure: `locales/{language}/translation.json`
  - Support for unlimited languages without database bloat
  - Dynamic language loading
  - Fallback language support (default: English)
- **Supported Languages:**
  - Arabic (ar) - RTL support
  - English (en) - LTR support
  - Extensible to any language (French, Spanish, etc.)
- **Translatable Fields (Using Keys):**
  - Product: name, description, metaTitle, metaDescription
  - Category: name, description, metaTitle, metaDescription, pageDescription
  - Content Pages: title, content, metaTitle, metaDescription
  - Order Status: status labels
  - Payment Terms: terms descriptions
  - Notifications: notification messages
  - Error Messages: all error messages
  - UI Labels: all interface labels
  - Email Templates: all email content
  - Site Settings: site name, descriptions
- **Translation Management:**
  - Admin can manage translations via API
  - Translation key generation (auto or manual)
  - Translation status tracking (complete/incomplete per language)
  - Missing translation detection
  - Translation import/export (JSON, CSV)
  - Translation versioning
  - Translation review workflow
- **Currency Support:**
  - Multi-currency support (SAR, EGP, USD, EUR, etc.)
  - Currency conversion rates (real-time or manual)
  - Currency preference per user
  - Price display in user's preferred currency
  - Currency symbol and formatting per locale
  - Exchange rate history
- **Localization:**
  - Date/time formatting per locale
  - Number formatting (decimals, thousands separator)
  - Address formatting per country
  - Phone number formatting
  - Timezone handling
  - Calendar system support (Gregorian, Hijri, etc.)
- **Language Detection:**
  - Browser language detection
  - User preference storage
  - URL-based language switching (`/ar/products`, `/en/products`)
  - Language switcher in UI
  - Remember language preference (cookie/localStorage)
- **RTL (Right-to-Left) Support:**
  - Full RTL support for Arabic
  - Automatic layout direction switching
  - RTL-aware UI components
  - RTL text alignment
- **API Language Support:**
  - Language parameter in API requests (`?lang=ar` or `Accept-Language` header)
  - Default language fallback
  - Language validation
  - Response language indication

### 18. File Upload Management
- Product image uploads (max 10 images per product)
- Payment receipt uploads (max 10MB)
- Excel file uploads for bulk product import
- Image format validation (JPEG, PNG, WebP)
- File storage and retrieval
- Drag and drop file upload support

### 19. Activity Logs and Audit Trails
- **Comprehensive Activity Tracking:**
  - User actions (login, logout, profile updates, password changes)
  - Vendor actions (product creation, updates, order management)
  - Admin actions (user management, vendor management, settings changes)
  - Order lifecycle events (status changes, payment updates)
  - Product changes (creation, updates, deletion, approval/rejection)
  - Payment transactions (all payment events)
  - Wallet transactions (deposits, withdrawals, transfers)
  - System configuration changes
  - Permission changes
  - Bulk operations (imports, exports)
- **Audit Trail Features:**
  - Who: User ID, role, email
  - What: Action type, entity type, entity ID
  - When: Timestamp with timezone
  - Where: IP address, user agent, location
  - Why: Reason/notes (optional)
  - Before/After: Change tracking (old value, new value)
- **Log Retention:**
  - Configurable retention period
  - Automatic archival of old logs
  - Log export functionality
  - Searchable audit logs
- **Security Audit:**
  - Failed login attempts
  - Permission denied events
  - Suspicious activity detection
  - API abuse detection
  - Data access tracking

### 20. Saved Searches and Search History
- **Saved Searches:**
  - Users can save search queries with filters
  - Named saved searches
  - Email alerts for new results (optional)
  - Share saved searches
  - Edit/delete saved searches
  - Saved search analytics
- **Search History:**
  - Track user search queries
  - Search history per user
  - Clear search history
  - Search suggestions based on history
  - Popular searches analytics
  - Search trend analysis
- **Search Analytics:**
  - Most searched terms
  - Searches with no results
  - Search-to-purchase conversion
  - Search abandonment analysis
  - Category search popularity

### 21. Export and Import Functionality
- **Data Export:**
  - Export products (CSV, Excel, JSON)
  - Export orders (CSV, Excel, JSON)
  - Export users (CSV, Excel, JSON)
  - Export vendors (CSV, Excel, JSON)
  - Export reports (PDF, Excel, CSV)
  - Export translations (JSON, CSV)
  - Export audit logs (CSV, JSON)
  - Custom export with field selection
  - Scheduled exports
  - Export filtering and date ranges
- **Data Import:**
  - Bulk product import (Excel, CSV)
  - Bulk user import
  - Bulk vendor import
  - Translation import (JSON, CSV)
  - Category import
  - Import validation and error reporting
  - Import preview before execution
  - Import history and logs
  - Rollback failed imports
- **Template Downloads:**
  - Product import template
  - User import template
  - Vendor import template
  - Translation template

### 22. Caching System
- **Cache Strategy:**
  - Redis or in-memory caching
  - Cache frequently accessed data:
    - Product listings
    - Category trees
    - Site settings
    - Translation keys
    - User sessions
    - Search results
    - Popular products
    - Statistics
- **Cache Invalidation:**
  - Automatic cache invalidation on data updates
  - Cache tags for related data
  - TTL (Time To Live) configuration
  - Manual cache clearing
- **Cache Performance:**
  - Cache hit/miss metrics
  - Cache warming strategies
  - Distributed caching support

### 23. Real-time Features
- **WebSocket Support:**
  - Real-time order updates
  - Real-time notifications
  - Real-time chat (support tickets)
  - Real-time inventory updates
  - Real-time negotiation updates
  - Live order tracking
- **Server-Sent Events (SSE):**
  - Notification streaming
  - Order status updates
  - System announcements
- **Real-time Analytics:**
  - Live dashboard statistics
  - Real-time sales monitoring
  - Active users tracking

### 24. Security Enhancements
- **Authentication:**
  - Two-factor authentication (2FA) - TOTP, SMS, Email
  - Social login (Google, Facebook, etc.)
  - OAuth 2.0 support
  - Session management
  - Remember me functionality
  - Account lockout after failed attempts
- **Authorization:**
  - Role-based access control (RBAC)
  - Permission-based access control
  - API key management
  - IP whitelisting for admin
- **Data Protection:**
  - Password encryption (bcrypt with salt)
  - Sensitive data encryption at rest
  - HTTPS enforcement
  - CSRF protection
  - XSS protection
  - SQL injection prevention
  - Rate limiting per user/IP
  - Request validation and sanitization
- **Security Monitoring:**
  - Failed login tracking
  - Suspicious activity alerts
  - Security event logging
  - Regular security audits

### 25. Performance Monitoring and Optimization
- **Performance Metrics:**
  - API response times
  - Database query performance
  - Cache hit rates
  - Error rates
  - Request throughput
  - Server resource usage (CPU, memory, disk)
- **Monitoring Tools:**
  - Application performance monitoring (APM)
  - Error tracking and logging
  - Uptime monitoring
  - Database query analysis
  - Slow query detection
- **Optimization:**
  - Database indexing strategy
  - Query optimization
  - Lazy loading for large datasets
  - Image optimization and CDN
  - Code splitting
  - Database connection pooling
  - Background job processing

### 26. Product Advertisement/Listing Management
- Create product advertisements/listings
- Product listing form with:
  - Stockship fees agreement checkbox (terms and conditions)
  - Country selection (dropdown, e.g., Saudi Arabia)
  - City selection (dropdown, e.g., Jeddah)
  - Image upload section:
    - Drag and drop images support
    - Click to select images
    - Max 100 files, 100MB each
    - Supported formats: image/jpeg, image/png, image/webp
    - Max 10 images per advertisement
  - Excel template download for bulk product listing
  - Excel file upload from device
  - Product description text area (required field, marked with *)
  - Negotiation acceptance toggle (price and quantity)
  - Category/section selection (required field, marked with *)
- Publish/unpublish product listings
- Product listing status management
- Product listing approval workflow (if needed)

### 20. Homepage and Discovery Features
- Top rated products section
- Best sellers section
- Recently added products
- Most purchased products
- Popular products tags/categories
- Business services showcase:
  - Security services (supplier/importer identity verification)
  - Commercial services (displaying various goods in all categories)
  - Communication services (fast communication and conversation monitoring)
- Promotional banners and carousels
- Category sidebar navigation

### 21. Product Viewing Options
- List view and grid view toggle
- Sort by options (price, rating, date, popularity)
- Product list view with detailed information
- View all products from a specific seller/company
- Product serial/item number tracking in orders

### 22. Request Price Feature
- Request price functionality for products
- Price inquiry system with:
  - Quantity specification (optional)
  - Custom message to seller
- Seller response to price requests:
  - Response price
  - Response message
  - Status update (pending, responded, closed)
- Price request notifications
- Price request history

### 23. Order Acceptance and Notifications
- Order acceptance workflow
- Notification when order is accepted
- Redirect to payment after order acceptance
- Order acceptance status tracking

### 24. Credit and Discount System
- Credit discount percentage (2.5% when using credit)
- Credit usage tracking
- Discount code system with validation
- Site commission vs credit discount differentiation

### 25. Company/Seller Profile Display
- Company profile tab in product pages
- Company information display:
  - Trade name
  - Activities and specialties
  - Payment terms
  - Shipping terms
  - Average lead time (peak and off-peak seasons)
  - Main products
  - Company rating
- Company ads listing
- Company verification number display

### 26. Admin Management System
- Admin authentication and authorization
- Admin roles and permissions:
  - **Super Admin**: Full system access, can create other admins, manage all settings
  - **Admin**: Full operational access (users, vendors, products, orders, payments, reports)
  - **Moderator**: Limited access (view and moderate content, respond to support tickets)
- Permission-based access control:
  - `users.*` - User management (create, read, update, delete, activate/deactivate)
  - `vendors.*` - Vendor management (create, read, update, delete, approve, suspend)
  - `products.*` - Product management (create, read, update, delete, approve, feature)
  - `orders.*` - Order management (view, update status, cancel, refund)
  - `payments.*` - Payment management (view, verify, refund)
  - `categories.*` - Category management (full CRUD)
  - `support.*` - Support ticket management
  - `reports.*` - Report generation and download
  - `settings.*` - Site settings management
  - `wallets.*` - Wallet management (view, freeze, transfer)
- Admin dashboard access with comprehensive statistics
- Admin CRUD operations for:
  - Users (Create, Read, Update, Delete, Activate/Deactivate)
  - Vendors (Create, Read, Update, Delete, Approve/Reject, Suspend)
  - Products (Create, Read, Update, Delete, Approve/Reject, Feature)
  - Orders (View, Update status, Cancel, Refund)
  - Categories (Full CRUD)
  - Payments (View, Verify, Refund, Manage)
  - Support tickets (View, Respond, Close)
- Admin user management:
  - View all users with filters
  - User details and activity history
  - User account status management
  - User wallet management
- Admin vendor management:
  - View all vendors with filters
  - Vendor approval/rejection workflow
  - Vendor suspension/activation
  - Vendor wallet management (view, freeze, transfer)
  - Vendor commission management
  - Vendor performance metrics
- Admin product management:
  - View all products with filters
  - Product approval/rejection
  - Product feature/unfeature
  - Bulk product operations
  - Product category management
- Admin order management:
  - View all orders with filters
  - Order status updates
  - Order cancellation
  - Order refund processing
  - Order analytics
- Admin payment management:
  - View all payments
  - Payment verification
  - Payment refund processing
  - Payment gateway configuration
  - Commission management
- Admin site configuration:
  - Site logo upload/change
  - Site settings management
  - Commission percentage configuration
  - Tax rate configuration
  - Email templates management
  - Content management (Terms, Privacy Policy, etc.)
- Admin reports and analytics:
  - Sales reports (downloadable)
  - User reports (downloadable)
  - Vendor reports (downloadable)
  - Product reports (downloadable)
  - Order reports (downloadable)
  - Payment reports (downloadable)
  - Revenue reports (downloadable)
  - Commission reports (downloadable)
  - Export reports in multiple formats (CSV, Excel, PDF)

### 27. Vendor Management System
- Vendor authentication and authorization
- Vendor roles and permissions:
  - **Verified Vendor**: Full vendor access (products, orders, payments, reports)
  - **Pending Vendor**: Limited access until approval (can create products but not publish)
  - **Suspended Vendor**: Restricted access (view only, cannot create/update)
- Vendor permissions:
  - `products.own.*` - Manage own products (create, update, delete)
  - `orders.own.*` - Manage own orders (view, accept, reject, update status)
  - `payments.own.*` - View own payments and commission
  - `reports.own.*` - Generate own reports
  - `profile.*` - Manage own profile
  - `wallet.own.*` - View own wallet and request payouts
- Vendor dashboard access with statistics
- Vendor product management:
  - Create, update, delete own products
  - Product approval workflow
  - Product status management
  - Bulk product upload
- Vendor order management:
  - View own orders
  - Accept/reject orders
  - Update order status
  - Order fulfillment tracking
- Vendor payment management:
  - View own payments
  - Payment history
  - Commission tracking
  - Payout requests
- Vendor reports and analytics:
  - Sales reports (downloadable)
  - Product performance reports
  - Order reports
  - Revenue reports
  - Commission reports
  - Export reports in multiple formats

### 28. Wallet System
- Main wallet (platform wallet):
  - Total platform revenue tracking
  - Commission collection
  - Refund management
  - Admin can view and manage
- Vendor wallet:
  - Vendor earnings tracking
  - Commission deductions
  - Payout requests
  - Wallet balance
  - Transaction history
  - Admin can manage all vendor wallets:
    - View vendor wallet balance
    - Freeze/unfreeze vendor wallet
    - Transfer funds to vendor
    - Deduct funds from vendor
    - View vendor transaction history
- User wallet (optional):
  - User balance for credits
  - Transaction history
- Wallet transactions:
  - Credit transactions
  - Debit transactions
  - Commission deductions
  - Refunds
  - Payouts
  - Transaction status tracking

### 29. Checkout System
- Checkout process management
- Checkout tables and data structures:
  - Cart to order conversion
  - Checkout session management
  - Payment method selection
  - Shipping address validation
  - Order summary calculation
  - Discount application
  - Tax calculation
  - Commission calculation
  - Final order creation
- Checkout validation
- Checkout completion tracking

### 30. Point System (Loyalty/Rewards)
- Point accumulation and redemption system
- **User Points:**
  - Users earn points for purchases
  - Users earn points for reviews
  - Users earn points for referrals
  - Users can redeem points for discounts
  - Users can view point balance and history
  - Point expiration management
  - Point conversion rates (configurable)
- **Vendor Points:**
  - Vendors earn points for sales
  - Vendors earn points for positive reviews
  - Vendors can use points for platform features
  - Vendors can view point balance and history
  - Point-based vendor rewards program
- **Admin Point Management:**
  - Admins can view all user/vendor points
  - Admins can manually add/deduct points
  - Admins can configure point earning rules
  - Admins can manage point expiration
  - Admins can view point analytics
  - Point transaction history
- Point transaction types:
  - Purchase points
  - Review points
  - Referral points
  - Redemption points
  - Admin adjustment points
  - Expired points

### 31. Product Offers System
- Vendor-created product offers
- **Offer Management:**
  - Vendors can create offers for their products
  - Offer types:
    - Percentage discount (e.g., 20% off)
    - Fixed amount discount (e.g., $50 off)
    - Buy X Get Y offers
    - Bundle offers
    - Flash sales
  - Offer duration (start date, end date)
  - Offer quantity limits
  - Offer eligibility rules
  - Offer status (Active, Scheduled, Expired, Cancelled)
- **Offer Features:**
  - Minimum purchase requirements
  - Maximum discount limits
  - Applicable to specific products or categories
  - User eligibility (all users, specific user groups)
  - Offer visibility and promotion
  - Offer analytics and performance tracking
- **Admin Offer Management:**
  - Admins can view all offers
  - Admins can approve/reject vendor offers
  - Admins can create platform-wide offers
  - Admins can manage offer visibility
  - Admins can view offer performance analytics

### 32. Coupons and Discounts System
- Comprehensive coupon management
- **Coupon Types:**
  - Percentage coupons (e.g., 15% off)
  - Fixed amount coupons (e.g., $100 off)
  - Free shipping coupons
  - Buy one get one (BOGO) coupons
  - Minimum purchase coupons
- **Coupon Features:**
  - Unique coupon codes
  - Usage limits (per user, total usage)
  - Validity period (start date, end date)
  - Minimum purchase amount requirement
  - Maximum discount cap
  - Applicable to specific products, categories, or vendors
  - First-time buyer only coupons
  - User-specific coupons
- **Coupon Management:**
  - **Admin Coupon Management:**
    - Create, update, delete coupons
    - View all coupons and usage statistics
    - Generate coupon codes
    - Bulk coupon generation
    - Coupon performance analytics
    - Coupon activation/deactivation
  - **Vendor Coupon Creation:**
    - Vendors can create coupons for their products
    - Vendor coupon approval workflow
    - Vendor coupon analytics
  - **User Coupon Usage:**
    - Users can apply coupons at checkout
    - Users can view available coupons
    - Users can view coupon history
    - Coupon validation and verification
- **Discount Code System:**
  - Discount code generation
  - Discount code validation
  - Discount code tracking
  - Discount code expiration
  - Discount code usage analytics

## API Endpoints (Proposed)

### Authentication
- `POST /api/auth/register` - Register a new user (name, email, password, phone, country, city)
- `POST /api/auth/login` - Login user and return JWT token
- `POST /api/auth/guest` - Login as guest
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user details (protected)
- `PUT /api/auth/me` - Update current user profile (protected)
- `POST /api/auth/logout` - Logout user

### Seller Registration
- `POST /api/sellers/register` - Register as seller (includes business details)
- `POST /api/sellers/complete-profile` - Complete seller profile with bank details
- `GET /api/sellers/:id` - Get seller profile
- `PUT /api/sellers/:id` - Update seller profile
- `GET /api/sellers/:id/rating` - Get seller rating

### Products
- `GET /api/products` - Get all products (with search/filter/pagination/sorting, includes sub-category filter)
- `GET /api/products/:id` - Get product by ID with full details (including SEO data)
- `POST /api/products` - Create new product (seller/admin only, includes SEO fields)
- `PUT /api/products/:id` - Update product (seller/admin only, includes SEO fields)
- `DELETE /api/products/:id` - Delete product (seller/admin only)
- `POST /api/products/bulk-upload` - Bulk upload products via Excel
- `GET /api/products/excel-template` - Download Excel template for bulk upload
- `GET /api/products/:id/related` - Get related products
- `GET /api/products/search` - Advanced product search (including image search, sub-category filter)
- `POST /api/products/:id/images` - Upload product images
- `DELETE /api/products/:id/images/:imageId` - Delete product image
- `PUT /api/products/:id/images/:imageId/alt-text` - Update image alt text for SEO
- `POST /api/products/:id/share` - Share product (generate shareable link)
- `GET /api/products/seller/:sellerId` - Get all products from a specific seller
- `GET /api/products/category/:categoryId` - Get products by category (including sub-categories)
- `GET /api/products/subcategory/:subcategoryId` - Get products by sub-category
- `GET /api/products/:id/seo` - Get product SEO data
- `PUT /api/products/:id/seo` - Update product SEO data (vendor/admin only)
- `POST /api/products/:id/generate-slug` - Auto-generate SEO-friendly slug from product name
- `GET /api/products/:id/structured-data` - Get product structured data (JSON-LD)

### Product Negotiation
- `POST /api/negotiations` - Create negotiation request (price/quantity)
- `GET /api/negotiations` - Get user's negotiations
- `GET /api/negotiations/:id` - Get negotiation details
- `PUT /api/negotiations/:id/respond` - Seller responds to negotiation
- `PUT /api/negotiations/:id/status` - Update negotiation status

### Shopping Cart (User)
- `GET /api/cart` - Get current user's cart with full details
- `GET /api/cart/summary` - Get cart summary (totals, counts)
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `PUT /api/cart/items/:id/notes` - Add/update notes for cart item
- `DELETE /api/cart/items/:id` - Remove item from cart
- `POST /api/cart/apply-discount` - Apply discount code
- `DELETE /api/cart/discount` - Remove discount code
- `POST /api/cart/clear` - Clear entire cart
- `POST /api/cart/save` - Save cart for later
- `GET /api/cart/saved` - Get saved carts
- `POST /api/cart/saved/:id/restore` - Restore saved cart
- `DELETE /api/cart/saved/:id` - Delete saved cart
- `POST /api/cart/share` - Generate shareable cart link
- `GET /api/cart/shared/:token` - Get shared cart by token
- `POST /api/cart/from-wishlist` - Move items from wishlist to cart
- `GET /api/cart/history` - Get cart history

### Shopping Cart (Admin)
- `GET /api/admin/carts` - Get all user carts (with filters: user, status, date range)
- `GET /api/admin/carts/:id` - Get specific cart details
- `GET /api/admin/carts/user/:userId` - Get user's cart(s)
- `GET /api/admin/carts/abandoned` - Get abandoned carts
- `GET /api/admin/carts/analytics` - Get cart analytics
- `POST /api/admin/carts/:id/items` - Add item to user's cart
- `PUT /api/admin/carts/:id/items/:itemId` - Update cart item in user's cart
- `DELETE /api/admin/carts/:id/items/:itemId` - Remove item from user's cart
- `POST /api/admin/carts/:id/clear` - Clear user's cart
- `GET /api/admin/carts/export` - Export cart data
- `POST /api/admin/carts/recovery-campaign` - Create cart recovery campaign

### Shopping Cart (Vendor)
- `GET /api/vendor/carts` - Get carts containing vendor's products
- `GET /api/vendor/carts/analytics` - Get cart analytics for vendor's products
- `GET /api/vendor/carts/products/:productId` - Get carts containing specific product
- `GET /api/vendor/carts/abandoned` - Get abandoned carts with vendor's products
- `GET /api/vendor/products/cart-stats` - Get cart statistics for all vendor products

### Orders
- `GET /api/orders` - Get all orders (with status filtering)
- `GET /api/orders/:id` - Get order by ID with full details
- `POST /api/orders` - Create new order from cart
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/:id/tracking` - Get order tracking information
- `POST /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/status/:status` - Get orders by status

### Payments
- `POST /api/payments/process-card` - Process card payment
- `POST /api/payments/process-transfer` - Initiate bank transfer payment
- `POST /api/payments/upload-receipt` - Upload bank transfer receipt
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/order/:orderId` - Get payment for order
- `POST /api/payments/:id/verify` - Verify bank transfer payment
- `POST /api/payments/:id/refund` - Process refund
- `GET /api/payments/terms` - Get payment terms and conditions
- `POST /api/payments/:id/accept-terms` - Accept payment terms (with checkboxes)
- `GET /api/payments/bank-details` - Get bank transfer details (FAB, IBAN, Beneficiary)

### Shipping
- `POST /api/shipping/address` - Add/update shipping address
- `GET /api/shipping/address` - Get shipping addresses
- `DELETE /api/shipping/address/:id` - Delete shipping address
- `POST /api/shipping/calculate` - Calculate shipping costs (based on CBM)
- `GET /api/shipping/methods` - Get available shipping methods
- `GET /api/shipping/track/:trackingNumber` - Track shipment

### Inventory
- `POST /api/inventory/add` - Add stock to a product
- `POST /api/inventory/remove` - Remove stock from a product
- `GET /api/inventory/stock-levels` - Get current stock levels
- `GET /api/inventory/low-stock` - Get products with low stock levels
- `PUT /api/inventory/products/:id/status` - Update product availability status

### Suppliers/Sellers
- `GET /api/suppliers` - Get all suppliers/sellers
- `GET /api/suppliers/:id` - Get supplier by ID with profile
- `GET /api/suppliers/:id/products` - Get supplier's products
- `GET /api/suppliers/:id/ads` - Get supplier's advertisements
- `POST /api/suppliers/:id/rate` - Rate a supplier

### Categories
- `GET /api/categories` - Get all categories (with hierarchy)
- `GET /api/categories/tree` - Get category tree structure
- `GET /api/categories/:id` - Get category by ID with sub-categories
- `GET /api/categories/:id/subcategories` - Get sub-categories of a category
- `GET /api/categories/:id/products` - Get products in category (including sub-categories)
- `GET /api/categories/:id/breadcrumb` - Get category breadcrumb path
- `POST /api/categories` - Create new category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)
- `PUT /api/categories/:id/parent` - Update category parent (move to different parent)
- `GET /api/categories/:id/seo` - Get category SEO data
- `PUT /api/categories/:id/seo` - Update category SEO data (admin only)

### Wishlist/Favorites (User)
- `GET /api/wishlist` - Get user's wishlist(s) with filters and sorting
- `GET /api/wishlist/:id` - Get specific wishlist by ID with full details
- `POST /api/wishlist` - Create new wishlist
- `PUT /api/wishlist/:id` - Update wishlist (name, privacy settings, description, cover image)
- `DELETE /api/wishlist/:id` - Delete wishlist
- `POST /api/wishlist/:id/duplicate` - Duplicate wishlist
- `POST /api/wishlist/merge` - Merge multiple wishlists
- `POST /api/wishlist/:id/products/:productId` - Add product to wishlist
- `POST /api/wishlist/:id/products/bulk` - Add multiple products to wishlist
- `DELETE /api/wishlist/:id/products/:productId` - Remove product from wishlist
- `DELETE /api/wishlist/:id/products/bulk` - Remove multiple products from wishlist
- `PUT /api/wishlist/:id/products/:productId/notes` - Add/update notes for wishlist item
- `PUT /api/wishlist/:id/products/:productId/priority` - Set item priority (Must Have, Nice to Have, Maybe Later)
- `PUT /api/wishlist/:id/products/:productId/position` - Reorder items in wishlist
- `POST /api/wishlist/:id/share` - Generate shareable wishlist link
- `GET /api/wishlist/shared/:token` - Get shared wishlist by token
- `POST /api/wishlist/:id/to-cart` - Move items from wishlist to cart
- `POST /api/wishlist/:id/products/:productId/to-cart` - Move specific item to cart
- `POST /api/wishlist/:id/products/bulk/to-cart` - Move multiple items to cart
- `GET /api/wishlist/notifications` - Get wishlist notifications (price drops, back in stock)
- `PUT /api/wishlist/:id/products/:productId/notifications` - Enable/disable notifications for item
- `GET /api/wishlist/:id/compare` - Compare products in wishlist side-by-side
- `GET /api/wishlist/:id/statistics` - Get wishlist statistics (total items, value, etc.)
- `GET /api/wishlist/:id/analytics` - Get wishlist analytics for user
- `GET /api/wishlist/:id/activity` - Get wishlist activity feed
- `GET /api/wishlist/:id/history` - Get wishlist version history
- `POST /api/wishlist/:id/restore` - Restore wishlist from history
- `GET /api/wishlist/:id/recommendations` - Get product recommendations based on wishlist
- `POST /api/wishlist/:id/budget` - Set wishlist budget
- `GET /api/wishlist/:id/budget` - Get wishlist budget tracking
- `GET /api/wishlist/:id/search` - Search within wishlist
- `POST /api/wishlist/:id/sort` - Sort wishlist items
- `GET /api/wishlist/:id/filter` - Filter wishlist items
- `POST /api/wishlist/:id/categories` - Add categories/tags to wishlist
- `PUT /api/wishlist/:id/categories` - Update wishlist categories
- `GET /api/wishlist/templates` - Get wishlist templates
- `POST /api/wishlist/from-template` - Create wishlist from template
- `GET /api/wishlist/:id/export` - Export wishlist (CSV, JSON)
- `POST /api/wishlist/import` - Import wishlist from file
- `PUT /api/wishlist/:id/products/:productId/purchased` - Mark item as purchased (for gift registry)
- `GET /api/wishlist/:id/collaborators` - Get wishlist collaborators
- `POST /api/wishlist/:id/collaborators/invite` - Invite user to collaborate on wishlist
- `PUT /api/wishlist/:id/collaborators/:userId` - Update collaborator permissions
- `DELETE /api/wishlist/:id/collaborators/:userId` - Remove collaborator
- `POST /api/wishlist/:id/collaborators/accept` - Accept collaboration request
- `POST /api/wishlist/:id/collaborators/decline` - Decline collaboration request
- `GET /api/wishlist/collaboration-requests` - Get pending collaboration requests

### Wishlist (Admin)
- `GET /api/admin/wishlists` - Get all user wishlists (with filters)
- `GET /api/admin/wishlists/:id` - Get specific wishlist details
- `GET /api/admin/wishlists/user/:userId` - Get user's wishlists
- `GET /api/admin/wishlists/products/popular` - Get most wishlisted products
- `GET /api/admin/wishlists/analytics` - Get wishlist analytics
- `GET /api/admin/wishlists/export` - Export wishlist data
- `GET /api/admin/wishlists/collaborative` - Get all collaborative wishlists
- `GET /api/admin/wishlists/collaboration-stats` - Get collaboration statistics
- `GET /api/admin/wishlists/trends` - Get wishlist trends (categories, price ranges)
- `GET /api/admin/wishlists/health` - Get wishlist health metrics (abandoned, inactive)
- `POST /api/admin/wishlists/bulk-operations` - Perform bulk operations on wishlists
- `POST /api/admin/wishlists/:id/moderate` - Moderate wishlist (flag, hide, etc.)
- `GET /api/admin/wishlists/:id/activity` - Get wishlist activity logs
- `GET /api/admin/wishlists/templates` - Get all wishlist templates
- `POST /api/admin/wishlists/templates` - Create wishlist template
- `PUT /api/admin/wishlists/templates/:id` - Update wishlist template
- `DELETE /api/admin/wishlists/templates/:id` - Delete wishlist template

### Wishlist (Vendor)
- `GET /api/vendor/wishlists` - Get wishlists containing vendor's products
- `GET /api/vendor/wishlists/analytics` - Get wishlist analytics for vendor's products
- `GET /api/vendor/wishlists/products/:productId` - Get wishlists containing specific product
- `GET /api/vendor/products/wishlist-stats` - Get wishlist statistics for all vendor products
- `GET /api/vendor/wishlists/users-count` - Get count of users who wishlisted vendor's products
- `GET /api/vendor/wishlists/trends` - Get wishlist trends for vendor's products
- `GET /api/vendor/wishlists/conversion` - Get wishlist-to-purchase conversion for vendor's products
- `GET /api/vendor/wishlists/demographics` - Get wishlist demographics for vendor's products
- `GET /api/vendor/wishlists/activity` - Get wishlist activity for vendor's products
- `POST /api/vendor/wishlists/offers` - Create special offers for wishlisted products
- `GET /api/vendor/wishlists/recommendations` - Get product recommendations based on wishlist data

### Reviews and Ratings
- `GET /api/products/:id/reviews` - Get product reviews
- `POST /api/products/:id/reviews` - Create product review
- `GET /api/suppliers/:id/reviews` - Get supplier reviews
- `POST /api/suppliers/:id/reviews` - Create supplier review

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notification count

### Support
- `GET /api/support/tickets` - Get support tickets
- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets/:id` - Get ticket details
- `PUT /api/support/tickets/:id` - Update ticket
- `POST /api/support/tickets/:id/messages` - Add message to ticket

### File Uploads
- `POST /api/upload/images` - Upload images (products, receipts)
- `POST /api/upload/excel` - Upload Excel file for bulk import
- `GET /api/files/:id` - Get uploaded file

### Content Management
- `GET /api/content/terms` - Get terms and conditions
- `GET /api/content/privacy` - Get privacy policy
- `GET /api/content/delivery-info` - Get delivery information
- `PUT /api/content/:type` - Update content (admin only)
- `GET /api/content/:type/seo` - Get content page SEO data
- `PUT /api/content/:type/seo` - Update content page SEO data (admin only)

### SEO Management
- `GET /api/seo/settings` - Get global SEO settings
- `PUT /api/seo/settings` - Update global SEO settings (admin only)
- `GET /api/seo/products/:id` - Get product SEO data
- `PUT /api/seo/products/:id` - Update product SEO data (vendor/admin only)
- `GET /api/seo/categories/:id` - Get category SEO data
- `PUT /api/seo/categories/:id` - Update category SEO data (admin only)
- `GET /api/seo/content/:type` - Get content page SEO data
- `PUT /api/seo/content/:type` - Update content page SEO data (admin only)
- `POST /api/seo/generate-slug` - Generate SEO-friendly slug from text
- `GET /api/seo/validate-slug` - Validate slug uniqueness
- `GET /api/seo/sitemap` - Get XML sitemap
- `GET /api/seo/robots-txt` - Get robots.txt content
- `PUT /api/seo/robots-txt` - Update robots.txt (admin only)
- `GET /api/seo/structured-data/:type/:id` - Get structured data (JSON-LD) for entity
- `GET /api/seo/analytics` - Get SEO analytics (admin only)
- `GET /api/seo/check` - Check SEO completeness for product/category/content (admin only)
- `POST /api/seo/bulk-update` - Bulk update SEO fields (admin only)

### Advanced Search
- `GET /api/search/products` - Advanced product search with full-text search
- `GET /api/search/autocomplete` - Search autocomplete/suggestions
- `GET /api/search/categories` - Search categories
- `GET /api/search/vendors` - Search vendors
- `GET /api/search/orders` - Search orders
- `GET /api/search/global` - Global search across all entities
- `POST /api/search/image` - Image-based search
- `GET /api/search/history` - Get user search history
- `DELETE /api/search/history` - Clear search history
- `POST /api/search/saved` - Save a search query
- `GET /api/search/saved` - Get saved searches
- `PUT /api/search/saved/:id` - Update saved search
- `DELETE /api/search/saved/:id` - Delete saved search
- `GET /api/search/analytics` - Get search analytics (admin only)
- `GET /api/search/popular` - Get popular searches

### Activity Logs and Audit
- `GET /api/audit/logs` - Get activity logs (admin only, with filters)
- `GET /api/audit/logs/:id` - Get specific log entry
- `GET /api/audit/user/:userId` - Get user activity logs
- `GET /api/audit/entity/:type/:id` - Get entity change history
- `GET /api/audit/export` - Export audit logs (admin only)
- `GET /api/audit/security` - Get security audit logs (admin only)

### Export and Import
- `POST /api/export/products` - Export products (admin/vendor)
- `POST /api/export/orders` - Export orders (admin/vendor)
- `POST /api/export/users` - Export users (admin only)
- `POST /api/export/vendors` - Export vendors (admin only)
- `POST /api/export/reports` - Export reports
- `GET /api/export/templates/:type` - Download export template
- `POST /api/import/products` - Import products (admin/vendor)
- `POST /api/import/users` - Import users (admin only)
- `POST /api/import/vendors` - Import vendors (admin only)
- `GET /api/import/preview` - Preview import data before execution
- `GET /api/import/history` - Get import history
- `GET /api/import/history/:id` - Get import details

### Translation Management (i18n)
- `GET /api/translations` - Get translations for a language
- `GET /api/translations/:key` - Get specific translation
- `POST /api/translations` - Create/update translation (admin only)
- `PUT /api/translations/:key` - Update translation (admin only)
- `DELETE /api/translations/:key` - Delete translation (admin only)
- `GET /api/translations/keys` - Get all translation keys
- `POST /api/translations/import` - Import translations (JSON/CSV)
- `GET /api/translations/export` - Export translations (JSON/CSV)
- `GET /api/translations/status` - Get translation completion status per language
- `GET /api/translations/missing` - Get missing translations
- `POST /api/translations/generate-key` - Generate translation key

### Security
- `POST /api/security/2fa/enable` - Enable 2FA
- `POST /api/security/2fa/disable` - Disable 2FA
- `POST /api/security/2fa/verify` - Verify 2FA code
- `POST /api/security/2fa/backup-codes` - Generate backup codes
- `POST /api/auth/social/:provider` - Social login (Google, Facebook, etc.)
- `GET /api/security/sessions` - Get active sessions
- `DELETE /api/security/sessions/:id` - Revoke session
- `POST /api/security/sessions/revoke-all` - Revoke all sessions
- `GET /api/security/login-history` - Get login history
- `POST /api/security/change-password` - Change password
- `POST /api/security/verify-email` - Verify email address
- `POST /api/security/resend-verification` - Resend verification email

### Real-time
- `WS /api/ws` - WebSocket connection for real-time updates
- `GET /api/realtime/notifications` - Server-sent events for notifications
- `GET /api/realtime/orders/:id` - Real-time order updates

### Analytics and Reports
- `GET /api/analytics/stock-levels` - Get stock level reports
- `GET /api/analytics/sales` - Get sales data
- `GET /api/analytics/orders` - Get order statistics
- `GET /api/analytics/search` - Get search analytics
- `GET /api/analytics/performance` - Get performance metrics (admin only)
- `GET /api/analytics/products/popular` - Get popular products

### Product Advertisements/Listings
- `POST /api/listings` - Create product listing/advertisement
- `GET /api/listings` - Get product listings (with filters)
- `GET /api/listings/:id` - Get listing details
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/:id/publish` - Publish listing
- `POST /api/listings/:id/unpublish` - Unpublish listing
- `GET /api/listings/excel-template` - Download Excel template for listings
- `POST /api/listings/bulk-upload` - Bulk upload listings via Excel

### Homepage and Discovery
- `GET /api/home/top-rated` - Get top rated products
- `GET /api/home/best-sellers` - Get best sellers
- `GET /api/home/recently-added` - Get recently added products
- `GET /api/home/most-purchased` - Get most purchased products
- `GET /api/home/popular-categories` - Get popular product categories/tags
- `GET /api/home/business-services` - Get business services information
- `GET /api/home/banners` - Get promotional banners

### Company/Seller Profile
- `GET /api/companies/:id` - Get company profile
- `GET /api/companies/:id/products` - Get all products from company
- `GET /api/companies/:id/ads` - Get company advertisements
- `GET /api/companies/:id/profile` - Get company profile details (payment terms, shipping terms, etc.)
- `PUT /api/companies/:id/profile` - Update company profile (seller/admin only)

### Request Price
- `POST /api/products/:id/request-price` - Request price for a product
- `GET /api/price-requests` - Get price requests (seller view)
- `GET /api/price-requests/:id` - Get price request details
- `PUT /api/price-requests/:id/respond` - Respond to price request

### Order Acceptance
- `POST /api/orders/:id/accept` - Accept order (seller)
- `POST /api/orders/:id/reject` - Reject order (seller)
- `GET /api/orders/pending-acceptance` - Get orders pending acceptance

### Product View Options
- `GET /api/products?view=list` - Get products in list view
- `GET /api/products?view=grid` - Get products in grid view
- `GET /api/products?sort=price|rating|date|popularity` - Get sorted products

### Credit and Discounts
- `GET /api/credit/discount-info` - Get credit discount information
- `POST /api/credit/apply` - Apply credit discount
- `GET /api/discounts` - Get available discount codes
- `GET /api/discounts/:code/validate` - Validate discount code

### Admin Management
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (with filters, pagination)
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/status` - Activate/Deactivate user
- `GET /api/admin/vendors` - Get all vendors (with filters, pagination)
- `POST /api/admin/vendors` - Create new vendor
- `GET /api/admin/vendors/:id` - Get vendor details
- `PUT /api/admin/vendors/:id` - Update vendor
- `DELETE /api/admin/vendors/:id` - Delete vendor
- `PUT /api/admin/vendors/:id/approve` - Approve vendor
- `PUT /api/admin/vendors/:id/reject` - Reject vendor
- `PUT /api/admin/vendors/:id/suspend` - Suspend/Activate vendor
- `GET /api/admin/products` - Get all products (with filters, pagination)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/admin/products/:id/approve` - Approve product
- `PUT /api/admin/products/:id/reject` - Reject product
- `PUT /api/admin/products/:id/feature` - Feature/Unfeature product
- `GET /api/admin/orders` - Get all orders (with filters, pagination)
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status
- `POST /api/admin/orders/:id/cancel` - Cancel order
- `GET /api/admin/payments` - Get all payments (with filters, pagination)
- `GET /api/admin/payments/:id` - Get payment details
- `POST /api/admin/payments/:id/verify` - Verify payment
- `POST /api/admin/payments/:id/refund` - Process refund
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/support/tickets` - Get all support tickets
- `GET /api/admin/support/tickets/:id` - Get ticket details
- `POST /api/admin/support/tickets/:id/respond` - Respond to ticket
- `PUT /api/admin/support/tickets/:id/close` - Close ticket

### Admin Site Configuration
- `GET /api/admin/settings` - Get site settings
- `PUT /api/admin/settings` - Update site settings
- `POST /api/admin/settings/logo` - Upload/Change site logo
- `GET /api/admin/settings/logo` - Get site logo
- `PUT /api/admin/settings/commission` - Update commission percentage
- `PUT /api/admin/settings/tax` - Update tax rate
- `GET /api/admin/settings/content` - Get content (terms, privacy, etc.)
- `PUT /api/admin/settings/content/:type` - Update content

### Admin Reports
- `GET /api/admin/reports/sales` - Get sales report (downloadable)
- `GET /api/admin/reports/users` - Get users report (downloadable)
- `GET /api/admin/reports/vendors` - Get vendors report (downloadable)
- `GET /api/admin/reports/products` - Get products report (downloadable)
- `GET /api/admin/reports/orders` - Get orders report (downloadable)
- `GET /api/admin/reports/payments` - Get payments report (downloadable)
- `GET /api/admin/reports/revenue` - Get revenue report (downloadable)
- `GET /api/admin/reports/commission` - Get commission report (downloadable)
- `GET /api/admin/reports/export` - Export report (CSV, Excel, PDF)

### Vendor Management
- `POST /api/vendor/login` - Vendor login
- `GET /api/vendor/dashboard/stats` - Get vendor dashboard statistics
- `GET /api/vendor/products` - Get vendor's products
- `POST /api/vendor/products` - Create product
- `PUT /api/vendor/products/:id` - Update product
- `DELETE /api/vendor/products/:id` - Delete product
- `GET /api/vendor/orders` - Get vendor's orders
- `GET /api/vendor/orders/:id` - Get order details
- `PUT /api/vendor/orders/:id/accept` - Accept order
- `PUT /api/vendor/orders/:id/reject` - Reject order
- `PUT /api/vendor/orders/:id/status` - Update order status
- `GET /api/vendor/payments` - Get vendor's payments
- `GET /api/vendor/payments/history` - Get payment history
- `GET /api/vendor/profile` - Get vendor profile
- `PUT /api/vendor/profile` - Update vendor profile

### Vendor Reports
- `GET /api/vendor/reports/sales` - Get sales report (downloadable)
- `GET /api/vendor/reports/products` - Get products report (downloadable)
- `GET /api/vendor/reports/orders` - Get orders report (downloadable)
- `GET /api/vendor/reports/revenue` - Get revenue report (downloadable)
- `GET /api/vendor/reports/commission` - Get commission report (downloadable)
- `GET /api/vendor/reports/export` - Export report (CSV, Excel, PDF)

### Wallet Management
- `GET /api/admin/wallet/main` - Get main wallet balance (admin only)
- `GET /api/admin/wallet/main/transactions` - Get main wallet transactions
- `GET /api/admin/wallet/vendors` - Get all vendor wallets (admin only)
- `GET /api/admin/wallet/vendors/:vendorId` - Get vendor wallet details
- `PUT /api/admin/wallet/vendors/:vendorId/freeze` - Freeze vendor wallet
- `PUT /api/admin/wallet/vendors/:vendorId/unfreeze` - Unfreeze vendor wallet
- `POST /api/admin/wallet/vendors/:vendorId/transfer` - Transfer funds to vendor
- `POST /api/admin/wallet/vendors/:vendorId/deduct` - Deduct funds from vendor
- `GET /api/admin/wallet/vendors/:vendorId/transactions` - Get vendor transactions
- `GET /api/vendor/wallet` - Get vendor wallet balance
- `GET /api/vendor/wallet/transactions` - Get vendor wallet transactions
- `POST /api/vendor/wallet/payout-request` - Request payout
- `GET /api/vendor/wallet/payout-requests` - Get payout requests
- `GET /api/user/wallet` - Get user wallet balance (if applicable)
- `GET /api/user/wallet/transactions` - Get user wallet transactions

### Checkout
- `POST /api/checkout/init` - Initialize checkout session
- `GET /api/checkout/session/:sessionId` - Get checkout session
- `POST /api/checkout/validate` - Validate checkout data
- `POST /api/checkout/complete` - Complete checkout and create order
- `POST /api/checkout/calculate` - Calculate order totals
- `PUT /api/checkout/session/:sessionId` - Update checkout session

### Vendor Product Management
- `GET /api/vendor/products` - Get vendor's products
- `GET /api/vendor/products/:id` - Get vendor product details
- `POST /api/vendor/products` - Create new product
- `PUT /api/vendor/products/:id` - Update product
- `DELETE /api/vendor/products/:id` - Delete product
- `PUT /api/vendor/products/:id/activate` - Activate product
- `PUT /api/vendor/products/:id/deactivate` - Deactivate product
- `GET /api/vendor/products/:id/reviews` - Get product reviews
- `POST /api/vendor/products/:id/reviews/:reviewId/respond` - Respond to review
- `GET /api/vendor/products/analytics` - Get product performance analytics

### Admin Product Review
- `GET /api/admin/products/pending` - Get pending products for review
- `GET /api/admin/products/:id` - Get product details for review
- `PUT /api/admin/products/:id/approve` - Approve product
- `PUT /api/admin/products/:id/reject` - Reject product with reason
- `GET /api/admin/products/:id/reviews` - View product reviews
- `GET /api/admin/products/analytics` - Get product analytics

### Order Tracking
- `GET /api/orders/my-orders` - Get user's orders (user)
- `GET /api/orders/my-orders/:id` - Get order details (user)
- `GET /api/orders/my-orders/:id/tracking` - Track order (user)
- `GET /api/vendor/orders` - Get vendor's orders
- `GET /api/vendor/orders/:id` - Get order details (vendor)
- `PUT /api/vendor/orders/:id/status` - Update order status (vendor)
- `POST /api/vendor/orders/:id/tracking` - Add tracking information (vendor)
- `GET /api/admin/orders` - Get all orders (admin)
- `GET /api/admin/orders/:id` - Get order details (admin)
- `GET /api/admin/orders/:id/tracking` - View order tracking (admin)
- `PUT /api/admin/orders/:id/intervene` - Admin order intervention
- `GET /api/orders/:id/timeline` - Get order timeline (all roles)

### Support System
- `POST /api/support/tickets` - Create support ticket (user/vendor)
- `GET /api/support/tickets` - Get user's/vendor's tickets
- `GET /api/support/tickets/:id` - Get ticket details
- `POST /api/support/tickets/:id/messages` - Add message to ticket
- `GET /api/admin/support/tickets` - Get all tickets (admin)
- `PUT /api/admin/support/tickets/:id/assign` - Assign ticket (admin)
- `PUT /api/admin/support/tickets/:id/priority` - Set ticket priority (admin)
- `PUT /api/admin/support/tickets/:id/resolve` - Resolve ticket (admin)
- `GET /api/admin/support/analytics` - Get support analytics (admin)

### Point System
- `GET /api/points/balance` - Get point balance (user/vendor)
- `GET /api/points/transactions` - Get point transaction history
- `GET /api/points/rules` - Get point earning rules
- `POST /api/points/redeem` - Redeem points for discount
- `GET /api/admin/points/users` - Get all user points (admin)
- `GET /api/admin/points/vendors` - Get all vendor points (admin)
- `POST /api/admin/points/adjust` - Manually adjust points (admin)
- `GET /api/admin/points/analytics` - Get point system analytics (admin)
- `PUT /api/admin/points/rules` - Update point earning rules (admin)

### Product Offers
- `GET /api/offers` - Get available offers
- `GET /api/offers/:id` - Get offer details
- `POST /api/vendor/offers` - Create product offer (vendor)
- `GET /api/vendor/offers` - Get vendor's offers
- `PUT /api/vendor/offers/:id` - Update offer (vendor)
- `DELETE /api/vendor/offers/:id` - Delete offer (vendor)
- `GET /api/admin/offers` - Get all offers (admin)
- `PUT /api/admin/offers/:id/approve` - Approve offer (admin)
- `PUT /api/admin/offers/:id/reject` - Reject offer (admin)
- `POST /api/admin/offers` - Create platform-wide offer (admin)
- `GET /api/admin/offers/analytics` - Get offer analytics (admin)

### Coupons and Discounts
- `GET /api/coupons/available` - Get available coupons
- `POST /api/coupons/validate` - Validate coupon code
- `GET /api/coupons/my-coupons` - Get user's coupons
- `POST /api/admin/coupons` - Create coupon (admin)
- `GET /api/admin/coupons` - Get all coupons (admin)
- `PUT /api/admin/coupons/:id` - Update coupon (admin)
- `DELETE /api/admin/coupons/:id` - Delete coupon (admin)
- `POST /api/admin/coupons/generate` - Generate coupon codes (admin)
- `POST /api/admin/coupons/bulk-generate` - Bulk generate coupons (admin)
- `GET /api/admin/coupons/:id/usage` - Get coupon usage statistics (admin)
- `POST /api/vendor/coupons` - Create vendor coupon (vendor)
- `GET /api/vendor/coupons` - Get vendor's coupons
- `PUT /api/vendor/coupons/:id` - Update vendor coupon
- `GET /api/vendor/coupons/analytics` - Get vendor coupon analytics

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Core User Entities
    User ||--o{ Cart : has
    User ||--o{ Order : places
    User ||--o{ Payment : makes
    User ||--o{ ShippingAddress : has
    User ||--o{ Wishlist : has
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

    %% Product Related
    Product ||--o{ ProductImage : has
    Product ||--o{ OrderItem : included_in
    Product ||--o{ CartItem : added_to
    Product ||--o{ CheckoutItem : in_checkout
    Product ||--o{ Wishlist : favorited_in
    Product ||--o{ ProductReview : reviewed
    Product ||--o{ ProductOffer : has_offers
    Product ||--o{ Negotiation : negotiated
    Product ||--o{ PriceRequest : requested
    Product }o--|| Category : belongs_to
    Product }o--|| Vendor : created_by
    Product }o--|| Admin : approved_by
    Product }o--|| Admin : rejected_by
    Product }o--o| ProductListing : linked_to

    Category ||--o{ Product : contains
    Category ||--o{ ProductListing : contains
    Category ||--o{ Category : parent_of

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
    Cart }o--|| User : belongs_to
    Cart }o--o| CheckoutSession : converts_to

    CartItem }o--|| Cart : belongs_to
    CartItem }o--|| Product : references

    CheckoutSession ||--o{ CheckoutItem : contains
    CheckoutSession }o--|| User : initiated_by
    CheckoutSession }o--o| Cart : from
    CheckoutSession }o--o| Order : creates

    CheckoutItem }o--|| CheckoutSession : belongs_to
    CheckoutItem }o--|| Product : references

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
        datetime createdAt
        datetime updatedAt
    }

    Category {
        int id PK
        string name UK
        string nameAr
        string description
        string icon
        string imageUrl
        int parentId FK
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
```

## Database Schema (Conceptual)

### User (Buyers/Customers)
- `id` (UUID/Int, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `phone` (String)
- `countryCode` (String)
- `country` (String)
- `city` (String)
- `isGuest` (Boolean, Default: false)
- `isActive` (Boolean, Default: true)
- `isEmailVerified` (Boolean, Default: false)
- `termsAccepted` (Boolean, Default: false)
- `termsAcceptedAt` (DateTime, Optional)
- `language` (String, Default: 'ar')
- `lastLoginAt` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Vendor (Sellers)
- `id` (UUID/Int, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `businessName` (String)
- `phone` (String)
- `countryCode` (String)
- `country` (String)
- `city` (String)
- `companyName` (String)
- `verificationNumber` (String, Optional)
- `rating` (Decimal, Optional - Average rating)
- `reviewCount` (Int, Default: 0)
- `activities` (String, Optional - Activities & Specialties)
- `paymentTerms` (String, Optional - JSON array)
- `shippingTerms` (String, Optional)
- `peakSeasonLeadTime` (Int, Optional - days)
- `offPeakSeasonLeadTime` (Int, Optional - days)
- `status` (Enum: PENDING, APPROVED, REJECTED, SUSPENDED)
- `isVerified` (Boolean, Default: false)
- `isActive` (Boolean, Default: true)
- `isEmailVerified` (Boolean, Default: false)
- `termsAccepted` (Boolean, Default: false)
- `termsAcceptedAt` (DateTime, Optional)
- `approvedAt` (DateTime, Optional)
- `approvedBy` (Int, Optional - Foreign Key to Admin)
- `suspendedAt` (DateTime, Optional)
- `suspendedBy` (Int, Optional - Foreign Key to Admin)
- `suspensionReason` (String, Optional)
- `language` (String, Default: 'ar')
- `lastLoginAt` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Admin
- `id` (UUID/Int, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `role` (Enum: SUPER_ADMIN, ADMIN, MODERATOR)
- `permissions` (String, Optional - JSON array of permissions)
- `isActive` (Boolean, Default: true)
- `lastLoginAt` (DateTime, Optional)
- `createdBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Product
- `id` (UUID/Int, Primary Key)
- **Translation Keys (i18n):**
  - `nameKey` (String, Unique - e.g., "product.name.123")
  - `descriptionKey` (String, Optional - e.g., "product.description.123")
- `sku` (String, Unique - Item Number)
- `price` (Decimal)
- `quantity` (Int)
- `quantityPerCarton` (Int, Optional)
- `cbm` (Decimal, Optional - Cubic Meter)
- `minStockLevel` (Int, Optional)
- `status` (Enum: AVAILABLE, SOLD_OUT, PENDING_APPROVAL, REJECTED)
- `isFeatured` (Boolean, Default: false)
- `categoryId` (Int, Foreign Key to Category - Main category)
- `vendorId` (Int, Foreign Key to Vendor)
- `country` (String)
- `city` (String)
- `acceptsNegotiation` (Boolean, Default: false)
- `rating` (Decimal, Optional - Average rating)
- `reviewCount` (Int, Default: 0)
- `approvedAt` (DateTime, Optional)
- `approvedBy` (Int, Optional - Foreign Key to Admin)
- `rejectedAt` (DateTime, Optional)
- `rejectedBy` (Int, Optional - Foreign Key to Admin)
- `rejectionReason` (String, Optional)
- **SEO Fields (Translation Keys):**
  - `metaTitleKey` (String, Optional - e.g., "product.meta.title.123")
  - `metaDescriptionKey` (String, Optional - e.g., "product.meta.description.123")
  - `metaKeywords` (String, Optional - comma-separated, language-independent)
  - `slug` (String, Unique - SEO-friendly URL, language-specific slugs stored separately)
  - `canonicalUrl` (String, Optional)
  - `ogTitleKey` (String, Optional)
  - `ogDescriptionKey` (String, Optional)
  - `ogImage` (String, Optional - Open Graph image URL)
  - `twitterCardTitleKey` (String, Optional)
  - `twitterCardDescriptionKey` (String, Optional)
  - `twitterCardImage` (String, Optional)
  - `structuredData` (String, Optional - JSON-LD structured data)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### ProductImage
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Foreign Key to Product)
- `imageUrl` (String)
- `imageOrder` (Int)
- `isPrimary` (Boolean, Default: false)
- `altText` (String, Optional - for SEO)
- `createdAt` (DateTime)

### ProductSubCategory
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Foreign Key to Product)
- `categoryId` (Int, Foreign Key to Category - sub-category)
- `createdAt` (DateTime)

### Category
- `id` (UUID/Int, Primary Key)
- **Translation Keys (i18n):**
  - `nameKey` (String, Unique - e.g., "category.name.123")
  - `descriptionKey` (String, Optional - e.g., "category.description.123")
  - `pageDescriptionKey` (String, Optional - e.g., "category.page.description.123")
- `icon` (String, Optional)
- `imageUrl` (String, Optional)
- `parentId` (Int, Optional - Foreign Key to Category for hierarchy)
- `level` (Int, Default: 0 - 0 for main category, 1+ for sub-categories)
- `displayOrder` (Int, Optional - for sorting)
- `isActive` (Boolean, Default: true)
- `productCount` (Int, Default: 0 - cached count)
- `breadcrumb` (String, Optional - generated breadcrumb path)
- **SEO Fields (Translation Keys):**
  - `metaTitleKey` (String, Optional - e.g., "category.meta.title.123")
  - `metaDescriptionKey` (String, Optional - e.g., "category.meta.description.123")
  - `metaKeywords` (String, Optional - comma-separated, language-independent)
  - `slug` (String, Unique - SEO-friendly URL, language-specific slugs stored separately)
  - `canonicalUrl` (String, Optional)
  - `ogTitleKey` (String, Optional)
  - `ogDescriptionKey` (String, Optional)
  - `ogImage` (String, Optional - Open Graph image URL)
  - `twitterCardTitleKey` (String, Optional)
  - `twitterCardDescriptionKey` (String, Optional)
  - `twitterCardImage` (String, Optional)
  - `structuredData` (String, Optional - JSON-LD structured data)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### BankAccount
- `id` (UUID/Int, Primary Key)
- `vendorId` (Int, Optional - Foreign Key to Vendor)
- `userId` (Int, Optional - Foreign Key to User)
- `accountName` (String)
- `accountNumber` (String)
- `bankName` (String)
- `bankAddress` (String)
- `bankCode` (String)
- `swiftCode` (String)
- `country` (String)
- `companyAddress` (String, Optional)
- `isDefault` (Boolean, Default: false)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Order
- `id` (UUID/Int, Primary Key)
- `orderNumber` (String, Unique - e.g., SHR1234556789)
- `userId` (Int, Foreign Key to User)
- `vendorId` (Int, Foreign Key to Vendor)
- `orderDate` (DateTime)
- `status` (Enum: ORDER_RECEIVED, PAYMENT_CONFIRMED, IN_PREPARATION, IN_SHIPPING, READY_FOR_PICKUP, COMPLETED, CANCELLED, AWAITING_RESPONSE)
- `totalAmount` (Decimal)
- `subtotal` (Decimal)
- `tax` (Decimal)
- `deliveryCharge` (Decimal)
- `siteCommission` (Decimal)
- `vendorCommission` (Decimal, Optional)
- `discountAmount` (Decimal, Optional)
- `discountCode` (String, Optional)
- `shippingAddress` (String)
- `shippingCountry` (String)
- `shippingCity` (String)
- `shippingMethod` (Enum: SITE_INTERMEDIARIES, CUSTOM_AGENT)
- `customsClearance` (Boolean, Default: false)
- `shippingCarrier` (String, Optional - e.g., DHL)
- `trackingNumber` (String, Optional)
- `estimatedDeliveryDays` (Int, Optional - e.g., 5-7)
- `notes` (String, Optional)
- `cancelledAt` (DateTime, Optional)
- `cancelledBy` (Int, Optional - Foreign Key to User/Admin)
- `cancellationReason` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### OrderItem
- `id` (UUID/Int, Primary Key)
- `orderId` (Int, Foreign Key to Order)
- `productId` (Int, Foreign Key to Product)
- `serialNumber` (Int, Optional - for order summary display)
- `quantity` (Int)
- `price` (Decimal) (Price at the time of order)
- `cbm` (Decimal, Optional)
- `itemNumber` (String, Optional - product SKU/item number)
- `createdAt` (DateTime)

### OrderTracking (Enhanced Order Status History)
- `id` (UUID/Int, Primary Key)
- `orderId` (Int, Foreign Key to Order)
- `status` (Enum - same as Order.status)
- `description` (String, Optional)
- `location` (String, Optional - e.g., "Currently in Dubai")
- `trackingNumber` (String, Optional)
- `carrier` (String, Optional - e.g., DHL)
- `estimatedDelivery` (DateTime, Optional)
- `updatedBy` (Int, Optional - Foreign Key to User/Vendor/Admin)
- `updatedByType` (Enum: USER, VENDOR, ADMIN)
- `createdAt` (DateTime)

### Negotiation
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Foreign Key to Product)
- `buyerId` (Int, Foreign Key to User)
- `vendorId` (Int, Foreign Key to Vendor)
- `negotiatedPrice` (Decimal)
- `negotiatedQuantity` (Int)
- `status` (Enum: PENDING, ACCEPTED, REJECTED, EXPIRED)
- `notes` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `respondedAt` (DateTime, Optional)

### Cart
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `name` (String, Optional - for multiple carts, e.g., "Main Cart", "Saved Cart 1")
- `discountCode` (String, Optional)
- `discountCodeId` (Int, Optional - Foreign Key to DiscountCode)
- `status` (Enum: ACTIVE, SAVED, ABANDONED, CONVERTED, EXPIRED, Default: ACTIVE)
- `isActive` (Boolean, Default: true)
- `shareToken` (String, Optional, Unique - for sharing cart)
- `shareExpiresAt` (DateTime, Optional)
- `subtotal` (Decimal, Optional - cached subtotal)
- `tax` (Decimal, Optional - cached tax)
- `delivery` (Decimal, Optional - cached delivery charges)
- `commission` (Decimal, Optional - cached site commission)
- `total` (Decimal, Optional - cached total)
- `lastActivityAt` (DateTime - for abandoned cart detection)
- `expiresAt` (DateTime, Optional - cart expiration)
- `convertedToOrderAt` (DateTime, Optional)
- `convertedToOrderId` (Int, Optional - Foreign Key to Order)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### CartItem
- `id` (UUID/Int, Primary Key)
- `cartId` (Int, Foreign Key to Cart)
- `productId` (Int, Foreign Key to Product)
- `quantity` (Int)
- `negotiatedPrice` (Decimal, Optional)
- `negotiatedQuantity` (Int, Optional)
- `notes` (String, Optional - user notes for this item)
- `addedFromWishlist` (Boolean, Default: false)
- `wishlistId` (Int, Optional - Foreign Key to Wishlist if added from wishlist)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SavedCart
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `cartId` (Int, Foreign Key to Cart)
- `name` (String - user-given name for saved cart)
- `description` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Payment
- `id` (UUID/Int, Primary Key)
- `orderId` (Int, Foreign Key to Order)
- `userId` (Int, Foreign Key to User)
- `method` (Enum: BANK_CARD, BANK_TRANSFER)
- `status` (Enum: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, VERIFIED)
- `amount` (Decimal)
- `tax` (Decimal)
- `siteCommission` (Decimal)
- `creditDiscount` (Decimal, Optional - 2.5% when using credit)
- `transactionId` (String, Optional)
- `cardLast4` (String, Optional - for card payments)
- `cardBrand` (String, Optional - Visa, Mastercard, etc.)
- `cardExpiry` (String, Optional - MM/YY format)
- `cardCVC` (String, Optional - encrypted)
- `billingAddress` (String, Optional - for card payments)
- `billingCountry` (String, Optional - for card payments)
- `billingPostalCode` (String, Optional - for card payments)
- `bankName` (String, Optional - for transfers, e.g., "FAB")
- `iban` (String, Optional - for transfers, e.g., "AE12 3456 7890 1234 5678 901")
- `beneficiary` (String, Optional - for transfers, e.g., "Mazadat Abu Dhabi LLC")
- `receiptUrl` (String, Optional - for bank transfers)
- `receiptVerified` (Boolean, Default: false)
- `verifiedAt` (DateTime, Optional)
- `refundAmount` (Decimal, Optional)
- `refundReason` (String, Optional)
- `isHeld` (Boolean, Default: false - payment held in escrow)
- `heldUntil` (DateTime, Optional - until shipping policy/quality confirmation)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### ShippingAddress
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `address` (String)
- `country` (String)
- `city` (String)
- `isDefault` (Boolean, Default: false)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### ProductReview (Enhanced)
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Foreign Key to Product)
- `userId` (Int, Foreign Key to User)
- `vendorId` (Int, Foreign Key to Vendor - product owner)
- `rating` (Int - 1 to 5)
- `title` (String, Optional)
- `comment` (String, Optional)
- `isVerifiedPurchase` (Boolean, Default: false)
- `orderId` (Int, Optional - Foreign Key to Order)
- `status` (Enum: PENDING, APPROVED, REJECTED, HIDDEN)
- `vendorResponse` (String, Optional)
- `vendorResponseAt` (DateTime, Optional)
- `adminReviewed` (Boolean, Default: false)
- `adminReviewedBy` (Int, Optional - Foreign Key to Admin)
- `adminReviewedAt` (DateTime, Optional)
- `helpfulCount` (Int, Default: 0)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Wishlist
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User - owner/creator)
- `name` (String, Default: "My Wishlist" - user can create multiple wishlists)
- `description` (String, Optional)
- `isDefault` (Boolean, Default: false - default wishlist)
- `privacy` (Enum: PRIVATE, PUBLIC, COLLABORATIVE, Default: PRIVATE)
- `isGiftRegistry` (Boolean, Default: false - mark as gift registry)
- `coverImage` (String, Optional - wishlist cover image URL)
- `shareToken` (String, Optional, Unique - for sharing wishlist)
- `shareExpiresAt` (DateTime, Optional)
- `budget` (Decimal, Optional - wishlist budget limit)
- `budgetSpent` (Decimal, Default: 0 - calculated from items)
- `categories` (String, Optional - JSON array of category/tag IDs)
- `templateId` (Int, Optional - Foreign Key to WishlistTemplate if created from template)
- `itemCount` (Int, Default: 0 - cached count)
- `totalValue` (Decimal, Default: 0 - cached total value)
- `expiresAt` (DateTime, Optional - auto-cleanup date)
- `isActive` (Boolean, Default: true)
- `version` (Int, Default: 1 - for versioning/history)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### WishlistItem
- `id` (UUID/Int, Primary Key)
- `wishlistId` (Int, Foreign Key to Wishlist)
- `productId` (Int, Foreign Key to Product)
- `notes` (String, Optional - user notes for this item)
- `priority` (Enum: MUST_HAVE, NICE_TO_HAVE, MAYBE_LATER, Default: NICE_TO_HAVE)
- `position` (Int, Optional - for custom ordering)
- `notifyOnSale` (Boolean, Default: false - notify when product goes on sale)
- `notifyOnStock` (Boolean, Default: false - notify when product is back in stock)
- `priceWhenAdded` (Decimal, Optional - track price when added for sale notifications)
- `currentPrice` (Decimal, Optional - current product price for comparison)
- `isPurchased` (Boolean, Default: false - for gift registries)
- `purchasedBy` (Int, Optional - Foreign Key to User who purchased)
- `purchasedAt` (DateTime, Optional)
- `addedToCartAt` (DateTime, Optional - when item was moved to cart)
- `addedBy` (Int, Optional - Foreign Key to User who added, for collaborative wishlists)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### WishlistCollaborator
- `id` (UUID/Int, Primary Key)
- `wishlistId` (Int, Foreign Key to Wishlist)
- `userId` (Int, Foreign Key to User - collaborator)
- `permission` (Enum: VIEW_ONLY, CAN_ADD, CAN_REMOVE, FULL_ACCESS, Default: VIEW_ONLY)
- `status` (Enum: PENDING, ACCEPTED, DECLINED, REMOVED, Default: PENDING)
- `invitedBy` (Int, Foreign Key to User - who sent the invitation)
- `invitedAt` (DateTime)
- `acceptedAt` (DateTime, Optional)
- `declinedAt` (DateTime, Optional)
- `removedAt` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### WishlistTemplate
- `id` (UUID/Int, Primary Key)
- `name` (String - template name, e.g., "Wedding Registry", "Birthday Wishlist")
- `description` (String, Optional)
- `category` (String, Optional - template category)
- `isDefault` (Boolean, Default: false)
- `isPublic` (Boolean, Default: true - available to all users)
- `productIds` (String, Optional - JSON array of default product IDs)
- `categoryIds` (String, Optional - JSON array of category IDs)
- `coverImage` (String, Optional)
- `createdBy` (Int, Optional - Foreign Key to Admin)
- `usageCount` (Int, Default: 0 - how many times template was used)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### WishlistActivity
- `id` (UUID/Int, Primary Key)
- `wishlistId` (Int, Foreign Key to Wishlist)
- `userId` (Int, Foreign Key to User - who performed the action)
- `action` (Enum: CREATED, UPDATED, ITEM_ADDED, ITEM_REMOVED, ITEM_UPDATED, COLLABORATOR_ADDED, COLLABORATOR_REMOVED, SHARED, ITEM_MOVED_TO_CART, ITEM_MARKED_PURCHASED)
- `entityType` (String, Optional - e.g., "WishlistItem", "WishlistCollaborator")
- `entityId` (Int, Optional - ID of the entity)
- `description` (String, Optional - human-readable description)
- `metadata` (String, Optional - JSON object with additional data)
- `createdAt` (DateTime)

### WishlistHistory
- `id` (UUID/Int, Primary Key)
- `wishlistId` (Int, Foreign Key to Wishlist)
- `version` (Int - version number)
- `snapshot` (String - JSON snapshot of wishlist at this version)
- `itemCount` (Int)
- `totalValue` (Decimal)
- `createdBy` (Int, Optional - Foreign Key to User)
- `createdAt` (DateTime)

### WishlistNotification
- `id` (UUID/Int, Primary Key)
- `wishlistItemId` (Int, Foreign Key to WishlistItem)
- `userId` (Int, Foreign Key to User)
- `type` (Enum: PRICE_DROP, BACK_IN_STOCK, SALE_STARTED, STOCK_LOW)
- `title` (String)
- `message` (String)
- `oldPrice` (Decimal, Optional - for price drop notifications)
- `newPrice` (Decimal, Optional - for price drop notifications)
- `discountPercentage` (Decimal, Optional)
- `isRead` (Boolean, Default: false)
- `readAt` (DateTime, Optional)
- `createdAt` (DateTime)

### Notification
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `type` (Enum: ORDER, PAYMENT, NEGOTIATION, SHIPPING, GENERAL)
- `title` (String)
- `message` (String)
- `isRead` (Boolean, Default: false)
- `relatedId` (Int, Optional - ID of related entity)
- `relatedType` (String, Optional - e.g., 'order', 'payment')
- `createdAt` (DateTime)

### SupportTicket
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `subject` (String)
- `status` (Enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `priority` (Enum: LOW, MEDIUM, HIGH)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SupportTicketMessage
- `id` (UUID/Int, Primary Key)
- `ticketId` (Int, Foreign Key to SupportTicket)
- `userId` (Int, Foreign Key to User)
- `message` (String)
- `isAdmin` (Boolean, Default: false)
- `createdAt` (DateTime)

### DiscountCode
- `id` (UUID/Int, Primary Key)
- `code` (String, Unique)
- `discountType` (Enum: PERCENTAGE, FIXED)
- `discountValue` (Decimal)
- `minPurchaseAmount` (Decimal, Optional)
- `maxDiscountAmount` (Decimal, Optional)
- `usageLimit` (Int, Optional)
- `usedCount` (Int, Default: 0)
- `validFrom` (DateTime)
- `validUntil` (DateTime)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Configuration
- `id` (UUID/Int, Primary Key)
- `key` (String, Unique - e.g., 'site_commission_percentage', 'tax_rate')
- `value` (String - JSON or simple value)
- `description` (String, Optional)
- `updatedAt` (DateTime)

### ProductListing (Advertisement)
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Optional - Foreign Key to Product, if linked to existing product)
- `vendorId` (Int, Foreign Key to Vendor)
- `title` (String)
- `description` (String)
- `country` (String)
- `city` (String)
- `categoryId` (Int, Foreign Key to Category)
- `acceptsNegotiation` (Boolean, Default: false)
- `status` (Enum: DRAFT, PUBLISHED, UNPUBLISHED, EXPIRED)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `publishedAt` (DateTime, Optional)

### PriceRequest
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Foreign Key to Product)
- `buyerId` (Int, Foreign Key to User)
- `vendorId` (Int, Foreign Key to Vendor)
- `requestedQuantity` (Int, Optional)
- `message` (String, Optional)
- `status` (Enum: PENDING, RESPONDED, CLOSED)
- `response` (String, Optional)
- `responsePrice` (Decimal, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `respondedAt` (DateTime, Optional)

### OrderAcceptance
- `id` (UUID/Int, Primary Key)
- `orderId` (Int, Foreign Key to Order)
- `vendorId` (Int, Foreign Key to Vendor)
- `status` (Enum: PENDING, ACCEPTED, REJECTED)
- `acceptedAt` (DateTime, Optional)
- `rejectedAt` (DateTime, Optional)
- `rejectionReason` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### CreditTransaction
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `orderId` (Int, Optional - Foreign Key to Order)
- `type` (Enum: DISCOUNT, REFUND, CHARGE)
- `amount` (Decimal)
- `discountPercentage` (Decimal, Optional - e.g., 2.5%)
- `description` (String, Optional)
- `createdAt` (DateTime)

### Banner
- `id` (UUID/Int, Primary Key)
- `title` (String)
- `description` (String, Optional)
- `imageUrl` (String)
- `linkUrl` (String, Optional)
- `type` (Enum: PROMOTIONAL, CATEGORY, SERVICE)
- `position` (Int - for ordering)
- `isActive` (Boolean, Default: true)
- `startDate` (DateTime, Optional)
- `endDate` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### BusinessService
- `id` (UUID/Int, Primary Key)
- `title` (String)
- `description` (String)
- `icon` (String, Optional)
- `type` (Enum: SECURITY, COMMERCIAL, COMMUNICATION)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### PaymentTermsAcceptance
- `id` (UUID/Int, Primary Key)
- `paymentId` (Int, Foreign Key to Payment)
- `orderId` (Int, Foreign Key to Order)
- `userId` (Int, Foreign Key to User)
- `cancellationRefundPolicy` (Boolean, Default: false)
- `pendingUntilShippingPolicy` (Boolean, Default: false)
- `pendingUntilQualityCheck` (Boolean, Default: false)
- `siteCommissionAcknowledged` (Boolean, Default: false)
- `creditDiscountAcknowledged` (Boolean, Default: false)
- `acceptedAt` (DateTime)
- `createdAt` (DateTime)

### MainWallet (Platform Wallet)
- `id` (UUID/Int, Primary Key)
- `balance` (Decimal, Default: 0)
- `totalRevenue` (Decimal, Default: 0)
- `totalCommission` (Decimal, Default: 0)
- `totalRefunds` (Decimal, Default: 0)
- `lastUpdated` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### VendorWallet
- `id` (UUID/Int, Primary Key)
- `vendorId` (Int, Foreign Key to Vendor, Unique)
- `balance` (Decimal, Default: 0)
- `totalEarnings` (Decimal, Default: 0)
- `totalCommission` (Decimal, Default: 0)
- `totalPayouts` (Decimal, Default: 0)
- `isFrozen` (Boolean, Default: false)
- `frozenAt` (DateTime, Optional)
- `frozenBy` (Int, Optional - Foreign Key to Admin)
- `freezeReason` (String, Optional)
- `lastUpdated` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### UserWallet (Optional)
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User, Unique)
- `balance` (Decimal, Default: 0)
- `totalCredits` (Decimal, Default: 0)
- `totalSpent` (Decimal, Default: 0)
- `lastUpdated` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### WalletTransaction
- `id` (UUID/Int, Primary Key)
- `walletType` (Enum: MAIN, VENDOR, USER)
- `walletId` (Int - ID of the wallet)
- `vendorId` (Int, Optional - Foreign Key to Vendor)
- `userId` (Int, Optional - Foreign Key to User)
- `type` (Enum: CREDIT, DEBIT, COMMISSION, REFUND, PAYOUT, TRANSFER, FREEZE, UNFREEZE)
- `amount` (Decimal)
- `balanceBefore` (Decimal)
- `balanceAfter` (Decimal)
- `description` (String, Optional)
- `relatedId` (Int, Optional - ID of related entity)
- `relatedType` (String, Optional - e.g., 'order', 'payment', 'payout')
- `status` (Enum: PENDING, COMPLETED, FAILED, CANCELLED)
- `processedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### PayoutRequest
- `id` (UUID/Int, Primary Key)
- `vendorId` (Int, Foreign Key to Vendor)
- `amount` (Decimal)
- `status` (Enum: PENDING, APPROVED, REJECTED, PROCESSED)
- `requestedAt` (DateTime)
- `approvedAt` (DateTime, Optional)
- `approvedBy` (Int, Optional - Foreign Key to Admin)
- `rejectedAt` (DateTime, Optional)
- `rejectedBy` (Int, Optional - Foreign Key to Admin)
- `rejectionReason` (String, Optional)
- `processedAt` (DateTime, Optional)
- `transactionId` (String, Optional)
- `bankAccountId` (Int, Optional - Foreign Key to BankAccount)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### CheckoutSession
- `id` (UUID/Int, Primary Key)
- `sessionId` (String, Unique)
- `userId` (Int, Foreign Key to User)
- `cartId` (Int, Optional - Foreign Key to Cart)
- `status` (Enum: INITIATED, IN_PROGRESS, COMPLETED, ABANDONED, EXPIRED)
- `shippingAddress` (String, Optional)
- `shippingCountry` (String, Optional)
- `shippingCity` (String, Optional)
- `shippingMethod` (Enum: SITE_INTERMEDIARIES, CUSTOM_AGENT, Optional)
- `customsClearance` (Boolean, Default: false)
- `discountCode` (String, Optional)
- `subtotal` (Decimal, Optional)
- `tax` (Decimal, Optional)
- `deliveryCharge` (Decimal, Optional)
- `siteCommission` (Decimal, Optional)
- `discountAmount` (Decimal, Optional)
- `totalAmount` (Decimal, Optional)
- `paymentMethod` (Enum: BANK_CARD, BANK_TRANSFER, Optional)
- `orderId` (Int, Optional - Foreign Key to Order, set when completed)
- `expiresAt` (DateTime)
- `completedAt` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### CheckoutItem
- `id` (UUID/Int, Primary Key)
- `sessionId` (Int, Foreign Key to CheckoutSession)
- `productId` (Int, Foreign Key to Product)
- `quantity` (Int)
- `price` (Decimal)
- `cbm` (Decimal, Optional)
- `itemNumber` (String, Optional)
- `negotiatedPrice` (Decimal, Optional)
- `negotiatedQuantity` (Int, Optional)
- `createdAt` (DateTime)

### SiteSettings
- `id` (UUID/Int, Primary Key)
- `siteName` (String)
- `siteLogo` (String, Optional)
- `siteFavicon` (String, Optional)
- `siteCommissionPercentage` (Decimal, Default: 2.5)
- `taxRate` (Decimal, Default: 0)
- `creditDiscountPercentage` (Decimal, Default: 2.5)
- `defaultCurrency` (String, Default: 'SAR')
- `supportedCurrencies` (String, Optional - JSON array)
- `defaultLanguage` (String, Default: 'ar')
- `supportedLanguages` (String, Optional - JSON array)
- `emailFrom` (String, Optional)
- `emailFromName` (String, Optional)
- `supportEmail` (String, Optional)
- `supportPhone` (String, Optional)
- `maintenanceMode` (Boolean, Default: false)
- `updatedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### AdminPermission
- `id` (UUID/Int, Primary Key)
- `adminId` (Int, Foreign Key to Admin)
- `permission` (String - e.g., 'users.create', 'products.delete', 'orders.view')
- `grantedAt` (DateTime)
- `grantedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)

### GlobalSEO
- `id` (UUID/Int, Primary Key)
- `siteTitle` (String, Optional - default meta title template)
- `siteDescription` (String, Optional - default meta description template)
- `siteKeywords` (String, Optional - default keywords)
- `ogImage` (String, Optional - default Open Graph image)
- `twitterCardImage` (String, Optional - default Twitter Card image)
- `robotsTxt` (String, Optional - robots.txt content)
- `sitemapUrl` (String, Optional - sitemap URL)
- `sitemapLastGenerated` (DateTime, Optional)
- `sitemapLastSubmitted` (DateTime, Optional)
- `googleVerificationCode` (String, Optional)
- `bingVerificationCode` (String, Optional)
- `updatedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### ContentPage
- `id` (UUID/Int, Primary Key)
- `type` (Enum: TERMS, PRIVACY, DELIVERY_INFO, ABOUT_US, CONTACT, CUSTOM)
- **Translation Keys (i18n):**
  - `titleKey` (String - e.g., "content.terms.title")
  - `contentKey` (String - e.g., "content.terms.body")
- `slug` (String, Unique - SEO-friendly URL, language-specific slugs stored separately)
- `isActive` (Boolean, Default: true)
- **SEO Fields (Translation Keys):**
  - `metaTitleKey` (String, Optional - e.g., "content.terms.meta.title")
  - `metaDescriptionKey` (String, Optional - e.g., "content.terms.meta.description")
  - `metaKeywords` (String, Optional - language-independent)
  - `canonicalUrl` (String, Optional)
  - `ogTitleKey` (String, Optional)
  - `ogDescriptionKey` (String, Optional)
  - `ogImage` (String, Optional)
  - `twitterCardTitleKey` (String, Optional)
  - `twitterCardDescriptionKey` (String, Optional)
  - `twitterCardImage` (String, Optional)
  - `structuredData` (String, Optional - JSON-LD)
- `createdBy` (Int, Optional - Foreign Key to Admin)
- `updatedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SEOAnalytics
- `id` (UUID/Int, Primary Key)
- `entityType` (Enum: PRODUCT, CATEGORY, CONTENT_PAGE)
- `entityId` (Int)
- `seoScore` (Int, Optional - 0-100)
- `missingFields` (String, Optional - JSON array of missing SEO fields)
- `lastChecked` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### TranslationKey
- `id` (UUID/Int, Primary Key)
- `key` (String, Unique - e.g., "product.name.123")
- `namespace` (String - e.g., "product", "category", "common")
- `entityType` (String, Optional - e.g., "Product", "Category")
- `entityId` (Int, Optional - ID of the entity)
- `fieldName` (String, Optional - e.g., "name", "description")
- `isSystem` (Boolean, Default: false - system translations vs user-generated)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SavedSearch
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User)
- `name` (String - user-given name for the search)
- `searchQuery` (String, Optional - search text)
- `filters` (String - JSON object with all filter criteria)
- `entityType` (Enum: PRODUCT, ORDER, VENDOR, CATEGORY)
- `emailAlerts` (Boolean, Default: false)
- `alertFrequency` (Enum: DAILY, WEEKLY, NEVER)
- `lastAlertSent` (DateTime, Optional)
- `resultCount` (Int, Optional - last result count)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SearchHistory
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Optional - Foreign Key to User, null for guest searches)
- `sessionId` (String, Optional - for guest users)
- `searchQuery` (String)
- `entityType` (Enum: PRODUCT, ORDER, VENDOR, CATEGORY, GLOBAL)
- `filters` (String, Optional - JSON object)
- `resultCount` (Int, Optional)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `createdAt` (DateTime)

### ActivityLog
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Optional - Foreign Key to User/Vendor/Admin)
- `userType` (Enum: USER, VENDOR, ADMIN, SYSTEM)
- `action` (String - e.g., "product.create", "order.update", "user.delete")
- `entityType` (String - e.g., "Product", "Order", "User")
- `entityId` (Int, Optional)
- `description` (String, Optional)
- `changes` (String, Optional - JSON object with before/after values)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `location` (String, Optional - country/city)
- `metadata` (String, Optional - JSON object for additional data)
- `createdAt` (DateTime)

### AuditTrail
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Optional - Foreign Key to User/Vendor/Admin)
- `userType` (Enum: USER, VENDOR, ADMIN, SYSTEM)
- `action` (String - e.g., "login", "password_change", "permission_grant")
- `entityType` (String, Optional)
- `entityId` (Int, Optional)
- `oldValue` (String, Optional - JSON or text)
- `newValue` (String, Optional - JSON or text)
- `reason` (String, Optional)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `success` (Boolean, Default: true)
- `errorMessage` (String, Optional)
- `createdAt` (DateTime)

### ExportHistory
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User/Vendor/Admin)
- `exportType` (Enum: PRODUCTS, ORDERS, USERS, VENDORS, REPORTS, TRANSLATIONS, AUDIT_LOGS)
- `format` (Enum: CSV, EXCEL, JSON, PDF)
- `filters` (String, Optional - JSON object with export filters)
- `fields` (String, Optional - JSON array of selected fields)
- `fileUrl` (String - path to exported file)
- `fileSize` (Int, Optional - in bytes)
- `recordCount` (Int, Optional)
- `status` (Enum: PENDING, PROCESSING, COMPLETED, FAILED)
- `errorMessage` (String, Optional)
- `expiresAt` (DateTime, Optional - file cleanup date)
- `createdAt` (DateTime)
- `completedAt` (DateTime, Optional)

### ImportHistory
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User/Vendor/Admin)
- `importType` (Enum: PRODUCTS, USERS, VENDORS, TRANSLATIONS, CATEGORIES)
- `format` (Enum: CSV, EXCEL, JSON)
- `fileUrl` (String - path to imported file)
- `fileSize` (Int, Optional - in bytes)
- `totalRecords` (Int)
- `successfulRecords` (Int, Default: 0)
- `failedRecords` (Int, Default: 0)
- `status` (Enum: PENDING, PROCESSING, COMPLETED, FAILED, ROLLED_BACK)
- `errors` (String, Optional - JSON array of error details)
- `previewData` (String, Optional - JSON array of preview records)
- `rollbackId` (Int, Optional - Foreign Key to ImportHistory for rollback)
- `createdAt` (DateTime)
- `completedAt` (DateTime, Optional)

### UserSession
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User/Vendor/Admin)
- `userType` (Enum: USER, VENDOR, ADMIN)
- `sessionToken` (String, Unique)
- `refreshToken` (String, Optional, Unique)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `deviceInfo` (String, Optional - JSON object)
- `location` (String, Optional)
- `isActive` (Boolean, Default: true)
- `lastActivityAt` (DateTime)
- `expiresAt` (DateTime)
- `createdAt` (DateTime)
- `revokedAt` (DateTime, Optional)

### LoginHistory
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Optional - Foreign Key to User/Vendor/Admin)
- `email` (String - email used for login attempt)
- `userType` (Enum: USER, VENDOR, ADMIN)
- `success` (Boolean)
- `failureReason` (String, Optional - e.g., "invalid_password", "account_locked")
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `location` (String, Optional)
- `twoFactorUsed` (Boolean, Default: false)
- `sessionId` (Int, Optional - Foreign Key to UserSession)
- `createdAt` (DateTime)

### TwoFactorAuth
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User/Vendor/Admin)
- `userType` (Enum: USER, VENDOR, ADMIN)
- `method` (Enum: TOTP, SMS, EMAIL)
- `secret` (String - encrypted TOTP secret)
- `phoneNumber` (String, Optional - for SMS)
- `isEnabled` (Boolean, Default: false)
- `backupCodes` (String, Optional - JSON array of encrypted backup codes)
- `lastVerifiedAt` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SocialAuth
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Foreign Key to User/Vendor/Admin)
- `provider` (Enum: GOOGLE, FACEBOOK, APPLE, TWITTER)
- `providerId` (String - provider's user ID)
- `email` (String, Optional)
- `accessToken` (String, Optional - encrypted)
- `refreshToken` (String, Optional - encrypted)
- `profileData` (String, Optional - JSON object)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SearchAnalytics
- `id` (UUID/Int, Primary Key)
- `searchQuery` (String)
- `entityType` (Enum: PRODUCT, ORDER, VENDOR, CATEGORY, GLOBAL)
- `resultCount` (Int, Optional)
- `hasResults` (Boolean)
- `clickedResult` (Boolean, Default: false)
- `resultId` (Int, Optional - ID of clicked result)
- `userId` (Int, Optional - Foreign Key to User)
- `sessionId` (String, Optional)
- `ipAddress` (String, Optional)
- `createdAt` (DateTime)

### PointSystem
- `id` (UUID/Int, Primary Key)
- `userId` (Int, Optional - Foreign Key to User)
- `vendorId` (Int, Optional - Foreign Key to Vendor)
- `pointType` (Enum: USER, VENDOR)
- `balance` (Int, Default: 0)
- `totalEarned` (Int, Default: 0)
- `totalRedeemed` (Int, Default: 0)
- `totalExpired` (Int, Default: 0)
- `lastUpdated` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### PointTransaction
- `id` (UUID/Int, Primary Key)
- `pointSystemId` (Int, Foreign Key to PointSystem)
- `userId` (Int, Optional - Foreign Key to User)
- `vendorId` (Int, Optional - Foreign Key to Vendor)
- `type` (Enum: EARNED, REDEEMED, EXPIRED, ADJUSTED, REFERRAL, REVIEW, PURCHASE)
- `points` (Int)
- `balanceBefore` (Int)
- `balanceAfter` (Int)
- `description` (String, Optional)
- `relatedId` (Int, Optional - ID of related entity)
- `relatedType` (String, Optional - e.g., 'order', 'review', 'referral')
- `expiresAt` (DateTime, Optional)
- `processedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)

### PointRule
- `id` (UUID/Int, Primary Key)
- `ruleType` (Enum: PURCHASE, REVIEW, REFERRAL, SIGNUP, ADMIN_ADJUSTMENT)
- `pointType` (Enum: USER, VENDOR)
- `points` (Int)
- `multiplier` (Decimal, Optional - for percentage-based rules)
- `minPurchaseAmount` (Decimal, Optional)
- `maxPointsPerTransaction` (Int, Optional)
- `isActive` (Boolean, Default: true)
- `validFrom` (DateTime)
- `validUntil` (DateTime, Optional)
- `createdBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### ProductOffer
- `id` (UUID/Int, Primary Key)
- `vendorId` (Int, Foreign Key to Vendor)
- `productId` (Int, Optional - Foreign Key to Product)
- `categoryId` (Int, Optional - Foreign Key to Category)
- `title` (String)
- `description` (String, Optional)
- `offerType` (Enum: PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y, BUNDLE, FLASH_SALE)
- `discountValue` (Decimal)
- `minPurchaseAmount` (Decimal, Optional)
- `maxDiscountAmount` (Decimal, Optional)
- `minQuantity` (Int, Optional)
- `maxQuantity` (Int, Optional)
- `buyQuantity` (Int, Optional - for BOGO offers)
- `getQuantity` (Int, Optional - for BOGO offers)
- `status` (Enum: PENDING, ACTIVE, SCHEDULED, EXPIRED, CANCELLED, REJECTED)
- `startDate` (DateTime)
- `endDate` (DateTime)
- `usageLimit` (Int, Optional)
- `usedCount` (Int, Default: 0)
- `isVisible` (Boolean, Default: true)
- `approvedAt` (DateTime, Optional)
- `approvedBy` (Int, Optional - Foreign Key to Admin)
- `rejectedAt` (DateTime, Optional)
- `rejectedBy` (Int, Optional - Foreign Key to Admin)
- `rejectionReason` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Coupon
- `id` (UUID/Int, Primary Key)
- `code` (String, Unique)
- `vendorId` (Int, Optional - Foreign Key to Vendor, for vendor-specific coupons)
- `createdBy` (Int, Optional - Foreign Key to Admin)
- `couponType` (Enum: PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BOGO)
- `discountValue` (Decimal)
- `minPurchaseAmount` (Decimal, Optional)
- `maxDiscountAmount` (Decimal, Optional)
- `applicableTo` (Enum: ALL_PRODUCTS, SPECIFIC_PRODUCTS, SPECIFIC_CATEGORIES, SPECIFIC_VENDORS)
- `productIds` (String, Optional - JSON array)
- `categoryIds` (String, Optional - JSON array)
- `vendorIds` (String, Optional - JSON array)
- `userEligibility` (Enum: ALL_USERS, FIRST_TIME_BUYERS, SPECIFIC_USERS)
- `userIds` (String, Optional - JSON array)
- `usageLimit` (Int, Optional - total usage limit)
- `usageLimitPerUser` (Int, Optional - per user limit)
- `usedCount` (Int, Default: 0)
- `validFrom` (DateTime)
- `validUntil` (DateTime)
- `status` (Enum: ACTIVE, INACTIVE, EXPIRED)
- `isVisible` (Boolean, Default: true)
- `approvedAt` (DateTime, Optional)
- `approvedBy` (Int, Optional - Foreign Key to Admin)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### CouponUsage
- `id` (UUID/Int, Primary Key)
- `couponId` (Int, Foreign Key to Coupon)
- `userId` (Int, Foreign Key to User)
- `orderId` (Int, Optional - Foreign Key to Order)
- `discountAmount` (Decimal)
- `usedAt` (DateTime)
- `createdAt` (DateTime)

### ProductReview (Enhanced)
- `id` (UUID/Int, Primary Key)
- `productId` (Int, Foreign Key to Product)
- `userId` (Int, Foreign Key to User)
- `vendorId` (Int, Foreign Key to Vendor - product owner)
- `rating` (Int - 1 to 5)
- `title` (String, Optional)
- `comment` (String, Optional)
- `isVerifiedPurchase` (Boolean, Default: false)
- `orderId` (Int, Optional - Foreign Key to Order)
- `status` (Enum: PENDING, APPROVED, REJECTED, HIDDEN)
- `vendorResponse` (String, Optional)
- `vendorResponseAt` (DateTime, Optional)
- `adminReviewed` (Boolean, Default: false)
- `adminReviewedBy` (Int, Optional - Foreign Key to Admin)
- `adminReviewedAt` (DateTime, Optional)
- `helpfulCount` (Int, Default: 0)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### OrderTracking
- `id` (UUID/Int, Primary Key)
- `orderId` (Int, Foreign Key to Order)
- `status` (Enum - same as Order.status)
- `description` (String, Optional)
- `location` (String, Optional)
- `trackingNumber` (String, Optional)
- `carrier` (String, Optional)
- `estimatedDelivery` (DateTime, Optional)
- `updatedBy` (Int, Optional - Foreign Key to User/Vendor/Admin)
- `updatedByType` (Enum: USER, VENDOR, ADMIN)
- `createdAt` (DateTime)

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# JWT
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"

# File Upload
MAX_FILE_SIZE="10485760"  # 10MB in bytes
UPLOAD_DIR="./uploads"
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp"

# Payment Gateway (configure based on chosen provider)
PAYMENT_GATEWAY_API_KEY="your_payment_gateway_api_key"
PAYMENT_GATEWAY_SECRET="your_payment_gateway_secret"
PAYMENT_GATEWAY_MODE="sandbox"  # or "production"

# Site Configuration
SITE_COMMISSION_PERCENTAGE="2.5"  # or 4% as per business rules
DEFAULT_TAX_RATE="0"  # Configure based on requirements

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your_email@example.com"
SMTP_PASS="your_email_password"
FROM_EMAIL="noreply@stockship.com"

# Shipping
DEFAULT_SHIPPING_DAYS="5-7"  # Default delivery time range

# Internationalization (i18n)
DEFAULT_LANGUAGE="ar"
SUPPORTED_LANGUAGES="ar,en"
FALLBACK_LANGUAGE="en"
TRANSLATION_FILES_PATH="./locales"
TRANSLATION_AUTO_GENERATE_KEYS="true"

# Search and Filtering
SEARCH_ENGINE="database"  # Options: database, elasticsearch, algolia
ELASTICSEARCH_URL="http://localhost:9200"  # If using Elasticsearch
ALGOLIA_APP_ID=""  # If using Algolia
ALGOLIA_API_KEY=""  # If using Algolia
SEARCH_RESULT_CACHE_TTL="3600"  # Cache TTL in seconds

# Caching
CACHE_TYPE="redis"  # Options: redis, memory
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
CACHE_TTL="3600"  # Default cache TTL in seconds
CACHE_PREFIX="stockship:"

# Real-time Features
WEBSOCKET_ENABLED="true"
WEBSOCKET_PORT="3001"
REDIS_PUBSUB_ENABLED="true"  # For distributed WebSocket

# Security
TWO_FACTOR_ENABLED="true"
SESSION_SECRET="your_session_secret_key"
SESSION_MAX_AGE="604800000"  # 7 days in milliseconds
MAX_LOGIN_ATTEMPTS="5"
ACCOUNT_LOCKOUT_DURATION="900000"  # 15 minutes in milliseconds
PASSWORD_MIN_LENGTH="8"
PASSWORD_REQUIRE_UPPERCASE="true"
PASSWORD_REQUIRE_LOWERCASE="true"
PASSWORD_REQUIRE_NUMBERS="true"
PASSWORD_REQUIRE_SYMBOLS="true"

# Social Authentication
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# Activity Logs and Audit
AUDIT_LOG_RETENTION_DAYS="365"
AUDIT_LOG_ARCHIVE_ENABLED="true"
ACTIVITY_LOG_ENABLED="true"

# Export/Import
EXPORT_FILE_RETENTION_DAYS="7"
EXPORT_MAX_FILE_SIZE="104857600"  # 100MB
IMPORT_MAX_FILE_SIZE="52428800"  # 50MB
IMPORT_BATCH_SIZE="1000"

# Performance Monitoring
APM_ENABLED="true"
APM_SERVICE_NAME="stockship-api"
LOG_LEVEL="info"  # Options: error, warn, info, debug
SENTRY_DSN=""  # For error tracking

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"

# Admin Configuration
ADMIN_EMAIL="admin@stockship.com"
ADMIN_PASSWORD="secure_admin_password"
SUPER_ADMIN_EMAIL="superadmin@stockship.com"
SUPER_ADMIN_PASSWORD="secure_superadmin_password"

# Wallet Configuration
WALLET_MIN_PAYOUT_AMOUNT="100"  # Minimum amount for payout request
WALLET_PAYOUT_FEE="0"  # Payout processing fee
```

## Translation Files Structure (i18n)

The project uses a modern translation key system where translations are stored in JSON files, not in the database. This keeps the database lightweight and allows for unlimited language support.

### File Structure
```
locales/
├── ar/
│   ├── translation.json
│   ├── product.json
│   ├── category.json
│   ├── common.json
│   └── errors.json
├── en/
│   ├── translation.json
│   ├── product.json
│   ├── category.json
│   ├── common.json
│   └── errors.json
└── fr/  # Example: Adding French
    ├── translation.json
    └── ...
```

### Translation Key Format
Translation keys follow a hierarchical structure:
- `product.name.123` - Product name for product ID 123
- `product.description.123` - Product description for product ID 123
- `category.name.45` - Category name for category ID 45
- `common.buttons.save` - Common UI button label
- `errors.validation.required` - Error message

### Example Translation File (locales/ar/product.json)
```json
{
  "product.name.123": "منتج مثال",
  "product.description.123": "وصف المنتج باللغة العربية",
  "product.meta.title.123": "منتج مثال - Stockship",
  "product.meta.description.123": "شراء منتج مثال من Stockship"
}
```

### Example Translation File (locales/en/product.json)
```json
{
  "product.name.123": "Example Product",
  "product.description.123": "Product description in English",
  "product.meta.title.123": "Example Product - Stockship",
  "product.meta.description.123": "Buy Example Product from Stockship"
}
```

### Translation Key Generation
- **Auto-generation**: When creating a product/category, automatically generate keys like `product.name.{id}`
- **Manual**: Admin can manually create/update translation keys via API
- **Bulk Import**: Import translations from JSON/CSV files

### Translation Management
- Admin dashboard for managing translations
- Translation completion status per language
- Missing translation detection
- Translation versioning
- Translation review workflow

## Project Structure (Suggested)

```
stockship-backend/
├── prisma/
│   └── schema.prisma          # Prisma schema definition
├── src/
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Auth, validation, error handling
│   ├── models/                # Data models (if needed beyond Prisma)
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic
│   ├── utils/                 # Helper functions
│   ├── validators/            # Input validation schemas
│   └── app.js                 # Express app setup
├── .env                       # Environment variables
├── .env.example               # Example environment variables
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

1. **Initialize Node.js Project**
   ```bash
   npm init -y
   ```

2. **Install Dependencies**
   ```bash
   # Core dependencies
   npm install express prisma @prisma/client bcrypt jsonwebtoken dotenv cors
   
   # File upload and processing
   npm install multer sharp xlsx
   
   # Validation
   npm install joi express-validator
   
   # Additional utilities
   npm install uuid date-fns
   
   # Development dependencies
   npm install -D nodemon @types/node
   ```

3. **Initialize Prisma**
   ```bash
   npx prisma init
   ```

4. **Configure Prisma Schema**
   - Update `prisma/schema.prisma` with the database schema
   - Set the provider to `mysql`
   - Configure the `DATABASE_URL` in `.env`

5. **Create Database**
   - Create a MySQL database
   - Update `DATABASE_URL` in `.env` with your database credentials

6. **Run Migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

7. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

8. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Quality
- Follow RESTful API conventions
- Implement proper error handling with meaningful error messages
- Use middleware for authentication, validation, and error handling
- Write clean, readable, and maintainable code
- Add comments where necessary to explain complex logic

### Security
- Always hash passwords using bcrypt
- Validate and sanitize all user inputs
- Use JWT tokens for authentication
- Implement rate limiting to prevent abuse
- Use environment variables for sensitive data
- Implement CORS properly

### Database
- Use Prisma migrations for all schema changes
- Define proper relationships between models
- Add indexes for frequently queried fields
- Use transactions for operations that modify multiple records

### API Design
- Use consistent naming conventions (camelCase or kebab-case)
- Return consistent response formats
- Implement pagination for list endpoints
- Use appropriate HTTP status codes
- Include proper error responses

## Testing (Recommended)
- Write unit tests for business logic
- Write integration tests for API endpoints
- Test authentication and authorization flows
- Test error scenarios

## Additional Notes

### Key Features from Figma Design
Based on the comprehensive Figma design analysis, the following features are critical:

1. **B2B Marketplace Functionality:**
   - Wholesale-only product listings
   - Direct buyer-seller negotiation
   - Bulk order processing
   - CBM-based shipping calculations

2. **Payment Protection:**
   - Escrow-style payment holding until shipping confirmation
   - Payment verification for bank transfers
   - Refund policies with tax and fee exclusions
   - Site commission tracking

3. **Shipping Management:**
   - Option to use site's shipping intermediaries or custom agents
   - Customs clearance responsibility options
   - Real-time shipping tracking integration
   - Shipping policy management

4. **Seller Features:**
   - Complete seller onboarding with bank details
   - Company profile management
   - Product advertisement creation
   - Excel bulk product upload
   - Seller ratings and reviews

5. **Order Lifecycle:**
   - Detailed order status tracking with timeline
   - Status-based filtering (Awaiting response, In delivery, Completed)
   - Order notes and communication
   - Shipping carrier integration

6. **Internationalization:**
   - Full Arabic language support (RTL)
   - Multi-currency support (SAR, EGP, USD)
   - Country and city-based filtering

### Implementation Considerations
- Review the Figma design carefully to ensure all features are implemented
- Pay attention to data validation requirements from the design
- Ensure API responses match the data structure expected by the frontend
- Implement comprehensive file upload functionality for:
  - Product images (multiple per product, max 10)
  - Payment receipts (max 10MB)
  - Excel files for bulk import
  - Site logo upload (admin only)
- Add logging for debugging and monitoring
- Implement proper error handling for payment processing
- Consider implementing webhook support for payment gateway callbacks
- Ensure proper handling of concurrent negotiations and orders
- Implement proper caching for frequently accessed data (categories, products)
- Consider implementing real-time notifications using WebSockets or similar
- Ensure proper handling of timezone differences for order tracking
- Implement proper security measures for file uploads (virus scanning, type validation)
- Consider implementing rate limiting for API endpoints
- Ensure proper handling of large Excel file imports (streaming, background jobs)
- **Admin Dashboard Features:**
  - Real-time statistics and analytics
  - Downloadable reports in multiple formats (CSV, Excel, PDF)
  - Site logo management from dashboard
  - Comprehensive user, vendor, product, order, and payment management
  - Wallet management for all vendors
  - Commission and revenue tracking
  - Support ticket management
- **Vendor Dashboard Features:**
  - Vendor-specific statistics
  - Downloadable reports for own data
  - Product management interface
  - Order management interface
  - Wallet and payout management
  - Commission tracking
- **Wallet System:**
  - Secure wallet transactions
  - Admin can freeze/unfreeze vendor wallets
  - Admin can transfer/deduct funds from vendor wallets
  - Payout request workflow with admin approval
  - Transaction history tracking
- **Permission System:**
  - Granular permission control for admins
  - Role-based access control
  - Permission inheritance and management
- **Three Separate Tables:**
  - User table for buyers/customers
  - Vendor table for sellers with extended fields
  - Admin table for platform administrators
  - Proper foreign key relationships between all entities

## Next Steps
1. Review the Figma design thoroughly
2. Set up the project structure
3. Configure Prisma with MySQL
4. Implement authentication endpoints
5. Implement CRUD operations for all entities
6. Add validation and error handling
7. Test all endpoints
8. Document API endpoints (consider using Swagger/OpenAPI)

---

**Note**: This README serves as a starting point. Please review the Figma design and adjust the requirements, API endpoints, and database schema accordingly to match the exact specifications of the Stockship application.

