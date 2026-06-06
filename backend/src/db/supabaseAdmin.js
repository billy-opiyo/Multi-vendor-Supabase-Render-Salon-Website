const { createClient } = require("@supabase/supabase-js")

const { env, isSupabaseConfigured } = require("../config/env")

let supabaseAdminClient

function getSupabaseAdmin() {
	if (!isSupabaseConfigured) {
		throw new Error(
			"Supabase admin client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
		)
	}

	if (!supabaseAdminClient) {
		supabaseAdminClient = createClient(
			env.SUPABASE_URL,
			env.SUPABASE_SERVICE_ROLE_KEY,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			},
		)
	}

	return supabaseAdminClient
}

module.exports = {
	getSupabaseAdmin,
}
