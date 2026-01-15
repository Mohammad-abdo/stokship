# تقرير شامل: ربط Frontend مع Backend - Stockship Platform

## 📋 نظرة عامة
هذا التقرير يفحص مجلد `frontend` ويحدد جميع النقاط التي تحتاج إلى ربط مع `backend`.

## ⚠️ ملاحظة مهمة: نوعان من المستخدمين
**يوجد في النظام نوعان من المستخدمين:**

### 1. المشتري/العميل (Buyer/Client)
- **مسار التسجيل:** `SignUp` → (تسجيل عام) → يمكنه الشراء والتصفح
- **الصفحات المخصصة:**
  - `Home.jsx` - الصفحة الرئيسية
  - `ProductsListPage.jsx` - قائمة المنتجات
  - `ProductDetails.jsx` - تفاصيل المنتج
  - `OrdersPage.jsx` - طلباتي
  - `OrderCheckout.jsx` - صفحة الدفع
  - `OrderCheckoutPageTwo.jsx` - إتمام الدفع
  - `PaymentPageOne.jsx` - الدفع
  - `OrderTrackingCardPage.jsx` - تتبع الطلب
  - `SellerProductsPage.jsx` - منتجات البائع (للتفاوض)
  - `RequestSent.jsx` - طلب التفاوض تم إرساله

### 2. البائع/التاجر (Vendor/Seller)
- **مسار التسجيل:** `Navbar` → "كن بائعاً" → `SignupBankInfoFormPage` → `Seller` → `PublishAdPage`
- **الصفحات المخصصة:**
  - `SignupBankInfoFormPage.jsx` - معلومات البنك والشركة (مطلوبة للبائعين)
  - `Seller.jsx` - صفحة البائع الرئيسية
  - `PublishAdPage.jsx` - نشر إعلان/عرض للبيع
  - `CompanyProfilePage.jsx` - ملف الشركة (يمكن أن يكون للمشترين أيضاً)

---

## 🔍 تحليل البنية الحالية

### 1. هيكل المشروع
```
Stokship/
├── backend/          (Node.js/Express API)
├── dashboard/        (Admin/Employee/Trader Dashboard)
└── frontend/         (Public-facing E-commerce Frontend) ⭐
```

### 2. Frontend Structure
```
frontend/
├── src/
│   ├── pages/        (19 صفحة)
│   ├── components/    (26 مكون)
│   ├── hooks/         (3 hooks)
│   ├── data/          (Mock data)
│   ├── locales/       (i18n translations)
│   └── routes.ts      (Route definitions)
├── package.json
└── vite.config.js
```

---

## 📊 تحليل الصفحات والمكونات

### الصفحات الموجودة (19 صفحة)

#### ✅ الصفحات التي تحتاج ربط Backend:

1. **Home.jsx** - الصفحة الرئيسية
   - **المكونات المستخدمة:**
     - `ProductsList` - عرض المنتجات
     - `FeaturedCategories` - الفئات المميزة
     - `RecommendedProducts` - المنتجات الموصى بها
   - **البيانات الحالية:** Mock data (hardcoded)
   - **يحتاج ربط:**
     - `GET /api/products` - جلب المنتجات
     - `GET /api/categories` - جلب الفئات
     - `GET /api/products/recommended` - المنتجات الموصى بها

2. **ProductDetails.jsx** - تفاصيل المنتج
   - **المكونات المستخدمة:**
     - `ProductDetailsComponent` - تفاصيل المنتج
     - `ProductsList` - منتجات ذات صلة
   - **البيانات الحالية:** Mock data (hardcoded images)
   - **يحتاج ربط:**
     - `GET /api/products/:id` - تفاصيل المنتج
     - `GET /api/products/:id/related` - منتجات ذات صلة
     - `GET /api/products/:id/reviews` - التقييمات

3. **ProductsListPage.jsx** - قائمة المنتجات
   - **المكونات المستخدمة:**
     - `ProductsListComponent` - قائمة المنتجات
   - **البيانات الحالية:** Mock data
   - **يحتاج ربط:**
     - `GET /api/products` - جلب المنتجات مع filters
     - `GET /api/categories` - الفئات للفلترة
     - `GET /api/search/products` - البحث

