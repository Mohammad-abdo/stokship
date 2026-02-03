/**
 * إعدادات المهام المجدولة
 * يمكن تعديل هذه الإعدادات حسب الحاجة
 */

module.exports = {
  // إعدادات إلغاء الطلبات غير المدفوعة
  cancelUnpaidOrders: {
    // المدة الزمنية قبل إلغاء الطلب
    // للإنتاج: 72 ساعة
    hoursBeforeCancel: parseInt(process.env.UNPAID_ORDER_CANCEL_HOURS) || 72,

    // جدول تشغيل الـ cron
    // للإنتاج: كل ساعة = '0 * * * *'
    // '0 * * * *' = كل ساعة
    // '0 */6 * * *' = كل 6 ساعات
    // '0 0 * * *' = كل يوم في منتصف الليل
    // '*/30 * * * *' = كل 30 دقيقة
    // '*/30 * * * * *' = كل 30 ثانية (للتجربة فقط)
    cronSchedule: process.env.UNPAID_ORDER_CRON_SCHEDULE || '0 * * * *', // Every hour (production)

    // تفعيل/تعطيل المهمة
    enabled: process.env.UNPAID_ORDER_CANCEL_ENABLED !== 'false',

    // إرسال إشعارات للمستخدمين
    sendNotifications: process.env.UNPAID_ORDER_SEND_NOTIFICATIONS !== 'false',

    // رسالة الإلغاء المخصصة (تظهر للعميل 72 ساعة)
    cancellationMessage: process.env.UNPAID_ORDER_CANCEL_MESSAGE ||
      'تم إلغاء الطلب تلقائياً بسبب عدم الدفع خلال 72 ساعة'
  }
};
