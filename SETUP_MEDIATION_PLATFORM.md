# Setup Guide: Mediation Platform

## Quick Start

### 1. Prerequisites

- Node.js >= 18.0.0
- MySQL database
- npm or yarn

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Fresh Installation

```bash
# Copy the new schema
cp prisma/schema-mediation.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init_mediation_platform

# Seed database (optional)
npm run prisma:seed
```

#### Option B: Migration from E-commerce

```bash
# 1. Backup current database
mysqldump -u user -p database > backup.sql

# 2. Copy new schema
cp prisma/schema-mediation.prisma prisma/schema.prisma

# 3. Generate Prisma client
npx prisma generate

# 4. Run migration script
node scripts/migrate-to-mediation.js

# 5. Verify data
npx prisma studio
```

### 4. Environment Variables

Create/update `.env` file:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/stockship"

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Redis (optional)
CACHE_TYPE=memory
REDIS_URL=redis://localhost:6379

# WebSocket (optional)
WEBSOCKET_ENABLED=true
```

### 5. Create Upload Directories

```bash
mkdir -p uploads/offers
mkdir -p uploads/invoices
mkdir -p uploads/receipts
```

### 6. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### 7. Verify Installation

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {
#   "status": "OK",
#   "timestamp": "...",
#   "uptime": ...,
#   "environment": "development"
# }
```

---

## API Endpoints

### Authentication

All mediation endpoints require authentication. Include JWT token in header:

```
Authorization: Bearer <token>
```

### Key Endpoints

#### Employee Management
- `POST /api/admin/employees` - Create employee
- `GET /api/admin/employees` - List employees
- `GET /api/employees/:id/dashboard` - Employee dashboard

#### Trader Management
- `POST /api/employees/:employeeId/traders` - Create trader
- `GET /api/traders/:id` - Get trader details
- `GET /api/traders/:id/offers` - Get trader's offers

#### Offer Management
- `GET /api/offers` - List active offers (public)
- `POST /api/traders/offers` - Create offer
- `POST /api/traders/offers/:id/upload-excel` - Upload Excel file
- `PUT /api/employees/offers/:id/validate` - Validate offer

#### Deal Management
- `POST /api/offers/:offerId/request-negotiation` - Request negotiation
- `GET /api/deals` - List deals (filtered by role)
- `GET /api/deals/:id` - Get deal details
- `PUT /api/traders/deals/:id/approve` - Approve deal
- `PUT /api/deals/:id/settle` - Settle deal

#### Negotiation
- `POST /api/deals/:dealId/negotiations` - Send message
- `GET /api/deals/:dealId/negotiations` - Get messages

#### Financial
- `POST /api/deals/:dealId/payments` - Process payment
- `PUT /api/employees/payments/:id/verify` - Verify payment
- `GET /api/financial/transactions` - Get transactions
- `GET /api/financial/ledger` - Get ledger

---

## Testing the API

### 1. Create Admin (if not exists)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 2. Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

Save the token from response.

### 3. Create Employee

```bash
curl -X POST http://localhost:5000/api/admin/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "employee@test.com",
    "password": "password123",
    "name": "Employee User",
    "commissionRate": 1.0
  }'
```

### 4. Login as Employee

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@test.com",
    "password": "password123",
    "userType": "EMPLOYEE"
  }'
```

### 5. Create Trader (as Employee)

```bash
curl -X POST http://localhost:5000/api/employees/1/traders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <employee-token>" \
  -d '{
    "email": "trader@test.com",
    "password": "password123",
    "name": "Trader User",
    "companyName": "Trader Company"
  }'
```

---

## Excel Upload Format

Create an Excel file with the following columns:

| Column | Description | Required |
|--------|-------------|----------|
| Product Name | Product description | Yes |
| Description | Additional details | No |
| Quantity | Available quantity | Yes |
| Cartons | Number of cartons | Yes |
| Length (cm) | Product length | No |
| Width (cm) | Product width | No |
| Height (cm) | Product height | No |
| Weight (kg) | Product weight | No |
| Country | Origin country | No |
| City | Origin city | No |

### Example Excel File

```
Product Name    | Description      | Quantity | Cartons | Length | Width | Height | Weight | Country | City
Cotton T-Shirt | 100% cotton      | 1000     | 50      | 30     | 25    | 5      | 0.2    | China   | Shanghai
Jeans          | Denim blue       | 500      | 25      | 40     | 30    | 8      | 0.5    | China   | Shanghai
```

---

## Troubleshooting

### Issue: Prisma Client not generated

```bash
npx prisma generate
```

### Issue: Migration fails

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_migration
```

### Issue: Excel upload fails

- Check file format (.xlsx, .xls, or .csv)
- Verify column headers match exactly
- Check file size (max 10MB)
- Ensure uploads/offers directory exists

### Issue: Authentication fails

- Verify JWT_SECRET in .env
- Check token expiration
- Ensure user is active
- Verify userType in token matches required role

### Issue: Authorization errors

- Check Employee-Trader relationship
- Verify Employee-Deal relationship
- Ensure user has correct role
- Check middleware order in routes

---

## Development Tips

### 1. Use Prisma Studio

```bash
npx prisma studio
```

Opens a visual database browser at http://localhost:5555

### 2. Check Logs

```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

### 3. Test Endpoints

Use Postman or create a test script:

```javascript
// test-api.js
const axios = require('axios');

async function testAPI() {
  const response = await axios.get('http://localhost:5000/api/offers');
  console.log(response.data);
}

testAPI();
```

---

## Production Deployment

### 1. Environment Setup

```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@prod-db:3306/stockship
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://yourdomain.com
```

### 2. Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### 3. Start Server

```bash
# Using PM2
pm2 start src/server.js --name stockship-api

# Or using systemd
sudo systemctl start stockship-api
```

### 4. Monitor

- Set up error tracking (Sentry, etc.)
- Monitor database performance
- Set up backup schedule
- Monitor API response times

---

## Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Check Prisma Studio for data issues
4. Review API endpoint responses

---

**Last Updated:** 2024




