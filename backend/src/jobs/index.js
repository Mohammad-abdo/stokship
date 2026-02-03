const { cancelUnpaidOrdersJob } = require('./cancelUnpaidOrders');
const { testJob } = require('./testJob');
const { logger } = require('../utils/logger');

/**
 * تهيئة وتشغيل جميع المهام المجدولة
 */
const initScheduledJobs = () => {
  logger.info('بدء تهيئة المهام المجدولة...');

  // تشغيل job إلغاء الطلبات غير المدفوعة
  cancelUnpaidOrdersJob();

  // تشغيل Test Job (للتجربة - يعمل كل 30 ثانية)
  testJob();

  logger.info('تم تهيئة جميع المهام المجدولة بنجاح');
};

module.exports = { initScheduledJobs };
