const { env } = require("../config/env")
const {
	createNotificationService,
} = require("../modules/notifications/notification.service")

async function sendUpcomingBookingReminders(options = {}) {
	return createNotificationService().queueUpcomingBookingReminders({
		leadTimeMinutes: env.UPCOMING_REMINDER_LEAD_TIME_MINUTES,
		windowMinutes: env.UPCOMING_REMINDER_WINDOW_MINUTES,
		...options,
	})
}

module.exports = {
	sendUpcomingBookingReminders,
}
