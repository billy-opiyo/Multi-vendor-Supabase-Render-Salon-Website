const { ApiError } = require("../../utils/errors")
const { getSupabaseErrorDetails } = require("../../utils/supabaseErrors")
const {
	NOTIFICATION_STATUSES,
	NOTIFICATION_TEMPLATE_KEYS,
} = require("./notification.constants")

const NOTIFICATION_OUTBOX_SELECT =
	"id, tenant_id, aggregate_type, aggregate_id, recipient_user_id, recipient_email, recipient_phone, channel, template_key, payload, status, attempts, available_at, locked_at, locked_by, sent_at, failed_at, failure_reason, idempotency_key, metadata, created_at, updated_at"

const BOOKING_NOTIFICATION_SELECT =
	"id, tenant_id, booking_id, waitlist_id, channel, notification_type, status, provider_message_id, sent_at, failed_at, failure_reason, metadata, created_at, updated_at"

const BOOKING_SELECT =
	"id, tenant_id, user_id, slot_id, waitlist_id, first_name, last_name, email, phone, service, service_id, stylist, stylist_id, appointment_date, appointment_time, starts_at, status, notes, inspiration_image_url, metadata, created_at, updated_at, cancelled_at, completed_at, expired_at, no_show_at"

const BOOKING_SLOT_SELECT =
	"id, tenant_id, slot_date, slot_time, starts_at, ends_at, stylist_id, stylist_key, taken, booking_id, user_id, release_reason, released_at, metadata, created_at, updated_at"

const WAITLIST_SELECT =
	"id, tenant_id, user_id, booking_id, preferred_slot_id, preferred_date, preferred_time, service, service_id, stylist, stylist_id, status, queue_position, queue_size, notification_channel, notified_at, metadata, created_at, updated_at"

function isUniqueViolation(error) {
	return (
		error?.code === "23505" ||
		/duplicate key/i.test(error?.message || "") ||
		/unique constraint/i.test(error?.message || "")
	)
}

function throwRepositoryError(error, statusCode, code, message) {
	if (!error) {
		return
	}

	throw new ApiError(statusCode, code, message, getSupabaseErrorDetails(error))
}

