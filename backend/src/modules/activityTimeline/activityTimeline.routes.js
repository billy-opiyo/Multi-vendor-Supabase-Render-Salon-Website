const express = require("express")

const { requireAdmin } = require("../../middleware/requireAdmin")
const { requireAuth } = require("../../middleware/requireAuth")
const activityTimelineController = require("./activityTimeline.controller")

const router = express.Router()

router.get(
	"/api/v1/admin/activity-timeline",
	requireAuth,
	requireAdmin(),
	activityTimelineController.listAdminActivityTimeline,
)

module.exports = router