const {
	createNotificationService,
} = require("../modules/notifications/notification.service")

async function syncWaitlistSlotOpenNotifications(options = {}) {
	return createNotificationService().queueWaitlistSlotOpenNotificationsForRecentlyReleasedSlots(
		options,
	)
}

module.exports = {
	syncWaitlistSlotOpenNotifications,
}
