const {
	createNotificationService,
} = require("../modules/notifications/notification.service")

async function flushNotificationOutbox(options = {}) {
	return createNotificationService().flushPending(options)
}

module.exports = {
	flushNotificationOutbox,
}
