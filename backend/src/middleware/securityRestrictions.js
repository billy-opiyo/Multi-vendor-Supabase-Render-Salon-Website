const { ApiError } = require("../utils/errors")
const { throwSupabaseError } = require("../utils/supabaseErrors")

function base64UrlDecode(value) {
	const normalized = String(value || "")
		.replace(/-/g, "+")
		.replace(/_/g, "/")
	const padded = normalized.padEnd(
		normalized.length + ((4 - (normalized.length % 4)) % 4),
		"=",
	)

	return Buffer.from(padded, "base64").toString("utf8")
}

function decodeJwtPayload(token) {
	try {
		const [, payload] = String(token || "").split(".")
		if (!payload) {
			return {}
		}

		return JSON.parse(base64UrlDecode(payload))
	} catch (_error) {
		return {}
	}
}

function getTokenIssuedAtMs(token) {
	const payload = decodeJwtPayload(token)
	const issuedAtSeconds = Number(payload.iat)

	if (!Number.isFinite(issuedAtSeconds) || issuedAtSeconds <= 0) {
		return 0
	}

	return issuedAtSeconds * 1000
}

function asObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function toFiniteNumber(value, fallback = 0) {
	const number = Number(value)
	return Number.isFinite(number) ? number : fallback
}

function normalizeSecurityRestrictions(value = {}) {
	const source = asObject(value)

	return {
		...source,
		blockedUntilMs: toFiniteNumber(source.blockedUntilMs),
		forceLogoutAtMs: toFiniteNumber(source.forceLogoutAtMs),
		passwordResetRequired: source.passwordResetRequired === true,
		passwordResetRequestedAtMs: toFiniteNumber(
			source.passwordResetRequestedAtMs,
		),
	}
}

function restrictionsFromProfileAndAuth(profile, authUser) {
	const authRestrictions = asObject(authUser?.app_metadata?.security_restrictions)
	const profileRestrictions = asObject(profile?.security_restrictions)

	return normalizeSecurityRestrictions({
		...authRestrictions,
		...profileRestrictions,
	})
}

async function loadProfileSecurityRestrictions(supabase, userId) {
	const { data, error } = await supabase
		.from("profiles")
		.select("id, security_restrictions")
		.eq("id", userId)
		.maybeSingle()

	throwSupabaseError(
		error,
		500,
		"profile_restriction_lookup_failed",
		"Unable to verify account security restrictions.",
	)

	return data
}

function assertSecurityRestrictionsAllowed({
	authUser,
	profile,
	token,
	allowPasswordResetRequired = false,
	now = Date.now(),
}) {
	const restrictions = restrictionsFromProfileAndAuth(profile, authUser)

	if (restrictions.blockedUntilMs > now) {
		throw new ApiError(
			403,
			"account_temporarily_blocked",
			"This account is temporarily blocked.",
			{
				blockedUntilMs: restrictions.blockedUntilMs,
				blockedUntil: new Date(restrictions.blockedUntilMs).toISOString(),
				reason: restrictions.blockReason || null,
			},
		)
	}

	if (restrictions.forceLogoutAtMs > 0) {
		const issuedAtMs = getTokenIssuedAtMs(token)

		if (!issuedAtMs || issuedAtMs <= restrictions.forceLogoutAtMs) {
			throw new ApiError(
				401,
				"force_logout_required",
				"This session is no longer valid. Please sign in again.",
				{
					forceLogoutAtMs: restrictions.forceLogoutAtMs,
					forceLogoutAt: new Date(
						restrictions.forceLogoutAtMs,
					).toISOString(),
				},
			)
		}
	}

	if (
		restrictions.passwordResetRequired &&
		allowPasswordResetRequired !== true
	) {
		throw new ApiError(
			403,
			"password_reset_required",
			"This account must reset its password before continuing.",
			{
				passwordResetRequestedAtMs:
					restrictions.passwordResetRequestedAtMs || null,
			},
		)
	}

	return restrictions
}

module.exports = {
	assertSecurityRestrictionsAllowed,
	decodeJwtPayload,
	getTokenIssuedAtMs,
	loadProfileSecurityRestrictions,
	normalizeSecurityRestrictions,
	restrictionsFromProfileAndAuth,
}