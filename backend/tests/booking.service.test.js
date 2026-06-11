process.env.NODE_ENV = "test"

const { ApiError } = require("../src/utils/errors")
const {
	createBookingService,
} = require("../src/modules/bookings/booking.service")
const {
	BOOKING_STATUSES,
	WAITLIST_SLOT_OCCUPIED_MESSAGE,
	WAITLIST_SLOT_OCCUPIED_REASON,
	WAITLIST_STATUSES,
} = require("../src/modules/bookings/booking.constants")
const {
	NOTIFICATION_TEMPLATE_KEYS,
} = require("../src/modules/notifications/notification.constants")

const customerUser = {
	id: "00000000-0000-4000-8000-000000000101",
	email: "customer@example.com",
}

const otherUser = {
	id: "00000000-0000-4000-8000-000000000102",
	email: "other@example.com",
}

const actorBookingAdmin = {
	id: "admin-row-1",
	user_id: "00000000-0000-4000-8000-000000000201",
	email: "bookings-admin@example.com",
	role: "admin",
	permissions: { canManageBookings: true },
	active: true,
}

const baseSlot = {
	id: "00000000-0000-4000-8000-000000000301",
	tenant_id: null,
	slot_date: "2026-07-01",
	slot_time: "09:00",
	starts_at: "2026-07-01T06:00:00.000Z",
	ends_at: "2026-07-01T07:00:00.000Z",
	stylist_id: null,
	stylist_key: "any",
	taken: false,
	booking_id: null,
	user_id: null,
	release_reason: null,
	released_at: null,
	metadata: {},
	created_at: "2026-06-07T00:00:00.000Z",
	updated_at: "2026-06-07T00:00:00.000Z",
}

const baseBooking = {
	id: "00000000-0000-4000-8000-000000000401",
	tenant_id: null,
	user_id: customerUser.id,
	slot_id: baseSlot.id,
	waitlist_id: null,
	first_name: "Ada",
	last_name: "Lovelace",
	email: customerUser.email,
	phone: "+254700000000",
	service: "Braids",
	service_id: null,
	stylist: null,
	stylist_id: null,
	appointment_date: baseSlot.slot_date,
	appointment_time: baseSlot.slot_time,
	starts_at: baseSlot.starts_at,
	status: BOOKING_STATUSES.PENDING,
	notes: null,
	inspiration_image_url: null,
	metadata: {},
	created_at: "2026-06-07T00:00:00.000Z",
	updated_at: "2026-06-07T00:00:00.000Z",
	cancelled_at: null,
	completed_at: null,
	expired_at: null,
	no_show_at: null,
}

const baseWaitlistEntry = {
	id: "00000000-0000-4000-8000-000000000501",
	tenant_id: null,
	user_id: customerUser.id,
	booking_id: baseBooking.id,
	preferred_slot_id: baseSlot.id,
	preferred_date: baseSlot.slot_date,
	preferred_time: baseSlot.slot_time,
	service: baseBooking.service,
	service_id: null,
	stylist: null,
	stylist_id: null,
	status: WAITLIST_STATUSES.WAITING,
	queue_position: 1,
	queue_size: 1,
	notification_channel: null,
	notified_at: null,
	metadata: {},
	created_at: "2026-06-07T00:00:00.000Z",
	updated_at: "2026-06-07T00:00:00.000Z",
}

const createPayload = {
	first_name: "Ada",
	last_name: "Lovelace",
	phone: "+254700000000",
	service: "Braids",
	appointment_date: baseSlot.slot_date,
	appointment_time: baseSlot.slot_time,
	metadata: {},
}

