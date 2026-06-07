const express = require("express")

const { requireAdmin } = require("../../middleware/requireAdmin")
const { requireAuth } = require("../../middleware/requireAuth")
const notificationController = require("./notification.controller")

const router = express.Router()

router.post(
	"/api/v1/admin/notifications/outbox/flush",
	requireAuth,
	requireAdmin("canManageSecurity"),
	notificationController.flushOutbox,
)

router.post(
	"/api/v1/admin/notifications/reminders/upcoming",
	requireAuth,
	requireAdmin("canManageBookings"),
	notificationController.queueUpcomingReminders,
)

module.exports = router
