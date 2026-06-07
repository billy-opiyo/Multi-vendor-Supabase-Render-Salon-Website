const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const {
	createActivityTimelineService,
} = require("./activityTimeline.service")
const {
	activityTimelineQuerySchema,
	normalizeActivityTimelinePayload,
} = require("./activityTimeline.validators")

const listAdminActivityTimeline = asyncHandler(async (req, res) => {
	const filters = parseRequest(
		activityTimelineQuerySchema,
		normalizeActivityTimelinePayload(req.query),
		{ message: "Invalid activity timeline filters." },
	)
	const activityTimeline =
		await createActivityTimelineService().listActivityTimeline(filters)

	res.status(200).json({
		ok: true,
		data: { activityTimeline },
	})
})

module.exports = {
	listAdminActivityTimeline,
}