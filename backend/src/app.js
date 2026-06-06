const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")

const { corsOptions } = require("./config/cors")
const { isTest } = require("./config/env")
const healthRoutes = require("./routes/health.routes")
const adminRoutes = require("./modules/admins/admin.routes")
const authRoutes = require("./modules/auth/auth.routes")
const profileRoutes = require("./modules/profiles/profile.routes")
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler")

function createApp() {
	const app = express()

	app.disable("x-powered-by")
	app.use(helmet())
	app.use(cors(corsOptions))
	app.use(express.json({ limit: "1mb" }))

	if (!isTest) {
		app.use(morgan("combined"))
	}

	app.use(healthRoutes)
	app.use(authRoutes)
	app.use(profileRoutes)
	app.use(adminRoutes)

	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}

module.exports = {
	createApp,
}
