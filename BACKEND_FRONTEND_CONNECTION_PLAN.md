# خطة ربط Backend مع Frontend - Stockship Platform

## 📋 نظرة عامة
هذه الخطة الشاملة لربط Backend (Node.js/Express) مع Frontend (React/Vite) لمنصة Stockship.

---

## 🎯 الأهداف
1. ✅ ربط جميع API endpoints بين Backend و Frontend
2. ✅ إعداد متغيرات البيئة (Environment Variables)
3. ✅ اختبار الاتصال والتحقق من عمل جميع الـ APIs
4. ✅ معالجة الأخطاء والاستثناءات
5. ✅ إضافة Authentication & Authorization
6. ✅ ربط صفحات Dashboard مع Backend APIs

---

## 📊 تحليل الوضع الحالي

### Backend Structure
```
backend/
├── src/
│   ├── server.js (Port: 5000)
│   ├── routes/ (40+ route files)
│   ├── controllers/ (44+ controller files)
│   ├── middleware/ (auth, errorHandler)
│   └── services/
└── prisma/ (Database schema)
```

### Frontend Structure
```
dashbaord/
├── src/
│   ├── lib/
│   │   └── stockshipApi.js (API client)
│   ├── pages/ (88+ page files)
│   └── contexts/ (Auth, Language)
└── vite.config.js
```

### Current API Base URL
- Frontend: `http://localhost:5000/api` (default)
- Backend: `http://localhost:5000/api`

---

## 🔧 المرحلة 1: إعداد البيئة (Environment Setup)

### 1.1 Backend Environment Variables
إنشاء ملف `.env` في `backend/`:
```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000/api

# Database
DATABASE_URL="mysql://user:password@localhost:3306/stockship_db"

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

### 1.2 Frontend Environment Variables
إنشاء ملف `.env` في `dashbaord/`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Stockship Dashboard
VITE_APP_VERSION=1.0.0
```

### 1.3 CORS Configuration
التحقق من إعدادات CORS في `backend/src/server.js`:
- ✅ السماح بـ `http://localhost:5173` (Vite dev server)
- ✅ السماح بـ `http://localhost:3000` (إذا كان هناك frontend آخر)

---

## 🔐 المرحلة 2: Authentication & Authorization

### 2.1 Multi-Auth System
التحقق من:
- ✅ `MultiAuthContext` في Frontend
- ✅ Token storage (admin_token, employee_token, trader_token, client_token)
- ✅ Token refresh mechanism
- ✅ Logout handling

### 2.2 API Interceptors
التحقق من:
- ✅ Request interceptor (إضافة Token)
- ✅ Response interceptor (معالجة 401, 403, 429)
- ✅ Error handling

### 2.3 Backend Auth Middleware
التحقق من:
- ✅ `protect` middleware
- ✅ `isAdmin`, `isEmployee`, `isTrader`, `isClient` middleware
- ✅ Role-based authorization

---

## 📡 المرحلة 3: ربط APIs حسب الأولوية

### 3.1 Priority 1: Core Authentication APIs ✅
**Status**: يجب التحقق من العمل
- [ ] `POST /api/auth/login` - تسجيل الدخول
- [ ] `POST /api/auth/register` - التسجيل
- [ ] `GET /api/auth/me` - معلومات المستخدم الحالي
- [ ] `POST /api/auth/logout` - تسجيل الخروج
- [ ] `POST /api/auth/refresh-token` - تحديث Token

**Frontend Files**:
- `dashbaord/src/lib/stockshipApi.js` → `authApi`
- `dashbaord/src/contexts/MultiAuthContext.jsx`

**Backend Files**:
- `backend/src/routes/auth.routes.js`
- `backend/src/controllers/auth.controller.js`

---

### 3.2 Priority 2: Admin Dashboard APIs 🔄
**Status**: يحتاج ربط
- [ ] `GET /api/admin/dashboard/stats` - إحصائيات Dashboard
- [ ] `GET /api/admin/users` - قائمة المستخدمين
- [ ] `GET /api/admin/vendors` - قائمة البائعين
- [ ] `GET /api/admin/products` - قائمة المنتجات
- [ ] `GET /api/admin/categories` - قائمة الفئات
- [ ] `GET /api/admin/orders` - قائمة الطلبات
- [ ] `GET /api/admin/payments` - قائمة المدفوعات
- [ ] `GET /api/admin/wallets` - قائمة المحافظ
- [ ] `GET /api/admin/support/tickets` - تذاكر الدعم
- [ ] `GET /api/admin/coupons` - القسائم
- [ ] `GET /api/admin/activity-logs` - سجل الأنشطة

