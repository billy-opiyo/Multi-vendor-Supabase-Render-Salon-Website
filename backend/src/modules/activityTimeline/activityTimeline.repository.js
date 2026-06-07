const { throwSupabaseError } = require("../../utils/supabaseErrors")

const ACTIVITY_TIMELINE_SELECT =
	"id, tenant_id, user_id, actor_user_id, activity_type, title, description, entity_type, entity_id, entity_key, metadata, created_at"

function applyNullableTenantFilter(query, tenantId) {
	if (tenantId === undefined) return query
	return tenantId ? query.eq("tenant_id", tenantId) : query.is("tenant_id", null)
}

function createActivityTimelineRepository(supabase) {
	return {
		async list(filters = {}) {
			let query = supabase
				.from("activity_timeline")
				.select(ACTIVITY_TIMELINE_SELECT)
				.order("created_at", { ascending: false })
				.range(
					filters.offset || 0,
					(filters.offset || 0) + (filters.limit || 50) - 1,
				)

			query = applyNullableTenantFilter(query, filters.tenant_id)
			if (filters.user_id) query = query.eq("user_id", filters.user_id)
			if (filters.actor_user_id) query = query.eq("actor_user_id", filters.actor_user_id)
			if (filters.activity_type) query = query.eq("activity_type", filters.activity_type)
			if (filters.entity_type) query = query.eq("entity_type", filters.entity_type)

			const { data, error } = await query

			throwSupabaseError(
				error,
				500,
				"activity_timeline_list_failed",
				"Unable to list activity timeline events.",
			)

			return data || []
		},
	}
}

module.exports = {
	ACTIVITY_TIMELINE_SELECT,
	createActivityTimelineRepository,
}