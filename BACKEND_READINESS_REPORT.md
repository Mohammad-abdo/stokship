# تقرير جاهزية Backend للتعامل مع Frontend

## 📋 نظرة عامة
هذا التقرير يفحص Backend APIs المتاحة ويقارنها مع ما يحتاجه Frontend.

---

## ✅ ما هو موجود في Backend

### 1. Authentication APIs ✅
- ✅ `POST /api/auth/register` - التسجيل (يدعم CLIENT فقط حالياً)
- ✅ `POST /api/auth/login` - تسجيل الدخول (يدعم ADMIN, EMPLOYEE, TRADER, CLIENT)
- ✅ `POST /api/auth/guest` - تسجيل دخول كزائر
- ✅ `POST /api/auth/forgot-password` - نسيان كلمة المرور
- ✅ `POST /api/auth/reset-password` - إعادة تعيين كلمة المرور
- ✅ `GET /api/auth/me` - معلومات المستخدم الحالي
- ✅ `PUT /api/auth/profile` - تحديث الملف الشخصي
- ✅ `POST /api/auth/logout` - تسجيل الخروج
- ✅ `POST /api/auth/refresh-token` - تحديث Token
- ✅ `POST /api/auth/verify-email` - التحقق من البريد
- ✅ `POST /api/auth/resend-verification` - إعادة إرسال التحقق

**ملاحظة:** `register` يدعم `userType` لكن يقبل فقط `CLIENT` حالياً. البائعين يحتاجون endpoint منفصل.

---

### 2. Product APIs ✅
- ✅ `GET /api/products` - جلب جميع المنتجات (مع filters: categoryId, vendorId, minPrice, maxPrice, search, etc.)
- ✅ `GET /api/products/:id` - تفاصيل منتج
- ✅ `GET /api/products/:id/related` - منتجات ذات صلة
- ✅ `GET /api/products/seller/:sellerId` - منتجات بائع معين
- ✅ `POST /api/products` - إنشاء منتج (VENDOR/ADMIN فقط)
- ✅ `PUT /api/products/:id` - تحديث منتج
- ✅ `DELETE /api/products/:id` - حذف منتج
- ✅ `POST /api/products/:id/images` - رفع صور منتج
- ✅ `GET /api/products/:id/reviews` - تقييمات المنتج
- ✅ `POST /api/products/:id/reviews` - إضافة تقييم

---

### 3. Category APIs ✅
- ✅ `GET /api/categories` - جلب جميع الفئات
- ✅ `GET /api/categories/:id` - تفاصيل فئة
- ✅ `GET /api/categories/:id/subcategories` - الفئات الفرعية
- ✅ `GET /api/categories/:id/products` - منتجات الفئة
- ✅ `GET /api/categories?featured=true` - الفئات المميزة (يمكن إضافتها)

---

### 4. Search APIs ✅
- ✅ `GET /api/search/products` - البحث في المنتجات (مع filters متقدمة)
- ✅ `GET /api/search/autocomplete` - الإكمال التلقائي
- ✅ `GET /api/search/categories` - البحث في الفئات
- ✅ `GET /api/search/vendors` - البحث في البائعين

---

### 5. Order APIs ✅
- ✅ `GET /api/orders/my-orders` - طلبات المستخدم (مع filter: status)
- ✅ `GET /api/orders/:id` - تفاصيل طلب
- ✅ `POST /api/orders` - إنشاء طلب
- ✅ `POST /api/orders/:id/cancel` - إلغاء طلب
- ✅ `GET /api/orders/:id/tracking` - تتبع الطلب
- ✅ `PUT /api/orders/:id/status` - تحديث حالة الطلب (VENDOR/ADMIN)

---

### 6. Cart APIs ✅
- ✅ `GET /api/cart` - جلب سلة التسوق
- ✅ `GET /api/cart/summary` - ملخص السلة
- ✅ `POST /api/cart/items` - إضافة منتج للسلة
- ✅ `PUT /api/cart/items/:id` - تحديث عنصر في السلة
- ✅ `DELETE /api/cart/items/:id` - حذف عنصر من السلة
- ✅ `POST /api/cart/clear` - مسح السلة
- ✅ `POST /api/cart/apply-discount` - تطبيق كود خصم
- ✅ `DELETE /api/cart/discount` - إزالة كود خصم

---

### 7. Payment APIs ✅
- ✅ `POST /api/payments/process-card` - معالجة دفع بالبطاقة
- ✅ `POST /api/payments/process-transfer` - معالجة تحويل بنكي
- ✅ `POST /api/payments/upload-receipt` - رفع صورة الإيصال
- ✅ `GET /api/payments/:id` - تفاصيل دفعة
- ✅ `GET /api/payments/bank-details` - تفاصيل البنك (Public)

