# متغيرات البيئة للمهام المجدولة

يمكن إضافة هذه المتغيرات إلى ملف `.env` لتخصيص سلوك المهام المجدولة.

## إلغاء الطلبات غير المدفوعة

### UNPAID_ORDER_CANCEL_HOURS
عدد الساعات قبل إلغاء الطلب تلقائياً.

**القيمة الافتراضية:** `72`

**أمثلة:**
```env
# إلغاء بعد 24 ساعة
UNPAID_ORDER_CANCEL_HOURS=24

# إلغاء بعد 48 ساعة
UNPAID_ORDER_CANCEL_HOURS=48

# إلغاء بعد أسبوع (168 ساعة)
UNPAID_ORDER_CANCEL_HOURS=168
```

---

### UNPAID_ORDER_CRON_SCHEDULE
جدول تشغيل المهمة (صيغة Cron).

**القيمة الافتراضية:** `0 * * * *` (كل ساعة)

**أمثلة:**
```env
# كل ساعة
UNPAID_ORDER_CRON_SCHEDULE=0 * * * *

# كل 6 ساعات
UNPAID_ORDER_CRON_SCHEDULE=0 */6 * * *

# كل يوم في الساعة 2 صباحاً
UNPAID_ORDER_CRON_SCHEDULE=0 2 * * *

# كل 30 دقيقة
UNPAID_ORDER_CRON_SCHEDULE=*/30 * * * *

# كل يوم أحد في منتصف الليل
UNPAID_ORDER_CRON_SCHEDULE=0 0 * * 0
```

**شرح صيغة Cron:**
```
┌───────────── دقيقة (0-59)
│ ┌───────────── ساعة (0-23)
│ │ ┌───────────── يوم من الشهر (1-31)
│ │ │ ┌───────────── شهر (1-12)
│ │ │ │ ┌───────────── يوم من الأسبوع (0-7) (الأحد = 0 أو 7)
│ │ │ │ │
* * * * *
```

---

### UNPAID_ORDER_CANCEL_ENABLED
تفعيل/تعطيل المهمة.

**القيمة الافتراضية:** `true`

**أمثلة:**
```env
# تفعيل المهمة
UNPAID_ORDER_CANCEL_ENABLED=true

# تعطيل المهمة
UNPAID_ORDER_CANCEL_ENABLED=false
```

---

### UNPAID_ORDER_SEND_NOTIFICATIONS
تفعيل/تعطيل إرسال إشعارات للمستخدمين.

**القيمة الافتراضية:** `true`

**أمثلة:**
```env
# إرسال إشعارات
UNPAID_ORDER_SEND_NOTIFICATIONS=true

# عدم إرسال إشعارات
UNPAID_ORDER_SEND_NOTIFICATIONS=false
```

---

### UNPAID_ORDER_CANCEL_MESSAGE
رسالة الإلغاء المخصصة. استخدم `{hours}` كمتغير للساعات.

**القيمة الافتراضية:** `تم إلغاء الطلب تلقائياً بسبب عدم الدفع خلال {hours} ساعة`

**أمثلة:**
```env
UNPAID_ORDER_CANCEL_MESSAGE=تم إلغاء طلبك تلقائياً بعد مرور {hours} ساعة بدون دفع

UNPAID_ORDER_CANCEL_MESSAGE=Order automatically cancelled after {hours} hours without payment
```

---

## مثال كامل لملف .env

```env
# إعدادات إلغاء الطلبات غير المدفوعة
UNPAID_ORDER_CANCEL_HOURS=72
UNPAID_ORDER_CRON_SCHEDULE=0 * * * *
UNPAID_ORDER_CANCEL_ENABLED=true
UNPAID_ORDER_SEND_NOTIFICATIONS=true
UNPAID_ORDER_CANCEL_MESSAGE=تم إلغاء الطلب تلقائياً بسبب عدم الدفع خلال {hours} ساعة
```

---

## ملاحظات مهمة

1. **إعادة التشغيل مطلوبة:** بعد تغيير أي متغير بيئي، يجب إعادة تشغيل الخادم.

2. **التحقق من الصلاحيات:** تأكد من أن قاعدة البيانات تدعم جميع الحقول المستخدمة (cancelledAt, cancellationReason, إلخ).

3. **المراقبة:** راجع السجلات بانتظام للتأكد من عمل المهمة بشكل صحيح.

4. **الاختبار:** استخدم `testCancelUnpaid.js` لاختبار المهمة قبل تفعيلها في الإنتاج.

5. **التوقيت:** صيغة Cron تستخدم التوقيت المحلي للخادم. تأكد من ضبط المنطقة الزمنية بشكل صحيح.
