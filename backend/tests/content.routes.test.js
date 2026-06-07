const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("phase 6 content route guards", () => {
	it("allows public validation to run before Supabase access for review submissions", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/reviews")
			.send({ customerName: "Ada" })
			.expect(400)

		expect(response.body).toMatchObject({
			ok: false,
			code: "validation_failed",
		})
	})

	it("allows public validation to run before Supabase access for contact messages", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/contact-messages")
			.send({ firstName: "Ada" })
			.expect(400)

		expect(response.body).toMatchObject({
			ok: false,
			code: "validation_failed",
		})
	})

	it("requires auth before listing admin gallery items", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/api/v1/admin/gallery")
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before moderating reviews", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/admin/reviews/00000000-0000-4000-8000-000000000701/moderate")
			.send({ status: "approved" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before signing Cloudinary uploads", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/uploads/cloudinary/sign")
			.send({ publicId: "gallery/test" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before updating contact message status", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/admin/contact-messages/00000000-0000-4000-8000-000000000801/status")
			.send({ status: "resolved" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})
})