4. **Login.jsx** - تسجيل الدخول
   - **المكونات المستخدمة:**
     - `LoginCard` - نموذج تسجيل الدخول
   - **البيانات الحالية:** لا يوجد ربط (form فقط)
   - **يحتاج ربط:**
     - `POST /api/auth/login` - تسجيل الدخول
     - `POST /api/auth/guest` - تسجيل دخول ضيف
     - `POST /api/auth/forgot-password` - نسيان كلمة المرور

5. **SignUp.jsx** - التسجيل
   - **المكونات المستخدمة:**
     - `SignUpCard` - نموذج التسجيل
   - **البيانات الحالية:** لا يوجد ربط
   - **يحتاج ربط:**
     - `POST /api/auth/register` - التسجيل
     - `POST /api/auth/verify-email` - التحقق من البريد

6. **SignupBankInfoFormPage.jsx** - معلومات البنك
   - **المكونات المستخدمة:**
     - `SignupBankInfoForm` - نموذج معلومات البنك
   - **البيانات الحالية:** لا يوجد ربط
   - **يحتاج ربط:**
     - `PUT /api/auth/me` - تحديث معلومات المستخدم
     - `POST /api/users/bank-info` - حفظ معلومات البنك

7. **OrdersPage.jsx** - صفحة الطلبات
   - **المكونات المستخدمة:**
     - `Orders` - قائمة الطلبات
   - **البيانات الحالية:** Mock data (hardcoded)
   - **يحتاج ربط:**
     - `GET /api/orders/my-orders` - جلب طلبات المستخدم
     - `GET /api/orders/:id` - تفاصيل الطلب
     - `POST /api/orders/:id/cancel` - إلغاء الطلب

8. **OrderCheckout.jsx** - صفحة الدفع
   - **المكونات المستخدمة:**
     - `OrderCheckoutComponent` - مكون الدفع
   - **البيانات الحالية:** Mock data
   - **يحتاج ربط:**
     - `POST /api/orders` - إنشاء طلب
     - `POST /api/cart/checkout` - عملية الدفع
     - `POST /api/coupons/validate` - التحقق من القسيمة

9. **OrderCheckoutPageTwo.jsx** - صفحة الدفع 2
   - **البيانات الحالية:** Mock data
   - **يحتاج ربط:**
     - `POST /api/checkout` - إتمام الدفع
     - `GET /api/shipping/rates` - أسعار الشحن

10. **PaymentPageOne.jsx** - صفحة الدفع
    - **المكونات المستخدمة:**
      - `PaymentCardOne` - مكون الدفع
    - **البيانات الحالية:** Mock data
    - **يحتاج ربط:**
      - `POST /api/payments` - معالجة الدفع
      - `GET /api/payments/methods` - طرق الدفع المتاحة

11. **OrderTrackingCardPage.jsx** - تتبع الطلب
    - **المكونات المستخدمة:**
      - `OrderTrackingCard` - تتبع الطلب
    - **البيانات الحالية:** Mock data
    - **يحتاج ربط:**
      - `GET /api/orders/:id/tracking` - تتبع الطلب
      - `GET /api/orders/:id` - تفاصيل الطلب

12. **Seller.jsx** - صفحة البائع
    - **البيانات الحالية:** Mock data
    - **يحتاج ربط:**
      - `GET /api/vendors/:id` - معلومات البائع
      - `GET /api/vendors/:id/products` - منتجات البائع

13. **SellerProductsPage.jsx** - منتجات البائع
    - **البيانات الحالية:** Mock data
    - **يحتاج ربط:**
      - `GET /api/products/seller/:sellerId` - منتجات البائع
      - `GET /api/vendors/:id` - معلومات البائع

14. **PublishAdPage.jsx** - نشر إعلان (للبيع فقط)
    - **البيانات الحالية:** Mock data
    - **مسار الاستخدام:** Seller → PublishAd
    - **يحتاج ربط:**
      - `POST /api/offers` - إنشاء عرض/إعلان للبيع
      - `POST /api/upload/images` - رفع الصور (حتى 10 صور)
      - `POST /api/upload/excel` - رفع ملف Excel للمنتجات
      - `GET /api/categories` - جلب الأقسام للاختيار
    - **ملاحظة:** هذه الصفحة خاصة بالبائعين لنشر عروضهم

