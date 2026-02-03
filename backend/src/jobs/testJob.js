const cron = require('node-cron');
const { logger } = require('../utils/logger');

/**
 * Test Cron Job - يعمل كل 30 ثانية للتجربة
 * Test Cron Job - Runs every 30 seconds for testing
 */
const testJob = () => {
    // عداد لتتبع عدد مرات التشغيل
    let runCount = 0;

    // Cron schedule: كل 30 ثانية
    // */30 * * * * * - الرمز الأخير للثواني
    cron.schedule('*/30 * * * * *', async () => {
        try {
            runCount++;
            const now = new Date();
            const timeString = now.toLocaleTimeString('ar-EG');

            // طباعة رسالة في الـ CMD
            console.log('\n========================================');
            console.log(`🔔 Test Cron Job - التشغيل #${runCount}`);
            console.log(`⏰ الوقت: ${timeString}`);
            console.log(`📅 التاريخ: ${now.toLocaleDateString('ar-EG')}`);
            console.log(`✅ الـ Cron Job يعمل بنجاح!`);
            console.log('========================================\n');

            // أيضاً تسجيل في الـ logger
            logger.info(`Test Cron Job executed - Run #${runCount} at ${timeString}`);

            // محاكاة عمل يستغرق 30 ثانية (للتجربة)
            const startTime = Date.now();

            // يمكنك هنا إضافة أي كود تريد اختباره
            // مثلاً: استعلام قاعدة بيانات، إرسال بريد إلكتروني، إلخ.

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            console.log(`⏱️  مدة التنفيذ: ${duration} ثانية\n`);

        } catch (error) {
            console.error('❌ خطأ في Test Cron Job:', error);
            logger.error('Error in test cron job:', error);
        }
    });

    console.log('\n✅ تم تفعيل Test Cron Job - يعمل كل 30 ثانية');
    console.log('⏰ سيتم تشغيله أول مرة بعد 30 ثانية من الآن\n');
    logger.info('Test Cron Job activated - Runs every 30 seconds');
};

module.exports = { testJob };
