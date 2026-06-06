const { getSupabaseAdmin } = require("../db/supabaseAdmin")
const { ApiError, asyncHandler } = require("../utils/errors")

function hasPermission(adminUser, permissionKey) {
	if (!permissionKey) {
		return true
	}

	if (adminUser.role === "super_admin") {
		return true
	}

	return Boolean(adminUser.permissions?.[permissionKey])
}

function requireAdmin(permissionKey = undefined) {
	return asyncHandler(async (req, _res, next) => {
		if (!req.auth?.user) {
			throw new ApiError(
				401,
				"authentication_required",
				"Authenticated user required.",
			)
		}

		const supabase = getSupabaseAdmin()
		const { data: adminUser, error } = await supabase
			.from("admin_users")
			.select("id, user_id, email, role, permissions, active, tenant_id")
			.eq("user_id", req.auth.user.id)
			.eq("active", true)
			.maybeSingle()

		if (error) {
			throw new ApiError(
				500,
				"admin_lookup_failed",
				"Unable to verify admin permissions.",
				{
					supabaseCode: error.code,
				},
			)
		}

		if (!adminUser) {
			throw new ApiError(403, "admin_required", "Active admin access required.")
		}

		if (!hasPermission(adminUser, permissionKey)) {
			throw new ApiError(
				403,
				"permission_denied",
				`Admin permission required: ${permissionKey}`,
			)
		}

		req.admin = adminUser
		next()
	})
}

module.exports = {
	hasPermission,
	requireAdmin,
}
