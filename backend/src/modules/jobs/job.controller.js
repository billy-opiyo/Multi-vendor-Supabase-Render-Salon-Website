const { jobHandlers, runJob } = require("../../jobs/runJob")
const { ApiError, asyncHandler } = require("../../utils/errors")
const { requireJobSecret } = require("./job.auth")

const availableJobs = Object.freeze(Object.keys(jobHandlers))

function getRequestOptions(req) {
	const body = req.body && typeof req.body === "object" ? req.body : {}
	const options =
		body.options && typeof body.options === "object" && !Array.isArray(body.options)
			? body.options
			: {}

	return {
		source: "external_http_scheduler",
		...options,
	}
}

const runScheduledJob = asyncHandler(async (req, res) => {
	requireJobSecret(req)

	const { jobName } = req.params

	if (!jobHandlers[jobName]) {
		throw new ApiError(
			404,
			"job_not_found",
			`Unknown job "${jobName}".`,
			{
				availableJobs,
			},
		)
	}

	const result = await runJob(jobName, getRequestOptions(req))

	res.status(200).json({
		ok: true,
		data: {
			jobName,
			result,
		},
	})
})

module.exports = {
	availableJobs,
	runScheduledJob,
}