---

### 8. Notification APIs ✅
- ✅ `GET /api/notifications` - جلب الإشعارات
- ✅ `GET /api/notifications/unread-count` - عدد الإشعارات غير المقروءة
- ✅ `PUT /api/notifications/:id/read` - تحديد كمقروء
- ✅ `PUT /api/notifications/read-all` - تحديد الكل كمقروء

---

### 9. Vendor/Seller APIs ⚠️ (جزئياً)
- ✅ `GET /api/vendors/profile` - ملف البائع (VENDOR فقط)
- ✅ `PUT /api/vendors/profile` - تحديث ملف البائع
- ✅ `GET /api/vendors/dashboard/stats` - إحصائيات البائع
- ✅ `POST /api/offers/vendor` - إنشاء عرض/إعلان (VENDOR)
- ✅ `GET /api/offers/vendor` - عروض البائع
- ✅ `PUT /api/offers/vendor/:id` - تحديث عرض
- ✅ `DELETE /api/offers/vendor/:id` - حذف عرض
- ✅ `GET /api/offers/:id` - تفاصيل عرض (Public)
- ✅ `GET /api/offers` - العروض النشطة (Public)

**⚠️ مفقود:**
- ❌ `POST /api/vendors/register` - تسجيل بائع جديد (يحتاج إنشاء)
- ❌ `POST /api/vendors/bank-info` - حفظ معلومات البنك (يحتاج إنشاء)
- ❌ `GET /api/vendors/:id` - معلومات بائع (Public) (يحتاج إنشاء)
- ❌ `GET /api/vendors/:id/products` - منتجات بائع (Public) (يحتاج إنشاء)

---

### 10. Company APIs ✅
- ✅ `GET /api/companies/:id` - معلومات شركة
- ✅ `GET /api/companies/:id/products` - منتجات الشركة

---

### 11. Coupon APIs ✅
- ✅ `POST /api/coupons/validate` - التحقق من كود خصم (يحتاج فحص)

---

### 12. Upload APIs ✅
- ✅ `POST /api/upload/images` - رفع صور
- ✅ `POST /api/upload/excel` - رفع ملف Excel

---

### 13. Content APIs ✅
- ✅ `GET /api/content/terms` - الشروط والأحكام (يحتاج فحص)
- ✅ `GET /api/content/policies` - السياسات (يحتاج فحص)

---

## ❌ ما هو مفقود في Backend

### 1. Vendor Registration ❌
**المشكلة:** لا يوجد endpoint لتسجيل بائع جديد من Frontend.

**الحل المطلوب:**
```javascript
// POST /api/vendors/register
// يجب أن:
// 1. ينشئ حساب CLIENT أولاً (أو يربطه بحساب موجود)
// 2. ينشئ حساب VENDOR مع معلومات البنك والشركة
// 3. يربط CLIENT و VENDOR إذا كان نفس البريد
```

**الوضع الحالي:**
- `POST /api/auth/register` يقبل فقط `CLIENT`
- `POST /api/admin/vendors` فقط للـ Admin
- لا يوجد endpoint عام لتسجيل بائع

---

### 2. Vendor Bank Info ❌
**المشكلة:** لا يوجد endpoint محدد لحفظ معلومات البنك.

**الحل المطلوب:**
```javascript
// POST /api/vendors/bank-info
// أو
// PUT /api/vendors/profile (مع bankInfo في body)
```

**الوضع الحالي:**
- `PUT /api/vendors/profile` موجود لكن لا يتضمن معلومات البنك
- قد تحتاج إلى إضافة `bankAccounts` في update

---

### 3. Public Vendor Info ❌
**المشكلة:** لا يمكن للمشترين رؤية معلومات البائع.

**الحل المطلوب:**
```javascript
// GET /api/vendors/:id (Public)
// GET /api/vendors/:id/products (Public)
```

**الوضع الحالي:**
- `GET /api/vendors/profile` فقط للبائع نفسه
- `GET /api/vendors/:id` غير موجود

---

### 4. Recommended Products ❌
**المشكلة:** لا يوجد endpoint للمنتجات الموصى بها.

**الحل المطلوب:**
```javascript
// GET /api/products/recommended
// يمكن استخدام:
// - المنتجات الأعلى تقييماً
// - المنتجات الأكثر مبيعاً
// - المنتجات المميزة
```

---