15. **CompanyProfilePage.jsx** - ملف الشركة
    - **البيانات الحالية:** Mock data
    - **يحتاج ربط:**
      - `GET /api/companies/:id` - معلومات الشركة
      - `GET /api/companies/:id/products` - منتجات الشركة

16. **Notification.jsx** - الإشعارات
    - **المكونات المستخدمة:**
      - `NotificationsList` - قائمة الإشعارات
    - **البيانات الحالية:** Mock data
    - **يحتاج ربط:**
      - `GET /api/notifications` - جلب الإشعارات
      - `PUT /api/notifications/:id/read` - تحديد كمقروء

17. **TermsPoliciesPage.jsx** - الشروط والسياسات
    - **البيانات الحالية:** Static content
    - **يحتاج ربط:**
      - `GET /api/content/terms` - الشروط والأحكام
      - `GET /api/content/policies` - السياسات

---

## 🔌 المكونات التي تحتاج ربط Backend

### 1. ProductsList.jsx
- **الوضع الحالي:** يستخدم Mock data (hardcoded products)
- **يحتاج ربط:**
  - `GET /api/products` - جلب المنتجات
  - `GET /api/products?category=:category` - فلترة حسب الفئة

### 2. ProductDetailsComponent.jsx
- **الوضع الحالي:** يستخدم Mock images و hardcoded data
- **يحتاج ربط:**
  - `GET /api/products/:id` - تفاصيل المنتج
  - `POST /api/wishlist` - إضافة للمفضلة
  - `POST /api/products/:id/reviews` - إضافة تقييم

### 3. LoginCard.jsx
- **الوضع الحالي:** Form فقط بدون ربط
- **يحتاج ربط:**
  - `POST /api/auth/login` - تسجيل الدخول
  - حفظ Token في localStorage
  - Redirect بعد تسجيل الدخول

### 4. SignUpCard.jsx
- **الوضع الحالي:** Form فقط بدون ربط
- **يحتاج ربط:**
  - `POST /api/auth/register` - التسجيل
  - `POST /api/auth/verify-email` - التحقق من البريد

### 5. Orders.jsx
- **الوضع الحالي:** Mock data (hardcoded orders)
- **يحتاج ربط:**
  - `GET /api/orders/my-orders` - جلب الطلبات
  - `GET /api/orders/my-orders?status=:status` - فلترة حسب الحالة

### 6. OrderCheckoutComponent.jsx
- **الوضع الحالي:** Mock data
- **يحتاج ربط:**
  - `GET /api/cart` - جلب سلة التسوق
  - `POST /api/coupons/validate` - التحقق من القسيمة
  - `POST /api/orders` - إنشاء الطلب

### 7. PaymentCardOne.jsx
- **الوضع الحالي:** Mock data
- **يحتاج ربط:**
  - `POST /api/payments` - معالجة الدفع
  - `GET /api/payments/methods` - طرق الدفع

### 8. ProductCard.jsx
- **الوضع الحالي:** يعرض بيانات Mock
- **يحتاج ربط:**
  - Navigate to product details
  - `POST /api/wishlist` - إضافة للمفضلة

### 9. RecommendedProducts.jsx
- **الوضع الحالي:** Mock data
- **يحتاج ربط:**
  - `GET /api/products/recommended` - المنتجات الموصى بها

### 10. FeaturedCategories.jsx
- **الوضع الحالي:** Mock data
- **يحتاج ربط:**
  - `GET /api/categories?featured=true` - الفئات المميزة

---

## ❌ المشاكل الحالية

### 1. لا يوجد API Client
- **المشكلة:** لا يوجد ملف `api.js` أو `axios` configuration
- **الحل:** إنشاء API client مشابه لـ `dashboard/src/lib/stockshipApi.js`

### 2. لا يوجد Authentication Context
- **المشكلة:** لا يوجد context لإدارة حالة المستخدم
- **الحل:** إنشاء `AuthContext` أو استخدام localStorage مباشرة

