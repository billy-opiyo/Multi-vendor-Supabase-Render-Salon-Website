const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const { createNotificationService } = require("./notification.service")
const {
	flushOutboxSchema,
	upcomingReminderSchema,
} = require("./notification.validators")

const flushOutbox = asyncHandler(async (req, res) => {
	const payload = parseRequest(flushOutboxSchema, req.body || {})
	const result = await createNotificationService().flushPending(payload)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const queueUpcomingReminders = asyncHandler(async (req, res) => {
	const payload = parseRequest(upcomingReminderSchema, req.body || {})
	const result =
		await createNotificationService().queueUpcomingBookingReminders(payload)

	res.status(202).json({
		ok: true,
		data: result,
	})
})

module.exports = {
	flushOutbox,
	queueUpcomingReminders,
}
