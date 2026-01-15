# Mediation Platform Architecture Analysis & Refactoring Plan

## Executive Summary

This document analyzes the current e-commerce implementation and provides a comprehensive refactoring plan to transform it into a **mediation/brokerage platform** where the platform acts as a financial intermediary facilitating deals between traders (suppliers) and clients, with employees acting as guarantors.

---

## 🔴 Critical Issues: Why WooCommerce/E-commerce Model is Wrong

### 1. **Fundamental Business Model Mismatch**

**Current (E-commerce):**
- Direct product pricing
- Cart-based purchasing
- Immediate checkout
- SKU-based inventory
- Fixed prices

**Required (Mediation):**
- No direct pricing (negotiation-based)
- Offer-based (not product-based)
- Deal lifecycle (negotiation → approval → payment → settlement)
- Descriptive products (no SKU inventory)
- Financial intermediary (escrow-like)

### 2. **Missing Core Entities**

The current schema lacks:
- ❌ **Employee** entity (mediator/guarantor role)
- ❌ **Trader** entity (distinct from Vendor)
- ❌ **Offer** entity (container for thousands of products)
- ❌ **Deal** entity (replaces Order)
- ❌ **Deal Negotiation** messaging system
- ❌ **Financial Ledger** for escrow transactions
- ❌ **Trader-Employee** permanent linkage
- ❌ **Barcode/QR** generation for traders

### 3. **Incorrect Data Relationships**

**Current Problems:**
- `Product` has direct `price` field → Should be descriptive only
- `Order` assumes immediate purchase → Should be `Deal` with lifecycle
- `Cart`/`CheckoutSession` → Not needed in mediation model
- `Vendor` = `Trader` → Should be separate entities
- No `Employee` role → Critical missing piece

### 4. **Workflow Mismatches**

**Current Flow:**
```
Product → Cart → Checkout → Order → Payment
```

**Required Flow:**
```
Trader Registration (by Employee) → Offer Upload (Excel) → 
Client Requests Negotiation → Deal Created → 
Negotiation Messages → Deal Approved → Payment to Platform → 
Commission Split → Settlement
```

---

## ✅ Required Architecture Changes

### Core Domain Model Transformation

#### 1. **Role Hierarchy**

```
Admin (Platform Owner)
  └─ Monitoring only
  └─ Financial supervision
  └─ Employee management

Employee (Mediator/Guarantor)
  └─ Registers Traders
  └─ Supervises Offers & Deals
  └─ Acts as Deal Guarantor
  └─ Monitors negotiations
  └─ Linked to specific Traders (permanent)

Trader (Supplier)
  └─ Uploads Offers (not products)
  └─ Each Offer contains thousands of products
  └─ Excel-based uploads
  └─ No pricing, only quantities/dimensions
  └─ Linked to ONE Employee permanently

Client (User)
  └─ Browses Offers
  └─ Requests Negotiation
  └─ Negotiates via messaging
  └─ Pays platform (not trader)
```

#### 2. **Entity Redesign**

**A. Offer (Replaces Product as Primary Entity)**
- Contains many products (descriptive only)
- Has logistics data (cartons, dimensions, CBM)
- Is negotiable, not purchasable
- Status: `DRAFT`, `PENDING_VALIDATION`, `ACTIVE`, `CLOSED`

**B. Deal (Replaces Order)**
- Created when client requests negotiation
- Lifecycle: `NEGOTIATION` → `APPROVED` → `PAID` → `SETTLED`
- Contains: CBM, cartons count, negotiated amount
- Has invoice, barcode/QR, audit log

**C. Negotiation (Messaging System)**
- Real-time or async messaging
- Fully logged
- No price until agreement
- Employee receives all notifications

**D. Financial Intermediary**
- Client pays platform (escrow)
- Platform calculates commissions:
  - Platform commission
  - Employee commission
  - Trader net amount
- All movements in Ledger & Transactions

---

## 📊 New Database Schema Design

### Key Entities

1. **Employee**
   - Linked to Admin (created by)
   - Has many Traders (permanent relationship)
   - Monitors Deals as guarantor
   - Receives commission

2. **Trader**
   - Created by Employee
   - Has unique Trader Code
   - Has Barcode/QR
   - Permanently linked to Employee
   - Uploads Offers (Excel)

3. **Offer**
   - Belongs to Trader
   - Contains many OfferItems (products)
   - Has total CBM, cartons
   - Validated by Employee
   - No pricing

4. **Deal**
   - Created from Offer
   - Has negotiation status
   - Contains negotiated amount
   - Has invoice, barcode
   - Guaranteed by Employee

5. **DealNegotiation**
   - Messaging between Trader & Client
   - Employee sees all messages
   - Logged in AuditLog

6. **FinancialLedger**
   - All money movements
   - Escrow tracking
   - Commission calculations

---

## 🔄 Migration Strategy

### Phase 1: Schema Migration
1. Create new entities (Employee, Trader, Offer, Deal, etc.)
2. Keep old schema temporarily
3. Create migration scripts

### Phase 2: Data Migration
1. Convert Vendors → Traders (with Employee assignment)
2. Convert Products → OfferItems (grouped into Offers)
3. Convert Orders → Deals (if applicable)

### Phase 3: Controller Refactoring
1. Remove Cart/Checkout controllers
2. Create Offer/Deal/Negotiation controllers
3. Create Employee/Trader controllers
4. Create Financial intermediary controllers

### Phase 4: Cleanup
1. Remove unused e-commerce entities
2. Update routes
3. Update frontend integration

---

## 🚫 What to Remove

- ❌ Cart logic
- ❌ Checkout flows
- ❌ Product pricing (direct)
- ❌ SKU-based inventory
- ❌ Wishlist (not needed)
- ❌ Coupon system (not applicable)
- ❌ Product reviews (not applicable)
- ❌ Order tracking (replace with Deal tracking)

---

## ✅ What to Keep & Adapt

- ✅ User authentication (for Clients)
- ✅ Payment system (adapt for escrow)
- ✅ Wallet system (adapt for commission distribution)
- ✅ Notification system (enhance for Employee alerts)
- ✅ Audit logging (critical for mediation)
- ✅ Excel import (enhance for bulk Offer uploads)
- ✅ File uploads (for invoices, receipts)

---

## 🎯 Implementation Priority

1. **Critical (Week 1-2)**
   - Employee & Trader entities
   - Offer entity with Excel upload
   - Deal entity with lifecycle
   - Basic negotiation messaging

2. **High (Week 3-4)**
   - Financial intermediary system
   - Commission calculation
   - Invoice generation
   - Barcode/QR generation

3. **Medium (Week 5-6)**
   - Employee dashboard
   - Deal monitoring
   - Audit logging
   - Backup system

4. **Low (Week 7+)**
   - Advanced analytics
   - Reporting
   - Export features
   - Performance optimization

---

## 📝 Next Steps

1. Review and approve this analysis
2. Create new Prisma schema
3. Implement core controllers
4. Create migration scripts
5. Test mediation workflow
6. Deploy incrementally

---

**Document Version:** 1.0  
**Date:** 2024  
**Author:** Backend Architecture Team




