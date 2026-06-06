const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("health endpoint", () => {
	it("returns service health metadata", async () => {
		const app = createApp()

		const response = await request(app).get("/health").expect(200)

		expect(response.body).toMatchObject({
			ok: true,
			service: "salon-render-backend",
			environment: "test",
			supabaseConfigured: false,
		})
		expect(response.body.timestamp).toEqual(expect.any(String))
		expect(response.body.uptimeSeconds).toEqual(expect.any(Number))
	})

	it("returns consistent JSON for unknown routes", async () => {
		const app = createApp()

		const response = await request(app).get("/missing").expect(404)

		expect(response.body).toMatchObject({
			ok: false,
			code: "not_found",
		})
	})
})
