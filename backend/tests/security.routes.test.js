const request = require("supertest")

process.env.NODE_ENV = "test"

const { createApp } = require("../src/app")

describe("phase 7 security route guards", () => {
	it("validates public login activity before Supabase access", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/security/login-activity")
			.send({ status: "invalid" })
			.expect(400)

		expect(response.body).toMatchObject({
			ok: false,
			code: "validation_failed",
		})
	})

	it("requires auth before recording account security changes", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/account/security-change")
			.send({ changeType: "password_changed" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before listing admin security dashboards", async () => {
		const app = createApp()

		const response = await request(app)
			.get("/api/v1/admin/security/login-activities")
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})

	it("requires auth before applying admin account restrictions", async () => {
		const app = createApp()

		const response = await request(app)
			.post("/api/v1/admin/security/users/00000000-0000-4000-8000-000000000001/restrict")
			.send({ action: "force_logout" })
			.expect(401)

		expect(response.body).toMatchObject({
			ok: false,
			code: "authentication_required",
		})
	})
})