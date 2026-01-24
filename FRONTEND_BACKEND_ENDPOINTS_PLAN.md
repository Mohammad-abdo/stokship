# خطة ربط Frontend مع Backend - Endpoints المطلوبة

## 📋 ملخص
هذا التقرير يحدد جميع الصفحات والمكونات في Frontend التي تحتاج endpoints من Backend، وما هو موجود وما هو مفقود.

---

## ✅ الصفحات والمكونات المربوطة بالفعل

### 1. **Authentication & Profile**
- ✅ `LoginCard.jsx` → `POST /api/auth/login`
- ✅ `SignUpCard.jsx` → `POST /api/auth/register`
- ✅ `ProfilePage.jsx` → `GET /api/auth/me`, `PUT /api/auth/me`
- ✅ `Navbar.jsx` → يستخدم `AuthContext`

### 2. **Products & Offers**
- ✅ `ProductsList.jsx` → `GET /api/offers`
- ✅ `RecommendedProducts.jsx` → `GET /api/offers/recommended`
- ✅ `ProductCard.jsx` → يعرض بيانات من Offers
- ✅ `ProductsListComponent.jsx` → `GET /api/offers` مع filters
- ✅ `ProductDetailsComponent.jsx` → `GET /api/offers/:id`
- ✅ `PublishAdPage.jsx` → `POST /api/traders/offers`, `GET /api/categories`

### 3. **Orders & Notifications**
- ✅ `Orders.jsx` → `GET /api/orders`
- ✅ `NotificationsList.jsx` → `GET /api/notifications`

---

## ⚠️ الصفحات والمكونات التي تحتاج ربط

### 1. **CompanyProfilePage.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock data)

**Endpoints المطلوبة:**
- ✅ `GET /api/companies/:id` (موجود في `company.routes.js`)
- ✅ `GET /api/companies/:id/products` (موجود)
- ✅ `GET /api/companies/:id/ads` (موجود)

**ما يحتاج عمله:**
- ربط `CompanyAdsComponent` بـ `GET /api/companies/:id/ads`
- ربط `ProductsList` بـ `GET /api/companies/:id/products`
- ربط `RecommendedProducts` بـ offers من الشركة

**ملاحظة:** يجب استخدام `traderId` من URL params بدلاً من `companyId` لأن النظام يستخدم `Trader` model.

---

### 2. **SellerProductsPage.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock products)

**Endpoints المطلوبة:**
- ✅ `GET /api/traders/:id/offers/public` (موجود في `mediation.routes.js`)
- ✅ `POST /api/offers/:offerId/request-negotiation` (موجود)

**ما يحتاج عمله:**
- جلب offers التاجر من `GET /api/traders/:sellerId/offers/public`
- عرض `OfferItems` من كل offer
- عند إرسال طلب التفاوض: `POST /api/offers/:offerId/request-negotiation`
- إرسال بيانات التفاوض (negotiationPrice, negotiationQuantity) لكل item

**ملاحظة:** يجب تحويل `OfferItems` إلى format مناسب للعرض في الصفحة.

---

### 3. **OrderCheckoutComponent.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock products و rows)

**Endpoints المطلوبة:**
- ✅ `GET /api/cart` (موجود في `cart.routes.js`)
- ✅ `POST /api/cart/items` (موجود)
- ✅ `PUT /api/cart/items/:id` (موجود)
- ✅ `DELETE /api/cart/items/:id` (موجود)
- ✅ `POST /api/coupons/validate` (موجود في `coupon.routes.js`)
- ✅ `POST /api/orders` (موجود في `order.routes.js`)

**ما يحتاج عمله:**
- جلب cart items من `GET /api/cart`
- عرض cart items في الجدول
- تحديث quantity/price من خلال `PUT /api/cart/items/:id`
- حذف items من خلال `DELETE /api/cart/items/:id`
- تطبيق coupon من خلال `POST /api/coupons/validate`
- عند إكمال الشراء: `POST /api/orders` مع بيانات من cart

**ملاحظة:** Cart في Backend قد يكون مختلف عن Deal في Mediation. يجب التحقق من كيفية ربط Cart مع Offers/Deals.

