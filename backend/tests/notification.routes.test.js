const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("phase 5 notification route guards", () => {
	it("requires auth before flushing the notification outbox", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/admin/notifications/outbox/flush")
			.send({ limit: 1 })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before queueing upcoming reminders", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/admin/notifications/reminders/upcoming")
			.send({ limit: 1 })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})
})