**Frontend Files**:
- `dashbaord/src/pages/stockship/admin/AdminDashboard.jsx`
- `dashbaord/src/pages/stockship/admin/AdminUsers.jsx`
- `dashbaord/src/pages/stockship/admin/AdminVendors.jsx`
- `dashbaord/src/pages/stockship/admin/AdminProducts.jsx`
- `dashbaord/src/pages/stockship/admin/AdminCategories.jsx`
- `dashbaord/src/pages/stockship/admin/AdminOrders.jsx`
- `dashbaord/src/pages/stockship/admin/AdminPayments.jsx`
- `dashbaord/src/pages/stockship/admin/AdminWallets.jsx`
- `dashbaord/src/pages/stockship/admin/AdminSupportTickets.jsx`
- `dashbaord/src/pages/stockship/admin/AdminCoupons.jsx`
- `dashbaord/src/pages/stockship/admin/AdminActivityLogs.jsx`

**Backend Files**:
- `backend/src/routes/admin.routes.js`
- `backend/src/controllers/admin.controller.js`

---

### 3.3 Priority 3: Mediation Platform APIs 🔄
**Status**: يحتاج ربط
- [ ] `GET /api/admin/employees` - قائمة الموظفين
- [ ] `GET /api/admin/traders` - قائمة التجار
- [ ] `GET /api/admin/offers` - قائمة العروض
- [ ] `GET /api/deals` - قائمة الصفقات
- [ ] `POST /api/offers/:id/validate` - التحقق من العرض
- [ ] `PUT /api/deals/:id/approve` - الموافقة على الصفقة
- [ ] `PUT /api/deals/:id/settle` - تسوية الصفقة

**Frontend Files**:
- `dashbaord/src/pages/stockship/admin/AdminEmployees.jsx`
- `dashbaord/src/pages/stockship/admin/AdminTraders.jsx`
- `dashbaord/src/pages/stockship/admin/AdminOffers.jsx`
- `dashbaord/src/pages/stockship/admin/AdminDeals.jsx`
- `dashbaord/src/pages/stockship/employee/EmployeeOffers.jsx`
- `dashbaord/src/pages/stockship/employee/EmployeeViewOffer.jsx`

**Backend Files**:
- `backend/src/routes/mediation.routes.js`
- `backend/src/controllers/mediation/*.controller.js`

---

### 3.4 Priority 4: CRUD Operations APIs 🔄
**Status**: يحتاج ربط
- [ ] `POST /api/admin/users` - إنشاء مستخدم
- [ ] `PUT /api/admin/users/:id` - تحديث مستخدم
- [ ] `DELETE /api/admin/users/:id` - حذف مستخدم
- [ ] `POST /api/products` - إنشاء منتج
- [ ] `PUT /api/products/:id` - تحديث منتج
- [ ] `DELETE /api/products/:id` - حذف منتج
- [ ] `POST /api/categories` - إنشاء فئة
- [ ] `PUT /api/categories/:id` - تحديث فئة
- [ ] `DELETE /api/categories/:id` - حذف فئة

**Frontend Files**:
- جميع صفحات Create/Edit في Admin

---

### 3.5 Priority 5: File Upload APIs 🔄
**Status**: يحتاج ربط
- [ ] `POST /api/upload/image` - رفع صورة
- [ ] `POST /api/upload/images` - رفع صور متعددة
- [ ] `POST /api/products/:id/images` - رفع صور منتج
- [ ] `DELETE /api/products/:id/images/:imageId` - حذف صورة

**Frontend Files**:
- `dashbaord/src/pages/stockship/admin/CreateProduct.jsx`
- `dashbaord/src/pages/stockship/admin/EditProduct.jsx`

**Backend Files**:
- `backend/src/routes/upload.routes.js`
- `backend/src/services/upload.service.js`

---

### 3.6 Priority 6: Settings & Configuration APIs 🔄
**Status**: يحتاج ربط
- [ ] `GET /api/admin/settings` - جلب الإعدادات
- [ ] `PUT /api/admin/settings` - تحديث الإعدادات
- [ ] `POST /api/admin/settings/password` - تغيير كلمة المرور

**Frontend Files**:
- `dashbaord/src/pages/stockship/admin/AdminSettings.jsx`

