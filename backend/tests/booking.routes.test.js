const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("phase 4 booking route guards", () => {
	it("requires auth before creating bookings", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/bookings")
			.send({ firstName: "Ada" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before listing own bookings", async () => {
		const app = createApp()

		const response = await request(app).get("/api/v1/bookings/me").expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before cancelling a booking", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/bookings/00000000-0000-4000-8000-000000000401/cancel")
			.send({ reason: "changed_plans" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before reading waitlist queue", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/api/v1/waitlist/00000000-0000-4000-8000-000000000501/queue")
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before checking admin booking permissions", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/api/v1/admin/bookings")
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before checking admin waitlist permissions", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/admin/waitlist/00000000-0000-4000-8000-000000000501/move-to-confirmed")
			.send({ reason: "slot_opened" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})
})