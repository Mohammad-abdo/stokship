# خطة ربط نظام العروض (Offers) مع Frontend

## 📋 المشكلة الأساسية

في Backend، **التاجر/البائع لا يضيف منتجات مباشرة، بل يضيفها في "عروض" (Offers)**.

### البنية في Backend:
```
Trader (التاجر)
  └── Offer (العرض/الإعلان)
      ├── Offer Metadata (عنوان، وصف، صور، فئة، etc.)
      └── OfferItems[] (المنتجات داخل العرض)
          ├── Item 1 (منتج)
          ├── Item 2 (منتج)
          └── Item N (منتج)
```

### مثال:
- **Offer:** "عرض أجهزة إلكترونية من الصين"
  - **OfferItem 1:** iPhone 14 Pro - 100 قطعة
  - **OfferItem 2:** Samsung Galaxy S23 - 50 قطعة
  - **OfferItem 3:** AirPods Pro - 200 قطعة

---

## 🔍 فهم نظام العروض في Backend

### 1. Offer Schema
```javascript
Offer {
  id: Int
  traderId: Int              // التاجر الذي أنشأ العرض
  title: String              // عنوان العرض
  description: String        // وصف العرض
  status: OfferStatus        // DRAFT, PENDING_VALIDATION, ACTIVE, CLOSED, REJECTED
  category: String           // الفئة (من صفحة الإنشاء)
  acceptsNegotiation: Boolean // هل يقبل التفاوض
  country: String            // الدولة
  city: String              // المدينة
  images: String            // JSON array - صور العرض الرئيسية
  excelFileUrl: String      // ملف Excel الأصلي
  totalCartons: Int         // إجمالي الكرتونات
  totalCBM: Decimal         // إجمالي المتر المكعب
  items: OfferItem[]         // المنتجات داخل العرض
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2. OfferItem Schema
```javascript
OfferItem {
  id: Int
  offerId: Int              // العرض الذي ينتمي إليه
  itemNo: String            // رقم الصنف
  productName: String       // اسم المنتج
  description: String        // وصف المنتج
  quantity: Int             // الكمية
  unitPrice: Decimal        // سعر الوحدة
  currency: String          // العملة
  amount: Decimal           // المبلغ الإجمالي
  cartonLength: Decimal     // طول الكرتون
  cartonWidth: Decimal      // عرض الكرتون
  cartonHeight: Decimal     // ارتفاع الكرتون
  totalCBM: Decimal         // المتر المكعب
  images: String            // JSON array - صور المنتج
  // ... المزيد من الحقول
}
```

### 3. Offer Status Flow
```
DRAFT → PENDING_VALIDATION → ACTIVE → CLOSED
                              ↓
                          REJECTED
```

- **DRAFT:** مسودة (التاجر لم يكمل)
- **PENDING_VALIDATION:** في انتظار موافقة الموظف
- **ACTIVE:** نشط (يظهر في Frontend)
- **CLOSED:** مغلق
- **REJECTED:** مرفوض

---

## 🎯 كيف سنعرض العروض في Frontend

### الخيار 1: عرض العروض كمنتجات (Recommended) ⭐
**الفكرة:** كل Offer يظهر كمنتج في الصفحة الرئيسية، وعند النقر عليه يظهر تفاصيل العرض مع جميع OfferItems.

**المزايا:**
- ✅ يتوافق مع تصميم Frontend الحالي
- ✅ سهل التنفيذ
- ✅ المستخدم يرى "منتجات" كما هو متوقع

**التنفيذ:**
```javascript
// في Home.jsx
GET /api/offers?status=ACTIVE&page=1&limit=20
// Response: Array of Offers
// كل Offer يعرض كـ ProductCard
```

### الخيار 2: عرض OfferItems كمنتجات منفصلة
**الفكرة:** تفكيك كل Offer إلى OfferItems منفصلة، كل OfferItem يظهر كمنتج مستقل.

**المزايا:**
- ✅ المستخدم يرى منتجات منفصلة
- ✅ يمكن البحث في المنتجات مباشرة

**العيوب:**
- ❌ يفقد سياق العرض
- ❌ معقد في التنفيذ
- ❌ يحتاج تحويل OfferItems إلى Products

### الخيار 3: هجين (Hybrid) ⭐⭐⭐
**الفكرة:** 
- الصفحة الرئيسية: تعرض Offers كمنتجات
- صفحة تفاصيل العرض: تعرض Offer مع جميع OfferItems
- صفحة قائمة المنتجات: يمكن عرض Offers أو OfferItems حسب الفلتر

**المزايا:**
- ✅ مرونة عالية
- ✅ يحافظ على سياق العرض
- ✅ يدعم البحث في كلا المستويين

---

## 📊 Mapping: Offers → Frontend Products

### في الصفحة الرئيسية (Home.jsx)
```javascript
// Backend Response
{
  id: 1,
  title: "عرض أجهزة إلكترونية",
  description: "أجهزة إلكترونية عالية الجودة",
  images: ["image1.jpg", "image2.jpg"],
  trader: { companyName: "شركة ABC" },
  _count: { items: 3 },
  totalCBM: 10.5,
  status: "ACTIVE"
}

