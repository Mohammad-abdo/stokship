# Prisma Schema Fixes Needed

## Summary
The Prisma schema has 97 validation errors that need to be fixed before generating the Prisma client. The main issues are:

1. **Missing relation fields** - Many models have relations defined on one side but not the other
2. **Duplicate constraint names** - Multiple relations using the same foreign key constraint name
3. **Missing fields/references** - Some @relation attributes are missing required fields or references

## Critical Issues to Fix

### 1. Vendor Model - Missing relation fields
- `suspendedByAdmin` needs `fields` and `references` in @relation
- `payoutRequests` relation missing on Admin model

### 2. Admin Model - Self-referential relation
- `createdByAdmin` needs `fields` and `references`

### 3. ActivityLog, AuditTrail, ExportHistory, ImportHistory
- Multiple relations using same `userId` field causing constraint name conflicts
- Need to use different field names or map constraint names

### 4. WalletTransaction
- Missing relations on User, Vendor, Admin models
- Multiple wallet types (MainWallet, VendorWallet, UserWallet) need proper relations

### 5. SupportTicketMessage
- Both `user` and `admin` using same `userId` field causing conflict

## Quick Fix Strategy

The schema needs significant refactoring. The main approach:
1. Use unique constraint names with `map` argument
2. Add missing relation fields on both sides
3. Fix self-referential relations
4. Separate fields for different user types where needed

## Recommendation

Given the complexity (97 errors), I recommend:
1. Fix the schema incrementally, starting with the most critical models
2. Or provide a corrected schema file
3. Test after each major fix

Would you like me to:
- A) Fix all schema errors systematically (will take time)
- B) Focus on critical models first (Vendor, Admin, Product, Order)
- C) Provide a corrected schema file


