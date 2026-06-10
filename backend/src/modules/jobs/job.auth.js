const crypto = require("node:crypto")

const { env } = require("../../config/env")
const { ApiError } = require("../../utils/errors")

function getBearerToken(authorizationHeader = "") {
	const [scheme, token] = String(authorizationHeader).split(" ")

	if (scheme?.toLowerCase() !== "bearer" || !token) {
		return null
	}

	return token
}

function getRequestJobSecret(req) {
	return (
		req.get("x-job-secret") ||
		req.get("x-cron-secret") ||
		getBearerToken(req.get("authorization")) ||
		null
	)
}

function secretsMatch(providedSecret, expectedSecret) {
	if (!providedSecret || !expectedSecret) {
		return false
	}

	const provided = Buffer.from(String(providedSecret))
	const expected = Buffer.from(String(expectedSecret))

	if (provided.length !== expected.length) {
		return false
	}

	return crypto.timingSafeEqual(provided, expected)
}

function requireJobSecret(req, options = {}) {
	const expectedSecret =
		options.expectedSecret === undefined ? env.JOB_SECRET : options.expectedSecret

	if (!expectedSecret) {
		throw new ApiError(
			503,
			"job_secret_not_configured",
			"JOB_SECRET must be configured before scheduled jobs can be triggered.",
		)
	}

	if (!secretsMatch(getRequestJobSecret(req), expectedSecret)) {
		throw new ApiError(
			401,
			"job_authentication_failed",
			"Scheduled job secret required.",
		)
	}

	return true
}

module.exports = {
	getBearerToken,
	getRequestJobSecret,
	requireJobSecret,
	secretsMatch,
}