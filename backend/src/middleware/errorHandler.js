const { ApiError } = require("../utils/errors")
const { isProduction } = require("../config/env")

function notFoundHandler(req, _res, next) {
	next(
		new ApiError(
			404,
			"not_found",
			`Route not found: ${req.method} ${req.originalUrl}`,
		),
	)
}

function errorHandler(err, _req, res, _next) {
	const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500
	const code = err.code || "internal_server_error"
	const message =
		statusCode === 500 && isProduction
			? "An unexpected server error occurred."
			: err.message || "An unexpected server error occurred."

	const response = {
		ok: false,
		code,
		message,
	}

	if (err.details !== undefined) {
		response.details = err.details
	}

	if (!isProduction && err.stack) {
		response.stack = err.stack
	}

	res.status(statusCode).json(response)
}

module.exports = {
	errorHandler,
	notFoundHandler,
}
