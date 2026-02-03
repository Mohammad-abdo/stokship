const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * حجز كمية من منتج (Reserve Inventory)
 * @param {string} offerItemId - معرف المنتج في العرض
 * @param {number} quantity - الكمية المطلوب حجزها
 * @param {string} dealId - معرف الصفقة
 * @returns {Promise<Object>} - معلومات الحجز
 * @throws {Error} - إذا كانت الكمية غير كافية أو حدث خطأ
 */
async function reserveInventory(offerItemId, quantity, dealId) {
    try {
        logger.info(`📦 حجز مخزون: ${quantity} من المنتج ${offerItemId} للصفقة ${dealId}`);

        // التحقق من صحة المدخلات
        if (!offerItemId || !dealId) {
            throw new Error('معرف المنتج ومعرف الصفقة مطلوبان');
        }

        if (!quantity || quantity <= 0) {
            throw new Error('الكمية يجب أن تكون أكبر من صفر');
        }

        // الحصول على المنتج
        const offerItem = await prisma.offerItem.findUnique({
            where: { id: offerItemId }
        });

        if (!offerItem) {
            throw new Error(`المنتج ${offerItemId} غير موجود`);
        }

        // حساب الكمية المتاحة
        const availableQuantity = offerItem.quantity - (offerItem.reservedQuantity || 0);

        logger.info(`📊 الكمية الإجمالية: ${offerItem.quantity}, المحجوزة: ${offerItem.reservedQuantity}, المتاحة: ${availableQuantity}`);

        // التحقق من توفر الكمية
        if (availableQuantity < quantity) {
            throw new Error(
                `الكمية المتاحة غير كافية. المتاح: ${availableQuantity}, المطلوب: ${quantity}`
            );
        }

        // حجز الكمية في transaction واحد
        const [updatedOfferItem, reservation] = await prisma.$transaction([
            // زيادة الكمية المحجوزة
            prisma.offerItem.update({
                where: { id: offerItemId },
                data: {
                    reservedQuantity: {
                        increment: quantity
                    }
                }
            }),

            // إنشاء  سجل الحجز
            prisma.inventoryReservation.create({
                data: {
                    offerItemId,
                    dealId,
                    quantityReserved: quantity,
                    status: 'RESERVED',
                    reservedAt: new Date(),
                    notes: `تم حجز ${quantity} وحدة من المنتج ${offerItem.productName}`
                }
            })
        ]);

        logger.info(`✅ تم حجز ${quantity} وحدة بنجاح. الحجوزات الجديدة: ${updatedOfferItem.reservedQuantity}`);

        return {
            success: true,
            reservation,
            offerItem: updatedOfferItem,
            availableQuantity: updatedOfferItem.quantity - updatedOfferItem.reservedQuantity
        };

    } catch (error) {
        logger.error(`❌ فشل حجز المخزون: ${error.message}`, error);
        throw error;
    }
}

/**
 * إلغاء حجز المخزون لصفقة معينة (Release Inventory)
 * @param {string} dealId - معرف الصفقة
 * @returns {Promise<Object>} - معلومات الإلغاء
 */
