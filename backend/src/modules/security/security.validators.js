const { z } = require("zod")

const {
	ACCOUNT_CHANGE_TYPES,
	ADMIN_SECURITY_ACTIONS,
	DEFAULT_SECURITY_LIMIT,
	DEVICE_TYPES,
	LOGIN_METHODS,
	LOGIN_STATUSES,
	MAX_SECURITY_LIMIT,
	RISK_LEVELS,
	SECURITY_ALERT_STATUSES,
} = require("./security.constants")

const nullableUuid = z.preprocess((value) => {
	if (typeof value === "string") {
		const trimmed = value.trim()
		return trimmed === "" || trimmed === "null" ? null : trimmed
	}

	return value
}, z.string().uuid().nullable().optional())

const optionalUuid = z.string().uuid().optional()
const metadataSchema = z.record(z.string(), z.unknown()).default({})
const optionalMetadataSchema = z.record(z.string(), z.unknown()).optional()

const optionalTrimmedString = (maxLength) =>
	z.preprocess((value) => {
		if (typeof value !== "string") {
			return value
		}

		const trimmed = value.trim()
		return trimmed.length === 0 ? undefined : trimmed
	}, z.string().min(1).max(maxLength).optional())

const nullableJson = z.unknown().optional()

const paginationShape = {
	tenant_id: nullableUuid,
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_SECURITY_LIMIT)
		.default(DEFAULT_SECURITY_LIMIT),
	offset: z.coerce.number().int().min(0).default(0),
}

const loginActivitySchema = z
	.object({
		tenant_id: nullableUuid,
		login_method: z.enum(LOGIN_METHODS).default("unknown"),
		status: z.enum(LOGIN_STATUSES).default("success"),
		device_type: z.enum(DEVICE_TYPES).default("unknown"),
		browser: optionalTrimmedString(80),
		country: optionalTrimmedString(80),
		locale: optionalTrimmedString(40),
		timezone: optionalTrimmedString(80),
		source: optionalTrimmedString(80),
		failure_code: optionalTrimmedString(80),
		attempted_email: z.string().trim().email().toLowerCase().optional(),
		metadata: metadataSchema,
	})
	.strict()

const accountSecurityChangeSchema = z
	.object({
		tenant_id: nullableUuid,
		change_type: z.enum(ACCOUNT_CHANGE_TYPES),
		old_value: nullableJson,
		new_value: nullableJson,
		details: optionalTrimmedString(280),
		source: optionalTrimmedString(80),
		metadata: metadataSchema,
	})
	.strict()

const securityListQuerySchema = z
	.object({
		...paginationShape,
		user_id: optionalUuid,
		email: z.string().trim().email().toLowerCase().optional(),
		status: z.string().trim().min(1).max(80).optional(),
		risk_level: z.enum(RISK_LEVELS).optional(),
		from: optionalTrimmedString(40),
		to: optionalTrimmedString(40),
	})
	.strict()

const securityAlertListQuerySchema = z
	.object({
		...paginationShape,
		user_id: optionalUuid,
		status: z.enum(SECURITY_ALERT_STATUSES).optional(),
		severity: z.enum(RISK_LEVELS).optional(),
		alert_type: z.string().trim().min(1).max(120).optional(),
	})
	.strict()

const securityActionListQuerySchema = z
	.object({
		...paginationShape,
		target_user_id: optionalUuid,
		actor_user_id: optionalUuid,
		action: z.enum(ADMIN_SECURITY_ACTIONS).optional(),
	})
	.strict()

const accountChangeListQuerySchema = z
	.object({
		...paginationShape,
		user_id: optionalUuid,
		change_type: z.enum(ACCOUNT_CHANGE_TYPES).optional(),
	})
	.strict()

const securityAlertParamsSchema = z.object({
	alertId: z.string().uuid(),
})

const securityAlertStatusSchema = z
	.object({
		status: z.enum(SECURITY_ALERT_STATUSES),
		metadata: optionalMetadataSchema,
	})
	.strict()

const securityTargetUserParamsSchema = z.object({
	userId: z.string().uuid(),
})

const adminSecurityRestrictionSchema = z
	.object({
		tenant_id: nullableUuid,
		action: z.enum(ADMIN_SECURITY_ACTIONS),
		reason: optionalTrimmedString(240),
		block_minutes: z.coerce.number().int().min(5).max(10080).default(60),
		metadata: metadataSchema,
	})
	.strict()

function normalizeSecurityPayload(payload = {}) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return payload
	}

	const normalized = { ...payload }
	const aliases = {
		tenantId: "tenant_id",
		loginMethod: "login_method",
		method: "login_method",
		deviceType: "device_type",
		failureCode: "failure_code",
		attemptedEmail: "attempted_email",
		changeType: "change_type",
		oldValue: "old_value",
		newValue: "new_value",
		blockMinutes: "block_minutes",
		riskLevel: "risk_level",
		userId: "user_id",
		targetUserId: "target_user_id",
		actorUserId: "actor_user_id",
		alertType: "alert_type",
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
	accountChangeListQuerySchema,
	accountSecurityChangeSchema,
	adminSecurityRestrictionSchema,
	loginActivitySchema,
	normalizeSecurityPayload,
	securityActionListQuerySchema,
	securityAlertListQuerySchema,
	securityAlertParamsSchema,
	securityAlertStatusSchema,
	securityListQuerySchema,
	securityTargetUserParamsSchema,
}