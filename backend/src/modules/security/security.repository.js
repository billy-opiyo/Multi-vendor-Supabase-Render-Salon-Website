const { ApiError } = require("../../utils/errors")
const { throwSupabaseError } = require("../../utils/supabaseErrors")

const LOGIN_ACTIVITY_SELECT =
	"id, tenant_id, user_id, email, login_method, status, device_type, ip_address, user_agent, country, risk_level, risk_score, metadata, created_at"
const SECURITY_ALERT_SELECT =
	"id, tenant_id, user_id, alert_type, severity, status, title, message, metadata, acknowledged_at, resolved_at, resolved_by, created_at, updated_at"
const ACCOUNT_CHANGE_SELECT =
	"id, tenant_id, user_id, change_type, old_value, new_value, metadata, created_at"
const SECURITY_ACTION_SELECT =
	"id, tenant_id, actor_user_id, target_user_id, action, reason, expires_at, cleared_at, metadata, created_at"
const PROFILE_SECURITY_SELECT =
	"id, tenant_id, email, display_name, role, security_restrictions, metadata, created_at, updated_at"

function applyNullableTenantFilter(query, tenantId) {
	if (tenantId === undefined) {
		return query
	}

	return tenantId ? query.eq("tenant_id", tenantId) : query.is("tenant_id", null)
}

function applyPagination(query, filters = {}) {
	const offset = filters.offset || 0
	const limit = filters.limit || 50
	return query.range(offset, offset + limit - 1)
}

function withDateRange(query, filters = {}) {
	let nextQuery = query

	if (filters.from) {
		nextQuery = nextQuery.gte("created_at", filters.from)
	}

	if (filters.to) {
		nextQuery = nextQuery.lte("created_at", filters.to)
	}

	return nextQuery
}