async function releaseInventory(dealId) {
    try {
        logger.info(`🔓 إلغاء حجز المخزون للصفقة ${dealId}`);

        // الحصول على كل الحجوزات المرتبطة بالصفقة
        const reservations = await prisma.inventoryReservation.findMany({
            where: {
                dealId,
                status: 'RESERVED' // فقط الحجوزات النشطة
            },
            include: {
                offerItem: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        reservedQuantity: true
                    }
                }
            }
        });

        if (reservations.length === 0) {
            logger.info(`ℹ️  لا توجد حجوزات نشطة للصفقة ${dealId}`);
            return {
                success: true,
                releasedCount: 0,
                message: 'لا توجد حجوزات نشطة'
            };
        }

        logger.info(`📋 تم العثور على ${reservations.length} حجز نشط`);

        // إلغاء كل الحجوزات في transaction واحد
        const results = await prisma.$transaction(
            reservations.map((reservation) => {
                return prisma.$transaction([
                    // تقليل الكمية المحجوزة
                    prisma.offerItem.update({
                        where: { id: reservation.offerItemId },
                        data: {
                            reservedQuantity: {
                                decrement: reservation.quantityReserved
                            }
                        }
                    }),

                    // تحديث حالة الحجز إلى RELEASED
                    prisma.inventoryReservation.update({
                        where: { id: reservation.id },
                        data: {
                            status: 'RELEASED',
                            releasedAt: new Date(),
                            notes: `${reservation.notes || ''}\nتم الإلغاء تلقائياً`
                        }
                    })
                ]);
            }).flat()
        );

        const totalQuantityReleased = reservations.reduce(
            (sum, r) => sum + r.quantityReserved,
            0
        );

        logger.info(`✅ تم إلغاء حجز ${totalQuantityReleased} وحدة من ${reservations.length} منتج`);

        return {
            success: true,
            releasedCount: reservations.length,
            totalQuantityReleased,
            reservations
        };

    } catch (error) {
        logger.error(`❌ فشل إلغاء حجز المخزون: ${error.message}`, error);
        throw error;
    }
}

/**
 * تأكيد الحجز (عند الدفع) - Confirm Inventory
 * @param {string} dealId - معرف الصفقة
 * @returns {Promise<Object>} - معلومات التأكيد
 */
async function confirmInventory(dealId) {
    try {
        logger.info(`✔️  تأكيد حجز المخزون للصفقة ${dealId}`);

        // تحديث حالة جميع الحجوزات إلى CONFIRMED
        const result = await prisma.inventoryReservation.updateMany({
            where: {
                dealId,
                status: 'RESERVED'
            },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date()
            }
        });

        logger.info(`✅ تم تأكيد ${result.count} حجز للصفقة ${dealId}`);

        return {
            success: true,
            confirmedCount: result.count
        };

    } catch (error) {
        logger.error(`❌ فشل تأكيد حجز المخزون: ${error.message}`, error);
        throw error;
    }
}

/**
 * الحصول على الكمية المتاحة لمنتج
 * @param {string} offerItemId - معرف المنتج
 * @returns {Promise<Object>} - معلومات الكمية
 */
async function getAvailableQuantity(offerItemId) {
    try {
        const offerItem = await prisma.offerItem.findUnique({
            where: { id: offerItemId },
            select: {
                id: true,
                productName: true,
                quantity: true,
                reservedQuantity: true
            }
        });

        if (!offerItem) {
            throw new Error(`المنتج ${offerItemId} غير موجود`);
        }

        const availableQuantity = offerItem.quantity - (offerItem.reservedQuantity || 0);

        return {
            productId: offerItem.id,
            productName: offerItem.productName,
            totalQuantity: offerItem.quantity,
            reservedQuantity: offerItem.reservedQuantity || 0,
            availableQuantity,
            isAvailable: availableQuantity > 0
        };

    } catch (error) {
        logger.error(`❌ فشل الحصول على الكمية المتاحة: ${error.message}`, error);
        throw error;
    }
}

/**
 * الحصول على جميع الحجوزات لصفقة معينة
 * @param {string} dealId - معرف الصفقة
 * @returns {Promise<Array>} - قائمة الحجوزات
 */
async function getDealReservations(dealId) {
    try {
        const reservations = await prisma.inventoryReservation.findMany({
            where: { dealId },
            include: {
                offerItem: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        reservedQuantity: true,
                        unitPrice: true,
                        currency: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return reservations;

    } catch (error) {
        logger.error(`❌ فشل الحصول على حجوزات الصفقة: ${error.message}`, error);
        throw error;
    }
}

module.exports = {
    reserveInventory,
    releaseInventory,
    confirmInventory,
    getAvailableQuantity,
    getDealReservations
};
