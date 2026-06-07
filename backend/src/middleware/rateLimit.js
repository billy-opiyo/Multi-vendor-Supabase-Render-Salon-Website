const { getSupabaseAdmin } = require("../db/supabaseAdmin")
const { isSupabaseConfigured } = require("../config/env")
const { ApiError, asyncHandler } = require("../utils/errors")
const { getSupabaseErrorDetails } = require("../utils/supabaseErrors")

function extractSubject(req) {
	if (req.auth?.user?.id) {
		return { subject_type: "user", subject_key: req.auth.user.id }
	}

	const email = String(req.body?.email || req.body?.attempted_email || "")
		.trim()
		.toLowerCase()

	if (email) {
		return { subject_type: "email", subject_key: email }
	}

	const forwarded = req.headers?.["x-forwarded-for"]
	const ip = String(
		(Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
			req.ip ||
			req.socket?.remoteAddress ||
			"anonymous",
	)
		.split(",")[0]
		.trim()

	return {
		subject_type: ip && ip !== "anonymous" ? "ip" : "anonymous",
		subject_key: ip || "anonymous",
	}
}

function addMs(date, ms) {
	return new Date(date.getTime() + ms)
}

function isSameWindow(windowStart, now, windowMs) {
	const windowStartMs = new Date(windowStart || 0).getTime()
	return Number.isFinite(windowStartMs) && now.getTime() - windowStartMs < windowMs
}

function createMemoryRateLimiter() {
	const store = new Map()

	return async function memoryRateLimit({ subject, tenantId, action, limit, windowMs, lockMs }) {
		const now = new Date()
		const key = [tenantId || "global", subject.subject_type, subject.subject_key, action].join(":")
		const existing = store.get(key)

		if (existing?.locked_until && new Date(existing.locked_until) > now) {
			return {
				allowed: false,
				attempts: existing.attempts,
				lockedUntil: existing.locked_until,
			}
		}

		const attempts = existing && isSameWindow(existing.window_start, now, windowMs)
			? existing.attempts + 1
			: 1
		const lockedUntil = attempts > limit ? addMs(now, lockMs).toISOString() : null

		store.set(key, {
			attempts,
			window_start: existing && isSameWindow(existing.window_start, now, windowMs)
				? existing.window_start
				: now.toISOString(),
			locked_until: lockedUntil,
		})

		return {
			allowed: !lockedUntil,
			attempts,
			lockedUntil,
		}
	}
}

const memoryRateLimit = createMemoryRateLimiter()

async function databaseRateLimit({ subject, tenantId, action, limit, windowMs, lockMs }) {
	const supabase = getSupabaseAdmin()
	const now = new Date()
	let query = supabase
		.from("rate_limits")
		.select("id, attempts, window_start, locked_until")
		.eq("subject_type", subject.subject_type)
		.eq("subject_key", subject.subject_key)
		.eq("action", action)

	query = tenantId ? query.eq("tenant_id", tenantId) : query.is("tenant_id", null)

	const { data: existing, error: lookupError } = await query.maybeSingle()

	if (lookupError) {
		throw new ApiError(
			500,
			"rate_limit_lookup_failed",
			"Unable to verify request rate limit.",
			getSupabaseErrorDetails(lookupError),
		)
	}

	if (existing?.locked_until && new Date(existing.locked_until) > now) {
		return {
			allowed: false,
			attempts: existing.attempts,
			lockedUntil: existing.locked_until,
		}
	}

	const keepWindow = existing && isSameWindow(existing.window_start, now, windowMs)
	const attempts = keepWindow ? existing.attempts + 1 : 1
	const lockedUntil = attempts > limit ? addMs(now, lockMs).toISOString() : null
	const values = {
		tenant_id: tenantId || null,
		subject_type: subject.subject_type,
		subject_key: subject.subject_key,
		action,
		attempts,
		window_start: keepWindow ? existing.window_start : now.toISOString(),
		locked_until: lockedUntil,
		metadata: {
			limit,
			window_ms: windowMs,
			lock_ms: lockMs,
		},
	}

	const write = existing
		? supabase.from("rate_limits").update(values).eq("id", existing.id)
		: supabase.from("rate_limits").insert(values)
	const { error: writeError } = await write

	if (writeError) {
		throw new ApiError(
			500,
			"rate_limit_write_failed",
			"Unable to update request rate limit.",
			getSupabaseErrorDetails(writeError),
		)
	}

	return {
		allowed: !lockedUntil,
		attempts,
		lockedUntil,
	}
}

function rateLimit({ action = "api", limit = 60, windowMs = 60 * 1000, lockMs = windowMs } = {}) {
	return asyncHandler(async (req, res, next) => {
		const subject = extractSubject(req)
		const tenantId = req.body?.tenant_id || req.query?.tenant_id || req.admin?.tenant_id || null
		const result = isSupabaseConfigured
			? await databaseRateLimit({ subject, tenantId, action, limit, windowMs, lockMs })
			: await memoryRateLimit({ subject, tenantId, action, limit, windowMs, lockMs })

		res.setHeader("X-RateLimit-Limit", String(limit))
		res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - result.attempts)))

		if (!result.allowed) {
			if (result.lockedUntil) {
				res.setHeader("Retry-After", String(Math.ceil((new Date(result.lockedUntil).getTime() - Date.now()) / 1000)))
			}

			throw new ApiError(
				429,
				"rate_limit_exceeded",
				"Too many requests. Please try again later.",
				{
					lockedUntil: result.lockedUntil,
					limit,
					windowMs,
				},
			)
		}

		next()
	})
}

module.exports = {
	databaseRateLimit,
	extractSubject,
	rateLimit,
}