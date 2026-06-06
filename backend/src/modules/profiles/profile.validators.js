const { z } = require("zod")

const nullableTrimmedString = (maxLength) =>
	z.preprocess(
		(value) => (typeof value === "string" ? value.trim() : value),
		z.string().min(1).max(maxLength).nullable().optional(),
	)

const profilePayloadSchema = z
	.object({
		display_name: nullableTrimmedString(120),
		phone: nullableTrimmedString(50),
		avatar_url: nullableTrimmedString(2048),
		metadata: z.record(z.string(), z.unknown()).optional(),
	})
	.strict()

function normalizeProfilePayload(payload = {}) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return payload
	}

	const normalized = { ...payload }

	if (
		normalized.displayName !== undefined &&
		normalized.display_name === undefined
	) {
		normalized.display_name = normalized.displayName
	}

	if (
		normalized.avatarUrl !== undefined &&
		normalized.avatar_url === undefined
	) {
		normalized.avatar_url = normalized.avatarUrl
	}

	delete normalized.displayName
	delete normalized.avatarUrl

	return normalized
}

module.exports = {
	normalizeProfilePayload,
	profilePayloadSchema,
}
