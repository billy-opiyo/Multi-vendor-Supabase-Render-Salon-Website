const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("phase 7 activity timeline route guards", () => {
	it("requires auth before listing the admin activity timeline", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/api/v1/admin/activity-timeline")
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})
})