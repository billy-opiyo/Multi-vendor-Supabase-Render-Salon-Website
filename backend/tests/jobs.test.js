process.env.NODE_ENV = "test"

const { parseCliOptions } = require("../src/jobs/runJob")

describe("job runner", () => {
	it("parses CLI options for Render cron jobs", () => {
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
})
