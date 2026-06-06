const { throwSupabaseError } = require("../../utils/supabaseErrors")

const PROFILE_SELECT =
	"id, tenant_id, email, display_name, phone, role, avatar_url, security_restrictions, metadata, created_at, updated_at"

function createProfileRepository(supabase) {
	return {
		async findById(userId) {
			const { data, error } = await supabase
				.from("profiles")
				.select(PROFILE_SELECT)
				.eq("id", userId)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"profile_lookup_failed",
				"Unable to load profile.",
			)

			return data
		},

		async create(values) {
			const { data, error } = await supabase
				.from("profiles")
				.insert(values)
				.select(PROFILE_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"profile_create_failed",
				"Unable to create profile.",
			)

			return data
		},

		async update(userId, values) {
			const { data, error } = await supabase
				.from("profiles")
				.update(values)
				.eq("id", userId)
				.select(PROFILE_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"profile_update_failed",
				"Unable to update profile.",
			)

			return data
		},
	}
}

module.exports = {
	PROFILE_SELECT,
	createProfileRepository,
}
