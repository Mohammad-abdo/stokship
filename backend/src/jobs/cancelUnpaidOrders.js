const cron = require('node-cron');
const prisma = require('../config/database');
const { logger } = require('../utils/logger');
const config = require('./config');
const { releaseInventory } = require('../services/inventory.service');

/**
 * Job لإلغاء الصفقات غير المدفوعة بعد المدة المحددة
 * يعمل حسب الجدول المحدد في الإعدادات
 */
const cancelUnpaidOrdersJob = () => {
  // التحقق من تفعيل المهمة
  if (!config.cancelUnpaidOrders.enabled) {
    logger.info('مهمة إلغاء الصفقات غير المدفوعة معطلة في الإعدادات');
    return;
  }

  const { hoursBeforeCancel, cronSchedule, sendNotifications, cancellationMessage } = config.cancelUnpaidOrders;

  cron.schedule(cronSchedule, async () => {
    try {
      logger.info(`بدء فحص الصفقات (Deals) غير المدفوعة (المدة: ${hoursBeforeCancel} ساعة)...`);

      // حساب الوقت قبل المدة المحددة من الآن
      const cutoffTime = new Date();
      cutoffTime.setTime(cutoffTime.getTime() - (hoursBeforeCancel * 60 * 60 * 1000)); // More precise calculation

      console.log('\n========================================');
      console.log(`🔍 فحص الصفقات غير المدفوعة`);
      console.log(`⏰ الوقت الحالي: ${new Date().toLocaleString('ar-EG')}`);
      console.log(`📅 وقت القطع (cutoff): ${cutoffTime.toLocaleString('ar-EG')}`);
      console.log(`⏱️  المدة: ${hoursBeforeCancel} ساعة (${hoursBeforeCancel * 3600} ثانية)`);
      console.log('========================================\n');

      // البحث عن الصفقات التي:
      // 1. تم إرسال عرض السعر لها (quoteSentAt) قبل أكثر من المدة المحددة
      // 2. حالتها NEGOTIATION أو APPROVED (لم يتم الدفع بعد)
      // 3. لا يوجد لها دفعة مكتملة (COMPLETED)
      const unpaidDeals = await prisma.deal.findMany({
        where: {
          quoteSentAt: {
            not: null,
            lt: cutoffTime
          },
          status: {
            in: ['NEGOTIATION', 'APPROVED'] // Cancel both negotiation and approved unpaid deals
          },
          // التحقق من عدم وجود دفعة مكتملة
          payments: {
            none: {
              status: 'COMPLETED'
            }
          }
        },
        include: {
          payments: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          trader: {
            select: {
              id: true,
              name: true,
              companyName: true
            }
          }
        }
      });

      if (unpaidDeals.length === 0) {
        logger.info('لا توجد صفقات غير مدفوعة تحتاج إلى إلغاء');
        console.log('✅ لا توجد صفقات غير مدفوعة تحتاج إلى إلغاء\n');
        return;
      }

      logger.info(`تم العثور على ${unpaidDeals.length} صفقات غير مدفوعة`);
      console.log(`\n📦 تم العثور على ${unpaidDeals.length} صفقات غير مدفوعة:\n`);

      // إلغاء كل صفقة
      for (const deal of unpaidDeals) {
        try {
          console.log(`\n🔄 معالجة الصفقة: ${deal.dealNumber}`);
          console.log(`   - العميل: ${deal.client?.name || 'غير معروف'}`);
          console.log(`   - التاجر: ${deal.trader?.companyName || 'غير معروف'}`);
          console.log(`   - تاريخ إرسال العرض: ${deal.quoteSentAt?.toLocaleString('ar-EG') || 'غير محدد'}`);

          // ⭐ إرجاع المخزون المحجوز - جديد
          try {
            const releaseResult = await releaseInventory(deal.id);
            if (releaseResult.releasedCount > 0) {
              console.log(`   📦 تم إرجاع ${releaseResult.totalQuantityReleased} وحدة من ${releaseResult.releasedCount} منتج إلى المخزون`);
            }
          } catch (releaseError) {
            console.warn(`   ⚠️  تحذير: فشل إرجاع المخزون: ${releaseError.message}`);
            // نكمل عملية الإلغاء حتى لو فشل إرجاع المخزون
          }

          // تحديث حالة الصفقة إلى CANCELLED
          await prisma.deal.update({
            where: { id: deal.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: cancellationMessage
            }
          });

          // إنشاء سجل تتبع للإلغاء
          await prisma.dealStatusHistory.create({
            data: {
              dealId: deal.id,
              status: 'CANCELLED',
              description: cancellationMessage,
              changedByType: 'SYSTEM'
            }
          });

          // إرسال إشعار للعميل (إذا كان مفعّل في الإعدادات)
          if (sendNotifications && deal.client) {
            try {
              await prisma.notification.create({
                data: {
                  userId: deal.clientId,
                  userType: 'CLIENT',
                  type: 'DEAL',
                  title: 'تم إلغاء الصفقة',
                  message: `تم إلغاء صفقتك رقم ${deal.dealNumber} تلقائياً - ${cancellationMessage}`,
                  relatedEntityType: 'DEAL',
                  relatedEntityId: deal.id.toString()
                }
              });
              console.log(`   ✅ تم إرسال إشعار للعميل`);
            } catch (notifError) {
              logger.error(`فشل في إرسال إشعار للصفقة ${deal.dealNumber}:`, notifError);
              console.log(`   ❌ فشل إرسال الإشعار`);
            }
          }

          logger.info(`تم إلغاء الصفقة ${deal.dealNumber} (ID: ${deal.id})`);
          console.log(`   ✅ تم إلغاء الصفقة بنجاح`);
        } catch (error) {
          logger.error(`فشل في إلغاء الصفقة ${deal.dealNumber}:`, error);
          console.log(`   ❌ فشل في إلغاء الصفقة: ${error.message}`);
        }
      }

      logger.info(`اكتمل فحص الصفقات. تم إلغاء ${unpaidDeals.length} صفقات`);
      console.log(`\n✅ اكتمل فحص الصفقات. تم إلغاء ${unpaidDeals.length} صفقات\n`);
      console.log('========================================\n');
    } catch (error) {
      logger.error('خطأ في job إلغاء الصفقات غير المدفوعة:', error);
      console.error('❌ خطأ في job إلغاء الصفقات غير المدفوعة:', error);
    }
  });

  logger.info(`تم تفعيل job إلغاء الصفقات غير المدفوعة - الجدول: ${cronSchedule} - المدة: ${hoursBeforeCancel} ساعة`);
  console.log(`\n✅ تم تفعيل job إلغاء الصفقات غير المدفوعة`);
  console.log(`⏰ الجدول: ${cronSchedule}`);
  console.log(`⏱️  المدة: ${hoursBeforeCancel} ساعة (${hoursBeforeCancel * 3600} ثانية)\n`);
};

module.exports = { cancelUnpaidOrdersJob };

