const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const { ApiError } = require("../../utils/errors")
const { pickDefined } = require("../../utils/validation")
const {
	normalizeSecurityRestrictions,
} = require("../../middleware/securityRestrictions")
const {
	ACCOUNT_CHANGE_TYPES,
	LOGIN_RISK_THRESHOLDS,
	SECURITY_ALERT_SEVERITY,
	getAccountChangeLabel,
} = require("./security.constants")
const { createSecurityRepository } = require("./security.repository")

const ALERTED_ACCOUNT_CHANGE_TYPES = new Set([
	"password_changed",
	"email_changed",
	"account_deleted",
	"account_deactivated",
])

function toDateMs(value) {
	const ms = new Date(value || 0).getTime()
	return Number.isFinite(ms) ? ms : 0
}

function clampRiskScore(score) {
	return Math.max(0, Math.min(100, Math.round(score)))
}

function riskLevelForScore(score) {
	if (score >= 70) return "high"
	if (score >= 35) return "medium"
	return "low"
}

function extractRequestIp(req) {
	const forwarded = req?.headers?.["x-forwarded-for"]
	const headerIp = Array.isArray(forwarded) ? forwarded[0] : forwarded
	const firstForwarded = String(headerIp || "")
		.split(",")[0]
		.trim()

	return (
		firstForwarded ||
		String(req?.ip || "").trim() ||
		String(req?.socket?.remoteAddress || "").trim() ||
		null
	)
}

function extractCountry(req, payload) {
	return (
		payload.country ||
		String(req?.headers?.["x-vercel-ip-country"] || "").trim() ||
		String(req?.headers?.["cf-ipcountry"] || "").trim() ||
		null
	)
}

function getUserAgent(req) {
	return String(req?.headers?.["user-agent"] || "").slice(0, 500) || null
}

function getLoginEmail(authUser, payload) {
	return String(authUser?.email || payload.attempted_email || "")
		.trim()
		.toLowerCase()
}

function buildLoginRiskAssessment({ payload, recent = [], nowMs }) {
	const status = payload.status
	const isFailure = status === "failure"
	const deviceType = payload.device_type || "unknown"
	const browser = payload.browser || "Unknown"
	const country = payload.country || "Unknown"
	const flags = new Set()
	const reasons = []
	let score = 0

	const within = (entry, windowMs) => {
		const age = nowMs - toDateMs(entry.created_at)
		return age >= 0 && age <= windowMs
	}

	const rapidAttempts = recent.filter((entry) =>
		within(entry, LOGIN_RISK_THRESHOLDS.rapidWindowMs),
	).length + 1

	if (rapidAttempts >= LOGIN_RISK_THRESHOLDS.rapidAttemptThreshold) {
		flags.add("rapid_repeated_logins")
		reasons.push("Rapid repeated login attempts detected.")
		score += 20
	}

	const failedAttemptsIn5m = isFailure
		? recent.filter(
				(entry) =>
					entry.status === "failure" &&
					within(entry, LOGIN_RISK_THRESHOLDS.failedWindowMs),
			).length + 1
		: 0
	const failedAttemptsIn15m = isFailure
		? recent.filter(
				(entry) =>
					entry.status === "failure" &&
					within(entry, LOGIN_RISK_THRESHOLDS.lockWindowMs),
			).length + 1
		: 0

	if (failedAttemptsIn5m >= LOGIN_RISK_THRESHOLDS.repeatFailureThreshold) {
		flags.add("repeated_failures")
		reasons.push("Multiple failed login attempts in a short window.")
		score += 30
	}

	if (failedAttemptsIn15m >= LOGIN_RISK_THRESHOLDS.lockThreshold) {
		flags.add("locked_account_threshold")
		reasons.push("Failed login threshold reached for account lock review.")
		score += 25
	}

	if (status === "success") {
		const priorSuccess = recent.filter((entry) => entry.status === "success")

		if (priorSuccess.length) {
			const knownDevice = priorSuccess.some(
				(entry) =>
					entry.device_type === deviceType &&
					entry.metadata?.browser === browser,
			)

			if (!knownDevice) {
				flags.add("new_device_or_browser")
				reasons.push("Login from a new device or browser.")
				score += 20
			}

			const lastSuccess = priorSuccess[0]
			const lastCountry = String(lastSuccess.country || "")
			if (
				country &&
				country !== "Unknown" &&
				lastCountry &&
				lastCountry !== "Unknown" &&
				lastCountry !== country &&
				within(lastSuccess, 24 * 60 * 60 * 1000)
			) {
				flags.add("country_changed_quickly")
				reasons.push("Login country changed within 24 hours.")
				score += 35
			}
		}
	}

	const riskScore = clampRiskScore(score)
	const riskLevel = riskLevelForScore(riskScore)
	const suspiciousFlags = [...flags]

	return {
		failedAttemptsIn5m,
		failedAttemptsIn15m,
		riskLevel,
		riskReasons: reasons,
		riskScore,
		suspicious: suspiciousFlags.length > 0,
		suspiciousFlags,
	}
}

