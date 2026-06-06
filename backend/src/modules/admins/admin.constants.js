const ADMIN_ROLES = ["super_admin", "admin"]

const ADMIN_PERMISSION_KEYS = [
	"canManageAdmins",
	"canManageBookings",
	"canManageContent",
	"canManageSecurity",
]

const DEFAULT_ADMIN_PERMISSIONS = Object.freeze({
	canManageAdmins: false,
	canManageBookings: true,
	canManageContent: true,
	canManageSecurity: false,
})

const SUPER_ADMIN_PERMISSIONS = Object.freeze({
	canManageAdmins: true,
	canManageBookings: true,
	canManageContent: true,
	canManageSecurity: true,
})

function normalizeAdminPermissions(
	input = {},
	base = DEFAULT_ADMIN_PERMISSIONS,
) {
	const permissions = { ...base }

	for (const key of ADMIN_PERMISSION_KEYS) {
		if (input[key] !== undefined) {
			permissions[key] = Boolean(input[key])
		}
	}

	return permissions
}

function getPermissionsForRole(
	role,
	input = {},
	base = DEFAULT_ADMIN_PERMISSIONS,
) {
	if (role === "super_admin") {
		return SUPER_ADMIN_PERMISSIONS
	}

	return normalizeAdminPermissions(input, base)
}

function sanitizeAdminUser(adminUser) {
	if (!adminUser) {
		return null
	}

	return {
		id: adminUser.id,
		tenant_id: adminUser.tenant_id,
		user_id: adminUser.user_id,
		email: adminUser.email,
		display_name: adminUser.display_name,
		role: adminUser.role,
		permissions: adminUser.permissions || {},
		active: adminUser.active,
		created_by: adminUser.created_by,
		updated_by: adminUser.updated_by,
		created_at: adminUser.created_at,
		updated_at: adminUser.updated_at,
	}
}

module.exports = {
	ADMIN_PERMISSION_KEYS,
	ADMIN_ROLES,
	DEFAULT_ADMIN_PERMISSIONS,
	SUPER_ADMIN_PERMISSIONS,
	getPermissionsForRole,
	normalizeAdminPermissions,
	sanitizeAdminUser,
}
