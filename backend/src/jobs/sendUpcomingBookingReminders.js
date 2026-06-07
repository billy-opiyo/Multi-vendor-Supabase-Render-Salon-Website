const { env } = require("../config/env")
const {
	createNotificationService,
} = require("../modules/notifications/notification.service")

async function sendUpcomingBookingReminders(options = {}) {
	return createNotificationService().queueUpcomingBookingReminders({
		windowMinutes: env.UPCOMING_REMINDER_WINDOW_MINUTES,
		...options,
	})
}

module.exports = {
	sendUpcomingBookingReminders,
}
