const { createApp } = require("./app")
const { env } = require("./config/env")

const app = createApp()

const server = app.listen(env.PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Salon Render backend listening on port ${env.PORT}`)
})

function shutdown(signal) {
	// eslint-disable-next-line no-console
	console.log(`${signal} received. Shutting down backend server...`)

	server.close(() => {
		process.exit(0)
	})
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