function buildLoginAlertSpecs(assessment) {
	const specs = []

	if (
		assessment.suspiciousFlags.includes("repeated_failures") ||
		assessment.suspiciousFlags.includes("locked_account_threshold")
	) {
		specs.push({
			alert_type: "multiple_failed_login_attempts",
			title: "Multiple failed login attempts",
			message: "Multiple failed login attempts were detected for this account.",
		})
	}

	if (assessment.suspiciousFlags.includes("new_device_or_browser")) {
		specs.push({
			alert_type: "new_device_detected",
			title: "New device or browser detected",
			message: "A successful login used a new device or browser.",
		})
	}

	if (assessment.suspiciousFlags.includes("country_changed_quickly")) {
		specs.push({
			alert_type: "login_unusual_country",
			title: "Unusual login country",
			message: "A successful login came from a different country within 24 hours.",
		})
	}

	if (assessment.suspiciousFlags.includes("rapid_repeated_logins")) {
		specs.push({
			alert_type: "rapid_repeated_logins",
			title: "Rapid repeated logins",
			message: "Rapid repeated login attempts were detected.",
		})
	}

	return specs
}

function sanitizeRestrictionsForAudit(restrictions) {
	return {
		blockedUntilMs: restrictions.blockedUntilMs || 0,
		blockReason: restrictions.blockReason || "",
		forceLogoutAtMs: restrictions.forceLogoutAtMs || 0,
		passwordResetRequired: restrictions.passwordResetRequired === true,
		passwordResetRequestedAtMs: restrictions.passwordResetRequestedAtMs || 0,
	}
}

function buildSecurityActivity({
	tenantId,
	userId,
	actorUserId,
	title,
	description,
	metadata = {},
}) {
	return {
		tenant_id: tenantId || null,
		user_id: userId || null,
		actor_user_id: actorUserId || null,
		activity_type: "security_event",
		title,
		description,
		entity_type: "security",
		entity_id: userId || null,
		metadata,
	}
}

