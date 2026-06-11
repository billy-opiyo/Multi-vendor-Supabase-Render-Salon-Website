process.env.NODE_ENV = "test"

const request = require("supertest")

function createAppWithBookingService(service) {
	const appPath = require.resolve("../src/app")
	const routesPath = require.resolve(
		"../src/modules/bookings/booking.routes",
	)
	const controllerPath = require.resolve(
		"../src/modules/bookings/booking.controller",
	)
	const servicePath = require.resolve(
		"../src/modules/bookings/booking.service",
	)

	delete require.cache[appPath]
	delete require.cache[routesPath]
	delete require.cache[controllerPath]

	const serviceModule = require(servicePath)
	const originalCreateBookingService = serviceModule.createBookingService
	serviceModule.createBookingService = () => service

	const { createApp } = require("../src/app")
	const app = createApp()

	return {
		app,
		restore() {
			serviceModule.createBookingService = originalCreateBookingService
			delete require.cache[appPath]
			delete require.cache[routesPath]
			delete require.cache[controllerPath]
		},
	}
}

describe("booking parity routes", () => {
	it("lists public booking slots with validated query filters", async () => {
		const bookingSlots = [
			{
				id: "00000000-0000-4000-8000-000000000301",
				slot_date: "2026-07-01",
				slot_time: "9:00 AM",
				stylist_key: "fatima",
				taken: true,
			},
		]
		const service = {
			listPublicBookingSlots: vi.fn().mockResolvedValue(bookingSlots),
		}
		const { app, restore } = createAppWithBookingService(service)

		try {
			const response = await request(app)
				.get("/api/v1/booking-slots")
				.query({
					date: "2026-07-01",
					stylist_key: "fatima",
					taken: "true",
					limit: "10",
					offset: "2",
				})
				.expect(200)

			expect(response.body).toEqual({
				ok: true,
				data: { bookingSlots },
			})
			expect(service.listPublicBookingSlots).toHaveBeenCalledWith({
				date: "2026-07-01",
				stylist_key: "fatima",
				taken: true,
				limit: 10,
				offset: 2,
			})
		} finally {
			restore()
		}
	}, 10_000)

	it("rejects invalid public booking slot filters before service access", async () => {
		const service = {
			listPublicBookingSlots: vi.fn(),
		}
		const { app, restore } = createAppWithBookingService(service)

		try {
			const response = await request(app)
				.get("/api/v1/booking-slots")
				.query({ date: "07-01-2026" })
				.expect(400)

			expect(response.body).toMatchObject({
				ok: false,
				code: "validation_failed",
			})
			expect(service.listPublicBookingSlots).not.toHaveBeenCalled()
		} finally {
			restore()
		}
	})

	it("requires auth before releasing expired legacy booking slots", async () => {
		const service = {
			releaseExpiredBookingSlotForClientByLegacyId: vi.fn(),
		}
		const { app, restore } = createAppWithBookingService(service)

		try {
			const response = await request(app)
				.post(
					"/api/v1/booking-slots/legacy/2026-07-01__fatima__900AM/release-expired",
				)
				.expect(401)

			expect(response.body).toMatchObject({
				ok: false,
				code: "authentication_required",
			})
			expect(
				service.releaseExpiredBookingSlotForClientByLegacyId,
			).not.toHaveBeenCalled()
		} finally {
			restore()
		}
	})
})