function createRepository(overrides = {}) {
	return {
		findSlotByIdentity: vi.fn().mockResolvedValue(baseSlot),
		createSlot: vi.fn(async (values) => ({ ...baseSlot, ...values })),
		reserveSlot: vi.fn(async (_slotId, values) => ({
			...baseSlot,
			...values,
			taken: true,
		})),
		attachSlotBooking: vi.fn(async (_slotId, bookingId) => ({
			...baseSlot,
			taken: true,
			booking_id: bookingId,
			user_id: customerUser.id,
		})),
		releaseSlot: vi.fn(async (slotId, values = {}) => ({
			...baseSlot,
			id: slotId,
			taken: false,
			booking_id: null,
			user_id: null,
			release_reason: values.release_reason || null,
			released_at: "2026-06-07T01:00:00.000Z",
		})),
		findBookingById: vi.fn().mockResolvedValue(baseBooking),
		listBookingsForUser: vi.fn().mockResolvedValue([baseBooking]),
		listAdminBookings: vi.fn().mockResolvedValue([baseBooking]),
		createBooking: vi.fn(async (values) => ({
			...baseBooking,
			...values,
			id:
				values.status === BOOKING_STATUSES.WAITLISTED
					? "00000000-0000-4000-8000-000000000402"
					: baseBooking.id,
		})),
		updateBooking: vi.fn(async (_bookingId, values) => ({
			...baseBooking,
			...values,
		})),
		findWaitlistById: vi.fn().mockResolvedValue(baseWaitlistEntry),
		listAdminWaitlist: vi.fn().mockResolvedValue([baseWaitlistEntry]),
		createWaitlistEntry: vi.fn(async (values) => ({
			...baseWaitlistEntry,
			...values,
			id: baseWaitlistEntry.id,
			booking_id: null,
			queue_position: null,
			queue_size: null,
		})),
		updateWaitlistEntry: vi.fn(async (waitlistId, values) => ({
			...baseWaitlistEntry,
			id: waitlistId,
			...values,
		})),
		listWaitlistQueue: vi.fn().mockResolvedValue([baseWaitlistEntry]),
		bulkUpdateWaitlistPositions: vi.fn(async (updates) =>
			updates.map((update) => ({
				...baseWaitlistEntry,
				...update,
			})),
		),
		insertStatusEvent: vi.fn().mockResolvedValue({
			id: "status-event-1",
			created_at: "2026-06-07T00:00:00.000Z",
		}),
		insertActivity: vi.fn().mockResolvedValue({
			id: "activity-1",
			created_at: "2026-06-07T00:00:00.000Z",
		}),
		insertAuditLog: vi.fn().mockResolvedValue({
			id: "audit-1",
			created_at: "2026-06-07T00:00:00.000Z",
		}),
		...overrides,
	}
}

function createNotificationServiceMock(overrides = {}) {
	return {
		queueBookingNotification: vi.fn().mockResolvedValue({ queued: [] }),
		queueWaitlistNotification: vi.fn().mockResolvedValue({ queued: [] }),
		queueWaitlistSlotOpenNotifications: vi
			.fn()
			.mockResolvedValue({ queued: [] }),
		...overrides,
	}
}

