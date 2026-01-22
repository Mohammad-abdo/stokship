# Preferred Categories Implementation Summary

## Overview
This implementation adds preferred categories functionality to the Stockship platform, allowing clients to select their preferred categories during registration. These preferences are used for prioritization only (not restriction), ensuring users can still browse all categories while seeing their preferred ones first.

## Changes Made

### 1. Database Schema (Prisma)
- **File**: `backend/prisma/schema.prisma`
- **Change**: Added `preferredCategories` field to `Client` model
  - Type: `String?` (JSON array stored as Text)
  - Stores array of category IDs as JSON string
  - Nullable to support existing users

### 2. Backend - Registration Endpoint
- **File**: `backend/src/controllers/auth.controller.js`
- **Changes**:
  - Updated `register` function to accept `preferredCategories` in request body
  - Added validation to ensure categories exist and are active
  - Saves validated categories as JSON string
  - Returns `preferredCategories` in response

### 3. Backend - Preferences Update Endpoint
- **File**: `backend/src/controllers/auth.controller.js`
- **New Function**: `updatePreferences`
- **Route**: `PUT /api/auth/preferences`
- **Access**: Private (Client only)
- **Features**:
  - Allows clients to update their preferred categories
  - Validates categories before saving
  - Supports clearing preferences (null or empty array)
  - Returns parsed categories in response

### 4. Backend - Route Registration
- **File**: `backend/src/routes/auth.routes.js`
- **Change**: Added route for preferences endpoint
  - `PUT /api/auth/preferences` → `updatePreferences` controller

### 5. Backend - Category Endpoints Prioritization
- **File**: `backend/src/controllers/category.controller.js`
- **Updated Functions**:
  - `getCategories`: Prioritizes preferred categories for authenticated clients
  - `getCategoryTree`: Recursively prioritizes preferred categories in tree structure
- **Features**:
  - Checks if user is authenticated and has preferences
  - Sorts categories: preferred first, then others
  - Adds `isPreferred` flag to each category in response
  - Maintains original order within preferred/non-preferred groups

### 6. Backend - Offers Endpoints Prioritization
- **File**: `backend/src/controllers/mediation/offer.controller.js`
- **Updated Function**: `getActiveOffers`
- **Features**:
  - Fetches user's preferred categories if authenticated
  - Sorts offers: preferred category offers first, then others
  - Adds `isPreferred` flag to each offer
  - Applies pagination after sorting to ensure preferred offers appear on first pages

### 7. Backend - Get Me Endpoint
- **File**: `backend/src/controllers/auth.controller.js`
- **Updated Function**: `getMe`
- **Change**: Includes `preferredCategories` in response (parsed as array)

### 8. Frontend - Registration Form
- **File**: `frontend/src/components/SignUpCard.jsx`
- **Changes**:
  - Added category selection dropdown with multi-select
  - Fetches categories on component mount
  - Validates that at least one category is selected
  - Sends `preferredCategories` array in registration request
  - Shows selected categories as chips with remove option
  - Added click-outside handler to close dropdown

## API Endpoints

### Registration (Updated)
```
POST /api/auth/register
Body: {
  ...existing fields,
  preferredCategories: ["category-id-1", "category-id-2"]
}
```

### Update Preferences (New)
```
PUT /api/auth/preferences
Headers: { Authorization: Bearer <token> }
Body: {
  preferredCategories: ["category-id-1", "category-id-2"] // or null to clear
}
```

### Get Categories (Updated)
```
GET /api/categories
Response: [
  {
    ...category fields,
    isPreferred: true/false // Added for authenticated clients
  }
]
```

### Get Offers (Updated)
```
GET /api/offers
Response: {
  data: [
    {
      ...offer fields,
      isPreferred: true/false // Added for authenticated clients
    }
  ]
}
```

## Database Migration Required

**Important**: You need to run a Prisma migration to add the `preferredCategories` field to the database.

```bash
cd backend
npx prisma migrate dev --name add_preferred_categories_to_client
```

Or if you prefer to generate the migration without applying:

```bash
npx prisma migrate dev --create-only --name add_preferred_categories_to_client
```

## Testing Checklist

- [ ] Run database migration
- [ ] Test registration with preferred categories
- [ ] Test registration without preferred categories (should fail validation)
- [ ] Test updating preferences via PUT /api/auth/preferences
- [ ] Test clearing preferences (send null or empty array)
- [ ] Test category endpoints return preferred categories first
- [ ] Test offers endpoints return preferred category offers first
- [ ] Test that non-preferred categories/offers are still accessible
- [ ] Test frontend registration form category selection
- [ ] Test that unauthenticated users see normal ordering

## Key Design Decisions

1. **Prioritization Only**: Preferred categories affect sorting/ordering only, not access control. Users can still browse all categories and offers.

2. **JSON Storage**: Categories are stored as JSON string in database for simplicity. Could be normalized to a junction table if needed in future.

3. **Backward Compatibility**: Field is nullable, so existing users without preferences continue to work normally.

4. **Validation**: Categories are validated to ensure they exist and are active before saving.

5. **Client-Only Feature**: Only clients can have preferred categories. Traders, employees, and admins don't need this feature.

6. **Visual Indicators**: Backend adds `isPreferred` flag to responses, allowing frontend to highlight preferred items if desired.

## Future Enhancements

1. Add visual highlighting/badges for preferred categories in frontend
2. Add "Recommended for You" section based on preferences
3. Add analytics to track which preferred categories lead to most deals
4. Consider normalizing to junction table if performance becomes an issue
5. Add category suggestions based on user browsing history


