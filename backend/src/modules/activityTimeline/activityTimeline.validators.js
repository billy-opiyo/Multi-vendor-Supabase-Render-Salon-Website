const { z } = require("zod")

const nullableUuid = z.preprocess((value) => {
	if (typeof value === "string") {
		const trimmed = value.trim()
		return trimmed === "" || trimmed === "null" ? null : trimmed
	}

	return value
}, z.string().uuid().nullable().optional())

const activityTimelineQuerySchema = z
	.object({
		tenant_id: nullableUuid,
		user_id: z.string().uuid().optional(),
		actor_user_id: z.string().uuid().optional(),
		activity_type: z.string().trim().min(1).max(120).optional(),
		entity_type: z.string().trim().min(1).max(120).optional(),
		limit: z.coerce.number().int().min(1).max(200).default(50),
		offset: z.coerce.number().int().min(0).default(0),
	})
	.strict()

function normalizeActivityTimelinePayload(payload = {}) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return payload
	}

	const normalized = { ...payload }
	const aliases = {
		tenantId: "tenant_id",
		userId: "user_id",
		actorUserId: "actor_user_id",
		activityType: "activity_type",
		entityType: "entity_type",
	}

	for (const [from, to] of Object.entries(aliases)) {
		if (normalized[from] !== undefined && normalized[to] === undefined) {
			normalized[to] = normalized[from]
		}
		delete normalized[from]
	}

	return normalized
}

module.exports = {
	activityTimelineQuerySchema,
	normalizeActivityTimelinePayload,
}