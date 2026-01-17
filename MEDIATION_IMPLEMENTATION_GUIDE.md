# Mediation Platform Implementation Guide

## Overview

This guide provides a complete overview of the refactored mediation platform architecture, implementation details, and migration strategy from the e-commerce model to the mediation/brokerage model.

---

## 📁 File Structure

### New Files Created

```
prisma/
  └── schema-mediation.prisma          # New mediation platform schema

src/controllers/mediation/
  ├── employee.controller.js           # Employee (mediator/guarantor) management
  ├── trader.controller.js             # Trader (supplier) management
  ├── offer.controller.js              # Offer creation & Excel upload
  ├── deal.controller.js               # Deal lifecycle management
  ├── negotiation.controller.js        # Negotiation messaging system
  └── financial.controller.js         # Financial intermediary & commissions

MEDIATION_PLATFORM_ANALYSIS.md         # Analysis document
MEDIATION_IMPLEMENTATION_GUIDE.md      # This file
```

---

## 🔄 Core Workflow

### 1. Trader Registration (Employee → Trader)

```
Employee creates Trader
  ↓
System generates:
  - Trader Code (TRD-0001)
  - Barcode
  - QR Code
  ↓
Trader permanently linked to Employee
```

**API Endpoint:**
```http
POST /api/employees/:employeeId/traders
```

### 2. Offer Creation (Trader → Offer)

```
Trader creates Offer
  ↓
Trader uploads Excel file with products
  ↓
System calculates:
  - CBM per item
  - Total CBM
  - Total cartons
  ↓
Offer status: PENDING_VALIDATION
  ↓
Employee validates data
  ↓
Offer status: ACTIVE
```

**API Endpoints:**
```http
POST /api/traders/offers
POST /api/traders/offers/:id/upload-excel
PUT /api/employees/offers/:id/validate
```

### 3. Deal Request (Client → Deal)

```
Client browses active Offers
  ↓
Client clicks "Request Negotiation"
  ↓
System creates Deal:
  - Status: NEGOTIATION
  - Employee assigned as guarantor
  - Notifications sent
```

**API Endpoint:**
```http
POST /api/offers/:offerId/request-negotiation
```

### 4. Negotiation (Client ↔ Trader)

```
Client and Trader exchange messages
  ↓
Employee sees all messages (guarantor)
  ↓
Messages logged in AuditLog
  ↓
Agreement reached on:
  - Price
  - Quantity
  - Terms
```

**API Endpoints:**
```http
POST /api/deals/:dealId/negotiations
GET /api/deals/:dealId/negotiations
```

### 5. Deal Approval (Trader)

```
Trader approves Deal
  ↓
System generates:
  - Invoice number
  - Barcode/QR code
  ↓
Deal status: APPROVED
  ↓
Notifications sent
```

**API Endpoint:**
```http
PUT /api/traders/deals/:id/approve
```

### 6. Payment Processing (Client → Platform)

```
Client pays platform (escrow)
  ↓
Payment status: PENDING
  ↓
Employee verifies payment receipt
  ↓
Payment status: COMPLETED
  ↓
Deal status: PAID
  ↓
Commissions calculated:
  - Platform commission
  - Employee commission
  - Trader net amount
```

**API Endpoints:**
```http
POST /api/deals/:dealId/payments
PUT /api/employees/payments/:id/verify
```

### 7. Deal Settlement

```
Employee settles Deal
  ↓
Deal status: SETTLED
  ↓
Final invoice generated
  ↓
All parties notified
```

**API Endpoint:**
```http
PUT /api/deals/:id/settle
```

---

## 💰 Financial Intermediary System

### Commission Calculation

```javascript
const amount = 10000; // Deal amount
const platformCommissionRate = 2.5; // 2.5%
const employeeCommissionRate = 1.0; // 1.0%

const platformCommission = (amount * 2.5) / 100; // 250
const employeeCommission = (amount * 1.0) / 100; // 100
const traderAmount = amount - platformCommission - employeeCommission; // 9650
```

### Ledger Entries

Every payment creates 4 ledger entries:

1. **DEBIT** from Client account
2. **CREDIT** to Platform (commission)
3. **CREDIT** to Employee (commission)
4. **CREDIT** to Trader (net amount)

### Financial Flow

```
Client Payment (10,000)
  ↓
Platform Escrow Account
  ↓
Distribution:
  ├─ Platform: 250 (2.5%)
  ├─ Employee: 100 (1.0%)
  └─ Trader: 9,650 (96.5%)
```

---

## 📊 Database Schema Highlights

### Key Entities

1. **Employee**
   - `employeeCode`: Auto-generated (EMP-0001)
   - `commissionRate`: Percentage (default 1.0%)
   - Linked to Admin (created by)

2. **Trader**
   - `traderCode`: Auto-generated (TRD-0001)
   - `barcode`: Unique identifier
   - `qrCodeUrl`: QR code image
   - `employeeId`: Permanently linked

3. **Offer**
   - `status`: DRAFT → PENDING_VALIDATION → ACTIVE → CLOSED
   - `totalCBM`: Calculated from items
   - `totalCartons`: Sum of item cartons
   - `excelFileUrl`: Original upload

4. **Deal**
   - `dealNumber`: Auto-generated (DEAL-2024-000001)
   - `status`: NEGOTIATION → APPROVED → PAID → SETTLED
   - `negotiatedAmount`: Agreed price
   - `invoiceNumber`: Generated on approval
   - `barcode`/`qrCodeUrl`: Generated on approval

