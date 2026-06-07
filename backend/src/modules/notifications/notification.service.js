const os = require("node:os")

const { env } = require("../../config/env")
const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const { createResendClient } = require("../../integrations/resend/resendClient")
const {
	createWhatsappClient,
} = require("../../integrations/whatsapp/whatsappClient")
const { pickDefined } = require("../../utils/validation")
const {
	DEFAULT_MAX_ATTEMPTS,
	DEFAULT_OUTBOX_LIMIT,
	DEFAULT_RETRY_BASE_SECONDS,
	DEFAULT_UPCOMING_REMINDER_WINDOW_MINUTES,
	NOTIFICATION_AGGREGATE_TYPES,
	NOTIFICATION_CHANNELS,
	NOTIFICATION_STATUSES,
	NOTIFICATION_TEMPLATE_KEYS,
} = require("./notification.constants")
const { createNotificationRepository } = require("./notification.repository")
const { renderTemplate } = require("./notification.templates")

function createWorkerId(prefix = "render-worker") {
	return `${prefix}:${os.hostname()}:${process.pid}`
}

function normalizeChannels({ email, phone, channels }) {
	if (Array.isArray(channels) && channels.length) {
		return [...new Set(channels)]
	}

	const resolved = []

	if (email) {
		resolved.push(NOTIFICATION_CHANNELS.EMAIL)
	}

	if (phone) {
		resolved.push(NOTIFICATION_CHANNELS.WHATSAPP)
	}

	return resolved
}

function buildIdempotencyKey(parts) {
	return parts
		.filter(
			(part) => part !== undefined && part !== null && String(part).trim(),
		)
		.map((part) => String(part).trim().toLowerCase().replace(/\s+/g, "_"))
		.join(":")
}

function toFailureReason(error) {
	return error?.message || String(error || "Unknown notification failure")
}

function calculateRetryAt({ attempts, baseRetrySeconds }) {
	const exponent = Math.max(0, attempts - 1)
	const delaySeconds = baseRetrySeconds * 2 ** exponent
	return new Date(Date.now() + delaySeconds * 1000).toISOString()
}

function createNoopNotificationService() {
	const result = async () => ({ queued: [], skipped: true, noop: true })

	return {
		flushPending: async () => ({ claimed: 0, results: [], noop: true }),
		queueBookingNotification: result,
		queueContactMessageNotification: result,
		queueUpcomingBookingReminders: async () => ({
			queued: [],
			candidates: 0,
			noop: true,
		}),
		queueWaitlistNotification: result,
		queueWaitlistSlotOpenNotifications: result,
		queueWaitlistSlotOpenNotificationsForRecentlyReleasedSlots: async () => ({
			slots: 0,
			queued: [],
			noop: true,
		}),
	}
}