### 3. جميع البيانات Mock
- **المشكلة:** جميع الصفحات تستخدم Mock data
- **الحل:** استبدال جميع Mock data بـ API calls

### 4. لا يوجد Error Handling
- **المشكلة:** لا يوجد معالجة للأخطاء
- **الحل:** إضافة try-catch و error handling

### 5. لا يوجد Loading States
- **المشكلة:** لا يوجد loading indicators
- **الحل:** إضافة loading states لجميع API calls

---

## 📝 خطة الربط

### المرحلة 1: إعداد البنية الأساسية

#### 1.1 إنشاء API Client
```javascript
// frontend/src/lib/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### 1.2 إنشاء API Services
```javascript
// frontend/src/services/authService.js
import api from '../lib/api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data, role = 'CLIENT') => api.post('/auth/register', { ...data, role }),
  registerAsBuyer: (data) => api.post('/auth/register', { ...data, role: 'CLIENT' }),
  registerAsSeller: (data) => api.post('/auth/register', { ...data, role: 'VENDOR' }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  guestLogin: () => api.post('/auth/guest'),
};

// frontend/src/services/vendorService.js
export const vendorService = {
  create: (data) => api.post('/vendors', data),
  getById: (id) => api.get(`/vendors/${id}`),
  getMe: () => api.get('/vendors/me'),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  saveBankInfo: (data) => api.post('/vendors/bank-info', data),
  getProducts: (id, params) => api.get(`/vendors/${id}/products`, { params }),
};

// frontend/src/services/productService.js
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  search: (params) => api.get('/search/products', { params }),
};

// frontend/src/services/orderService.js
export const orderService = {
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  getTracking: (id) => api.get(`/orders/${id}/tracking`),
};
```

#### 1.3 إنشاء Auth Context
```javascript
// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await authService.me();
        setUser(response.data.data || response.data);
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user } = response.data.data || response.data;
    localStorage.setItem('auth_token', token);
    setUser(user);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

### المرحلة 2: ربط الصفحات الرئيسية

#### 2.1 Home.jsx
```javascript
// إضافة useEffect لجلب البيانات
useEffect(() => {
  fetchProducts();
  fetchCategories();
  fetchRecommended();
}, []);

const fetchProducts = async () => {
  try {
    const response = await productService.getAll({ limit: 20 });
    setProducts(response.data.data || response.data);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};
```

#### 2.2 ProductDetails.jsx
```javascript
const { id } = useParams();

useEffect(() => {
  if (id) {
    fetchProduct(id);
    fetchRelated(id);
  }
}, [id]);

const fetchProduct = async (id) => {
  try {
    const response = await productService.getById(id);
    setProduct(response.data.data || response.data);
  } catch (error) {
    console.error('Error fetching product:', error);
  }
};
```

#### 2.3 Login.jsx
```javascript
const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await login(email, password);
    const user = response.data.data || response.data;
    
    // Redirect based on user role
    if (user.role === 'VENDOR' || user.role === 'SELLER') {
      navigate('/seller'); // أو /PublishAd إذا كان مسجل بالفعل
    } else {
      navigate('/'); // المشترين يذهبون للصفحة الرئيسية
    }
  } catch (error) {
    setError(error.response?.data?.message || 'Login failed');
  }
};
```

#### 2.4 SignUp.jsx (للمشترين)
```javascript
const { registerAsBuyer } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await registerAsBuyer({ name, email, phone, password });
    navigate('/'); // بعد التسجيل يذهب للصفحة الرئيسية
  } catch (error) {
    setError(error.response?.data?.message || 'Registration failed');
  }
};
```

#### 2.5 SignupBankInfoFormPage.jsx (للبائعين)
```javascript
import { vendorService } from '../services/vendorService';
import { authService } from '../services/authService';

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // 1. تسجيل حساب بائع
    const registerResponse = await authService.registerAsSeller({
      name: form.fullName,
      email: form.email,
      phone: form.phone,
      password: generatePassword(), // أو من صفحة سابقة
    });
    
    // 2. إنشاء ملف بائع مع معلومات البنك
    await vendorService.create({
      userId: registerResponse.data.user.id,
      companyName: form.fullName,
      city: form.city,
      country: form.country,
      companyAddress: form.companyAddress,
      bankInfo: {
        accountName: form.bankAccountName,
        accountNumber: form.bankAccountNumber,
        bankName: form.bankName,
        bankAddress: form.bankAddress,
        bankCode: form.bankCode,
        swift: form.swift,
        region: form.region,
      }
    });
    
    navigate('/seller'); // الانتقال لصفحة البائع
  } catch (error) {
    setError(error.response?.data?.message || 'Registration failed');
  }
};
```