5. **DealNegotiation**
   - Real-time messaging
   - `messageType`: TEXT, PRICE_PROPOSAL, QUANTITY_PROPOSAL
   - Employee sees all messages

6. **FinancialTransaction**
   - `type`: DEPOSIT, COMMISSION, PAYOUT, etc.
   - Tracks all money movements
   - Commission breakdown

---

## 🔐 Authorization Rules

### Employee
- Can create Traders (only their own)
- Can validate Offers (only from their Traders)
- Can verify Payments (only for their Deals)
- Can view all Deals they guarantee

### Trader
- Can create Offers
- Can upload Excel files
- Can approve Deals
- Can send negotiation messages
- Can view their own Offers and Deals

### Client
- Can browse active Offers
- Can request Negotiation (create Deal)
- Can send negotiation messages
- Can make payments
- Can view their own Deals

### Admin
- Can create Employees
- Can view all entities
- Can manage system settings
- Can view financial reports

---

## 📝 Excel Upload Format

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| Product Name | Product description | "Cotton T-Shirt" |
| Description | Additional details | "100% cotton, white" |
| Quantity | Available quantity | 1000 |
| Cartons | Number of cartons | 50 |
| Length (cm) | Product length | 30 |
| Width (cm) | Product width | 25 |
| Height (cm) | Product height | 5 |
| Weight (kg) | Product weight | 0.2 |
| Country | Origin country | "China" |
| City | Origin city | "Shanghai" |

### CBM Calculation

```
CBM = (Length × Width × Height) / 1,000,000
Total CBM = CBM × Quantity
```

---

## 🚀 Migration Steps

### Phase 1: Schema Migration

1. **Backup current database**
   ```bash
   mysqldump -u user -p database > backup.sql
   ```

2. **Create new schema**
   ```bash
   cp prisma/schema-mediation.prisma prisma/schema.prisma
   npx prisma migrate dev --name mediation_platform
   ```

3. **Run seed script** (if needed)
   ```bash
   npm run prisma:seed
   ```

### Phase 2: Data Migration

1. **Convert Vendors → Traders**
   ```sql
   -- Assign each Vendor to an Employee
   -- Generate trader codes
   -- Create barcodes/QR codes
   ```

2. **Convert Products → OfferItems**
   ```sql
   -- Group products into Offers
   -- Calculate CBM
   -- Update relationships
   ```

3. **Convert Orders → Deals** (if applicable)
   ```sql
   -- Map order status to deal status
   -- Preserve payment information
   ```

### Phase 3: Controller Integration

1. **Update routes**
   ```javascript
   // src/routes/mediation.routes.js
   router.post('/employees/:employeeId/traders', createTrader);
   router.post('/traders/offers', createOffer);
   // ... etc
   ```

2. **Update middleware**
   ```javascript
   // Ensure role-based access control
   // Verify Employee-Trader relationships
   ```

3. **Test endpoints**
   ```bash
   npm test
   ```

### Phase 4: Frontend Integration

1. **Update API calls**
   - Replace cart/checkout with deal/negotiation
   - Update offer display
   - Add employee dashboard

2. **Update UI components**
   - Remove cart UI
   - Add negotiation chat
   - Add employee validation UI

### Phase 5: Cleanup

1. **Remove unused entities**
   - Cart, CartItem
   - CheckoutSession, CheckoutItem
   - Wishlist (if not needed)
   - Coupon (if not needed)

2. **Archive old data**
   - Keep for audit purposes
   - Move to archive tables

---

## 🔍 Key Differences from E-commerce

| E-commerce | Mediation Platform |
|------------|-------------------|
| Product → Cart → Checkout | Offer → Negotiation → Deal |
| Fixed prices | Negotiated prices |
| Immediate purchase | Deal lifecycle |
| SKU inventory | Descriptive products |
| Vendor = Seller | Trader + Employee |
| Direct payment | Escrow payment |
| Order tracking | Deal tracking |
| Product reviews | Not applicable |

---

## 📈 Monitoring & Analytics

### Employee Dashboard Metrics

- Number of Traders
- Active Deals count
- Total Deals count
- Total Commission earned

### Financial Reports

- Platform revenue
- Employee commissions
- Trader payouts
- Transaction history

### Deal Analytics

- Average negotiation time
- Deal success rate
- Average deal amount
- Commission breakdown

---

## 🔒 Security Considerations

1. **Role-based access control**
   - Verify Employee-Trader relationships
   - Verify Employee-Deal relationships

2. **Payment verification**
   - Employee must verify receipts
   - Audit trail for all payments

3. **Data validation**
   - Excel file validation
   - Offer validation by Employee
   - Deal amount verification

4. **Audit logging**
   - All actions logged
   - Full audit trail
   - Immutable logs

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Excel upload fails**
   - Check file format
   - Verify column headers
   - Check file size limits

2. **Commission calculation wrong**
   - Verify commission rates
   - Check employee assignment
   - Review transaction logs

3. **Deal status not updating**
   - Check payment status
   - Verify employee verification
   - Review status history

---

## 🎯 Next Steps

1. ✅ Complete schema migration
2. ✅ Implement controllers
3. ⏳ Create routes
4. ⏳ Update frontend
5. ⏳ Testing
6. ⏳ Deployment

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Implementation Complete