function createSecurityRepository(supabase) {
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
					"Unable to load Supabase Auth user.",
					{
						supabaseCode: error.code,
						supabaseMessage: error.message,
					},
				)
			}

			return data?.user || null
		},

		async updateAuthUserSecurityRestrictions(authUser, restrictions) {
			const nextAppMetadata = {
				...(authUser?.app_metadata || {}),
				security_restrictions: restrictions,
			}

			const { data, error } = await supabase.auth.admin.updateUserById(
				authUser.id,
				{
					app_metadata: nextAppMetadata,
				},
			)

			if (error) {
				throw new ApiError(
					500,
					"auth_user_restriction_update_failed",
					"Unable to update Supabase Auth security metadata.",
					{
						supabaseCode: error.code,
						supabaseMessage: error.message,
					},
				)
			}

			return data?.user || null
		},

		async findProfileByUserId(userId) {
			const { data, error } = await supabase
				.from("profiles")
				.select(PROFILE_SECURITY_SELECT)
				.eq("id", userId)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"profile_lookup_failed",
				"Unable to load profile security data.",
			)

			return data
		},

		async upsertProfileSecurityRestrictions(userId, values) {
			const { data: updated, error: updateError } = await supabase
				.from("profiles")
				.update({
					security_restrictions: values.security_restrictions,
				})
				.eq("id", userId)
				.select(PROFILE_SECURITY_SELECT)
				.maybeSingle()

			throwSupabaseError(
				updateError,
				500,
				"profile_restriction_update_failed",
				"Unable to update profile security restrictions.",
			)

			if (updated) {
				return updated
			}

			const { data: inserted, error: insertError } = await supabase
				.from("profiles")
				.insert({
					id: userId,
					tenant_id: values.tenant_id || null,
					email: values.email || null,
					display_name: values.display_name || null,
					role: values.role || "customer",
					security_restrictions: values.security_restrictions,
				})
				.select(PROFILE_SECURITY_SELECT)
				.single()

			throwSupabaseError(
				insertError,
				500,
				"profile_restriction_insert_failed",
				"Unable to create profile security restrictions.",
			)

			return inserted
		},

		async listRecentLoginActivities({ userId, email, limit = 25 } = {}) {
			let query = supabase
				.from("login_activities")
				.select(LOGIN_ACTIVITY_SELECT)
				.order("created_at", { ascending: false })
				.limit(limit)

			if (userId) {
				query = query.eq("user_id", userId)
			} else if (email) {
				query = query.ilike("email", email)
			}

			const { data, error } = await query

			throwSupabaseError(
				error,
				500,
				"login_activity_recent_lookup_failed",
				"Unable to load recent login activity.",
			)

			return data || []
		},

		async insertLoginActivity(values) {
			const { data, error } = await supabase
				.from("login_activities")
				.insert(values)
				.select(LOGIN_ACTIVITY_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"login_activity_write_failed",
				"Unable to record login activity.",
			)

			return data
		},

		async listLoginActivities(filters = {}) {
			let query = supabase
				.from("login_activities")
				.select(LOGIN_ACTIVITY_SELECT)
				.order("created_at", { ascending: false })

			query = applyNullableTenantFilter(query, filters.tenant_id)
			query = withDateRange(query, filters)

			if (filters.user_id) query = query.eq("user_id", filters.user_id)
			if (filters.email) query = query.ilike("email", filters.email)
			if (filters.status) query = query.eq("status", filters.status)
			if (filters.risk_level) query = query.eq("risk_level", filters.risk_level)

			const { data, error } = await applyPagination(query, filters)

			throwSupabaseError(
				error,
				500,
				"login_activity_list_failed",
				"Unable to list login activity.",
			)

			return data || []
		},

		async insertSecurityAlert(values) {
			const { data, error } = await supabase
				.from("security_alerts")
				.insert(values)
				.select(SECURITY_ALERT_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"security_alert_write_failed",
				"Unable to write security alert.",
			)

			return data
		},

		async listSecurityAlerts(filters = {}) {
			let query = supabase
				.from("security_alerts")
				.select(SECURITY_ALERT_SELECT)
				.order("created_at", { ascending: false })

			query = applyNullableTenantFilter(query, filters.tenant_id)
			if (filters.user_id) query = query.eq("user_id", filters.user_id)
			if (filters.status) query = query.eq("status", filters.status)
			if (filters.severity) query = query.eq("severity", filters.severity)
			if (filters.alert_type) query = query.eq("alert_type", filters.alert_type)

			const { data, error } = await applyPagination(query, filters)

			throwSupabaseError(
				error,
				500,
				"security_alert_list_failed",
				"Unable to list security alerts.",
			)

			return data || []
		},

		async updateSecurityAlert(alertId, values) {
			const { data, error } = await supabase
				.from("security_alerts")
				.update(values)
				.eq("id", alertId)
				.select(SECURITY_ALERT_SELECT)
				.maybeSingle()

			throwSupabaseError(
				error,
				500,
				"security_alert_update_failed",
				"Unable to update security alert.",
			)

			return data
		},

		async insertAccountChange(values) {
			const { data, error } = await supabase
				.from("account_change_history")
				.insert(values)
				.select(ACCOUNT_CHANGE_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"account_change_write_failed",
				"Unable to record account change.",
			)

			return data
		},

		async listAccountChanges(filters = {}) {
			let query = supabase
				.from("account_change_history")
				.select(ACCOUNT_CHANGE_SELECT)
				.order("created_at", { ascending: false })

			query = applyNullableTenantFilter(query, filters.tenant_id)
			if (filters.user_id) query = query.eq("user_id", filters.user_id)
			if (filters.change_type) query = query.eq("change_type", filters.change_type)

			const { data, error } = await applyPagination(query, filters)

			throwSupabaseError(
				error,
				500,
				"account_change_list_failed",
				"Unable to list account change history.",
			)

			return data || []
		},

		async insertSecurityAction(values) {
			const { data, error } = await supabase
				.from("admin_security_actions")
				.insert(values)
				.select(SECURITY_ACTION_SELECT)
				.single()

			throwSupabaseError(
				error,
				500,
				"admin_security_action_write_failed",
				"Unable to record admin security action.",
			)

			return data
		},

		async listSecurityActions(filters = {}) {
			let query = supabase
				.from("admin_security_actions")
				.select(SECURITY_ACTION_SELECT)
				.order("created_at", { ascending: false })

			query = applyNullableTenantFilter(query, filters.tenant_id)
			if (filters.target_user_id) {
				query = query.eq("target_user_id", filters.target_user_id)
			}
			if (filters.actor_user_id) {
				query = query.eq("actor_user_id", filters.actor_user_id)
			}
			if (filters.action) query = query.eq("action", filters.action)

			const { data, error } = await applyPagination(query, filters)

			throwSupabaseError(
				error,
				500,
				"admin_security_action_list_failed",
				"Unable to list admin security actions.",
			)

			return data || []
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

		async insertActivity(values) {
			const { data, error } = await supabase
				.from("activity_timeline")
				.insert(values)
				.select("id, created_at")
				.single()

			throwSupabaseError(
				error,
				500,
				"activity_timeline_write_failed",
				"Unable to write activity timeline event.",
			)

			return data
		},
	}
}

module.exports = {
	ACCOUNT_CHANGE_SELECT,
	LOGIN_ACTIVITY_SELECT,
	PROFILE_SECURITY_SELECT,
	SECURITY_ACTION_SELECT,
	SECURITY_ALERT_SELECT,
	createSecurityRepository,
}