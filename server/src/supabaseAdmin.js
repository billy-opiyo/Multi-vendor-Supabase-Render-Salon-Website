const { createClient } = require("@supabase/supabase-js")
const { config, isSupabaseConfigured } = require("./config")

let adminClient = null

function getSupabaseAdmin() {
	if (!isSupabaseConfigured()) {
		throw new Error(
			"Supabase is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
		)
	}

	if (!adminClient) {
		adminClient = createClient(
			config.supabase.url,
			config.supabase.serviceRoleKey,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			},
		)
	}

	return adminClient
}

module.exports = {
	getSupabaseAdmin,
}
