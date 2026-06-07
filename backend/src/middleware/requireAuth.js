const { getSupabaseAdmin } = require("../db/supabaseAdmin")
const { ApiError, asyncHandler } = require("../utils/errors")
const {
	assertSecurityRestrictionsAllowed,
	loadProfileSecurityRestrictions,
} = require("./securityRestrictions")

function getBearerToken(req) {
	const authorization = req.get("authorization") || ""
	const [scheme, token] = authorization.split(" ")

	if (scheme?.toLowerCase() !== "bearer" || !token) {
		return null
	}

	return token
}

function createAuthMiddleware(options = {}) {
	return asyncHandler(async (req, _res, next) => {
		const token = getBearerToken(req)

		if (!token) {
			if (options.optional === true) {
				next()
				return
			}

			throw new ApiError(
				401,
				"authentication_required",
				"Bearer access token required.",
			)
		}

		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase.auth.getUser(token)

		if (error || !data?.user) {
			throw new ApiError(401, "invalid_token", "Invalid or expired access token.")
		}

		const profile = await loadProfileSecurityRestrictions(
			supabase,
			data.user.id,
		)
		const securityRestrictions = assertSecurityRestrictionsAllowed({
			authUser: data.user,
			profile,
			token,
			allowPasswordResetRequired:
				options.allowPasswordResetRequired === true,
		})

		req.auth = {
			token,
			user: data.user,
			securityRestrictions,
		}

		next()
	})
}

const requireAuth = createAuthMiddleware()
const optionalAuth = createAuthMiddleware({ optional: true })
const requireAuthAllowingPasswordReset = createAuthMiddleware({
	allowPasswordResetRequired: true,
})

module.exports = {
	createAuthMiddleware,
	getBearerToken,
	optionalAuth,
	requireAuth,
	requireAuthAllowingPasswordReset,
}
