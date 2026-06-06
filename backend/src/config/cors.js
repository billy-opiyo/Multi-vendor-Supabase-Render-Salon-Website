const { allowedOrigins, isProduction } = require("./env")

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

		callback(new Error(`Origin not allowed by CORS: ${origin}`))
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