### 5. Featured Categories ❌
**المشكلة:** لا يوجد filter للفئات المميزة.

**الحل المطلوب:**
```javascript
// GET /api/categories?featured=true
// يحتاج إضافة field `isFeatured` في Category model
```

---

### 6. Coupon Validation ❌
**المشكلة:** لا يوجد endpoint واضح للتحقق من كود الخصم.

**الحل المطلوب:**
```javascript
// POST /api/coupons/validate
// Body: { code: "DISCOUNT10" }
// Response: { valid: true, discount: 10, type: "PERCENTAGE" }
```

---

### 7. Content Pages ❌
**المشكلة:** لا يوجد endpoints واضحة للشروط والسياسات.

**الحل المطلوب:**
```javascript
// GET /api/content/terms
// GET /api/content/policies
// أو استخدام ContentPage routes الموجودة
```

---

## ⚠️ مشاكل التوافق

### 1. User Types Mismatch
**المشكلة:**
- Frontend يتوقع: `BUYER`, `SELLER`, `VENDOR`
- Backend يستخدم: `CLIENT`, `TRADER`, `VENDOR`, `EMPLOYEE`, `ADMIN`

**الحل:**
- استخدام `CLIENT` بدلاً من `BUYER`
- استخدام `VENDOR` للبائعين
- أو إضافة mapping في Frontend

---

### 2. Order Status Mismatch
**المشكلة:**
- Frontend يستخدم: `waiting`, `shipping`, `done`
- Backend يستخدم: `PENDING`, `ACCEPTED`, `IN_PREPARATION`, `IN_SHIPPING`, `COMPLETED`, `CANCELLED`

**الحل:**
- إضافة mapping في Frontend
- أو استخدام Backend statuses مباشرة

---

### 3. Authentication Response Format
**المشكلة:**
- Backend يرسل: `{ success: true, data: { user, token, refreshToken } }`
- Frontend قد يتوقع: `{ user, token }` مباشرة

**الحل:**
- التأكد من معالجة response format في Frontend
- أو توحيد format في Backend

---

## 📊 ملخص الجاهزية

### ✅ جاهز تماماً (90%+)
- Authentication (ما عدا Vendor Registration)
- Products
- Categories
- Search
- Orders
- Payments
- Notifications

### ⚠️ جاهز جزئياً (50-70%)
- Vendor/Seller APIs (يحتاج Registration و Public endpoints)
- Content Pages (يحتاج فحص routes)
- Coupons (يحتاج فحص validation)

### ❌ غير جاهز (0-30%)
- Vendor Registration من Frontend
- Recommended Products
- Featured Categories
- Public Vendor Info

---

## 🔧 الإجراءات المطلوبة

### الأولوية العالية (للبدء الفوري)
1. **إنشاء Vendor Registration Endpoint**
   ```javascript
   POST /api/vendors/register
   // يجب أن ينشئ CLIENT و VENDOR معاً
   ```

2. **إضافة Public Vendor Endpoints**
   ```javascript
   GET /api/vendors/:id (Public)
   GET /api/vendors/:id/products (Public)
   ```

3. **إضافة Recommended Products**
   ```javascript
   GET /api/products/recommended
   ```

### الأولوية المتوسطة
4. **إضافة Featured Categories**
   - إضافة `isFeatured` field في Category model
   - إضافة filter في `GET /api/categories`

5. **فحص وربط Coupon Validation**
   - التأكد من وجود `POST /api/coupons/validate`
   - أو إنشاؤه إذا كان مفقوداً

6. **فحص Content Pages Routes**
   - التأكد من `GET /api/content/terms`
   - التأكد من `GET /api/content/policies`

### الأولوية المنخفضة
7. **توحيد Response Formats**
8. **إضافة Error Handling موحد**
9. **إضافة Rate Limiting**

---

## ✅ الخلاصة

**الـ Backend جاهز بنسبة ~75% للتعامل مع Frontend.**

### ما يعمل الآن:
- ✅ جميع APIs الأساسية موجودة (Products, Orders, Cart, Payments)
- ✅ Authentication يعمل (ما عدا Vendor Registration)
- ✅ Search و Categories جاهزة

### ما يحتاج إصلاح:
- ❌ Vendor Registration من Frontend
- ❌ Public Vendor Info
- ❌ Recommended Products
- ⚠️ بعض endpoints تحتاج فحص (Coupons, Content)

### التوصية:
**يمكن البدء بربط Frontend مع Backend مع إضافة الـ endpoints المفقودة تدريجياً.**

---

**هل تريد البدء بإنشاء الـ endpoints المفقودة؟**