---

### 4. **CheckoutSummaryComponent.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock rows)

**Endpoints المطلوبة:**
- ✅ `POST /api/shipping/calculate` (موجود في `shipping.routes.js`)
- ✅ `GET /api/shipping/methods` (موجود)
- ✅ `POST /api/coupons/validate` (موجود)
- ✅ `POST /api/orders` (موجود)

**ما يحتاج عمله:**
- جلب shipping methods من `GET /api/shipping/methods`
- حساب shipping cost من `POST /api/shipping/calculate`
- تطبيق coupon
- حفظ shipping address (country, city)
- إكمال الطلب: `POST /api/orders`

---

### 5. **PaymentCardOne.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock summary)

**Endpoints المطلوبة:**
- ✅ `GET /api/payments/bank-details` (موجود في `payment.routes.js`)
- ✅ `POST /api/payments/process-card` (موجود)
- ✅ `POST /api/payments/process-transfer` (موجود)
- ✅ `POST /api/payments/upload-receipt` (موجود)

**ما يحتاج عمله:**
- جلب bank details من `GET /api/payments/bank-details`
- معالجة card payment: `POST /api/payments/process-card`
- معالجة bank transfer: `POST /api/payments/process-transfer`
- رفع receipt: `POST /api/payments/upload-receipt`

---

### 6. **OrderTrackingCard.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock tracking data)

**Endpoints المطلوبة:**
- ✅ `GET /api/orders/my-orders/:id/tracking` (موجود في `order.routes.js`)

**ما يحتاج عمله:**
- جلب tracking data من `GET /api/orders/my-orders/:orderId/tracking`
- عرض tracking steps من response

---

### 7. **SignupBankInfoForm.jsx**
**الوضع الحالي:** ينتقل إلى `ROUTES.SELLER` بعد submit

**Endpoints المطلوبة:**
- ❌ `POST /api/traders/register` (غير موجود - يحتاج إنشاء)
- أو استخدام `POST /api/auth/register` مع `userType: 'TRADER'` (يحتاج تعديل)

**ما يحتاج عمله:**
- إنشاء endpoint جديد `POST /api/traders/register` أو تعديل `POST /api/auth/register` لقبول `TRADER`
- إرسال بيانات البنك والشركة عند التسجيل
- حفظ بيانات Trader في قاعدة البيانات

**ملاحظة:** حالياً `POST /api/auth/register` يرفض `TRADER` ويرجع خطأ. يجب تعديله أو إنشاء endpoint منفصل.

---

### 8. **CompanyAdsComponent.jsx**
**الوضع الحالي:** يعرض بيانات ثابتة (mock offers)

**Endpoints المطلوبة:**
- ✅ `GET /api/companies/:id/ads` (موجود في `company.routes.js`)
- أو `GET /api/traders/:id/offers/public` (موجود)

**ما يحتاج عمله:**
- جلب offers/ads من `GET /api/traders/:traderId/offers/public`
- عرض offers مع filters (all, featured, available, latest)
- تطبيق filters على البيانات

---

### 9. **FeaturedCategories.jsx**
**الوضع الحالي:** يعرض محتوى ثابت (static content)

**Endpoints المطلوبة:**
- ✅ `GET /api/categories?featured=true` (موجود في `category.routes.js`)

**ما يحتاج عمله:**
- جلب featured categories من `GET /api/categories?featured=true`
- عرض categories مع صورها (إذا كانت متوفرة)

**ملاحظة:** المكون حالياً يعرض محتوى ثابت (features و bigCard). قد يحتاج تعديل التصميم لعرض categories ديناميكية.

---

### 10. **PopularGoodsChips.jsx**
**الوضع الحالي:** يعرض categories ثابتة من translation keys

**Endpoints المطلوبة:**
- ✅ `GET /api/categories` (موجود)

**ما يحتاج عمله:**
- جلب categories من `GET /api/categories`
- عرض categories كـ chips
- عند النقر على chip، استدعاء `onSelect` callback

---

## 🔴 Endpoints المفقودة في Backend

