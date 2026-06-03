const { defineConfig, devices } = require("@playwright/test")

const PORT = Number(process.env.PORT || 4173)
const HOST = process.env.HOST || "127.0.0.1"
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${HOST}:${PORT}`

module.exports = defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	timeout: 60 * 1000,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI
		? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
		: "list",
	use: {
		baseURL,
		launchOptions: {
			args: ["--disable-gpu", "--disable-software-rasterizer"],
		},
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},
	webServer: {
		command: "node scripts/test-static-server.js",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
})