function createNotificationService({
	notificationRepository,
	emailProvider,
	whatsappProvider,
	workerId,
} = {}) {
	const repository =
		notificationRepository || createNotificationRepository(getSupabaseAdmin())
	const resend = emailProvider || createResendClient()
	const whatsapp = whatsappProvider || createWhatsappClient()
	const resolvedWorkerId = workerId || createWorkerId()

	async function enqueueOutboxNotification({
		tenantId,
		aggregateType,
		aggregateId,
		recipientUserId,
		recipientEmail,
		recipientPhone,
		channel,
		templateKey,
		payload,
		idempotencyKey,
		metadata = {},
	}) {
		return repository.enqueueOutbox(
			pickDefined({
				tenant_id: tenantId,
				aggregate_type: aggregateType,
				aggregate_id: aggregateId,
				recipient_user_id: recipientUserId,
				recipient_email: recipientEmail,
				recipient_phone: recipientPhone,
				channel,
				template_key: templateKey,
				payload,
				status: NOTIFICATION_STATUSES.PENDING,
				available_at: new Date().toISOString(),
				idempotency_key: idempotencyKey,
				metadata,
			}),
		)
	}

	async function trackBookingNotification(row, { booking, waitlistEntry }) {
		if (row.was_existing) {
			return null
		}

		return repository.insertBookingNotification({
			tenant_id:
				booking?.tenant_id || waitlistEntry?.tenant_id || row.tenant_id,
			booking_id: booking?.id || waitlistEntry?.booking_id || null,
			waitlist_id: waitlistEntry?.id || booking?.waitlist_id || null,
			channel: row.channel,
			notification_type: row.template_key,
			status: "queued",
			metadata: {
				outbox_id: row.id,
				idempotency_key: row.idempotency_key,
			},
		})
	}

	async function queueBookingNotification(booking, templateKey, options = {}) {
		if (!booking?.id) {
			return { queued: [], skipped: true, reason: "missing_booking" }
		}

		const channels = normalizeChannels({
			email: booking.email,
			phone: booking.phone,
			channels: options.channels,
		})

		if (!channels.length) {
			return { queued: [], skipped: true, reason: "missing_booking_recipient" }
		}

		const queued = []
		const tracking = []

		for (const channel of channels) {
			const row = await enqueueOutboxNotification({
				tenantId: booking.tenant_id,
				aggregateType: NOTIFICATION_AGGREGATE_TYPES.BOOKING,
				aggregateId: booking.id,
				recipientUserId: booking.user_id,
				recipientEmail: booking.email,
				recipientPhone: booking.phone,
				channel,
				templateKey,
				payload: {
					booking,
					waitlistEntry: options.waitlistEntry,
					slot: options.slot,
					event: options.event || {},
					site: options.site || {},
				},
				idempotencyKey: buildIdempotencyKey([
					"booking",
					booking.id,
					templateKey,
					channel,
					options.uniqueKey,
				]),
				metadata: {
					source: options.source || "render_booking_service",
					...(options.metadata || {}),
				},
			})

			queued.push(row)

			if (options.trackBookingNotification !== false) {
				tracking.push(
					trackBookingNotification(row, {
						booking,
						waitlistEntry: options.waitlistEntry,
					}),
				)
			}
		}

		await Promise.all(tracking)

		return { queued, skipped: false }
	}

	async function queueWaitlistNotification(
		waitlistEntry,
		templateKey,
		options = {},
	) {
		if (!waitlistEntry?.id) {
			return { queued: [], skipped: true, reason: "missing_waitlist_entry" }
		}

		const booking = options.booking
		const recipientEmail = options.recipientEmail || booking?.email
		const recipientPhone = options.recipientPhone || booking?.phone
		const channels = normalizeChannels({
			email: recipientEmail,
			phone: recipientPhone,
			channels: options.channels,
		})

		if (!channels.length) {
			return { queued: [], skipped: true, reason: "missing_waitlist_recipient" }
		}

		const queued = []
		const tracking = []

		for (const channel of channels) {
			const row = await enqueueOutboxNotification({
				tenantId: waitlistEntry.tenant_id,
				aggregateType: NOTIFICATION_AGGREGATE_TYPES.WAITLIST,
				aggregateId: waitlistEntry.id,
				recipientUserId: waitlistEntry.user_id || booking?.user_id,
				recipientEmail,
				recipientPhone,
				channel,
				templateKey,
				payload: {
					booking,
					waitlistEntry,
					slot: options.slot,
					event: options.event || {},
					site: options.site || {},
				},
				idempotencyKey: buildIdempotencyKey([
					"waitlist",
					waitlistEntry.id,
					templateKey,
					channel,
					options.uniqueKey,
				]),
				metadata: {
					source: options.source || "render_waitlist_service",
					...(options.metadata || {}),
				},
			})

			queued.push(row)

			if (options.trackBookingNotification !== false) {
				tracking.push(trackBookingNotification(row, { booking, waitlistEntry }))
			}
		}

		await Promise.all(tracking)

		if (options.markWaitlistNotified !== false && queued.length) {
			await repository.markWaitlistNotified(waitlistEntry.id, {
				channel: channels[0],
			})
		}

		return { queued, skipped: false }
	}

	async function queueWaitlistSlotOpenNotifications(
		queue = [],
		slot,
		options = {},
	) {
		const queued = []

		for (const waitlistEntry of queue) {
			const booking = waitlistEntry.booking_id
				? await repository.findBookingById(waitlistEntry.booking_id)
				: null

			const result = await queueWaitlistNotification(
				waitlistEntry,
				NOTIFICATION_TEMPLATE_KEYS.WAITLIST_SLOT_OPEN,
				{
					booking,
					slot,
					uniqueKey: slot?.released_at || slot?.id || options.uniqueKey,
					source: options.source || "render_slot_release",
					metadata: options.metadata,
				},
			)

			queued.push(...result.queued)
		}

		return { queued, skipped: queued.length === 0 }
	}

	async function queueContactMessageNotification(contactMessage, options = {}) {
		if (!contactMessage?.id) {
			return { queued: [], skipped: true, reason: "missing_contact_message" }
		}

		const recipientEmail =
			options.recipientEmail ||
			contactMessage.notification_email ||
			contactMessage.assigned_email

		if (!recipientEmail) {
			return { queued: [], skipped: true, reason: "missing_contact_recipient" }
		}

		const row = await enqueueOutboxNotification({
			tenantId: contactMessage.tenant_id,
			aggregateType: NOTIFICATION_AGGREGATE_TYPES.CONTACT_MESSAGE,
			aggregateId: contactMessage.id,
			recipientEmail,
			channel: NOTIFICATION_CHANNELS.EMAIL,
			templateKey: NOTIFICATION_TEMPLATE_KEYS.CONTACT_MESSAGE_RECEIVED,
			payload: {
				contactMessage,
				site: options.site || {},
			},
			idempotencyKey: buildIdempotencyKey([
				"contact_message",
				contactMessage.id,
				NOTIFICATION_CHANNELS.EMAIL,
				options.uniqueKey,
			]),
			metadata: {
				source: options.source || "render_contact_message_service",
				...(options.metadata || {}),
			},
		})

		return { queued: [row], skipped: false }
	}

	async function deliverOutboxRow(row) {
		const rendered = renderTemplate(row.template_key, row.payload || {})

		if (row.channel === NOTIFICATION_CHANNELS.INTERNAL) {
			return repository.markSkipped(
				row.id,
				"internal_notification_no_provider",
				{
					metadata: { ...(row.metadata || {}), rendered },
				},
			)
		}

		if (row.channel === NOTIFICATION_CHANNELS.EMAIL) {
			if (!row.recipient_email) {
				return repository.markSkipped(row.id, "missing_recipient_email")
			}

			const result = await resend.sendEmail({
				to: row.recipient_email,
				subject: rendered.subject,
				html: rendered.html,
				text: rendered.text,
			})

			if (result.skipped) {
				return repository.markSkipped(
					row.id,
					result.reason || "email_provider_skipped",
				)
			}

			return repository.markSent(row.id, {
				provider_message_id: result.providerMessageId,
				metadata: { ...(row.metadata || {}), provider: result.provider },
			})
		}

		if (row.channel === NOTIFICATION_CHANNELS.WHATSAPP) {
			if (!row.recipient_phone) {
				return repository.markSkipped(row.id, "missing_recipient_phone")
			}

			const result = await whatsapp.sendTextMessage({
				to: row.recipient_phone,
				text: rendered.whatsappText || rendered.text,
			})

			if (result.skipped) {
				return repository.markSkipped(
					row.id,
					result.reason || "whatsapp_provider_skipped",
				)
			}

			return repository.markSent(row.id, {
				provider_message_id: result.providerMessageId,
				metadata: { ...(row.metadata || {}), provider: result.provider },
			})
		}

		return repository.markSkipped(row.id, `unsupported_channel:${row.channel}`)
	}

	async function handleDeliveryFailure(row, error, options) {
		const reason = toFailureReason(error)
		const metadata = {
			...(row.metadata || {}),
			last_worker_id: resolvedWorkerId,
		}

		if (row.attempts >= options.maxAttempts) {
			return repository.markFailed(row.id, { reason, metadata })
		}

		return repository.markRetrying(row.id, {
			availableAt: calculateRetryAt({
				attempts: row.attempts,
				baseRetrySeconds: options.baseRetrySeconds,
			}),
			reason,
			metadata,
		})
	}

	return {
		async flushPending(options = {}) {
			const limit = options.limit || DEFAULT_OUTBOX_LIMIT
			const maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS
			const baseRetrySeconds =
				options.baseRetrySeconds || DEFAULT_RETRY_BASE_SECONDS
			const rows = await repository.claimAvailable({
				limit,
				lockedBy: options.lockedBy || resolvedWorkerId,
			})

			const results = []

			for (const row of rows) {
				try {
					results.push({
						id: row.id,
						result: await deliverOutboxRow(row),
					})
				} catch (error) {
					results.push({
						id: row.id,
						result: await handleDeliveryFailure(row, error, {
							maxAttempts,
							baseRetrySeconds,
						}),
						error: toFailureReason(error),
					})
				}
			}

			return {
				claimed: rows.length,
				results,
			}
		},

		queueBookingNotification,
		queueContactMessageNotification,
		queueWaitlistNotification,
		queueWaitlistSlotOpenNotifications,

		async queueUpcomingBookingReminders(options = {}) {
			const nowIso = options.nowIso || new Date().toISOString()
			const windowMinutes =
				options.windowMinutes || DEFAULT_UPCOMING_REMINDER_WINDOW_MINUTES
			const windowEndIso =
				options.windowEndIso ||
				new Date(
					new Date(nowIso).getTime() + windowMinutes * 60 * 1000,
				).toISOString()
			const candidates = await repository.listUpcomingReminderCandidates({
				nowIso,
				windowEndIso,
				limit: options.limit || DEFAULT_OUTBOX_LIMIT,
			})

			const queued = []

			for (const booking of candidates) {
				const result = await queueBookingNotification(
					booking,
					NOTIFICATION_TEMPLATE_KEYS.UPCOMING_BOOKING_REMINDER,
					{
						uniqueKey: booking.starts_at,
						source: "render_upcoming_reminder_job",
						event: { windowMinutes },
					},
				)

				queued.push(...result.queued)
			}

			return {
				candidates: candidates.length,
				queued,
			}
		},

		async queueWaitlistSlotOpenNotificationsForRecentlyReleasedSlots(
			options = {},
		) {
			const sinceIso =
				options.sinceIso || new Date(Date.now() - 60 * 60 * 1000).toISOString()
			const slots = await repository.listRecentlyReleasedSlots({
				sinceIso,
				limit: options.limit || DEFAULT_OUTBOX_LIMIT,
			})
			const queued = []

			for (const slot of slots) {
				const queue = await repository.listWaitlistEntriesForSlot(slot, {
					limit: options.queueLimit || DEFAULT_OUTBOX_LIMIT,
				})
				const result = await queueWaitlistSlotOpenNotifications(queue, slot, {
					source: "render_waitlist_slot_open_job",
				})

				queued.push(...result.queued)
			}

			return {
				slots: slots.length,
				queued,
			}
		},
	}
}

module.exports = {
	buildIdempotencyKey,
	createNoopNotificationService,
	createNotificationService,
}
