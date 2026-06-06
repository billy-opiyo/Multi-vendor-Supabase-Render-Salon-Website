const { z } = require("zod")

const permissionSchema = z
	.object({
		canManageAdmins: z.boolean().optional(),
		canManageBookings: z.boolean().optional(),
		canManageContent: z.boolean().optional(),
		canManageSecurity: z.boolean().optional(),
	})
	.strict()

const nullableTrimmedString = (maxLength) =>
	z.preprocess(
		(value) => (typeof value === "string" ? value.trim() : value),
		z.string().min(1).max(maxLength).nullable().optional(),
	)

const nullableUuid = z.string().uuid().nullable().optional()

const adminCreateSchema = z
	.object({
		user_id: z.string().uuid(),
		tenant_id: nullableUuid,
		email: z.string().trim().email().optional(),
		display_name: nullableTrimmedString(120),
		role: z.enum(["super_admin", "admin"]).default("admin"),
		permissions: permissionSchema.optional(),
		active: z.boolean().default(true),
	})
	.strict()

const adminUpdateSchema = z
	.object({
		tenant_id: nullableUuid,
		email: z.string().trim().email().optional(),
		display_name: nullableTrimmedString(120),
		role: z.enum(["super_admin", "admin"]).optional(),
		permissions: permissionSchema.optional(),
		active: z.boolean().optional(),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one admin field must be provided.",
	})

const adminParamsSchema = z.object({
	adminUserId: z.string().uuid(),
})

const adminListQuerySchema = z
	.object({
		active: z.enum(["true", "false"]).optional(),
		role: z.enum(["super_admin", "admin"]).optional(),
	})
	.strict()
	.transform((value) => ({
		...value,
		active: value.active === undefined ? undefined : value.active === "true",
	}))

function normalizeAdminPayload(payload = {}) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return payload
	}

	const normalized = { ...payload }

	if (normalized.userId !== undefined && normalized.user_id === undefined) {
		normalized.user_id = normalized.userId
	}

	if (normalized.tenantId !== undefined && normalized.tenant_id === undefined) {
		normalized.tenant_id = normalized.tenantId
	}

	if (
		normalized.displayName !== undefined &&
		normalized.display_name === undefined
	) {
		normalized.display_name = normalized.displayName
	}

	delete normalized.userId
	delete normalized.tenantId
	delete normalized.displayName

	return normalized
}

module.exports = {
	adminCreateSchema,
	adminListQuerySchema,
	adminParamsSchema,
	adminUpdateSchema,
	normalizeAdminPayload,
	permissionSchema,
}
