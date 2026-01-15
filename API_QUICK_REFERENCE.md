# API Quick Reference - Mediation Platform

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except public offers) require:
```
Authorization: Bearer <jwt-token>
```

---

## 🔐 Employee Endpoints

### Create Employee (Admin)
```http
POST /admin/employees
Content-Type: application/json

{
  "email": "employee@example.com",
  "password": "password123",
  "name": "Employee Name",
  "phone": "+1234567890",
  "commissionRate": 1.0
}
```

### List Employees (Admin)
```http
GET /admin/employees?page=1&limit=20&isActive=true
```

### Employee Dashboard
```http
GET /employees/:id/dashboard
```

### Get Employee's Traders
```http
GET /employees/:id/traders?page=1&limit=20
```

---

## 👤 Trader Endpoints

### Create Trader (Employee)
```http
POST /employees/:employeeId/traders
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "password123",
  "name": "Trader Name",
  "companyName": "Company Name",
  "phone": "+1234567890",
  "country": "Country",
  "city": "City"
}
```

### Get Trader Details
```http
GET /traders/:id
```

### Get Trader's Offers
```http
GET /traders/:id/offers?page=1&limit=20&status=ACTIVE
```

---

## 📦 Offer Endpoints

### List Active Offers (Public)
```http
GET /offers?page=1&limit=20&traderId=1&country=China&search=text
```

### Get Offer Details (Public)
```http
GET /offers/:id
```

### Create Offer (Trader)
```http
POST /traders/offers
Content-Type: application/json

{
  "title": "Offer Title",
  "description": "Offer description"
}
```

### Upload Excel File (Trader)
```http
POST /traders/offers/:id/upload-excel
Content-Type: multipart/form-data

file: <excel-file>
```

### Validate Offer (Employee)
```http
PUT /employees/offers/:id/validate
Content-Type: application/json

{
  "approved": true,
  "validationNotes": "All data verified"
}
```

---

## 🤝 Deal Endpoints

### Request Negotiation (Client)
```http
POST /offers/:offerId/request-negotiation
Content-Type: application/json

{
  "notes": "Interested in this offer"
}
```

### List Deals (Filtered by Role)
```http
GET /deals?page=1&limit=20&status=NEGOTIATION
```

### Get Deal Details
```http
GET /deals/:id
```

### Add Deal Items (Client/Trader)
```http
POST /deals/:id/items
Content-Type: application/json

{
  "items": [
    {
      "offerItemId": 1,
      "quantity": 100,
      "cartons": 10,
      "negotiatedPrice": 50.00,
      "notes": "Custom notes"
    }
  ]
}
```

### Approve Deal (Trader)
```http
PUT /traders/deals/:id/approve
Content-Type: application/json

{
  "negotiatedAmount": 5000.00,
  "notes": "Deal approved"
}
```

### Settle Deal (Employee/Admin)
```http
PUT /deals/:id/settle
```

---

## 💬 Negotiation Endpoints

### Send Message (Client/Trader)
```http
POST /deals/:dealId/negotiations
Content-Type: application/json

{
  "message": "Hello, I'm interested",
  "messageType": "TEXT",
  "proposedPrice": 5000.00,
  "proposedQuantity": 100
}
```

### Get Messages
```http
GET /deals/:dealId/negotiations?page=1&limit=50
```

### Mark as Read
```http
PUT /deals/:dealId/negotiations/read
```

---

## 💰 Financial Endpoints

### Process Payment (Client)
```http
POST /deals/:dealId/payments
Content-Type: application/json

{
  "amount": 5000.00,
  "method": "BANK_TRANSFER",
  "transactionId": "TXN123456",
  "receiptUrl": "/uploads/receipts/receipt.pdf"
}
```

### Verify Payment (Employee)
```http
PUT /employees/payments/:id/verify
Content-Type: application/json

{
  "verified": true,
  "notes": "Payment verified"
}
```

### Get Transactions (Admin/Employee)
```http
GET /financial/transactions?page=1&limit=20&type=COMMISSION&status=COMPLETED
```

### Get Ledger (Admin)
```http
GET /financial/ledger?page=1&limit=50&accountType=PLATFORM&startDate=2024-01-01
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "message": "Data retrieved successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## 🔑 Status Values

### Offer Status
- `DRAFT`
- `PENDING_VALIDATION`
- `ACTIVE`
- `CLOSED`
- `REJECTED`

### Deal Status
- `NEGOTIATION`
- `APPROVED`
- `PAID`
- `SETTLED`
- `CANCELLED`
- `DISPUTED`

### Payment Status
- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `REFUNDED`
- `HELD`

### Payment Method
- `BANK_TRANSFER`
- `BANK_CARD`
- `WALLET`

### Negotiation Message Type
- `TEXT`
- `PRICE_PROPOSAL`
- `QUANTITY_PROPOSAL`
- `TERMS_PROPOSAL`
- `SYSTEM_NOTIFICATION`

---

## 🚨 Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Server Error |

---

## 📝 Notes

1. All dates are in ISO 8601 format
2. All amounts are in decimal format (2 decimal places)
3. File uploads max size: 10MB
4. Pagination defaults: page=1, limit=20
5. All timestamps are in UTC

---

**Last Updated:** 2024




