const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const {
	createActivityTimelineRepository,
} = require("./activityTimeline.repository")

function createActivityTimelineService({ activityTimelineRepository } = {}) {
	const repository =
		activityTimelineRepository ||
		createActivityTimelineRepository(getSupabaseAdmin())

	return {
		async listActivityTimeline(filters = {}) {
			return repository.list(filters)
		},
	}
}

module.exports = {
	createActivityTimelineService,
}