**Backend Files**:
- `backend/src/routes/admin.routes.js` (يحتاج إضافة)
- `backend/src/controllers/admin.controller.js` (يحتاج إضافة)

---

## 🧪 المرحلة 4: الاختبار والتحقق

### 4.1 API Testing Checklist
- [ ] اختبار جميع Authentication APIs
- [ ] اختبار جميع Admin Dashboard APIs
- [ ] اختبار جميع CRUD Operations
- [ ] اختبار File Upload
- [ ] اختبار Error Handling
- [ ] اختبار Pagination
- [ ] اختبار Filtering & Search
- [ ] اختبار Authorization (403, 401)

### 4.2 Frontend Testing Checklist
- [ ] اختبار Login/Logout
- [ ] اختبار Dashboard Loading
- [ ] اختبار Data Tables
- [ ] اختبار Forms (Create/Edit)
- [ ] اختبار File Upload UI
- [ ] اختبار Error Messages
- [ ] اختبار Loading States
- [ ] اختبار RTL Support

---

## 🐛 المرحلة 5: معالجة الأخطاء

### 5.1 Error Handling Strategy
- ✅ Network Errors (No connection)
- ✅ 401 Unauthorized (Token expired)
- ✅ 403 Forbidden (No permission)
- ✅ 404 Not Found
- ✅ 422 Validation Errors
- ✅ 429 Rate Limiting
- ✅ 500 Server Errors

### 5.2 Error Messages
- ✅ User-friendly messages
- ✅ Translation support (i18n)
- ✅ Toast notifications
- ✅ Console logging (dev only)

---

## 📝 المرحلة 6: التوثيق

### 6.1 API Documentation
- [ ] إنشاء ملف `API_DOCUMENTATION.md`
- [ ] توثيق جميع Endpoints
- [ ] Request/Response Examples
- [ ] Error Codes

### 6.2 Frontend Documentation
- [ ] توثيق API Client Usage
- [ ] توثيق Context Usage
- [ ] توثيق Component Patterns

---

## 🚀 خطة التنفيذ

### Week 1: Setup & Core APIs
- Day 1-2: Environment Setup & CORS Configuration
- Day 3-4: Authentication APIs Testing
- Day 5: Admin Dashboard Stats API

### Week 2: Admin Dashboard APIs
- Day 1-2: Users, Vendors, Products APIs
- Day 3-4: Categories, Orders, Payments APIs
- Day 5: Support Tickets, Coupons, Activity Logs APIs

### Week 3: Mediation Platform APIs
- Day 1-2: Employees, Traders APIs
- Day 3-4: Offers, Deals APIs
- Day 5: Validation & Approval APIs

### Week 4: CRUD & File Upload
- Day 1-2: CRUD Operations Testing
- Day 3-4: File Upload Implementation
- Day 5: Settings API Implementation

### Week 5: Testing & Bug Fixes
- Day 1-3: Comprehensive Testing
- Day 4-5: Bug Fixes & Optimization

---

## ✅ Checklist النهائي

### Environment
- [ ] Backend `.env` file created
- [ ] Frontend `.env` file created
- [ ] CORS configured correctly
- [ ] Database connected

### Authentication
- [ ] Login working
- [ ] Logout working
- [ ] Token refresh working
- [ ] Multi-role auth working

### APIs
- [ ] All Admin APIs connected
- [ ] All Mediation APIs connected
- [ ] All CRUD APIs working
- [ ] File upload working

### Testing
- [ ] All pages loading data
- [ ] All forms submitting correctly
- [ ] Error handling working
- [ ] Loading states working

### Documentation
- [ ] API documentation complete
- [ ] Frontend documentation complete

---

## 📌 ملاحظات مهمة

1. **CORS**: تأكد من إعداد CORS بشكل صحيح للسماح بـ Frontend origin
2. **Authentication**: استخدم Multi-Auth system للدعم المتعدد الأدوار
3. **Error Handling**: تأكد من معالجة جميع أنواع الأخطاء
4. **Loading States**: أضف loading states لجميع API calls
5. **Validation**: تحقق من validation في Backend و Frontend
6. **Security**: تأكد من حماية جميع endpoints
7. **Performance**: استخدم pagination للقوائم الكبيرة
8. **Testing**: اختبر كل API قبل الانتقال للتالي

---

## 🎯 الخطوة التالية

ابدأ بـ **المرحلة 1: إعداد البيئة** ثم انتقل تدريجياً للمراحل التالية.

**هل تريد البدء بالمرحلة 1 الآن؟**