#### 2.6 PublishAdPage.jsx (للبائعين)
```javascript
import { offerService } from '../services/offerService';

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    
    // رفع الصور
    uploadedImages.forEach((img, index) => {
      formData.append('images', img);
    });
    
    // رفع Excel
    if (excelFile) {
      formData.append('excelFile', excelFile);
    }
    
    // بيانات الإعلان
    formData.append('title', sectionName);
    formData.append('description', description);
    formData.append('country', country);
    formData.append('city', city);
    formData.append('acceptNegotiation', acceptNegotiation);
    formData.append('negotiationText', negotiationText);
    
    await offerService.create(formData);
    navigate('/seller'); // أو صفحة نجاح
  } catch (error) {
    setError(error.response?.data?.message || 'Failed to publish ad');
  }
};
```

---

### المرحلة 3: ربط المكونات

#### 3.1 ProductsList.jsx
- استبدال Mock data بـ API call
- إضافة loading state
- إضافة error handling

#### 3.2 ProductDetailsComponent.jsx
- جلب بيانات المنتج من API
- ربط إضافة للمفضلة
- ربط إضافة تقييم

#### 3.3 Orders.jsx
- جلب الطلبات من API
- إضافة فلترة حسب الحالة

---

## 📋 Checklist الربط

### Authentication
- [ ] إنشاء API client
- [ ] إنشاء Auth Context (يدعم Buyer و Seller)
- [ ] ربط Login.jsx (مع redirect حسب role)
- [ ] ربط SignUp.jsx (للمشترين)
- [ ] ربط SignupBankInfoFormPage.jsx (للبائعين)
- [ ] حفظ Token و Role
- [ ] Logout functionality
- [ ] Guest login functionality

### Products
- [ ] ربط Home.jsx - جلب المنتجات
- [ ] ربط ProductsListPage.jsx
- [ ] ربط ProductDetails.jsx
- [ ] ربط ProductCard.jsx
- [ ] ربط RecommendedProducts.jsx
- [ ] ربط FeaturedCategories.jsx

### Orders
- [ ] ربط OrdersPage.jsx
- [ ] ربط OrderCheckout.jsx
- [ ] ربط OrderCheckoutPageTwo.jsx
- [ ] ربط PaymentPageOne.jsx
- [ ] ربط OrderTrackingCardPage.jsx

### Other Pages
- [ ] ربط Seller.jsx (للبائعين)
- [ ] ربط SellerProductsPage.jsx (للمشترين - عرض منتجات بائع)
- [ ] ربط CompanyProfilePage.jsx (للبائعين والمشترين)
- [ ] ربط PublishAdPage.jsx (للبائعين - نشر إعلان)
- [ ] ربط Notification.jsx (للبائعين والمشترين)
- [ ] ربط TermsPoliciesPage.jsx
- [ ] ربط RequestSent.jsx (للمشترين - بعد إرسال طلب تفاوض)

### Features
- [ ] إضافة Loading States
- [ ] إضافة Error Handling
- [ ] إضافة Toast Notifications
- [ ] إضافة Form Validation
- [ ] إضافة Pagination
- [ ] إضافة Search & Filters

---

## 🔗 Backend APIs المطلوبة

### Authentication APIs
- `POST /api/auth/login` - تسجيل الدخول (يدعم Buyer و Seller)
- `POST /api/auth/register` - التسجيل
  - **Buyer:** `POST /api/auth/register` مع `role: "CLIENT"` أو `role: "BUYER"`
  - **Seller:** `POST /api/auth/register` مع `role: "VENDOR"` أو `role: "SELLER"`
