// Render API browser adapter.
// ------------------------------------------------------------
// This file is intentionally framework-free so the static public/admin pages can
// call the Render backend without Firebase callable functions.
;(function () {
	const clientConfig = window.CLIENT_CONFIG || {}
	const appConfig = window.APP_CONFIG || {}
	const integrations = clientConfig.integrations || {}
	const renderConfig = appConfig.render || integrations.render || {}

	function trimSlash(value = "") {
		return String(value || "").replace(/\/+$/, "")
	}

	function resolveApiBaseUrl() {
		return trimSlash(
			renderConfig.apiBaseUrl ||
				renderConfig.baseUrl ||
				appConfig.apiBaseUrl ||
				integrations.apiBaseUrl ||
				"",
		)
	}

	function isPlainObject(value) {
		return Boolean(value && typeof value === "object" && !Array.isArray(value))
	}

	function toErrorMessage(payload, fallback = "Request failed") {
		if (typeof payload === "string" && payload.trim()) return payload.trim()
		if (isPlainObject(payload)) {
			return (
				payload.message ||
				payload.error_description ||
				payload.error ||
				payload.code ||
				fallback
			)
		}
		return fallback
	}

	async function readJsonResponse(response) {
		const text = await response.text()
		if (!text) return null
		try {
			return JSON.parse(text)
		} catch (_error) {
			return text
		}
	}

	function getAccessToken() {
		if (typeof window.AppServices?.getAccessToken === "function") {
			return window.AppServices.getAccessToken()
		}
		return ""
	}

	function normalizeTags(value) {
		if (Array.isArray(value)) {
			return value.map((item) => String(item || "").trim()).filter(Boolean)
		}
		return String(value || "")
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean)
	}

	function normalizePayload(payload = {}) {
		return isPlainObject(payload) ? payload : {}
	}

	async function request(path, options = {}) {
		const baseUrl = resolveApiBaseUrl()
		if (!baseUrl) {
			throw new Error(
				"Render API base URL is not configured. Set APP_CONFIG.render.apiBaseUrl in client-config.js.",
			)
		}

		const {
			method = "GET",
			body,
			headers = {},
			auth = true,
			token = "",
		} = options

		const requestHeaders = {
			...headers,
		}

		if (body !== undefined && !(body instanceof FormData)) {
			requestHeaders["Content-Type"] = "application/json"
		}

		const accessToken = token || (auth ? getAccessToken() : "")
		if (accessToken) {
			requestHeaders.Authorization = `Bearer ${accessToken}`
		}

		const response = await fetch(`${baseUrl}${path}`, {
			method,
			headers: requestHeaders,
			body:
				body === undefined
					? undefined
					: body instanceof FormData
						? body
						: JSON.stringify(body),
		})

		const payload = await readJsonResponse(response)
		if (!response.ok) {
			const error = new Error(
				toErrorMessage(payload, `Render API request failed (${response.status})`),
			)
			error.status = response.status
			error.payload = payload
			throw error
		}

		return payload
	}

	function dataOrPayload(payload) {
		return payload && Object.prototype.hasOwnProperty.call(payload, "data")
			? payload.data
			: payload
	}

	function encodeSegment(value = "") {
		return encodeURIComponent(String(value || "").trim())
	}

	function normalizeCloudinarySignPayload(payload = {}) {
		const source = normalizePayload(payload)
		return {
			...source,
			tags: normalizeTags(source.tags),
		}
	}

	const callableHandlers = {
		async createCloudinarySignedUpload(payload) {
			return dataOrPayload(
				await request("/api/v1/uploads/cloudinary/sign", {
					method: "POST",
					body: normalizeCloudinarySignPayload(payload),
				}),
			)
		},

		async logLoginActivity(payload) {
			return dataOrPayload(
				await request("/api/v1/security/login-activity", {
					method: "POST",
					body: payload,
					auth: Boolean(getAccessToken()),
				}),
			)
		},

		async logAccountSecurityChange(payload) {
			return dataOrPayload(
				await request("/api/v1/account/security-change", {
					method: "POST",
					body: payload,
				}),
			)
		},

		async clientCancelBooking(payload = {}) {
			const bookingId = encodeSegment(payload.bookingId || payload.booking_id)
			return dataOrPayload(
				await request(`/api/v1/bookings/${bookingId}/cancel`, {
					method: "POST",
					body: payload,
				}),
			)
		},

		async clientRescheduleBooking(payload = {}) {
			const bookingId = encodeSegment(payload.bookingId || payload.booking_id)
			return dataOrPayload(
				await request(`/api/v1/bookings/${bookingId}/reschedule`, {
					method: "POST",
					body: {
						...payload,
						appointment_date: payload.appointment_date || payload.date,
						appointment_time: payload.appointment_time || payload.time,
						stylist_key: payload.stylist_key || payload.stylistKey,
					},
				}),
			)
		},

		async clientReleaseExpiredBookingSlot(payload = {}) {
			return { ok: true, skipped: true, slotId: payload.slotId || payload.slot_id }
		},

		async clientGetWaitlistQueueInfo(payload = {}) {
			const waitlistId = encodeSegment(payload.waitlistId || payload.waitlist_id)
			if (!waitlistId) return null
			return dataOrPayload(
				await request(`/api/v1/waitlist/${waitlistId}/queue`, {
					method: "GET",
				}),
			)
		},

		async adminRestrictUserAccount(payload = {}) {
			const userId = encodeSegment(payload.uid || payload.userId || payload.user_id)
			return dataOrPayload(
				await request(`/api/v1/admin/security/users/${userId}/restrict`, {
					method: "POST",
					body: payload,
				}),
			)
		},

		async adminCreateAdminUser(payload = {}) {
			return dataOrPayload(
				await request("/api/v1/admin/users", {
					method: "POST",
					body: payload,
				}),
			)
		},

		async adminUpdateAdminUser(payload = {}) {
			const adminUserId = encodeSegment(
				payload.adminUserId || payload.admin_user_id || payload.id,
			)
			return dataOrPayload(
				await request(`/api/v1/admin/users/${adminUserId}`, {
					method: "PATCH",
					body: payload,
				}),
			)
		},

		async adminListAdminUsers() {
			return dataOrPayload(await request("/api/v1/admin/users"))
		},

		async adminMoveWaitlistBookingToConfirmed(payload = {}) {
			const waitlistId = encodeSegment(payload.waitlistId || payload.waitlist_id)
			return dataOrPayload(
				await request(`/api/v1/admin/waitlist/${waitlistId}/move-to-confirmed`, {
					method: "POST",
					body: payload,
				}),
			)
		},

		async adminUpdateBookingStatusAndReleaseSlot(payload = {}) {
			const bookingId = encodeSegment(payload.bookingId || payload.booking_id)
			return dataOrPayload(
				await request(`/api/v1/admin/bookings/${bookingId}/release-slot`, {
					method: "POST",
					body: payload,
				}),
			)
		},
	}

	async function callCallable(name, payload = {}) {
		const safeName = String(name || "").trim()
		const handler = callableHandlers[safeName]
		if (!handler) {
			throw new Error(`No Render callable adapter is registered for ${safeName}.`)
		}
		return handler(payload)
	}

	window.RenderApi = {
		callCallable,
		dataOrPayload,
		isConfigured: () => Boolean(resolveApiBaseUrl()),
		request,
		resolveApiBaseUrl,
	}
})()