### 1. **Trader Registration Endpoint**
**المطلوب:**
```
POST /api/traders/register
```
**البيانات:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "companyName": "string",
  "country": "string",
  "city": "string",
  "bankAccountName": "string",
  "bankAccountNumber": "string",
  "bankName": "string",
  "bankAddress": "string",
  "bankCode": "string",
  "swift": "string",
  "region": "string",
  "companyAddress": "string"
}
```

**الحل:**
- إنشاء `POST /api/traders/register` في `mediation.routes.js`
- أو تعديل `POST /api/auth/register` لقبول `userType: 'TRADER'` وحفظ بيانات Trader

---

### 2. **Cart Integration with Offers/Deals**
**المشكلة:** Cart في Backend قد يكون منفصل عن Mediation Offers/Deals.

**الحل:**
- ربط Cart items مع OfferItems
- أو استخدام Deal items بدلاً من Cart
- التحقق من كيفية ربط `POST /api/orders` مع Offers/Deals

---

## 📝 خطة التنفيذ

### المرحلة 1: الصفحات الأساسية (Priority: High)
1. ✅ **SellerProductsPage** - ربط مع `GET /api/traders/:id/offers/public`
2. ✅ **OrderTrackingCard** - ربط مع `GET /api/orders/my-orders/:id/tracking`
3. ✅ **CompanyAdsComponent** - ربط مع `GET /api/traders/:id/offers/public`

### المرحلة 2: Checkout & Payment (Priority: High)
4. ✅ **OrderCheckoutComponent** - ربط مع Cart endpoints
5. ✅ **CheckoutSummaryComponent** - ربط مع Shipping & Order endpoints
6. ✅ **PaymentCardOne** - ربط مع Payment endpoints

### المرحلة 3: Registration & Profile (Priority: Medium)
7. ✅ **SignupBankInfoForm** - إنشاء/تعديل Trader registration endpoint
8. ✅ **CompanyProfilePage** - ربط مع Company/Trader endpoints

### المرحلة 4: Home Page Components (Priority: Low)
9. ✅ **FeaturedCategories** - ربط مع Categories endpoint
10. ✅ **PopularGoodsChips** - ربط مع Categories endpoint

---

## 🔧 ملاحظات تقنية

### 1. **Trader vs Company**
- النظام يستخدم `Trader` model في Mediation
- `CompanyProfilePage` يجب أن يستخدم `traderId` بدلاً من `companyId`
- Endpoint: `GET /api/traders/:id/public` موجود

### 2. **Cart vs Deal**
- Cart في Backend قد يكون منفصل عن Mediation
- يجب التحقق من كيفية ربط Cart items مع OfferItems
- أو استخدام Deal items مباشرة

### 3. **Order Creation**
- `POST /api/orders` موجود لكن قد يحتاج تعديل ليدعم Offers/Deals
- يجب التحقق من schema Order في Prisma

### 4. **Shipping Address**
- يجب حفظ shipping address في User profile أو Order
- Endpoints موجودة في `user.routes.js`:
  - `GET /api/users/shipping-addresses`
  - `POST /api/users/shipping-addresses`

---

## ✅ Checklist

- [ ] ربط SellerProductsPage مع Backend
- [ ] ربط OrderCheckoutComponent مع Cart
- [ ] ربط CheckoutSummaryComponent مع Shipping & Orders
- [ ] ربط PaymentCardOne مع Payment endpoints
- [ ] ربط OrderTrackingCard مع Tracking endpoint
- [ ] إنشاء/تعديل Trader registration endpoint
- [ ] ربط CompanyAdsComponent مع Trader offers
- [ ] ربط CompanyProfilePage مع Trader profile
- [ ] ربط FeaturedCategories مع Categories
- [ ] ربط PopularGoodsChips مع Categories

---

## 📌 الخطوات التالية

1. **بدء من المرحلة 1** - ربط الصفحات الأساسية
2. **اختبار كل endpoint** قبل الانتقال للخطوة التالية
3. **التأكد من عدم تغيير التصميم** - فقط ربط البيانات
4. **إضافة error handling** في كل component
5. **إضافة loading states** أثناء fetch البيانات