- `POST /api/auth/logout`
- `GET /api/auth/me` - معلومات المستخدم الحالي
- `POST /api/auth/forgot-password`
- `POST /api/auth/guest` - تسجيل دخول كزائر

### Product APIs
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/:id/related`
- `GET /api/products/recommended`
- `GET /api/products/seller/:sellerId`
- `GET /api/search/products`

### Category APIs
- `GET /api/categories`
- `GET /api/categories?featured=true`

### Order APIs
- `GET /api/orders/my-orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `POST /api/orders/:id/cancel`
- `GET /api/orders/:id/tracking`

### Cart APIs
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:id`
- `DELETE /api/cart/:id`

### Payment APIs
- `POST /api/payments`
- `GET /api/payments/methods`

### Coupon APIs
- `POST /api/coupons/validate`

### Vendor/Seller APIs
- `POST /api/vendors` - إنشاء حساب بائع (من SignupBankInfoForm)
- `GET /api/vendors/:id` - معلومات البائع
- `PUT /api/vendors/:id` - تحديث معلومات البائع
- `GET /api/vendors/:id/products` - منتجات البائع
- `POST /api/vendors/bank-info` - حفظ معلومات البنك
- `GET /api/vendors/me` - معلومات البائع الحالي

### Notification APIs
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

### Content APIs
- `GET /api/content/terms`
- `GET /api/content/policies`

---

## 🚀 خطة التنفيذ

### Week 1: Setup & Core
- Day 1: إنشاء API client و Auth Context (يدعم Buyer و Seller)
- Day 2: ربط Authentication
  - Login.jsx (مع redirect حسب role)
  - SignUp.jsx (للمشترين)
  - SignupBankInfoFormPage.jsx (للبائعين)
- Day 3: ربط Home page
- Day 4: ربط ProductDetails page
- Day 5: Testing & Bug fixes

### Week 2: Products & Orders
- Day 1-2: ربط جميع صفحات المنتجات
- Day 3-4: ربط صفحات الطلبات
- Day 5: ربط صفحات الدفع

### Week 3: Other Features
- Day 1: ربط صفحات البائع (Seller.jsx, PublishAdPage.jsx)
- Day 2: ربط صفحات الشركة (CompanyProfilePage.jsx)
- Day 3: ربط SellerProductsPage.jsx (للمشترين)
- Day 4: ربط الإشعارات والمحتوى
- Day 5: Testing & Optimization

---

## ✅ النتيجة النهائية

بعد إكمال الربط:
- ✅ جميع الصفحات متصلة بالـ Backend
- ✅ Authentication يعمل بشكل صحيح
- ✅ جميع البيانات تأتي من API
- ✅ Error handling و Loading states موجودة
- ✅ تجربة مستخدم سلسة

---

## 📌 ملاحظات مهمة

1. **Environment Variables:** تأكد من إعداد `VITE_API_URL` في `.env`
2. **CORS:** تأكد من إعداد CORS في Backend للسماح بـ Frontend origin
3. **Error Messages:** استخدم ترجمات i18n لرسائل الخطأ
4. **Loading States:** أضف loading indicators لجميع API calls
5. **Form Validation:** تحقق من البيانات قبل الإرسال
6. **Token Management:** احفظ Token و Role بشكل آمن
7. **Refresh Token:** فكر في إضافة refresh token mechanism
8. **User Roles:** 
   - تأكد من تحديد role (CLIENT/BUYER أو VENDOR/SELLER) عند التسجيل
   - استخدم role للتحكم في الوصول للصفحات
   - Buyer يمكنه: الشراء، التصفح، تتبع الطلبات
   - Seller يمكنه: نشر الإعلانات، إدارة المنتجات، عرض منتجاته
9. **Route Protection:** 
   - حماية صفحات البائعين (PublishAdPage, Seller) من المشترين
   - حماية صفحات المشترين (OrderCheckout) من البائعين (إذا لزم الأمر)
10. **Navbar Logic:**
    - زر "كن بائعاً" يذهب إلى SignupBankInfoFormPage
    - زر "تسجيل الدخول" يذهب إلى Login
    - بعد تسجيل الدخول، اعرض اسم المستخدم و role

---

**هل تريد البدء بتنفيذ هذه الخطة؟**

