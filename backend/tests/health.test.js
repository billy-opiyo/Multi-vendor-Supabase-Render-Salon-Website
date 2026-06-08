const request = require("supertest")

process.env.NODE_ENV = "test"
process.env.FRONTEND_ORIGIN = "https://allowed.example"

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

	it("allows configured browser origins with CORS headers", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/health")
			.set("Origin", "https://allowed.example")
			.expect(200)

		expect(response.headers["access-control-allow-origin"]).toBe(
			"https://allowed.example",
		)
	})

	it("rejects unexpected browser origins without returning a generic 500", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/health")
			.set("Origin", "https://unexpected-origin.example")
			.expect(403)

		expect(response.headers["access-control-allow-origin"]).toBeUndefined()
		expect(response.body).toMatchObject({
			ok: false,
			code: "cors_origin_not_allowed",
			message: "Origin is not allowed by CORS policy.",
		})
	})
})
