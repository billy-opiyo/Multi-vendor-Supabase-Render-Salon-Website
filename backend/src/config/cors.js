const { allowedOrigins, isProduction } = require("./env")
const { ApiError } = require("../utils/errors")

const wildcardAllowed = allowedOrigins.includes("*")

const corsOptions = {
	origin(origin, callback) {
		if (!origin) {
			callback(null, true)
			return
		}

		if (wildcardAllowed || allowedOrigins.includes(origin)) {
			callback(null, true)
			return
		}

		callback(
			new ApiError(
				403,
				"cors_origin_not_allowed",
				"Origin is not allowed by CORS policy.",
			),
		)
	},
	credentials: true,
	optionsSuccessStatus: 204,
}

if (!isProduction && allowedOrigins.length === 0) {
	corsOptions.origin = true
}

module.exports = {
	corsOptions,
}