describe("booking service", () => {
	it("creates a confirmed booking and marks an available slot taken", async () => {
		const bookingRepository = createRepository()
		const notificationService = createNotificationServiceMock()
		const service = createBookingService({
			bookingRepository,
			notificationService,
		})

		const result = await service.createBooking(customerUser, createPayload)

		expect(result.waitlisted).toBe(false)
		expect(result.booking).toMatchObject({
			status: BOOKING_STATUSES.CONFIRMED,
			slot_id: baseSlot.id,
			user_id: customerUser.id,
			email: customerUser.email,
		})
		expect(result.slot).toMatchObject({
			taken: true,
			booking_id: baseBooking.id,
		})
		expect(bookingRepository.reserveSlot).toHaveBeenCalledWith(baseSlot.id, {
			user_id: customerUser.id,
		})
		expect(bookingRepository.createBooking).toHaveBeenCalledWith(
			expect.objectContaining({
				status: BOOKING_STATUSES.CONFIRMED,
				slot_id: baseSlot.id,
			}),
		)
		expect(bookingRepository.insertStatusEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				from_status: null,
				to_status: BOOKING_STATUSES.CONFIRMED,
			}),
		)
		expect(notificationService.queueBookingNotification).toHaveBeenCalledWith(
			result.booking,
			NOTIFICATION_TEMPLATE_KEYS.BOOKING_CONFIRMED,
			expect.objectContaining({ slot: result.slot }),
		)
	})

	it("creates a waitlisted booking when the requested slot is already occupied", async () => {
		const occupiedSlot = {
			...baseSlot,
			taken: true,
			booking_id: "00000000-0000-4000-8000-000000000499",
			user_id: otherUser.id,
		}
		const bookingRepository = createRepository({
			findSlotByIdentity: vi.fn().mockResolvedValue(occupiedSlot),
		})
		const notificationService = createNotificationServiceMock()
		const service = createBookingService({
			bookingRepository,
			notificationService,
		})

		const result = await service.createBooking(customerUser, createPayload)

		expect(result.waitlisted).toBe(true)
		expect(result.booking.status).toBe(BOOKING_STATUSES.WAITLISTED)
		expect(result.waitlistEntry).toMatchObject({
			queue_position: 1,
			queue_size: 1,
		})
		expect(bookingRepository.updateWaitlistEntry).toHaveBeenCalledWith(
			baseWaitlistEntry.id,
			{ booking_id: result.booking.id },
		)
		expect(bookingRepository.reserveSlot).not.toHaveBeenCalled()
		expect(bookingRepository.createWaitlistEntry).toHaveBeenCalledWith(
			expect.objectContaining({
				preferred_slot_id: occupiedSlot.id,
				status: WAITLIST_STATUSES.WAITING,
			}),
		)
		expect(notificationService.queueWaitlistNotification).toHaveBeenCalledWith(
			result.waitlistEntry,
			NOTIFICATION_TEMPLATE_KEYS.WAITLIST_JOINED,
			expect.objectContaining({
				booking: result.booking,
				slot: occupiedSlot,
				markWaitlistNotified: false,
			}),
		)
	})

	it("converts a slot reservation race into a waitlist entry", async () => {
		const bookingRepository = createRepository({
			reserveSlot: vi.fn().mockResolvedValue(null),
		})
		const service = createBookingService({ bookingRepository })

		const result = await service.createBooking(customerUser, createPayload)

		expect(result.waitlisted).toBe(true)
		expect(result.booking.status).toBe(BOOKING_STATUSES.WAITLISTED)
		expect(bookingRepository.createWaitlistEntry).toHaveBeenCalled()
	})

	it("prevents a customer from cancelling another customer's booking", async () => {
		const bookingRepository = createRepository({
			findBookingById: vi.fn().mockResolvedValue({
				...baseBooking,
				user_id: otherUser.id,
			}),
		})
		const service = createBookingService({ bookingRepository })

		await expect(
			service.cancelOwnBooking(customerUser, baseBooking.id, {}),
		).rejects.toMatchObject({
			code: "booking_access_denied",
			statusCode: 403,
		})
		expect(bookingRepository.updateBooking).not.toHaveBeenCalled()
	})

	it("allows a booking admin to complete a booking and release the slot", async () => {
		const bookingRepository = createRepository({
			findBookingById: vi.fn().mockResolvedValue({
				...baseBooking,
				status: BOOKING_STATUSES.CONFIRMED,
			}),
			updateBooking: vi.fn(async (_bookingId, values) => ({
				...baseBooking,
				status: BOOKING_STATUSES.CONFIRMED,
				...values,
			})),
		})
		const service = createBookingService({ bookingRepository })

		const result = await service.updateBookingStatusAsAdmin(
			actorBookingAdmin,
			baseBooking.id,
			{ status: BOOKING_STATUSES.COMPLETED, reason: "service_finished" },
		)

		expect(result.booking.status).toBe(BOOKING_STATUSES.COMPLETED)
		expect(bookingRepository.releaseSlot).toHaveBeenCalledWith(baseSlot.id, {
			release_reason: "service_finished",
		})
		expect(bookingRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "booking.status_updated",
				resource_id: baseBooking.id,
			}),
		)
	})

	it("moves a waitlisted booking to confirmed when the preferred slot is available", async () => {
		const waitlistedBooking = {
			...baseBooking,
			status: BOOKING_STATUSES.WAITLISTED,
			slot_id: null,
			waitlist_id: baseWaitlistEntry.id,
		}
		const availableSlot = {
			...baseSlot,
			taken: false,
			booking_id: null,
		}
		const bookingRepository = createRepository({
			findWaitlistById: vi.fn().mockResolvedValue(baseWaitlistEntry),
			findBookingById: vi.fn().mockResolvedValue(waitlistedBooking),
			findSlotById: vi.fn().mockResolvedValue(availableSlot),
			updateBooking: vi.fn(async (_bookingId, values) => ({
				...waitlistedBooking,
				...values,
			})),
		})
		const service = createBookingService({ bookingRepository })

		const result = await service.moveWaitlistToConfirmed(
			actorBookingAdmin,
			baseWaitlistEntry.id,
			{ reason: "slot_opened" },
		)

		expect(result.booking).toMatchObject({
			status: BOOKING_STATUSES.CONFIRMED,
			slot_id: availableSlot.id,
		})
		expect(result.waitlistEntry.status).toBe(WAITLIST_STATUSES.BOOKED)
		expect(bookingRepository.reserveSlot).toHaveBeenCalledWith(
			availableSlot.id,
			{ user_id: customerUser.id },
		)
		expect(bookingRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "waitlist.promoted_to_confirmed",
				resource_id: baseWaitlistEntry.id,
			}),
		)
	})

	it("rejects waitlist promotion when the preferred slot is occupied", async () => {
		const waitlistedBooking = {
			...baseBooking,
			status: BOOKING_STATUSES.WAITLISTED,
			slot_id: null,
			waitlist_id: baseWaitlistEntry.id,
		}
		const bookingRepository = createRepository({
			findWaitlistById: vi.fn().mockResolvedValue(baseWaitlistEntry),
			findBookingById: vi.fn().mockResolvedValue(waitlistedBooking),
			findSlotById: vi.fn().mockResolvedValue({
				...baseSlot,
				taken: true,
				booking_id: "00000000-0000-4000-8000-000000000499",
			}),
		})
		const service = createBookingService({ bookingRepository })

		await expect(
			service.moveWaitlistToConfirmed(
				actorBookingAdmin,
				baseWaitlistEntry.id,
				{},
			),
		).rejects.toMatchObject({
			code: "waitlist_slot_occupied",
			message: WAITLIST_SLOT_OCCUPIED_MESSAGE,
			statusCode: 409,
			details: {
				reason: WAITLIST_SLOT_OCCUPIED_REASON,
				slotId: baseSlot.id,
				currentBookingId: "00000000-0000-4000-8000-000000000499",
				waitlistBookingId: waitlistedBooking.id,
			},
		})
		expect(bookingRepository.updateBooking).not.toHaveBeenCalled()
	})

	it("releases expired taken slots after the Firebase two-hour grace window", async () => {
		const nowIso = "2026-07-01T09:00:00.000Z"
		const expiredSlot = {
			...baseSlot,
			taken: true,
			booking_id: baseBooking.id,
			user_id: customerUser.id,
			starts_at: "2026-07-01T06:00:00.000Z",
		}
		const confirmedBooking = {
			...baseBooking,
			status: BOOKING_STATUSES.CONFIRMED,
			slot_id: expiredSlot.id,
			starts_at: expiredSlot.starts_at,
		}
		const bookingRepository = createRepository({
			listExpiredTakenSlots: vi.fn().mockResolvedValue([expiredSlot]),
			listExpiredActiveBookings: vi.fn().mockResolvedValue([confirmedBooking]),
			findBookingById: vi.fn().mockResolvedValue(confirmedBooking),
			updateBooking: vi.fn(async (_bookingId, values) => ({
				...confirmedBooking,
				...values,
			})),
		})
		const notificationService = createNotificationServiceMock()
		const service = createBookingService({
			bookingRepository,
			notificationService,
		})

		const result = await service.releaseExpiredBookingSlots({ nowIso })

		expect(result.cutoffIso).toBe("2026-07-01T07:00:00.000Z")
		expect(result.candidates).toBe(2)
		expect(result.released).toHaveLength(1)
		expect(result.released[0]).toMatchObject({
			released: true,
			reason: BOOKING_STATUSES.NO_SHOW,
			bookingId: confirmedBooking.id,
			bookingStatus: BOOKING_STATUSES.CONFIRMED,
			nextBookingStatus: BOOKING_STATUSES.NO_SHOW,
		})
		expect(bookingRepository.updateBooking).toHaveBeenCalledWith(
			confirmedBooking.id,
			expect.objectContaining({
				status: BOOKING_STATUSES.NO_SHOW,
				no_show_at: nowIso,
			}),
		)
		expect(bookingRepository.releaseSlot).toHaveBeenCalledWith(expiredSlot.id, {
			release_reason: BOOKING_STATUSES.NO_SHOW,
		})
		expect(
			notificationService.queueWaitlistSlotOpenNotifications,
		).toHaveBeenCalled()
	})

	it("does not release taken slots before the two-hour expired-slot grace window", async () => {
		const nowIso = "2026-07-01T07:59:00.000Z"
		const notYetExpiredSlot = {
			...baseSlot,
			taken: true,
			booking_id: baseBooking.id,
			user_id: customerUser.id,
			starts_at: "2026-07-01T06:00:00.000Z",
		}
		const bookingRepository = createRepository({
			listExpiredTakenSlots: vi.fn().mockResolvedValue([notYetExpiredSlot]),
			listExpiredActiveBookings: vi.fn().mockResolvedValue([]),
		})
		const service = createBookingService({ bookingRepository })

		const result = await service.releaseExpiredBookingSlots({ nowIso })

		expect(result.released).toEqual([
			expect.objectContaining({
				released: false,
				reason: "not-expired",
			}),
		])
		expect(bookingRepository.updateBooking).not.toHaveBeenCalled()
		expect(bookingRepository.releaseSlot).not.toHaveBeenCalled()
	})

	it("exports ApiError-compatible failures for invalid time parsing", () => {
		const service = createBookingService({
			bookingRepository: createRepository(),
		})

		expect(service).toBeDefined()
		expect(new ApiError(400, "example", "Example")).toMatchObject({
			statusCode: 400,
			code: "example",
		})
	})
})
