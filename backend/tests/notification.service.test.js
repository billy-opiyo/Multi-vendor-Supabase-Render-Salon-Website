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
			sent_at: "2026-07-01T01:00:00.000Z",
			...values,
		})),
		markSkipped: vi.fn(async (id, reason) => ({
			id,
			status: NOTIFICATION_STATUSES.SKIPPED,
			failed_at: "2026-07-01T01:00:00.000Z",
			failure_reason: reason,
		})),
		markRetrying: vi.fn(async (id, values = {}) => ({
			id,
			status: NOTIFICATION_STATUSES.RETRYING,
			failed_at: "2026-07-01T01:00:00.000Z",
			...values,
		})),
		markFailed: vi.fn(async (id, values = {}) => ({
			id,
			status: NOTIFICATION_STATUSES.FAILED,
			failed_at: "2026-07-01T01:00:00.000Z",
			...values,
		})),
		updateBookingNotificationByOutboxId: vi.fn(async (id, values = {}) => ({
			id: `booking-notification-for-${id}`,
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
		markWaitlistNotificationFailed: vi.fn(async (id, values = {}) => ({
			id,
			status: "notification_failed",
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
		expect(
			notificationRepository.updateBookingNotificationByOutboxId,
		).toHaveBeenCalledWith(
			pendingRow.id,
			expect.objectContaining({
				status: "sent",
				provider_message_id: "email-message-1",
				sent_at: expect.any(String),
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
		expect(
			notificationRepository.updateBookingNotificationByOutboxId,
		).toHaveBeenCalledWith(
			pendingRow.id,
			expect.objectContaining({
				status: "failed",
				failure_reason: "provider down",
			}),
		)
	})

	it("notifies only the first waiting waitlist entry for a released slot", async () => {
		const slot = {
			id: "00000000-0000-4000-8000-000000000301",
			released_at: "2026-07-01T01:00:00.000Z",
		}
		const firstWaiting = {
			id: "00000000-0000-4000-8000-000000000501",
			booking_id: booking.id,
			status: "waiting",
			metadata: {},
		}
		const secondWaiting = {
			id: "00000000-0000-4000-8000-000000000502",
			booking_id: booking.id,
			status: "waiting",
			metadata: {},
		}
		const alreadyNotified = {
			id: "00000000-0000-4000-8000-000000000503",
			booking_id: booking.id,
			status: "notified",
			metadata: {},
		}
		const notificationRepository = createRepository()
		const service = createNotificationService({
			notificationRepository,
			...createProviders(),
		})

		const result = await service.queueWaitlistSlotOpenNotifications(
			[firstWaiting, secondWaiting, alreadyNotified],
			slot,
		)

		expect(result).toMatchObject({
			targeted: 1,
			notified: [firstWaiting.id],
			skippedWaitlistCount: 1,
			skipped: false,
		})
		expect(notificationRepository.findBookingById).toHaveBeenCalledTimes(1)
		expect(notificationRepository.enqueueOutbox).toHaveBeenCalledTimes(2)
		expect(notificationRepository.enqueueOutbox).toHaveBeenCalledWith(
			expect.objectContaining({
				aggregate_type: "waitlist",
				aggregate_id: firstWaiting.id,
				template_key: NOTIFICATION_TEMPLATE_KEYS.WAITLIST_SLOT_OPEN,
			}),
		)
		expect(notificationRepository.enqueueOutbox).not.toHaveBeenCalledWith(
			expect.objectContaining({ aggregate_id: secondWaiting.id }),
		)
		expect(notificationRepository.markWaitlistNotified).toHaveBeenCalledWith(
			firstWaiting.id,
			{ channel: NOTIFICATION_CHANNELS.EMAIL },
		)
	})

	it("marks the targeted waitlist entry notification_failed when slot-open notification has no recipient", async () => {
		const slot = {
			id: "00000000-0000-4000-8000-000000000301",
			released_at: "2026-07-01T01:00:00.000Z",
		}
		const waitlistEntry = {
			id: "00000000-0000-4000-8000-000000000501",
			booking_id: null,
			status: "waiting",
			metadata: { source: "test" },
		}
		const notificationRepository = createRepository()
		const service = createNotificationService({
			notificationRepository,
			...createProviders(),
		})

		const result = await service.queueWaitlistSlotOpenNotifications(
			[waitlistEntry],
			slot,
		)

		expect(result).toMatchObject({
			targeted: 1,
			queued: [],
			skipped: true,
			skippedWaitlistEntries: [
				{ waitlistId: waitlistEntry.id, reason: "missing_waitlist_recipient" },
			],
		})
		expect(notificationRepository.enqueueOutbox).not.toHaveBeenCalled()
		expect(
			notificationRepository.markWaitlistNotificationFailed,
		).toHaveBeenCalledWith(waitlistEntry.id, {
			reason: "missing_waitlist_recipient",
			metadata: waitlistEntry.metadata,
		})
	})

	it("queues upcoming reminders using the Firebase two-hour lead and fifteen-minute window", async () => {
		const nowIso = "2026-07-01T03:45:00.000Z"
		const reminderBooking = {
			...booking,
			status: "confirmed",
			starts_at: "2026-07-01T05:45:00.000Z",
		}
		const notificationRepository = createRepository({
			listUpcomingReminderCandidates: vi
				.fn()
				.mockResolvedValue([reminderBooking]),
		})
		const service = createNotificationService({
			notificationRepository,
			...createProviders(),
		})

		const result = await service.queueUpcomingBookingReminders({ nowIso })

		expect(notificationRepository.listUpcomingReminderCandidates).toHaveBeenCalledWith(
			expect.objectContaining({
				nowIso,
				windowStartIso: "2026-07-01T05:30:00.000Z",
				windowEndIso: "2026-07-01T06:00:00.000Z",
			}),
		)
		expect(result).toMatchObject({
			candidates: 1,
			leadTimeMinutes: 120,
			windowStartIso: "2026-07-01T05:30:00.000Z",
			windowEndIso: "2026-07-01T06:00:00.000Z",
		})
		expect(notificationRepository.enqueueOutbox).toHaveBeenCalledWith(
			expect.objectContaining({
				template_key: NOTIFICATION_TEMPLATE_KEYS.UPCOMING_BOOKING_REMINDER,
			}),
		)
	})
})
