const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const { createAdminRepository } = require("../admins/admin.repository")
const { sanitizeAdminUser } = require("../admins/admin.constants")
const { createProfileRepository } = require("../profiles/profile.repository")

function serializeAuthUser(authUser) {
	return {
		id: authUser.id,
		email: authUser.email || null,
		phone: authUser.phone || null,
		app_metadata: authUser.app_metadata || {},
		user_metadata: authUser.user_metadata || {},
		created_at: authUser.created_at,
		last_sign_in_at: authUser.last_sign_in_at,
	}
}

function serializeAdminAccess(adminUser) {
	if (!adminUser) {
		return {
			isAdmin: false,
			adminUser: null,
			role: null,
			permissions: {},
		}
	}

	return {
		isAdmin: true,
		adminUser: sanitizeAdminUser(adminUser),
		role: adminUser.role,
		permissions: adminUser.permissions || {},
	}
}

function createAuthService({ profileRepository, adminRepository } = {}) {
	let resolvedProfileRepository = profileRepository
	let resolvedAdminRepository = adminRepository

	if (!resolvedProfileRepository || !resolvedAdminRepository) {
		const supabase = getSupabaseAdmin()
		resolvedProfileRepository =
			resolvedProfileRepository || createProfileRepository(supabase)
		resolvedAdminRepository =
			resolvedAdminRepository || createAdminRepository(supabase)
	}

	return {
		async getCurrentUserContext(authUser) {
			const [profile, adminUser] = await Promise.all([
				resolvedProfileRepository.findById(authUser.id),
				resolvedAdminRepository.findActiveByUserId(authUser.id),
			])

			return {
				user: serializeAuthUser(authUser),
				profile,
				admin: serializeAdminAccess(adminUser),
			}
		},
	}
}

module.exports = {
	createAuthService,
	serializeAdminAccess,
	serializeAuthUser,
}
