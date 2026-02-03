/**
 * ملف اختبار يدوي لوظيفة إلغاء الطلبات غير المدفوعة
 * قم بتشغيله بشكل مباشر لاختبار الوظيفة بدون انتظار الـ cron schedule
 * 
 * الاستخدام: node src/jobs/testCancelUnpaid.js
 */

require('dotenv').config();
const prisma = require('../config/database');
const { logger } = require('../utils/logger');

async function testCancelUnpaidOrders() {
  try {
    logger.info('=== بدء الاختبار اليدوي لإلغاء الطلبات غير المدفوعة ===');

    // حساب الوقت قبل 72 ساعة من الآن
    const seventyTwoHoursAgo = new Date();
    seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

    logger.info(`البحث عن الطلبات المنشأة قبل: ${seventyTwoHoursAgo.toISOString()}`);

    // البحث عن الطلبات غير المدفوعة
    const unpaidOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          lt: seventyTwoHoursAgo
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED', 'PAYMENT_CONFIRMED']
        },
        OR: [
          {
            payments: {
              none: {
                status: 'COMPLETED'
              }
            }
          },
          {
            payments: {
              none: {}
            }
          }
        ]
      },
      include: {
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    logger.info(`عدد الطلبات المعثور عليها: ${unpaidOrders.length}`);

    if (unpaidOrders.length === 0) {
      logger.info('لا توجد طلبات تحتاج إلى إلغاء');
      logger.info('=== انتهى الاختبار ===');
      process.exit(0);
      return;
    }

    // عرض تفاصيل الطلبات
    console.log('\n📋 الطلبات التي سيتم إلغاؤها:');
    unpaidOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. الطلب: ${order.orderNumber}`);
      console.log(`   - تاريخ الإنشاء: ${order.createdAt.toISOString()}`);
      console.log(`   - الحالة الحالية: ${order.status}`);
      console.log(`   - المبلغ: ${order.totalAmount}`);
      console.log(`   - المستخدم: ${order.user?.name || 'غير محدد'}`);
      console.log(`   - عدد الدفعات: ${order.payments.length}`);
      if (order.payments.length > 0) {
        order.payments.forEach((payment, idx) => {
          console.log(`      دفعة ${idx + 1}: ${payment.status} - ${payment.amount}`);
        });
      }
    });

    // طلب تأكيد من المستخدم
    console.log('\n⚠️  هل تريد المتابعة وإلغاء هذه الطلبات؟');
    console.log('   للمتابعة: أضف --confirm كمعامل عند التشغيل');
    console.log('   مثال: node src/jobs/testCancelUnpaid.js --confirm\n');

    if (!process.argv.includes('--confirm')) {
      logger.info('تم الإلغاء - لم يتم تأكيد العملية');
      logger.info('=== انتهى الاختبار ===');
      process.exit(0);
      return;
    }

    // تنفيذ الإلغاء
    logger.info('بدء عملية الإلغاء...');
    let successCount = 0;
    let errorCount = 0;

    for (const order of unpaidOrders) {
      try {
        // تحديث حالة الطلب
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: 'تم إلغاء الطلب تلقائياً بسبب عدم الدفع خلال 72 ساعة (اختبار يدوي)'
          }
        });

        // إنشاء سجل تتبع
        await prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: 'CANCELLED',
            description: 'تم إلغاء الطلب تلقائياً بسبب عدم الدفع خلال 72 ساعة (اختبار يدوي)',
            updatedByType: 'SYSTEM'
          }
        });

        // إرسال إشعار
        try {
          await prisma.notification.create({
            data: {
              userId: order.userId,
              userType: 'USER',
              type: 'ORDER',
              title: 'تم إلغاء الطلب',
              message: `تم إلغاء طلبك رقم ${order.orderNumber} تلقائياً بسبب عدم الدفع خلال 72 ساعة`,
              relatedEntityType: 'ORDER',
              relatedEntityId: order.id.toString()
            }
          });
        } catch (notifError) {
          logger.warn(`فشل في إرسال إشعار للطلب ${order.orderNumber}`);
        }

        logger.info(`✓ تم إلغاء الطلب ${order.orderNumber}`);
        successCount++;
      } catch (error) {
        logger.error(`✗ فشل في إلغاء الطلب ${order.orderNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 النتائج:');
    console.log(`   - نجح: ${successCount}`);
    console.log(`   - فشل: ${errorCount}`);
    console.log(`   - الإجمالي: ${unpaidOrders.length}`);

    logger.info('=== انتهى الاختبار بنجاح ===');
    process.exit(0);
  } catch (error) {
    logger.error('خطأ في الاختبار:', error);
    process.exit(1);
  }
}

// تشغيل الاختبار
testCancelUnpaidOrders();