function createNotificationRepository(supabase) {
	async function findOutboxByIdempotencyKey(idempotencyKey) {
		const { data, error } = await supabase
			.from("notification_outbox")
			.select(NOTIFICATION_OUTBOX_SELECT)
			.eq("idempotency_key", idempotencyKey)
			.maybeSingle()

		throwRepositoryError(
			error,
			500,
			"notification_outbox_lookup_failed",
			"Unable to load existing notification outbox row.",
		)

		return data
	}

	return {
		async enqueueOutbox(values) {
			const { data, error } = await supabase
				.from("notification_outbox")
				.insert(values)
				.select(NOTIFICATION_OUTBOX_SELECT)
				.single()

			if (isUniqueViolation(error) && values.idempotency_key) {
				const existing = await findOutboxByIdempotencyKey(
					values.idempotency_key,
				)
				if (existing) {
					return { ...existing, was_existing: true }
				}
			}

			throwRepositoryError(
				error,
				500,
				"notification_enqueue_failed",
				"Unable to enqueue notification.",
			)

			return { ...data, was_existing: false }
		},

		async insertBookingNotification(values) {
			const { data, error } = await supabase
				.from("booking_notifications")
				.insert(values)
				.select(BOOKING_NOTIFICATION_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"booking_notification_write_failed",
				"Unable to write booking notification record.",
			)

			return data
		},

		async claimAvailable({
			limit,
			lockedBy,
			nowIso = new Date().toISOString(),
		}) {
			const { data, error } = await supabase
				.from("notification_outbox")
				.select(NOTIFICATION_OUTBOX_SELECT)
				.in("status", [
					NOTIFICATION_STATUSES.PENDING,
					NOTIFICATION_STATUSES.RETRYING,
				])
				.lte("available_at", nowIso)
				.order("available_at", { ascending: true })
				.order("created_at", { ascending: true })
				.limit(limit)

			throwRepositoryError(
				error,
				500,
				"notification_claim_lookup_failed",
				"Unable to load pending notification rows.",
			)

			const claimed = []

			for (const row of data || []) {
				const { data: claimedRow, error: claimError } = await supabase
					.from("notification_outbox")
					.update({
						status: NOTIFICATION_STATUSES.PROCESSING,
						locked_at: nowIso,
						locked_by: lockedBy,
						attempts: row.attempts + 1,
					})
					.eq("id", row.id)
					.in("status", [
						NOTIFICATION_STATUSES.PENDING,
						NOTIFICATION_STATUSES.RETRYING,
					])
					.lte("available_at", nowIso)
					.select(NOTIFICATION_OUTBOX_SELECT)
					.maybeSingle()

				throwRepositoryError(
					claimError,
					500,
					"notification_claim_failed",
					"Unable to claim pending notification row.",
				)

				if (claimedRow) {
					claimed.push(claimedRow)
				}
			}

			return claimed
		},

		async markSent(notificationId, values = {}) {
			const metadata = {
				...(values.metadata || {}),
			}

			if (values.provider_message_id) {
				metadata.provider_message_id = values.provider_message_id
			}

			const { data, error } = await supabase
				.from("notification_outbox")
				.update({
					status: NOTIFICATION_STATUSES.SENT,
					sent_at: new Date().toISOString(),
					failed_at: null,
					failure_reason: null,
					locked_at: null,
					locked_by: null,
					metadata,
				})
				.eq("id", notificationId)
				.select(NOTIFICATION_OUTBOX_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"notification_mark_sent_failed",
				"Unable to mark notification as sent.",
			)

			return data
		},

		async markSkipped(notificationId, reason, values = {}) {
			const { data, error } = await supabase
				.from("notification_outbox")
				.update({
					status: NOTIFICATION_STATUSES.SKIPPED,
					failed_at: new Date().toISOString(),
					failure_reason: reason,
					locked_at: null,
					locked_by: null,
					metadata: values.metadata || {},
				})
				.eq("id", notificationId)
				.select(NOTIFICATION_OUTBOX_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"notification_mark_skipped_failed",
				"Unable to mark notification as skipped.",
			)

			return data
		},

		async markRetrying(notificationId, { availableAt, reason, metadata = {} }) {
			const { data, error } = await supabase
				.from("notification_outbox")
				.update({
					status: NOTIFICATION_STATUSES.RETRYING,
					available_at: availableAt,
					failed_at: new Date().toISOString(),
					failure_reason: reason,
					locked_at: null,
					locked_by: null,
					metadata,
				})
				.eq("id", notificationId)
				.select(NOTIFICATION_OUTBOX_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"notification_mark_retrying_failed",
				"Unable to mark notification as retrying.",
			)

			return data
		},

		async markFailed(notificationId, { reason, metadata = {} }) {
			const { data, error } = await supabase
				.from("notification_outbox")
				.update({
					status: NOTIFICATION_STATUSES.FAILED,
					failed_at: new Date().toISOString(),
					failure_reason: reason,
					locked_at: null,
					locked_by: null,
					metadata,
				})
				.eq("id", notificationId)
				.select(NOTIFICATION_OUTBOX_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"notification_mark_failed_failed",
				"Unable to mark notification as failed.",
			)

			return data
		},

		async listUpcomingReminderCandidates({ nowIso, windowEndIso, limit }) {
			const { data, error } = await supabase
				.from("bookings")
				.select(BOOKING_SELECT)
				.eq("status", "confirmed")
				.gte("starts_at", nowIso)
				.lte("starts_at", windowEndIso)
				.order("starts_at", { ascending: true })
				.limit(limit)

			throwRepositoryError(
				error,
				500,
				"upcoming_reminder_lookup_failed",
				"Unable to load upcoming booking reminder candidates.",
			)

			return data || []
		},

		async listRecentlyReleasedSlots({ sinceIso, limit }) {
			const { data, error } = await supabase
				.from("booking_slots")
				.select(BOOKING_SLOT_SELECT)
				.eq("taken", false)
				.not("released_at", "is", null)
				.gte("released_at", sinceIso)
				.order("released_at", { ascending: false })
				.limit(limit)

			throwRepositoryError(
				error,
				500,
				"released_slot_lookup_failed",
				"Unable to load recently released booking slots.",
			)

			return data || []
		},

		async listWaitlistEntriesForSlot(slot, { limit = 25 } = {}) {
			let query = supabase
				.from("waitlist_entries")
				.select(WAITLIST_SELECT)
				.in("status", [
					"waiting",
					"notified",
					"contacted",
					"notification_failed",
				])
				.order("created_at", { ascending: true })
				.order("id", { ascending: true })
				.limit(limit)

			if (slot.id) {
				query = query.eq("preferred_slot_id", slot.id)
			} else {
				query = query
					.eq("preferred_date", slot.slot_date)
					.eq("preferred_time", slot.slot_time)
			}

			const { data, error } = await query

			throwRepositoryError(
				error,
				500,
				"waitlist_slot_lookup_failed",
				"Unable to load waitlist entries for released slot.",
			)

			return data || []
		},

		async findBookingById(bookingId) {
			const { data, error } = await supabase
				.from("bookings")
				.select(BOOKING_SELECT)
				.eq("id", bookingId)
				.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"notification_booking_lookup_failed",
				"Unable to load booking for notification.",
			)

			return data
		},

		async markWaitlistNotified(waitlistId, { channel }) {
			const { data, error } = await supabase
				.from("waitlist_entries")
				.update({
					status: "notified",
					notification_channel: channel,
					notified_at: new Date().toISOString(),
				})
				.eq("id", waitlistId)
				.select(WAITLIST_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"waitlist_notification_mark_failed",
				"Unable to mark waitlist entry as notified.",
			)

			return data
		},

		async enqueueContactMessageNotification(contactMessage, options = {}) {
			return this.enqueueOutbox({
				tenant_id: contactMessage.tenant_id,
				aggregate_type: "contact_message",
				aggregate_id: contactMessage.id,
				recipient_email: options.recipientEmail,
				channel: "email",
				template_key: NOTIFICATION_TEMPLATE_KEYS.CONTACT_MESSAGE_RECEIVED,
				payload: {
					contactMessage,
					site: options.site || {},
				},
				idempotency_key: `contact_message:${contactMessage.id}:email`,
				metadata: {
					source: "render_contact_api",
				},
			})
		},
	}
}

module.exports = {
	BOOKING_NOTIFICATION_SELECT,
	NOTIFICATION_OUTBOX_SELECT,
	createNotificationRepository,
	isUniqueViolation,
}
