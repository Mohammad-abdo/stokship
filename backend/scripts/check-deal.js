const prisma = require('../src/config/database');

async function checkDeal() {
    try {
        console.log('\n🔍 جاري فحص الصفقة...\n');

        const deal = await prisma.deal.findUnique({
            where: { id: '54ef94ed-cd94-43ab-a348-4ea97547e8de' },
            include: {
                payments: true,
                client: { select: { name: true } },
                trader: { select: { companyName: true } }
            }
        });

        if (!deal) {
            console.log('❌ الصفقة غير موجودة في قاعدة البيانات');
            return;
        }

        console.log('📦 معلومات الصفقة:\n');
        console.log('  رقم الصفقة:', deal.dealNumber);
        console.log('  الحالة:', deal.status);
        console.log('  العميل:', deal.client?.name || 'غير محدد');
        console.log('  التاجر:', deal.trader?.companyName || 'غير محدد');
        console.log('  تاريخ الإنشاء:', deal.createdAt);
        console.log('  تاريخ إرسال العرض (quoteSentAt):', deal.quoteSentAt || 'لم يتم إرسال عرض بعد');
        console.log('  عدد الدفعات:', deal.payments?.length || 0);

        if (deal.payments?.length > 0) {
            console.log('\n💰 الدفعات:');
            deal.payments.forEach((p, i) => {
                console.log(`  ${i + 1}. حالة: ${p.status}, المبلغ: ${p.amount}`);
            });
        }

        console.log('\n⏰ الوقت الحالي:', new Date().toLocaleString('ar-EG'));

        if (deal.quoteSentAt) {
            const diff = (new Date() - new Date(deal.quoteSentAt)) / 1000;
            console.log('⏱️  الفرق الزمني من إرسال العرض:', diff.toFixed(0), 'ثانية');
            console.log('⏱️  الفرق الزمني:', (diff / 60).toFixed(2), 'دقيقة');
            console.log('⏱️  الفرق الزمني:', (diff / 3600).toFixed(4), 'ساعة');

            console.log('\n📊 تحليل سبب عدم الإلغاء:\n');

            if (deal.status !== 'NEGOTIATION') {
                console.log('  ❌ الحالة ليست NEGOTIATION (الحالة الحالية:', deal.status + ')');
                console.log('  ℹ️  الـ cron job يلغي فقط الصفقات في حالة NEGOTIATION');
            } else {
                console.log('  ✅ الحالة هي NEGOTIATION');
            }

            if (!deal.quoteSentAt) {
                console.log('  ❌ لم يتم إرسال عرض سعر (quoteSentAt = null)');
                console.log('  ℹ️  الـ cron job يلغي فقط الصفقات التي تم إرسال عرض سعر لها');
            } else {
                console.log('  ✅ تم إرسال عرض السعر');
            }

            const hasCompletedPayment = deal.payments?.some(p => p.status === 'COMPLETED');
            if (hasCompletedPayment) {
                console.log('  ❌ توجد دفعة مكتملة');
                console.log('  ℹ️  الـ cron job لا يلغي الصفقات المدفوعة');
            } else {
                console.log('  ✅ لا توجد دفعة مكتملة');
            }

            // Check if 30 seconds have passed
            const configTime = 30 / 3600; // 30 seconds in hours
            if (diff < 30) {
                console.log(`  ⏳ لم يمر 30 ثانية بعد (مر ${diff.toFixed(0)} ثانية فقط)`);
                console.log(`  ℹ️  انتظر ${(30 - diff).toFixed(0)} ثانية أخرى`);
            } else {
                console.log(`  ✅ مر أكثر من 30 ثانية (${diff.toFixed(0)} ثانية)`);
            }
        } else {
            console.log('\n⚠️  لم يتم إرسال عرض سعر بعد (quoteSentAt = null)');
            console.log('ℹ️   الـ cron job يلغي فقط الصفقات التي تم إرسال عرض سعر لها');
        }

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

checkDeal();
