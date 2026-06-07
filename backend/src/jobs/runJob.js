const { flushNotificationOutbox } = require("./flushNotificationOutbox")
const { releaseExpiredBookingSlots } = require("./releaseExpiredBookingSlots")
const {
	sendUpcomingBookingReminders,
} = require("./sendUpcomingBookingReminders")
const {
	syncWaitlistSlotOpenNotifications,
} = require("./syncWaitlistSlotOpenNotifications")

const jobHandlers = Object.freeze({
	flushNotificationOutbox,
	releaseExpiredBookingSlots,
	sendUpcomingBookingReminders,
	syncWaitlistSlotOpenNotifications,
})

function parseCliOptions(args) {
	const options = {}

	for (const arg of args) {
		if (!arg.startsWith("--")) {
			continue
		}

		const [key, rawValue] = arg.slice(2).split("=")
		const value = rawValue === undefined ? true : rawValue
		const camelKey = key.replace(/-([a-z])/g, (_match, letter) =>
			letter.toUpperCase(),
		)

		if (value === "true") {
			options[camelKey] = true
		} else if (value === "false") {
			options[camelKey] = false
		} else if (value !== "" && !Number.isNaN(Number(value))) {
			options[camelKey] = Number(value)
		} else {
			options[camelKey] = value
		}
	}

	return options
}

async function runJob(jobName, options = {}) {
	const handler = jobHandlers[jobName]

	if (!handler) {
		throw new Error(
			`Unknown job "${jobName}". Available jobs: ${Object.keys(jobHandlers).join(", ")}`,
		)
	}

	return handler(options)
}

async function main() {
	const [, , jobName, ...optionArgs] = process.argv

	if (!jobName) {
		throw new Error(
			`Missing job name. Available jobs: ${Object.keys(jobHandlers).join(", ")}`,
		)
	}

	const result = await runJob(jobName, parseCliOptions(optionArgs))
	// eslint-disable-next-line no-console
	console.log(JSON.stringify({ ok: true, jobName, result }, null, 2))
}

if (require.main === module) {
	main().catch((error) => {
		// eslint-disable-next-line no-console
		console.error(
			JSON.stringify(
				{
					ok: false,
					message: error.message,
					stack: error.stack,
				},
				null,
				2,
			),
		)
		process.exitCode = 1
	})
}

module.exports = {
	jobHandlers,
	parseCliOptions,
	runJob,
}
