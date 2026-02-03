const prisma = require('../config/database');

/**
 * Helper function to create notifications for users
 * @param {Object} options - Notification options
 * @param {Number|Array} options.userIds - Single user ID or array of user IDs
 * @param {String} options.userType - User type (ADMIN, EMPLOYEE, TRADER, CLIENT)
 * @param {String} options.type - Notification type (DEAL, NEGOTIATION, PAYMENT, OFFER, etc.)
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.relatedEntityType - Related entity type (DEAL, OFFER, PAYMENT, etc.)
 * @param {Number} options.relatedEntityId - Related entity ID
 * @returns {Promise<Array>} Created notifications
 */
async function createNotification(options) {
  const {
    userIds,
    userType,
    type,
    title,
    message,
    relatedEntityType = null,
    relatedEntityId = null
  } = options;

  if (!userIds || !userType || !type || !title || !message) {
    throw new Error('Missing required notification parameters');
  }

  // Convert single userId to array
  const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

  // Create notifications for all users
  const notifications = await Promise.all(
    userIdArray.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          userType,
          type,
          title,
          message,
          relatedEntityType,
          relatedEntityId,
          isRead: false
        }
      })
    )
  );

  return notifications;
}

/**
 * Notify when a deal is created
 * @param {Object} deal - Deal object
 * @param {Object} client - Client object
 * @param {Object} trader - Trader object
 * @param {Object} employee - Employee object
 */
async function notifyDealCreated(deal, client, trader, employee) {
  await Promise.all([
    // Notify trader
    createNotification({
      userIds: trader.id,
      userType: 'TRADER',
      type: 'DEAL',
      title: 'New Deal Request',
      message: `Client ${client.name} requested negotiation for deal ${deal.dealNumber}`,
      relatedEntityType: 'DEAL',
      relatedEntityId: deal.id
    }),
    // Notify employee (guarantor)
    createNotification({
      userIds: employee.id,
      userType: 'EMPLOYEE',
      type: 'DEAL',
      title: 'New Deal Request',
      message: `Client ${client.name} requested negotiation for deal ${deal.dealNumber}`,
      relatedEntityType: 'DEAL',
      relatedEntityId: deal.id
    })
  ]);
}

/**
 * Notify when deal status changes
 * @param {Object} deal - Deal object
 * @param {String} newStatus - New status
 * @param {String} changedByType - Who changed the status (TRADER, CLIENT, EMPLOYEE, ADMIN)
 */
