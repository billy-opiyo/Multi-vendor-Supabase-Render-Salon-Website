const { ApiError } = require("../../utils/errors")
const { throwSupabaseError } = require("../../utils/supabaseErrors")

const ADMIN_SELECT =
	"id, tenant_id, user_id, email, display_name, role, permissions, active, created_by, updated_by, created_at, updated_at"

function createAdminRepository(supabase) {
	return {
		async getAuthUserById(userId) {
			const { data, error } = await supabase.auth.admin.getUserById(userId)

			if (error) {
				if (error.status === 404) {
					return null
				}

				throw new ApiError(
					500,
					"auth_user_lookup_failed",
					"Unable to verify Supabase Auth user.",
					{
						supabaseCode: error.code,
						supabaseMessage: error.message,
					},
				)
			}

			return data?.user || null
		},

		async findActiveByUserId(userId) {
			const { data, error } = await supabase
				.from("admin_users")
				.select(ADMIN_SELECT)
				.eq("user_id", userId)
				.eq("active", true)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"admin_lookup_failed",
				"Unable to load admin user.",
			)

			return data
		},

		async findById(adminUserId) {
			const { data, error } = await supabase
				.from("admin_users")
				.select(ADMIN_SELECT)
				.eq("id", adminUserId)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"admin_lookup_failed",
				"Unable to load admin user.",
			)

			return data
		},

		async findByUserId(userId) {
			const { data, error } = await supabase
				.from("admin_users")
				.select(ADMIN_SELECT)
				.eq("user_id", userId)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"admin_lookup_failed",
				"Unable to load admin user.",
			)

			return data
		},

		async findByEmail(email) {
			const { data, error } = await supabase
				.from("admin_users")
				.select(ADMIN_SELECT)
				.ilike("email", email)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"admin_lookup_failed",
				"Unable to load admin user.",
			)

			return data
		},

		async list(filters = {}) {
			let query = supabase
				.from("admin_users")
				.select(ADMIN_SELECT)
				.order("created_at", { ascending: false })

			if (filters.active !== undefined) {
				query = query.eq("active", filters.active)
			}

			if (filters.role) {
				query = query.eq("role", filters.role)
			}

			const { data, error } = await query

			throwSupabaseError(
				error,
				500,
				"admin_list_failed",
				"Unable to list admin users.",
			)

			return data || []
		},

		async create(values) {
			const { data, error } = await supabase
				.from("admin_users")
				.insert(values)
				.select(ADMIN_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"admin_create_failed",
				"Unable to create admin user.",
			)

			return data
		},

		async update(adminUserId, values) {
			const { data, error } = await supabase
				.from("admin_users")
				.update(values)
				.eq("id", adminUserId)
				.select(ADMIN_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"admin_update_failed",
				"Unable to update admin user.",
			)

			return data
		},

		async upsertProfileRole(userId, values) {
			const updateValues = {
				email: values.email,
				display_name: values.display_name,
				role: values.role,
			}

			const { data: updatedProfile, error: updateError } = await supabase
				.from("profiles")
				.update(updateValues)
				.eq("id", userId)
				.select("id")
				.maybeSingle()

			throwSupabaseError(
				updateError,
				500,
				"profile_role_update_failed",
				"Unable to update profile role.",
			)

			if (updatedProfile) {
				return
			}

			const { error: insertError } = await supabase.from("profiles").insert({
				id: userId,
				email: values.email,
				display_name: values.display_name,
				role: values.role,
			})

			throwSupabaseError(
				insertError,
				500,
				"profile_role_insert_failed",
				"Unable to create profile role record.",
			)
		},

		async insertAuditLog(values) {
			const { data, error } = await supabase
				.from("admin_audit_logs")
				.insert(values)
				.select("id, created_at")
				.single()

			throwSupabaseError(
				error,
				500,
				"admin_audit_log_failed",
				"Unable to write admin audit log.",
			)

			return data
		},
	}
}

module.exports = {
	ADMIN_SELECT,
	createAdminRepository,
}
