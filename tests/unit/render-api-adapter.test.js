const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

const ROOT = path.resolve(__dirname, "..", "..")

function loadRenderApiAdapter(fetchMock) {
	const code = fs.readFileSync(
		path.join(ROOT, "public", "JS", "render-api-adapter.js"),
		"utf8",
	)
	class TestFormData {}
	class TestCustomEvent {
		constructor(type, options = {}) {
			this.type = type
			this.detail = options.detail
		}
	}
	const sandbox = {
		CustomEvent: TestCustomEvent,
		FormData: TestFormData,
		console,
		fetch: fetchMock,
		sessionStorage: { setItem: vi.fn() },
		window: {
			APP_CONFIG: {
				render: { apiBaseUrl: "https://render.example.test" },
			},
			AppServices: {
				getAccessToken: () => "test-access-token",
			},
			CLIENT_CONFIG: {},
			dispatchEvent: vi.fn(),
			setTimeout,
		},
	}
	sandbox.window.window = sandbox.window

	vm.createContext(sandbox)
	vm.runInContext(code, sandbox, { filename: "render-api-adapter.js" })

	return sandbox.window.RenderApi
}

function createFetchMock() {
	const calls = []
	const fetchMock = vi.fn(async (url, options = {}) => {
		calls.push({ url, options })
		return {
			ok: true,
			status: 200,
			async text() {
				return JSON.stringify({ data: { ok: true, url } })
			},
		}
	})
	return { calls, fetchMock }
}

describe("render-api-adapter parity call routing", () => {
	it("routes expired slot release calls to UUID and legacy endpoints", async () => {
		const { calls, fetchMock } = createFetchMock()
		const renderApi = loadRenderApiAdapter(fetchMock)
		const uuidSlotId = "00000000-0000-4000-8000-000000000301"
		const legacySlotId = "2026-07-01__fatima__900AM"

		await renderApi.callCallable("clientReleaseExpiredBookingSlot", {
			slotId: uuidSlotId,
		})
		await renderApi.callCallable("clientReleaseExpiredBookingSlot", {
			slotId: legacySlotId,
		})

		expect(calls.map((call) => call.url)).toEqual([
			`https://render.example.test/api/v1/booking-slots/${uuidSlotId}/release-expired`,
			`https://render.example.test/api/v1/booking-slots/legacy/${legacySlotId}/release-expired`,
		])
		expect(calls[0].options.method).toBe("POST")
		expect(calls[1].options.method).toBe("POST")
		expect(calls[0].options.headers.Authorization).toBe(
			"Bearer test-access-token",
		)
		expect(JSON.parse(calls[1].options.body)).toEqual({ slotId: legacySlotId })
	})

	it("routes waitlist queue lookups by booking ID before waitlist ID", async () => {
		const { calls, fetchMock } = createFetchMock()
		const renderApi = loadRenderApiAdapter(fetchMock)
		const bookingId = "00000000-0000-4000-8000-000000000401"
		const waitlistId = "00000000-0000-4000-8000-000000000501"

		await renderApi.callCallable("clientGetWaitlistQueueInfo", {
			bookingId,
			waitlistId,
		})
		await renderApi.callCallable("clientGetWaitlistQueueInfo", {
			waitlistId,
		})

		expect(calls.map((call) => call.url)).toEqual([
			`https://render.example.test/api/v1/bookings/${bookingId}/waitlist-queue`,
			`https://render.example.test/api/v1/waitlist/${waitlistId}/queue`,
		])
		expect(calls[0].options.method).toBe("GET")
		expect(calls[0].options.body).toBeUndefined()
		expect(calls[1].options.method).toBe("GET")
	})
})