async function notifyDealStatusChanged(deal, newStatus, changedByType) {
  if (!deal || !deal.id || !deal.dealNumber) {
    console.error('Invalid deal object provided to notifyDealStatusChanged');
    return;
  }

  const notifications = [];

  // Always notify trader and client
  if (deal.traderId) {
    notifications.push(
      createNotification({
        userIds: deal.traderId,
        userType: 'TRADER',
        type: 'DEAL',
        title: `Deal ${deal.dealNumber} Status Updated`,
        message: `Deal status changed to ${newStatus}`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      })
    );
  }

  if (deal.clientId) {
    notifications.push(
      createNotification({
        userIds: deal.clientId,
        userType: 'CLIENT',
        type: 'DEAL',
        title: `Deal ${deal.dealNumber} Status Updated`,
        message: `Deal status changed to ${newStatus}`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      })
    );
  }

  // Notify employee if status is approved/paid/settled
  if (['APPROVED', 'PAID', 'SETTLED'].includes(newStatus) && deal.employeeId) {
    notifications.push(
      createNotification({
        userIds: deal.employeeId,
        userType: 'EMPLOYEE',
        type: 'DEAL',
        title: `Deal ${deal.dealNumber} Status Updated`,
        message: `Deal status changed to ${newStatus}`,
        relatedEntityType: 'DEAL',
        relatedEntityId: deal.id
      })
    );
  }

  if (notifications.length > 0) {
    // Use allSettled to continue even if some notifications fail
    const results = await Promise.allSettled(notifications);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Error creating notification ${index}:`, result.reason);
      }
    });
  }
}

/**
 * Notify when payment is verified
 * @param {Object} payment - Payment object
 * @param {Object} deal - Deal object
 */
async function notifyPaymentVerified(payment, deal) {
  await Promise.all([
    // Notify trader
    createNotification({
      userIds: deal.traderId,
      userType: 'TRADER',
      type: 'PAYMENT',
      title: 'تم تحقق الدفع',
      message: `تم دفع الصفقة ${deal.dealNumber} والتحقق منها`,
      relatedEntityType: 'PAYMENT',
      relatedEntityId: payment.id
    }),
    // Notify client (اشعار مرئي انه تم دفع الصفقة)
    createNotification({
      userIds: deal.clientId,
      userType: 'CLIENT',
      type: 'PAYMENT',
      title: 'تم دفع الصفقة',
      message: `تم التحقق من دفعتك للصفقة ${deal.dealNumber}`,
      relatedEntityType: 'PAYMENT',
      relatedEntityId: payment.id
    }),
    // Notify employee (يظهر في داشبورد الموظف)
    createNotification({
      userIds: deal.employeeId,
      userType: 'EMPLOYEE',
      type: 'PAYMENT',
      title: 'تم دفع الصفقة',
      message: `تم التحقق من دفع الصفقة ${deal.dealNumber}`,
      relatedEntityType: 'PAYMENT',
      relatedEntityId: payment.id
    })
  ]);
}

/**
 * Notify when offer is created/updated
 * @param {Object} offer - Offer object (must include traderId and optionally trader.employeeId)
 * @param {String} action - Action type (CREATED, UPDATED, APPROVED, REJECTED, EXCEL_UPLOADED, DELETED)
 * @param {String} changedByType - Who made the change (TRADER, EMPLOYEE, ADMIN) - defaults to TRADER for CREATED
 */
async function notifyOfferAction(offer, action, changedByType = null) {
  const actionMessages = {
    CREATED: 'New offer created',
    UPDATED: 'Offer updated',
    APPROVED: 'Offer approved',
    REJECTED: 'Offer rejected',
    EXCEL_UPLOADED: 'Excel file uploaded',
    DELETED: 'Offer deleted'
  };

  const messages = {
    CREATED: `Your offer "${offer.title}" has been created successfully`,
    UPDATED: `Your offer "${offer.title}" has been updated`,
    APPROVED: `Your offer "${offer.title}" has been approved and is now active`,
    REJECTED: `Your offer "${offer.title}" has been rejected. Please review and update.`,
    EXCEL_UPLOADED: `Excel file has been uploaded for offer "${offer.title}"`,
    DELETED: `Your offer "${offer.title}" has been deleted`
  };

  // Determine who changed it - default to TRADER for CREATED
  const changedBy = changedByType || (action === 'CREATED' ? 'TRADER' : 'EMPLOYEE');

  // Always notify trader for all actions
  try {
    await createNotification({
      userIds: offer.traderId,
      userType: 'TRADER',
      type: 'OFFER',
      title: `Offer ${action}`,
      message: messages[action] || `Your offer "${offer.title}" has been ${action.toLowerCase()}`,
      relatedEntityType: 'OFFER',
      relatedEntityId: offer.id
    });
  } catch (error) {
    console.error('Error notifying trader:', error);
  }

  // Notify employee (guarantor) if action is CREATED or EXCEL_UPLOADED by trader
  if ((action === 'CREATED' || action === 'EXCEL_UPLOADED') && changedBy === 'TRADER') {
    // Get trader with employeeId
    const trader = await prisma.trader.findUnique({
      where: { id: offer.traderId },
      select: { employeeId: true, name: true }
    });

    if (trader && trader.employeeId) {
      try {
        await createNotification({
          userIds: trader.employeeId,
          userType: 'EMPLOYEE',
          type: 'OFFER',
          title: `New Offer ${action}`,
          message: action === 'CREATED' 
            ? `Trader ${trader.name} created a new offer "${offer.title}" that needs validation`
            : `Trader ${trader.name} uploaded an Excel file for offer "${offer.title}" that needs validation`,
          relatedEntityType: 'OFFER',
          relatedEntityId: offer.id
        });
      } catch (error) {
        console.error('Error notifying employee:', error);
      }
    }
  }

  // Notify admins for important offer actions
  if (['CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'DELETED'].includes(action)) {
    try {
      await notifyAdmin(
        'OFFER',
        `Offer ${action}`,
        `Offer "${offer.title}" has been ${action.toLowerCase()} by ${changedBy}`,
        'OFFER',
        offer.id
      );
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }
}

/**
 * Notify when a negotiation message is sent
 * @param {Object} deal - Deal object
 * @param {Number} senderId - Sender user ID
 * @param {String} senderType - Sender type (TRADER or CLIENT)
 */
async function notifyNegotiationMessage(deal, senderId, senderType) {
  const recipientId = senderType === 'CLIENT' ? deal.traderId : deal.clientId;
  const recipientType = senderType === 'CLIENT' ? 'TRADER' : 'CLIENT';

  await Promise.all([
    // Notify recipient
    createNotification({
      userIds: recipientId,
      userType: recipientType,
      type: 'NEGOTIATION',
      title: 'New Negotiation Message',
      message: `You have a new message in deal ${deal.dealNumber}`,
      relatedEntityType: 'DEAL',
      relatedEntityId: deal.id
    }),
    // Notify employee (guarantor)
    createNotification({
      userIds: deal.employeeId,
      userType: 'EMPLOYEE',
      type: 'NEGOTIATION',
      title: 'New Negotiation Message',
      message: `New message in deal ${deal.dealNumber} between trader and client`,
      relatedEntityType: 'DEAL',
      relatedEntityId: deal.id
    })
  ]);
}

/**
 * Notify admin about important actions
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedEntityType - Related entity type
 * @param {Number} relatedEntityId - Related entity ID
 */
async function notifyAdmin(type, title, message, relatedEntityType = null, relatedEntityId = null) {
  // Get all admin users
  const admins = await prisma.admin.findMany({
    where: { isActive: true }
  });

  if (admins.length > 0) {
    const adminIds = admins.map(admin => admin.id);
    await createNotification({
      userIds: adminIds,
      userType: 'ADMIN',
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId
    });
  }
}

module.exports = {
  createNotification,
  notifyDealCreated,
  notifyDealStatusChanged,
  notifyPaymentVerified,
  notifyOfferAction,
  notifyNegotiationMessage,
  notifyAdmin
};

