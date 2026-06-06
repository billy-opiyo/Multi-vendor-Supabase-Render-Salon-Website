const { getSupabaseAdmin } = require("../db/supabaseAdmin")
const { ApiError, asyncHandler } = require("../utils/errors")

function getBearerToken(req) {
	const authorization = req.get("authorization") || ""
	const [scheme, token] = authorization.split(" ")

	if (scheme?.toLowerCase() !== "bearer" || !token) {
		return null
	}

	return token
}

const requireAuth = asyncHandler(async (req, _res, next) => {
	const token = getBearerToken(req)

	if (!token) {
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

	req.auth = {
		token,
		user: data.user,
	}

	next()
})

module.exports = {
	requireAuth,
}
