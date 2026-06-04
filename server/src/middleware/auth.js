const { getSupabaseAdmin } = require("../supabaseAdmin")

function getBearerToken(request) {
	const header = request.headers.authorization || ""
	const match = String(header).match(/^Bearer\s+(.+)$/i)
	return match ? match[1].trim() : ""
}

async function requireSupabaseUser(request, response, next) {
	try {
		const token = getBearerToken(request)
		if (!token) {
			return response.status(401).json({ error: "Authentication required" })
		}

		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase.auth.getUser(token)
		if (error || !data?.user) {
			return response.status(401).json({ error: "Invalid or expired session" })
		}

		request.user = data.user
		return next()
	} catch (error) {
		return next(error)
	}
}

async function requireAdmin(request, response, next) {
	try {
		const token = getBearerToken(request)
		if (!token) {
			return response.status(401).json({ error: "Authentication required" })
		}

		const supabase = getSupabaseAdmin()
		const { data: userData, error: userError } =
			await supabase.auth.getUser(token)
		if (userError || !userData?.user) {
			return response.status(401).json({ error: "Invalid or expired session" })
		}

		const { data: adminUser, error: adminError } = await supabase
			.from("admin_users")
			.select("*")
			.eq("auth_user_id", userData.user.id)
			.eq("is_active", true)
			.maybeSingle()

		if (adminError) throw adminError
		if (!adminUser) {
			return response.status(403).json({ error: "Admin access required" })
		}

		request.user = userData.user
		request.adminUser = adminUser
		return next()
	} catch (error) {
		return next(error)
	}
}

module.exports = {
	requireSupabaseUser,
	requireAdmin,
}
