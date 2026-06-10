process.env.NODE_ENV = "test"

const { parseCliOptions } = require("../src/jobs/runJob")
const {
	getBearerToken,
	getRequestJobSecret,
	requireJobSecret,
	secretsMatch,
} = require("../src/modules/jobs/job.auth")

function createRequest(headers = {}) {
	const normalizedHeaders = Object.fromEntries(
		Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
	)

	return {
		get(headerName) {
			return normalizedHeaders[headerName.toLowerCase()] || ""
		},
	}
}

describe("job runner", () => {
	it("parses CLI options for scheduled jobs", () => {
		expect(
			parseCliOptions([
				"--limit=10",
				"--dry-run=true",
				"--window-minutes=60",
				"--source=test",
			]),
		).toEqual({
			limit: 10,
			dryRun: true,
			windowMinutes: 60,
			source: "test",
		})
	})

	it("reads scheduler secrets from supported HTTP headers", () => {
		expect(getBearerToken("Bearer secret-value")).toBe("secret-value")
		expect(getBearerToken("Basic secret-value")).toBeNull()

		expect(
			getRequestJobSecret(createRequest({ "x-job-secret": "primary" })),
		).toBe("primary")
		expect(
			getRequestJobSecret(createRequest({ "x-cron-secret": "fallback" })),
		).toBe("fallback")
		expect(
			getRequestJobSecret(
				createRequest({ authorization: "Bearer bearer-secret" }),
			),
		).toBe("bearer-secret")
	})

	it("compares scheduler secrets safely", () => {
		expect(secretsMatch("expected", "expected")).toBe(true)
		expect(secretsMatch("wrong", "expected")).toBe(false)
		expect(secretsMatch("", "expected")).toBe(false)
		expect(secretsMatch("expected", "")).toBe(false)
	})

	it("requires a configured scheduler secret", () => {
		expect(() =>
			requireJobSecret(createRequest({ "x-job-secret": "anything" }), {
				expectedSecret: null,
			}),
		).toThrow("JOB_SECRET must be configured")
	})

	it("rejects missing or invalid scheduler secrets", () => {
		for (const request of [
			createRequest(),
			createRequest({ "x-job-secret": "wrong" }),
		]) {
			expect(() =>
				requireJobSecret(request, { expectedSecret: "expected" }),
			).toThrow("Scheduled job secret required")
		}
	})

	it("accepts a matching scheduler secret", () => {
		expect(
			requireJobSecret(createRequest({ "x-job-secret": "expected" }), {
				expectedSecret: "expected",
			}),
		).toBe(true)
	})
})
