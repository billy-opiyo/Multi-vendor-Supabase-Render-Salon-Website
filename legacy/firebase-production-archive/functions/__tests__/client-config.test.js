const clientConfig = require("../client-config")

describe("functions client config", () => {
	it("exposes backend branding and timezone values", () => {
		expect(clientConfig.businessName).toEqual(expect.any(String))
		expect(clientConfig.businessName.trim()).not.toBe("")
		expect(clientConfig.teamName).toEqual(expect.any(String))
		expect(clientConfig.timezone).toEqual(expect.any(String))
		expect(Number.isFinite(Number(clientConfig.utcOffsetHours))).toBe(true)
	})

	it("keeps server notification and upload values deployable", () => {
		expect(clientConfig.contactNotificationEmail).toMatch(
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		)
		expect(clientConfig.cloudinaryFolder).toMatch(/^[a-z0-9-]+\/uploads$/)
		expect(clientConfig.utcOffsetHours).toBeGreaterThanOrEqual(-12)
		expect(clientConfig.utcOffsetHours).toBeLessThanOrEqual(14)
	})
})