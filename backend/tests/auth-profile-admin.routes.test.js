const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("phase 3 auth/profile/admin route guards", () => {
	it("requires auth for the current auth context endpoint", async () => {
		const app = createApp()

		const response = await request(app).get("/api/v1/auth/me").expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth for profile sync", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/profiles/sync")
			.send({ displayName: "Customer" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before checking admin permissions", async () => {
		const app = createApp()

		const response = await request(app).get("/api/v1/admin/users").expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})
})
