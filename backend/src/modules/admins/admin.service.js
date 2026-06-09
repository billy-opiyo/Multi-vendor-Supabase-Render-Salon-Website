const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const { ApiError } = require("../../utils/errors")
const { hasOwn, pickDefined } = require("../../utils/validation")
const {
	DEFAULT_ADMIN_PERMISSIONS,
	getPermissionsForRole,
	sanitizeAdminUser,
} = require("./admin.constants")
const { createAdminRepository } = require("./admin.repository")

const PRIVILEGE_FIELDS = ["role", "permissions", "active"]

function assertActorCanAssignRole(actorAdmin, role) {
	if (role === "super_admin" && actorAdmin.role !== "super_admin") {
		throw new ApiError(
			403,
			"super_admin_required",
			"Only a super admin can assign the super_admin role.",
		)
	}
}

function includesPrivilegeField(payload) {
	return PRIVILEGE_FIELDS.some((field) => hasOwn(payload, field))
}

function valuesDiffer(before, after) {
	return JSON.stringify(before) !== JSON.stringify(after)
}

function buildAuditChanges(before, after) {
	const fields = [
		"tenant_id",
		"email",
		"display_name",
		"role",
		"permissions",
		"active",
	]
	const changes = {}

	for (const field of fields) {
		if (valuesDiffer(before?.[field] ?? null, after?.[field] ?? null)) {
			changes[field] = {
				before: before?.[field] ?? null,
				after: after?.[field] ?? null,
			}
		}
	}

	return changes
}

function profileRoleForAdmin(adminUser) {
	return adminUser.active ? adminUser.role : "customer"
}

function createAdminService({ adminRepository } = {}) {
	const repository =
		adminRepository || createAdminRepository(getSupabaseAdmin())

	return {
		async getCurrentAdmin(actorAdmin) {
			return sanitizeAdminUser(actorAdmin)
		},

		async listAdminUsers(filters = {}) {
			const adminUsers = await repository.list(filters)
			return adminUsers.map(sanitizeAdminUser)
		},

		async createAdminUser(actorAdmin, payload) {
			assertActorCanAssignRole(actorAdmin, payload.role)

			const authUser = await repository.getAuthUserById(payload.user_id)

			if (!authUser) {
				throw new ApiError(
					404,
					"auth_user_not_found",
					"Supabase Auth user was not found.",
				)
			}

			const email = payload.email || authUser.email

			if (!email) {
				throw new ApiError(
					400,
					"admin_email_required",
					"Admin email is required when the auth user has no email.",
				)
			}

			const [existingByUserId, existingByEmail] = await Promise.all([
				repository.findByUserId(payload.user_id),
				repository.findByEmail(email),
			])

			if (existingByUserId || existingByEmail) {
				throw new ApiError(
					409,
					"admin_user_already_exists",
					"An admin record already exists for this user or email.",
				)
			}

			const permissions = getPermissionsForRole(
				payload.role,
				payload.permissions || {},
				DEFAULT_ADMIN_PERMISSIONS,
			)

			const created = await repository.create(
				pickDefined({
					tenant_id: payload.tenant_id,
					user_id: payload.user_id,
					email,
					display_name: payload.display_name || null,
					role: payload.role,
					permissions,
					active: payload.active,
					created_by: actorAdmin.user_id,
					updated_by: actorAdmin.user_id,
				}),
			)

			await repository.upsertProfileRole(created.user_id, {
				email: created.email,
				display_name: created.display_name,
				role: profileRoleForAdmin(created),
			})

			await repository.insertAuditLog({
				tenant_id: created.tenant_id,
				actor_user_id: actorAdmin.user_id,
				target_user_id: created.user_id,
				action: "admin_user.created",
				resource_type: "admin_user",
				resource_id: created.id,
				changes: {
					before: null,
					after: sanitizeAdminUser(created),
				},
				metadata: {
					source: "render_api",
				},
			})

			return sanitizeAdminUser(created)
		},

		async updateAdminUser(actorAdmin, adminUserId, payload) {
			let existing = await repository.findById(adminUserId)

			if (!existing) {
				existing = await repository.findByUserId(adminUserId)
			}

			if (!existing) {
				throw new ApiError(
					404,
					"admin_user_not_found",
					"Admin user was not found.",
				)
			}

			const targetIsActor = existing.user_id === actorAdmin.user_id

			if (targetIsActor && includesPrivilegeField(payload)) {
				throw new ApiError(
					400,
					"self_admin_privilege_update_forbidden",
					"Admins cannot change their own role, permissions, or active state through this endpoint.",
				)
			}

			const nextRole = payload.role || existing.role
			assertActorCanAssignRole(actorAdmin, nextRole)

			const nextPermissions =
				hasOwn(payload, "permissions") || payload.role
					? getPermissionsForRole(
							nextRole,
							payload.permissions || {},
							existing.permissions || DEFAULT_ADMIN_PERMISSIONS,
						)
					: undefined

			const updateValues = pickDefined({
				tenant_id: payload.tenant_id,
				email: payload.email,
				display_name: payload.display_name,
				role: payload.role,
				permissions: nextPermissions,
				active: payload.active,
				updated_by: actorAdmin.user_id,
			})

			const updated = await repository.update(existing.id, updateValues)

			if (
				hasOwn(updateValues, "role") ||
				hasOwn(updateValues, "active") ||
				hasOwn(updateValues, "email") ||
				hasOwn(updateValues, "display_name")
			) {
				await repository.upsertProfileRole(updated.user_id, {
					email: updated.email,
					display_name: updated.display_name,
					role: profileRoleForAdmin(updated),
				})
			}

			await repository.insertAuditLog({
				tenant_id: updated.tenant_id,
				actor_user_id: actorAdmin.user_id,
				target_user_id: updated.user_id,
				action: "admin_user.updated",
				resource_type: "admin_user",
				resource_id: updated.id,
				changes: buildAuditChanges(existing, updated),
				metadata: {
					source: "render_api",
				},
			})

			return sanitizeAdminUser(updated)
		},
	}
}

module.exports = {
	buildAuditChanges,
	createAdminService,
	includesPrivilegeField,
	profileRoleForAdmin,
}
