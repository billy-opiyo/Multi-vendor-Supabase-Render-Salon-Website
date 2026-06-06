const { ApiError } = require("./errors")

function formatZodIssue(issue) {
	return {
		path: issue.path?.length ? issue.path.join(".") : "body",
		code: issue.code,
		message: issue.message,
	}
}

function parseRequest(schema, value, options = {}) {
	const result = schema.safeParse(value)

	if (!result.success) {
		throw new ApiError(
			400,
			options.code || "validation_failed",
			options.message || "Invalid request payload.",
			{
				issues: result.error.issues.map(formatZodIssue),
			},
		)
	}

	return result.data
}

function pickDefined(values) {
	return Object.fromEntries(
		Object.entries(values).filter(([_key, value]) => value !== undefined),
	)
}

function hasOwn(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

module.exports = {
	parseRequest,
	pickDefined,
	hasOwn,
}
