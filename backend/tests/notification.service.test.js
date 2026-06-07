process.env.NODE_ENV = "test"

const {
	NOTIFICATION_CHANNELS,
	NOTIFICATION_STATUSES,
	NOTIFICATION_TEMPLATE_KEYS,
} = require("../src/modules/notifications/notification.constants")
const {
	buildIdempotencyKey,
	createNotificationService,
} = require("../src/modules/notifications/notification.service")

const booking = {
	id: "00000000-0000-4000-8000-000000000401",
	tenant_id: null,
	user_id: "00000000-0000-4000-8000-000000000101",
	first_name: "Ada",
	last_name: "Lovelace",
	email: "ada@example.com",
	phone: "+254700000000",
	service: "Braids",
	appointment_date: "2026-07-01",
	appointment_time: "09:00",
	starts_at: "2026-07-01T06:00:00.000Z",
	status: "pending",
	metadata: {},
}

function createRepository(overrides = {}) {
	return {
		enqueueOutbox: vi.fn(async (values) => ({
			id: `outbox-${values.channel}`,
			attempts: 0,
			was_existing: false,
			...values,
		})),
		insertBookingNotification: vi.fn(async (values) => ({
			id: `booking-notification-${values.channel}`,
			...values,
		})),
		claimAvailable: vi.fn().mockResolvedValue([]),
		markSent: vi.fn(async (id, values = {}) => ({
			id,
			status: NOTIFICATION_STATUSES.SENT,
			...values,
		})),
		markSkipped: vi.fn(async (id, reason) => ({
			id,
			status: NOTIFICATION_STATUSES.SKIPPED,
			failure_reason: reason,
		})),
		markRetrying: vi.fn(async (id, values = {}) => ({
			id,
			status: NOTIFICATION_STATUSES.RETRYING,
			...values,
		})),
		markFailed: vi.fn(async (id, values = {}) => ({
			id,
			status: NOTIFICATION_STATUSES.FAILED,
			...values,
		})),
		listUpcomingReminderCandidates: vi.fn().mockResolvedValue([]),
		listRecentlyReleasedSlots: vi.fn().mockResolvedValue([]),
		listWaitlistEntriesForSlot: vi.fn().mockResolvedValue([]),
		findBookingById: vi.fn().mockResolvedValue(booking),
		markWaitlistNotified: vi.fn(async (id, values = {}) => ({
			id,
			...values,
		})),
		...overrides,
	}
}

function createProviders(overrides = {}) {
	return {
		emailProvider: {
			sendEmail: vi.fn().mockResolvedValue({
				provider: "resend",
				providerMessageId: "email-message-1",
			}),
		},
		whatsappProvider: {
			sendTextMessage: vi.fn().mockResolvedValue({
				provider: "whatsapp_cloud_api",
				providerMessageId: "whatsapp-message-1",
			}),
		},
		...overrides,
	}
}

describe("notification service", () => {
	it("builds stable idempotency keys", () => {
		expect(buildIdempotencyKey(["Booking", booking.id, "email reminder"])).toBe(
			`booking:${booking.id}:email_reminder`,
		)
	})

	it("queues booking notifications for email and WhatsApp recipients", async () => {
		const notificationRepository = createRepository()
		const service = createNotificationService({
			notificationRepository,
			...createProviders(),
		})

		const result = await service.queueBookingNotification(
			booking,
			NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED,
			{ uniqueKey: "created" },
		)

		expect(result.skipped).toBe(false)
		expect(result.queued).toHaveLength(2)
		expect(notificationRepository.enqueueOutbox).toHaveBeenCalledWith(
			expect.objectContaining({
				channel: NOTIFICATION_CHANNELS.EMAIL,
				template_key: NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED,
				aggregate_type: "booking",
				aggregate_id: booking.id,
			}),
		)
		expect(notificationRepository.enqueueOutbox).toHaveBeenCalledWith(
			expect.objectContaining({
				channel: NOTIFICATION_CHANNELS.WHATSAPP,
				recipient_phone: booking.phone,
			}),
		)
		expect(
			notificationRepository.insertBookingNotification,
		).toHaveBeenCalledTimes(2)
	})

	it("flushes pending email notifications through the email provider", async () => {
		const pendingRow = {
			id: "outbox-1",
			channel: NOTIFICATION_CHANNELS.EMAIL,
			template_key: NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED,
			recipient_email: booking.email,
			recipient_phone: null,
			payload: { booking },
			attempts: 1,
			metadata: {},
		}
		const notificationRepository = createRepository({
			claimAvailable: vi.fn().mockResolvedValue([pendingRow]),
		})
		const providers = createProviders()
		const service = createNotificationService({
			notificationRepository,
			...providers,
		})

		const result = await service.flushPending({ limit: 1 })

		expect(result.claimed).toBe(1)
		expect(providers.emailProvider.sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: booking.email,
				subject: expect.stringContaining("Booking request received"),
			}),
		)
		expect(notificationRepository.markSent).toHaveBeenCalledWith(
			pendingRow.id,
			expect.objectContaining({
				provider_message_id: "email-message-1",
			}),
		)
	})

	it("marks provider failures as retrying before max attempts", async () => {
		const pendingRow = {
			id: "outbox-retry",
			channel: NOTIFICATION_CHANNELS.EMAIL,
			template_key: NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED,
			recipient_email: booking.email,
			payload: { booking },
			attempts: 1,
			metadata: {},
		}
		const notificationRepository = createRepository({
			claimAvailable: vi.fn().mockResolvedValue([pendingRow]),
		})
		const providers = createProviders({
			emailProvider: {
				sendEmail: vi.fn().mockRejectedValue(new Error("provider down")),
			},
		})
		const service = createNotificationService({
			notificationRepository,
			...providers,
		})

		await service.flushPending({ maxAttempts: 3, baseRetrySeconds: 1 })

		expect(notificationRepository.markRetrying).toHaveBeenCalledWith(
			pendingRow.id,
			expect.objectContaining({
				reason: "provider down",
				availableAt: expect.any(String),
			}),
		)
		expect(notificationRepository.markFailed).not.toHaveBeenCalled()
	})

	it("marks provider failures as failed at max attempts", async () => {
		const pendingRow = {
			id: "outbox-failed",
			channel: NOTIFICATION_CHANNELS.EMAIL,
			template_key: NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED,
			recipient_email: booking.email,
			payload: { booking },
			attempts: 3,
			metadata: {},
		}
		const notificationRepository = createRepository({
			claimAvailable: vi.fn().mockResolvedValue([pendingRow]),
		})
		const providers = createProviders({
			emailProvider: {
				sendEmail: vi.fn().mockRejectedValue(new Error("provider down")),
			},
		})
		const service = createNotificationService({
			notificationRepository,
			...providers,
		})

		await service.flushPending({ maxAttempts: 3 })

		expect(notificationRepository.markFailed).toHaveBeenCalledWith(
			pendingRow.id,
			expect.objectContaining({ reason: "provider down" }),
		)
	})
})