function createSecurityService({ securityRepository, now = () => new Date() } = {}) {
	const repository =
		securityRepository || createSecurityRepository(getSupabaseAdmin())

	async function createSecurityAlert(values) {
		return repository.insertSecurityAlert({
			tenant_id: values.tenant_id || null,
			user_id: values.user_id || null,
			alert_type: values.alert_type,
			severity:
				values.severity ||
				SECURITY_ALERT_SEVERITY[values.alert_type] ||
				"medium",
			status: "open",
			title: values.title,
			message: values.message || null,
			metadata: values.metadata || {},
		})
	}

	async function clearPasswordResetRequirement(authUser, tenantId) {
		const profile = await repository.findProfileByUserId(authUser.id)
		const restrictions = normalizeSecurityRestrictions({
			...(authUser?.app_metadata?.security_restrictions || {}),
			...(profile?.security_restrictions || {}),
		})

		if (!restrictions.passwordResetRequired) {
			return null
		}

		const nextRestrictions = {
			...restrictions,
			passwordResetRequired: false,
			passwordResetRequestedAtMs: 0,
			passwordResetClearedAtMs: now().getTime(),
		}

		await repository.upsertProfileSecurityRestrictions(authUser.id, {
			tenant_id: profile?.tenant_id || tenantId || null,
			email: profile?.email || authUser.email || null,
			display_name: profile?.display_name || null,
			role: profile?.role || "customer",
			security_restrictions: nextRestrictions,
		})
		await repository.updateAuthUserSecurityRestrictions(authUser, nextRestrictions)

		return nextRestrictions
	}

	return {
		async recordLoginActivity(authUser, payload, req) {
			if (payload.status === "success" && !authUser?.id) {
				throw new ApiError(
					401,
					"authentication_required",
					"Authenticated user required to record successful login activity.",
				)
			}

			const occurredAt = now()
			const userId = authUser?.id || null
			const email = getLoginEmail(authUser, payload) || null
			const country = extractCountry(req, payload)
			const recent = await repository.listRecentLoginActivities({
				userId,
				email,
				limit: 25,
			})
			const assessment = buildLoginRiskAssessment({
				payload: { ...payload, country },
				recent,
				nowMs: occurredAt.getTime(),
			})

			const loginActivity = await repository.insertLoginActivity({
				tenant_id: payload.tenant_id || null,
				user_id: userId,
				email,
				login_method: payload.login_method,
				status: payload.status,
				device_type: payload.device_type,
				ip_address: extractRequestIp(req),
				user_agent: getUserAgent(req),
				country,
				risk_level: assessment.riskLevel,
				risk_score: assessment.riskScore,
				metadata: {
					...(payload.metadata || {}),
					attempted_email: payload.attempted_email || null,
					browser: payload.browser || null,
					locale: payload.locale || null,
					timezone: payload.timezone || null,
					source: payload.source || null,
					failure_code: payload.failure_code || null,
					failed_attempts_in_5m: assessment.failedAttemptsIn5m,
					failed_attempts_in_15m: assessment.failedAttemptsIn15m,
					risk_reasons: assessment.riskReasons,
					suspicious: assessment.suspicious,
					suspicious_flags: assessment.suspiciousFlags,
				},
			})

			const alerts = []
			for (const spec of buildLoginAlertSpecs(assessment)) {
				alerts.push(
					await createSecurityAlert({
						tenant_id: payload.tenant_id,
						user_id: userId,
						...spec,
						metadata: {
							login_activity_id: loginActivity.id,
							email,
							risk_score: assessment.riskScore,
							risk_level: assessment.riskLevel,
							suspicious_flags: assessment.suspiciousFlags,
						},
					}),
				)
			}

			if (assessment.suspicious && userId) {
				await repository.insertActivity(
					buildSecurityActivity({
						tenantId: payload.tenant_id,
						userId,
						title: "Suspicious login activity detected",
						description:
							assessment.riskReasons.join(" ") ||
							"Suspicious login activity was recorded.",
						metadata: {
							login_activity_id: loginActivity.id,
							risk_score: assessment.riskScore,
							risk_level: assessment.riskLevel,
							suspicious_flags: assessment.suspiciousFlags,
						},
					}),
				)
			}

			return {
				alerts,
				loginActivity,
				riskAssessment: assessment,
			}
		},

		async recordAccountSecurityChange(authUser, payload) {
			if (!authUser?.id) {
				throw new ApiError(
					401,
					"authentication_required",
					"Authenticated user required.",
				)
			}

			const accountChange = await repository.insertAccountChange({
				tenant_id: payload.tenant_id || null,
				user_id: authUser.id,
				change_type: payload.change_type,
				old_value: payload.old_value ?? null,
				new_value: payload.new_value ?? null,
				metadata: {
					...(payload.metadata || {}),
					details: payload.details || null,
					source: payload.source || "render_api",
				},
			})

			let clearedRestrictions = null
			if (payload.change_type === "password_changed") {
				clearedRestrictions = await clearPasswordResetRequirement(
					authUser,
					payload.tenant_id,
				)
			}

			let alert = null
			if (ALERTED_ACCOUNT_CHANGE_TYPES.has(payload.change_type)) {
				alert = await createSecurityAlert({
					tenant_id: payload.tenant_id,
					user_id: authUser.id,
					alert_type: payload.change_type,
					title: getAccountChangeLabel(payload.change_type),
					message: `${getAccountChangeLabel(payload.change_type)} event recorded.`,
					metadata: {
						account_change_id: accountChange.id,
						details: payload.details || null,
						source: payload.source || "render_api",
					},
				})
			}

			await repository.insertActivity(
				buildSecurityActivity({
					tenantId: payload.tenant_id,
					userId: authUser.id,
					actorUserId: authUser.id,
					title: getAccountChangeLabel(payload.change_type),
					description: payload.details || null,
					metadata: {
						account_change_id: accountChange.id,
						change_type: payload.change_type,
					},
				}),
			)

			return { accountChange, alert, clearedRestrictions }
		},

		async listLoginActivities(filters = {}) {
			return repository.listLoginActivities(filters)
		},

		async listSecurityAlerts(filters = {}) {
			return repository.listSecurityAlerts(filters)
		},

		async updateSecurityAlertStatus(actorAdmin, alertId, payload) {
			const nowIso = now().toISOString()
			const updateValues = {
				status: payload.status,
				metadata: payload.metadata,
			}

			if (payload.status === "acknowledged") {
				updateValues.acknowledged_at = nowIso
			}

			if (["resolved", "dismissed"].includes(payload.status)) {
				updateValues.resolved_at = nowIso
				updateValues.resolved_by = actorAdmin.user_id
			}

			const alert = await repository.updateSecurityAlert(
				alertId,
				pickDefined(updateValues),
			)

			if (!alert) {
				throw new ApiError(
					404,
					"security_alert_not_found",
					"Security alert was not found.",
				)
			}

			await repository.insertAuditLog({
				tenant_id: alert.tenant_id || actorAdmin.tenant_id || null,
				actor_user_id: actorAdmin.user_id,
				target_user_id: alert.user_id,
				action: "security_alert.status_updated",
				resource_type: "security_alert",
				resource_id: alert.id,
				changes: { after: alert },
				metadata: { source: "render_security_service" },
			})

			return alert
		},

		async listAccountChanges(filters = {}) {
			return repository.listAccountChanges(filters)
		},

		async listSecurityActions(filters = {}) {
			return repository.listSecurityActions(filters)
		},

		async applyAdminSecurityRestriction(actorAdmin, targetUserId, payload) {
			const targetAuthUser = await repository.getAuthUserById(targetUserId)

			if (!targetAuthUser) {
				throw new ApiError(
					404,
					"auth_user_not_found",
					"Target Supabase Auth user was not found.",
				)
			}

			const timestamp = now()
			const nowMs = timestamp.getTime()
			const profile = await repository.findProfileByUserId(targetUserId)
			const beforeRestrictions = normalizeSecurityRestrictions({
				...(targetAuthUser.app_metadata?.security_restrictions || {}),
				...(profile?.security_restrictions || {}),
			})
			const nextRestrictions = {
				...beforeRestrictions,
				updatedAtMs: nowMs,
				updatedAt: timestamp.toISOString(),
				updatedBy: actorAdmin.email || actorAdmin.user_id,
				updatedByUserId: actorAdmin.user_id,
			}
			let expiresAt = null

			if (payload.action === "temporary_block") {
				expiresAt = new Date(
					nowMs + payload.block_minutes * 60 * 1000,
				).toISOString()
				nextRestrictions.blockedUntilMs = new Date(expiresAt).getTime()
				nextRestrictions.blockReason =
					payload.reason || "Temporary block applied by admin"
			}

			if (payload.action === "force_logout") {
				nextRestrictions.forceLogoutAtMs = nowMs
			}

			if (payload.action === "force_password_reset") {
				nextRestrictions.passwordResetRequired = true
				nextRestrictions.passwordResetRequestedAtMs = nowMs
			}

			if (payload.action === "clear_restrictions") {
				nextRestrictions.blockedUntilMs = 0
				nextRestrictions.blockReason = ""
				nextRestrictions.forceLogoutAtMs = 0
				nextRestrictions.passwordResetRequired = false
				nextRestrictions.passwordResetRequestedAtMs = 0
				nextRestrictions.clearedAtMs = nowMs
				nextRestrictions.clearedAt = timestamp.toISOString()
				nextRestrictions.clearedBy = actorAdmin.email || actorAdmin.user_id
				nextRestrictions.clearedByUserId = actorAdmin.user_id
			}

			const normalizedNextRestrictions = normalizeSecurityRestrictions(nextRestrictions)
			const updatedProfile = await repository.upsertProfileSecurityRestrictions(
				targetUserId,
				{
					tenant_id: payload.tenant_id || profile?.tenant_id || null,
					email: profile?.email || targetAuthUser.email || null,
					display_name: profile?.display_name || null,
					role: profile?.role || "customer",
					security_restrictions: normalizedNextRestrictions,
				},
			)
			await repository.updateAuthUserSecurityRestrictions(
				targetAuthUser,
				normalizedNextRestrictions,
			)

			const securityAction = await repository.insertSecurityAction({
				tenant_id: updatedProfile.tenant_id || actorAdmin.tenant_id || null,
				actor_user_id: actorAdmin.user_id,
				target_user_id: targetUserId,
				action: payload.action,
				reason: payload.reason || null,
				expires_at: expiresAt,
				cleared_at:
					payload.action === "clear_restrictions"
						? timestamp.toISOString()
						: null,
				metadata: {
					...(payload.metadata || {}),
					block_minutes:
						payload.action === "temporary_block"
							? payload.block_minutes
							: null,
					force_logout_enforced_by: "requireAuth middleware",
				},
			})

			await repository.insertAuditLog({
				tenant_id: updatedProfile.tenant_id || actorAdmin.tenant_id || null,
				actor_user_id: actorAdmin.user_id,
				target_user_id: targetUserId,
				action: `security.${payload.action}`,
				resource_type: "profile",
				resource_id: targetUserId,
				changes: {
					security_restrictions: {
						before: sanitizeRestrictionsForAudit(beforeRestrictions),
						after: sanitizeRestrictionsForAudit(normalizedNextRestrictions),
					},
				},
				metadata: {
					source: "render_security_service",
					security_action_id: securityAction.id,
				},
			})

			await repository.insertActivity(
				buildSecurityActivity({
					tenantId: updatedProfile.tenant_id || actorAdmin.tenant_id,
					userId: targetUserId,
					actorUserId: actorAdmin.user_id,
					title: `Admin security action: ${payload.action.replace(/_/g, " ")}`,
					description: payload.reason || null,
					metadata: {
						security_action_id: securityAction.id,
						action: payload.action,
					},
				}),
			)

			return {
				profile: updatedProfile,
				securityAction,
				securityRestrictions: normalizedNextRestrictions,
			}
		},

		async getSecurityDashboard(filters = {}) {
			const [loginActivities, alerts, accountChanges, securityActions] =
				await Promise.all([
					repository.listLoginActivities({ ...filters, limit: 200, offset: 0 }),
					repository.listSecurityAlerts({ ...filters, limit: 200, offset: 0 }),
					repository.listAccountChanges({ ...filters, limit: 100, offset: 0 }),
					repository.listSecurityActions({ ...filters, limit: 100, offset: 0 }),
				])

			const countBy = (rows, key) =>
				rows.reduce((acc, row) => {
					const value = row[key] || "unknown"
					acc[value] = (acc[value] || 0) + 1
					return acc
				}, {})

			return {
				counts: {
					loginActivities: loginActivities.length,
					securityAlerts: alerts.length,
					openAlerts: alerts.filter((alert) => alert.status === "open").length,
					highRiskLogins: loginActivities.filter(
						(activity) => activity.risk_level === "high",
					).length,
					accountChanges: accountChanges.length,
					securityActions: securityActions.length,
				},
				byRiskLevel: countBy(loginActivities, "risk_level"),
				byAlertStatus: countBy(alerts, "status"),
				byAlertSeverity: countBy(alerts, "severity"),
				recent: {
					loginActivities: loginActivities.slice(0, 10),
					securityAlerts: alerts.slice(0, 10),
					accountChanges: accountChanges.slice(0, 10),
					securityActions: securityActions.slice(0, 10),
				},
			}
		},
	}
}

module.exports = {
	buildLoginRiskAssessment,
	createSecurityService,
	extractRequestIp,
	riskLevelForScore,
}