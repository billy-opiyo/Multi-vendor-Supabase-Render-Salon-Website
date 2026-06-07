const { ApiError } = require("../../utils/errors")
const { getSupabaseErrorDetails } = require("../../utils/supabaseErrors")
const { WAITLIST_QUEUE_STATUSES } = require("./booking.constants")

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

function applyNullableTenantFilter(query, tenantId) {
	return tenantId
		? query.eq("tenant_id", tenantId)
		: query.is("tenant_id", null)
}

function createBookingRepository(supabase) {
	return {
		async findSlotById(slotId) {
			const { data, error } = await supabase
				.from("booking_slots")
				.select(BOOKING_SLOT_SELECT)
				.eq("id", slotId)
				.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"booking_slot_lookup_failed",
				"Unable to load booking slot.",
			)

			return data
		},

		async findSlotByIdentity(identity) {
			let query = supabase
				.from("booking_slots")
				.select(BOOKING_SLOT_SELECT)
				.eq("slot_date", identity.slot_date)
				.eq("slot_time", identity.slot_time)
				.ilike("stylist_key", identity.stylist_key)

			query = applyNullableTenantFilter(query, identity.tenant_id)

			const { data, error } = await query.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"booking_slot_lookup_failed",
				"Unable to load booking slot.",
			)

			return data
		},

		async createSlot(values) {
			const { data, error } = await supabase
				.from("booking_slots")
				.insert(values)
				.select(BOOKING_SLOT_SELECT)
				.single()

			if (isUniqueViolation(error)) {
				throwRepositoryError(
					error,
					409,
					"booking_slot_already_exists",
					"Booking slot already exists.",
				)
			}

			throwRepositoryError(
				error,
				500,
				"booking_slot_create_failed",
				"Unable to create booking slot.",
			)

			return data
		},

		async reserveSlot(slotId, values) {
			const { data, error } = await supabase
				.from("booking_slots")
				.update({
					...values,
					taken: true,
					release_reason: null,
					released_at: null,
				})
				.eq("id", slotId)
				.eq("taken", false)
				.is("booking_id", null)
				.select(BOOKING_SLOT_SELECT)
				.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"booking_slot_reserve_failed",
				"Unable to reserve booking slot.",
			)

			return data
		},

		async attachSlotBooking(slotId, bookingId) {
			const { data, error } = await supabase
				.from("booking_slots")
				.update({ booking_id: bookingId })
				.eq("id", slotId)
				.select(BOOKING_SLOT_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"booking_slot_attach_failed",
				"Unable to attach booking to slot.",
			)

			return data
		},

		async releaseSlot(slotId, values = {}) {
			const { data, error } = await supabase
				.from("booking_slots")
				.update({
					taken: false,
					booking_id: null,
					user_id: null,
					release_reason: values.release_reason || null,
					released_at: new Date().toISOString(),
				})
				.eq("id", slotId)
				.select(BOOKING_SLOT_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"booking_slot_release_failed",
				"Unable to release booking slot.",
			)

			return data
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
				"booking_lookup_failed",
				"Unable to load booking.",
			)

			return data
		},

		async listBookingsForUser(userId, filters = {}) {
			let query = supabase
				.from("bookings")
				.select(BOOKING_SELECT)
				.eq("user_id", userId)
				.order("starts_at", { ascending: false })
				.range(
					filters.offset || 0,
					(filters.offset || 0) + (filters.limit || 50) - 1,
				)

			if (filters.status) {
				query = query.eq("status", filters.status)
			}

			const { data, error } = await query

			throwRepositoryError(
				error,
				500,
				"booking_list_failed",
				"Unable to list bookings.",
			)

			return data || []
		},

		async listAdminBookings(filters = {}) {
			let query = supabase
				.from("bookings")
				.select(BOOKING_SELECT)
				.order("starts_at", { ascending: false })
				.range(
					filters.offset || 0,
					(filters.offset || 0) + (filters.limit || 50) - 1,
				)

			if (filters.status) {
				query = query.eq("status", filters.status)
			}

			const { data, error } = await query

			throwRepositoryError(
				error,
				500,
				"admin_booking_list_failed",
				"Unable to list admin bookings.",
			)

			return data || []
		},

		async listExpiredActiveBookings({ cutoffIso, limit = 50 } = {}) {
			const { data, error } = await supabase
				.from("bookings")
				.select(BOOKING_SELECT)
				.in("status", ["pending", "confirmed"])
				.lte("starts_at", cutoffIso)
				.order("starts_at", { ascending: true })
				.limit(limit)

			throwRepositoryError(
				error,
				500,
				"expired_booking_list_failed",
				"Unable to list expired active bookings.",
			)

			return data || []
		},

		async createBooking(values) {
			const { data, error } = await supabase
				.from("bookings")
				.insert(values)
				.select(BOOKING_SELECT)
				.single()

			if (isUniqueViolation(error)) {
				throwRepositoryError(
					error,
					409,
					"booking_slot_conflict",
					"An active booking already exists for this slot.",
				)
			}

			throwRepositoryError(
				error,
				500,
				"booking_create_failed",
				"Unable to create booking.",
			)

			return data
		},

		async updateBooking(bookingId, values) {
			const { data, error } = await supabase
				.from("bookings")
				.update(values)
				.eq("id", bookingId)
				.select(BOOKING_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"booking_update_failed",
				"Unable to update booking.",
			)

			return data
		},

		async findWaitlistById(waitlistId) {
			const { data, error } = await supabase
				.from("waitlist_entries")
				.select(WAITLIST_SELECT)
				.eq("id", waitlistId)
				.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"waitlist_lookup_failed",
				"Unable to load waitlist entry.",
			)

			return data
		},

		async listAdminWaitlist(filters = {}) {
			let query = supabase
				.from("waitlist_entries")
				.select(WAITLIST_SELECT)
				.order("created_at", { ascending: true })
				.range(
					filters.offset || 0,
					(filters.offset || 0) + (filters.limit || 50) - 1,
				)

			if (filters.status) {
				query = query.eq("status", filters.status)
			}

			const { data, error } = await query

			throwRepositoryError(
				error,
				500,
				"admin_waitlist_list_failed",
				"Unable to list admin waitlist entries.",
			)

			return data || []
		},

		async createWaitlistEntry(values) {
			const { data, error } = await supabase
				.from("waitlist_entries")
				.insert(values)
				.select(WAITLIST_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"waitlist_create_failed",
				"Unable to create waitlist entry.",
			)

			return data
		},

		async updateWaitlistEntry(waitlistId, values) {
			const { data, error } = await supabase
				.from("waitlist_entries")
				.update(values)
				.eq("id", waitlistId)
				.select(WAITLIST_SELECT)
				.single()

			throwRepositoryError(
				error,
				500,
				"waitlist_update_failed",
				"Unable to update waitlist entry.",
			)

			return data
		},

		async listWaitlistQueue(filters) {
			let query = supabase
				.from("waitlist_entries")
				.select(WAITLIST_SELECT)
				.in("status", WAITLIST_QUEUE_STATUSES)
				.order("created_at", { ascending: true })
				.order("id", { ascending: true })

			if (filters.preferred_slot_id) {
				query = query.eq("preferred_slot_id", filters.preferred_slot_id)
			} else {
				query = applyNullableTenantFilter(query, filters.tenant_id)
				query = query
					.eq("preferred_date", filters.preferred_date)
					.eq("preferred_time", filters.preferred_time)
			}

			if (filters.stylist_id) {
				query = query.eq("stylist_id", filters.stylist_id)
			}

			const { data, error } = await query

			throwRepositoryError(
				error,
				500,
				"waitlist_queue_lookup_failed",
				"Unable to load waitlist queue.",
			)

			return data || []
		},

		async bulkUpdateWaitlistPositions(updates) {
			const updated = []

			for (const update of updates) {
				updated.push(
					await this.updateWaitlistEntry(update.id, {
						queue_position: update.queue_position,
						queue_size: update.queue_size,
					}),
				)
			}

			return updated
		},

		async insertStatusEvent(values) {
			const { data, error } = await supabase
				.from("booking_status_events")
				.insert(values)
				.select("id, created_at")
				.single()

			throwRepositoryError(
				error,
				500,
				"booking_status_event_failed",
				"Unable to write booking status event.",
			)

			return data
		},

		async insertActivity(values) {
			const { data, error } = await supabase
				.from("activity_timeline")
				.insert(values)
				.select("id, created_at")
				.single()

			throwRepositoryError(
				error,
				500,
				"activity_timeline_write_failed",
				"Unable to write activity timeline event.",
			)

			return data
		},

		async insertAuditLog(values) {
			const { data, error } = await supabase
				.from("admin_audit_logs")
				.insert(values)
				.select("id, created_at")
				.single()

			throwRepositoryError(
				error,
				500,
				"admin_audit_log_failed",
				"Unable to write admin audit log.",
			)

			return data
		},
	}
}

module.exports = {
	BOOKING_SELECT,
	BOOKING_SLOT_SELECT,
	WAITLIST_SELECT,
	createBookingRepository,
	isUniqueViolation,
}
