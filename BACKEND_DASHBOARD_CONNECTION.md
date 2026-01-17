# Backend-Dashboard Connection Guide

## Current Status

✅ **Dashboard**: Fully set up and ready
- Admin dashboard with all pages
- Vendor dashboard with all pages  
- API service configured
- Authentication integrated
- Routing complete

⚠️ **Backend**: Prisma schema needs fixes before client generation

## Once Schema is Fixed

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations**:
   ```bash
   npx prisma migrate dev
   ```

3. **Seed Database** (optional):
   ```bash
   npm run prisma:seed
   ```

4. **Start Backend Server**:
   ```bash
   npm run dev
   ```

5. **Start Dashboard**:
   ```bash
   cd dashbaord
   npm run dev
   ```

## API Configuration

The dashboard is configured to connect to:
- **Default**: `http://localhost:3000/api`
- **Configurable**: Set `VITE_API_URL` in `dashbaord/.env`

## Authentication Flow

1. User logs in via dashboard
2. Backend returns JWT token
3. Token stored in localStorage
4. All API requests include token in Authorization header
5. Backend validates token and returns data

## Testing Connection

Once backend is running, test the connection:
1. Open dashboard: `http://localhost:5173`
2. Navigate to login page
3. Use admin credentials from seed data
4. Should redirect to admin dashboard

## Dashboard Routes

- Admin: `/admin/dashboard`, `/admin/users`, `/admin/vendors`, etc.
- Vendor: `/vendor/dashboard`, `/vendor/products`, `/vendor/orders`, etc.

All routes are protected and will redirect to login if not authenticated.


