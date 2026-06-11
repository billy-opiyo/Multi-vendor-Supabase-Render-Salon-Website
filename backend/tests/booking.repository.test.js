process.env.NODE_ENV = "test"

const {
	PUBLIC_BOOKING_SLOT_SELECT,
	createBookingRepository,
} = require("../src/modules/bookings/booking.repository")

function createQueryMock({ data = [], error = null } = {}) {
	const calls = []
	const query = {
		select: vi.fn((columns) => {
			calls.push(["select", columns])
			return query
		}),
		order: vi.fn((column, options) => {
			calls.push(["order", column, options])
			return query
		}),
		range: vi.fn((from, to) => {
			calls.push(["range", from, to])
			return query
		}),
		eq: vi.fn((column, value) => {
			calls.push(["eq", column, value])
			return query
		}),
		gte: vi.fn((column, value) => {
			calls.push(["gte", column, value])
			return query
		}),
		lte: vi.fn((column, value) => {
			calls.push(["lte", column, value])
			return query
		}),
		ilike: vi.fn((column, value) => {
			calls.push(["ilike", column, value])
			return query
		}),
		is: vi.fn((column, value) => {
			calls.push(["is", column, value])
			return query
		}),
		then(resolve, reject) {
			return Promise.resolve({ data, error }).then(resolve, reject)
		},
	}
	const supabase = {
		from: vi.fn((table) => {
			calls.push(["from", table])
			return query
		}),
	}

	return { calls, query, supabase }
}

describe("booking repository public slot listing", () => {
	it("uses a safe public booking slot projection and default future/taken filters", async () => {
		const rows = [{ id: "slot-1", taken: true }]
		const { calls, supabase } = createQueryMock({ data: rows })
		const repository = createBookingRepository(supabase)

		const result = await repository.listPublicBookingSlots()

		expect(result).toBe(rows)
		expect(calls).toContainEqual(["from", "booking_slots"])
		expect(calls).toContainEqual(["select", PUBLIC_BOOKING_SLOT_SELECT])
		expect(PUBLIC_BOOKING_SLOT_SELECT).not.toMatch(
			/booking_id|user_id|metadata|release_reason|released_at/,
		)
		expect(calls).toContainEqual(["is", "tenant_id", null])
		expect(calls).toContainEqual(["eq", "taken", true])
		expect(calls).toContainEqual(["range", 0, 299])
		expect(
			calls.some(
				([method, column, value]) =>
					method === "gte" &&
					column === "starts_at" &&
					!Number.isNaN(Date.parse(value)),
			),
		).toBe(true)
	})

	it("applies explicit public booking slot filters", async () => {
		const { calls, supabase } = createQueryMock({ data: [] })
		const repository = createBookingRepository(supabase)

		await repository.listPublicBookingSlots({
			tenant_id: "00000000-0000-4000-8000-000000000901",
			date: "2026-07-01",
			stylist_key: "fatima",
			taken: false,
			limit: 2,
			offset: 5,
		})

		expect(calls).toContainEqual([
			"eq",
			"tenant_id",
			"00000000-0000-4000-8000-000000000901",
		])
		expect(calls).toContainEqual(["eq", "slot_date", "2026-07-01"])
		expect(calls).toContainEqual(["ilike", "stylist_key", "fatima"])
		expect(calls).toContainEqual(["eq", "taken", false])
		expect(calls).toContainEqual(["range", 5, 6])
		expect(
			calls.some(
				([method, column]) => method === "gte" && column === "starts_at",
			),
		).toBe(false)
	})

	it("applies from/to date ranges when a single date is not supplied", async () => {
		const { calls, supabase } = createQueryMock({ data: [] })
		const repository = createBookingRepository(supabase)

		await repository.listPublicBookingSlots({
			from: "2026-07-01",
			to: "2026-07-31",
		})

		expect(calls).toContainEqual(["gte", "slot_date", "2026-07-01"])
		expect(calls).toContainEqual(["lte", "slot_date", "2026-07-31"])
	})
})