// Frontend ProductCard Props
{
  id: offer.id,
  title: offer.title,
  description: offer.description,
  image: offer.images[0], // أول صورة
  seller: offer.trader.companyName,
  itemsCount: offer._count.items,
  // يمكن إضافة: minPrice من OfferItems
}
```

### في صفحة تفاصيل المنتج (ProductDetails.jsx)
```javascript
// Backend: GET /api/offers/:id
{
  id: 1,
  title: "عرض أجهزة إلكترونية",
  description: "...",
  images: ["img1.jpg", "img2.jpg"],
  trader: { ... },
  items: [
    { id: 1, productName: "iPhone 14", quantity: 100, unitPrice: 5000, ... },
    { id: 2, productName: "Samsung S23", quantity: 50, unitPrice: 4000, ... }
  ]
}

// Frontend: يعرض Offer كمنتج رئيسي مع قائمة OfferItems
```

---

## 🔌 APIs المطلوبة للربط

### ✅ موجودة في Backend:

1. **GET /api/offers** - جلب العروض النشطة
   ```javascript
   GET /api/offers?status=ACTIVE&page=1&limit=20&country=SA&city=Riyadh
   Response: { offers: [...], pagination: {...} }
   ```

2. **GET /api/offers/:id** - تفاصيل عرض
   ```javascript
   GET /api/offers/1
   Response: { offer: {...}, items: [...] }
   ```

3. **POST /api/traders/offers** - إنشاء عرض (للبيع)
   ```javascript
   POST /api/traders/offers
   Body: { title, description, items: [...], metadata: {...} }
   ```

### ❌ مفقودة أو تحتاج تحسين:

1. **GET /api/offers/recommended** - العروض الموصى بها
   ```javascript
   // يمكن استخدام: GET /api/offers?status=ACTIVE&sortBy=createdAt&limit=10
   // أو إنشاء endpoint مخصص
   ```

2. **GET /api/offers/by-category** - العروض حسب الفئة
   ```javascript
   GET /api/offers?status=ACTIVE&category=electronics
   // موجود لكن يحتاج فحص
   ```

3. **GET /api/offers/search** - البحث في العروض
   ```javascript
   GET /api/offers?status=ACTIVE&search=iphone
   // موجود في getActiveOffers
   ```

4. **GET /api/traders/:id/offers** - عروض تاجر معين
   ```javascript
   GET /api/offers?status=ACTIVE&traderId=1
   // موجود
   ```

---

## 🛠️ ما نحتاجه للربط

### 1. Frontend API Client
```javascript
// frontend/src/services/offerService.js
export const offerService = {
  // جلب العروض النشطة (للصفحة الرئيسية)
  getActiveOffers: (params) => api.get('/offers', { params }),
  
  // تفاصيل عرض
  getOfferById: (id) => api.get(`/offers/${id}`),
  
  // البحث في العروض
  searchOffers: (query, params) => api.get('/offers', { 
    params: { ...params, search: query, status: 'ACTIVE' } 
  }),
  
  // عروض تاجر معين
  getTraderOffers: (traderId, params) => api.get('/offers', {
    params: { ...params, traderId, status: 'ACTIVE' }
  }),
  
  // إنشاء عرض (للبيع)
  createOffer: (data) => api.post('/traders/offers', data),
  
  // رفع Excel
  uploadExcel: (offerId, file) => {
    const formData = new FormData();
    formData.append('excelFile', file);
    return api.post(`/traders/offers/${offerId}/upload-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
```

### 2. تحويل Offers إلى Products Format
```javascript
// frontend/src/utils/offerMapper.js
export const mapOfferToProduct = (offer) => {
  // حساب أقل سعر من OfferItems
  const minPrice = offer.items?.length > 0
    ? Math.min(...offer.items.map(item => parseFloat(item.unitPrice || 0)))
    : 0;
  
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    image: offer.images ? JSON.parse(offer.images)[0] : null,
    images: offer.images ? JSON.parse(offer.images) : [],
    seller: offer.trader?.companyName || 'Unknown',
    sellerId: offer.traderId,
    price: minPrice,
    currency: offer.items?.[0]?.currency || 'SAR',
    itemsCount: offer._count?.items || 0,
    totalCBM: parseFloat(offer.totalCBM || 0),
    category: offer.category,
    country: offer.country,
    city: offer.city,
    acceptsNegotiation: offer.acceptsNegotiation,
    rating: 5, // يمكن إضافة تقييمات لاحقاً
    reviews: 0,
    isOffer: true, // Flag للتمييز بين Product و Offer
    offerId: offer.id
  };
};
```

### 3. تحديث Home.jsx
```javascript
// frontend/src/pages/Home.jsx
import { offerService } from '../services/offerService';
import { mapOfferToProduct } from '../utils/offerMapper';

const [offers, setOffers] = useState([]);

useEffect(() => {
  fetchOffers();
}, []);

const fetchOffers = async () => {
  try {
    const response = await offerService.getActiveOffers({ 
      page: 1, 
      limit: 20 
    });
    
    // تحويل Offers إلى Products format
    const products = response.data.data.offers.map(mapOfferToProduct);
    setOffers(products);
  } catch (error) {
    console.error('Error fetching offers:', error);
  }
};
```

### 4. تحديث ProductDetails.jsx
```javascript
// frontend/src/pages/ProductDetails.jsx
const { id } = useParams();
const [offer, setOffer] = useState(null);

useEffect(() => {
  if (id) {
    fetchOffer(id);
  }
}, [id]);

const fetchOffer = async (id) => {
  try {
    const response = await offerService.getOfferById(id);
    setOffer(response.data.data);
  } catch (error) {
    console.error('Error fetching offer:', error);
  }
};

// عرض Offer كمنتج رئيسي + قائمة OfferItems
return (
  <div>
    {/* Offer Details (كمنتج رئيسي) */}
    <OfferDetailsComponent offer={offer} />
    
    {/* Offer Items List */}
    <OfferItemsList items={offer?.items || []} />
  </div>
);
```

### 5. تحديث ProductsListPage.jsx
```javascript
// frontend/src/pages/ProductsListPage.jsx
const [offers, setOffers] = useState([]);

const fetchOffers = async (filters) => {
  try {
    const params = {
      status: 'ACTIVE',
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.category && { category: filters.category }),
      ...(filters.search && { search: filters.search }),
      ...(filters.country && { country: filters.country }),
      ...(filters.city && { city: filters.city })
    };
    
    const response = await offerService.getActiveOffers(params);
    const products = response.data.data.offers.map(mapOfferToProduct);
    setOffers(products);
  } catch (error) {
    console.error('Error fetching offers:', error);
  }
};
```

---

## 🔄 Flow كامل: من البائع إلى المشتري

### 1. البائع ينشئ عرض (PublishAdPage.jsx)
```javascript
// 1. البائع يملأ النموذج
const formData = {
  title: "عرض أجهزة إلكترونية",
  description: "...",
  category: "electronics",
  country: "السعودية",
  city: "الرياض",
  acceptsNegotiation: true,
  images: [file1, file2, ...], // صور العرض
  excelFile: excelFile // ملف Excel
};

// 2. رفع الصور أولاً
const imageUrls = await uploadImages(formData.images);

// 3. رفع Excel
const excelResponse = await offerService.uploadExcel(null, formData.excelFile);
// Excel يتم معالجته في Backend ويستخرج OfferItems

// 4. إنشاء العرض
const offer = await offerService.createOffer({
  title: formData.title,
  description: formData.description,
  metadata: {
    category: formData.category,
    country: formData.country,
    city: formData.city,
    acceptsNegotiation: formData.acceptsNegotiation,
    adImages: imageUrls
  },
  excelFileUrl: excelResponse.data.excelFileUrl,
  excelFileName: excelResponse.data.excelFileName,
  excelFileSize: excelResponse.data.excelFileSize
});

// 5. العرض يذهب إلى PENDING_VALIDATION
// الموظف يتحقق منه ويجعله ACTIVE
```

### 2. المشتري يرى العروض (Home.jsx)
```javascript
// جلب العروض النشطة فقط
GET /api/offers?status=ACTIVE

// عرضها كمنتجات
offers.map(offer => <ProductCard product={mapOfferToProduct(offer)} />)
```

### 3. المشتري يرى تفاصيل عرض (ProductDetails.jsx)
```javascript
// جلب تفاصيل العرض مع OfferItems
GET /api/offers/:id

// عرض:
// - معلومات العرض (العنوان، الوصف، الصور)
// - معلومات التاجر
// - قائمة OfferItems (المنتجات داخل العرض)
```

### 4. المشتري يطلب تفاوض (SellerProductsPage.jsx)
```javascript
// المشتري يختار OfferItems ويدخل الكميات والأسعار
// ثم يرسل طلب تفاوض
POST /api/offers/:offerId/request-negotiation
Body: {
  items: [
    { offerItemId: 1, quantity: 50, proposedPrice: 4800 },
    { offerItemId: 2, quantity: 30, proposedPrice: 3800 }
  ],
  notes: "..."
}

// هذا ينشئ Deal في Backend
```

---

## ⚠️ المشاكل والتحديات

### 1. الفرق بين Products و Offers
**المشكلة:** Frontend مصمم لعرض Products، لكن Backend يستخدم Offers.

**الحل:**
- استخدام `mapOfferToProduct` لتحويل Offers إلى Products format
- إضافة flag `isOffer: true` للتمييز
- Frontend يتعامل مع Offers كأنها Products

### 2. البحث والفلترة
**المشكلة:** البحث يحتاج أن يكون في Offers و OfferItems.

**الحل:**
- البحث في Offers: `GET /api/offers?search=iphone`
- البحث في OfferItems: يحتاج endpoint جديد أو تحسين البحث الحالي

### 3. التقييمات والمراجعات
**المشكلة:** Offers لا تحتوي على تقييمات حالياً.

**الحل:**
- إضافة Review system للـ Offers
- أو استخدام تقييمات التاجر (Trader)

### 4. الصور
**المشكلة:** 
- Offers لها صور (adImages)
- OfferItems لها صور أيضاً

**الحل:**
- في ProductCard: استخدام أول صورة من Offer
- في ProductDetails: عرض صور Offer + صور OfferItems

---

## 📋 Checklist للربط

### Backend (التحقق من الجاهزية)
- [x] `GET /api/offers` - جلب العروض النشطة
- [x] `GET /api/offers/:id` - تفاصيل عرض
- [x] `POST /api/traders/offers` - إنشاء عرض
- [x] `POST /api/traders/offers/:id/upload-excel` - رفع Excel
- [ ] `GET /api/offers/recommended` - العروض الموصى بها (اختياري)
- [ ] `GET /api/offers/search` - بحث محسّن (اختياري)

### Frontend (ما نحتاج إنشاؤه)
- [ ] `frontend/src/services/offerService.js` - API client للعروض
- [ ] `frontend/src/utils/offerMapper.js` - تحويل Offers → Products
- [ ] تحديث `Home.jsx` - جلب وعرض Offers
- [ ] تحديث `ProductDetails.jsx` - عرض تفاصيل Offer
- [ ] تحديث `ProductsListPage.jsx` - عرض Offers مع filters
- [ ] تحديث `PublishAdPage.jsx` - ربط مع Backend
- [ ] تحديث `SellerProductsPage.jsx` - عرض OfferItems للتفاوض

### Testing
- [ ] اختبار جلب العروض النشطة
- [ ] اختبار عرض تفاصيل عرض
- [ ] اختبار إنشاء عرض من البائع
- [ ] اختبار البحث والفلترة
- [ ] اختبار طلب التفاوض

---

## 🎯 الخلاصة

### الوضع الحالي:
- ✅ Backend جاهز بنسبة 90% (APIs موجودة)
- ❌ Frontend يحتاج ربط كامل مع نظام Offers
- ⚠️ يحتاج تحويل Offers إلى Products format

### الخطوات التالية:
1. **إنشاء offerService.js** في Frontend
2. **إنشاء offerMapper.js** لتحويل Offers → Products
3. **تحديث Home.jsx** لجلب وعرض Offers
4. **تحديث ProductDetails.jsx** لعرض تفاصيل Offer
5. **تحديث PublishAdPage.jsx** لربط إنشاء العرض
6. **اختبار شامل** للربط

### التوصية:
**استخدام الخيار 3 (Hybrid)** - عرض Offers كمنتجات في الصفحة الرئيسية، وعرض تفاصيل Offer مع OfferItems في صفحة التفاصيل.

---

**هل تريد البدء بإنشاء offerService.js و offerMapper.js؟**

