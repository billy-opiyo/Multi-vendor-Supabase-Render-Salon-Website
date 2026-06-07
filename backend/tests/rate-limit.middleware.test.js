const express = require("express")
const request = require("supertest")

process.env.NODE_ENV = "test"

const { errorHandler } = require("../src/middleware/errorHandler")
const { rateLimit } = require("../src/middleware/rateLimit")

describe("rate limit middleware", () => {
	it("blocks requests over the configured limit", async () => {
		const app = express()
		app.use(express.json())
		app.post(
			"/limited",
			rateLimit({ action: "api", limit: 1, windowMs: 60_000 }),
			(_req, res) => res.status(200).json({ ok: true }),
		)
		app.use(errorHandler)

		await request(app)
			.post("/limited")
			.send({ attempted_email: "rate-test@example.com" })
			.expect(200)

		const response = await request(app)
			.post("/limited")
			.send({ attempted_email: "rate-test@example.com" })
			.expect(429)

		expect(response.body).toMatchObject({
			ok: false,
			code: "rate_limit_exceeded",
		})
	})
})