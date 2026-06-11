const { isTest } = require("../../config/env")
const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const { ApiError } = require("../../utils/errors")
const { pickDefined } = require("../../utils/validation")
const {
	BOOKING_STATUS_NOTIFICATION_TEMPLATES,
	NOTIFICATION_TEMPLATE_KEYS,
} = require("../notifications/notification.constants")
const {
	createNoopNotificationService,
	createNotificationService,
} = require("../notifications/notification.service")
const {
	DEFAULT_EXPIRED_SLOT_GRACE_MINUTES,
	BOOKING_STATUSES,
	DEFAULT_SLOT_DURATION_MINUTES,
	WAITLIST_SLOT_OCCUPIED_MESSAGE,
	DEFAULT_STYLIST_KEY,
	WAITLIST_QUEUE_STATUSES,
	buildWaitlistSlotOccupiedDetails,
	WAITLIST_STATUSES,
	canTransitionBookingStatus,
	isCancellableBookingStatus,
	isTerminalBookingStatus,
	timestampFieldForBookingStatus,
} = require("./booking.constants")
const { createBookingRepository } = require("./booking.repository")

const DEFAULT_TIMEZONE_OFFSET = "+03:00"

function assertAuthenticatedUser(authUser) {
	if (!authUser?.id) {
		throw new ApiError(
			401,
			"authentication_required",
			"Authenticated user required.",
		)
	}
}

function assertBookingOwnership(booking, authUser) {
	if (booking.user_id !== authUser.id) {
		throw new ApiError(
			403,
			"booking_access_denied",
			"You do not have access to this booking.",
		)
	}
}

function slugifyStylistKey(value) {
	return (
		String(value || DEFAULT_STYLIST_KEY)
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || DEFAULT_STYLIST_KEY
	)
}

function parseAppointmentTimeToMinutes(time) {
	const normalized = String(time || "")
		.trim()
		.toLowerCase()
	const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)

	if (!match) {
		throw new ApiError(
			400,
			"invalid_appointment_time",
			"Appointment time must use a recognizable HH:mm, H:mm AM, or H AM/PM format.",
		)
	}

	let hours = Number(match[1])
	const minutes = match[2] === undefined ? 0 : Number(match[2])
	const meridiem = match[3]

	if (minutes < 0 || minutes > 59) {
		throw new ApiError(
			400,
			"invalid_appointment_time",
			"Appointment time minutes must be between 00 and 59.",
		)
	}

	if (meridiem) {
		if (hours < 1 || hours > 12) {
			throw new ApiError(
				400,
				"invalid_appointment_time",
				"12-hour appointment time must use hours from 1 to 12.",
			)
		}

		if (meridiem === "pm" && hours !== 12) {
			hours += 12
		}

		if (meridiem === "am" && hours === 12) {
			hours = 0
		}
	} else if (hours < 0 || hours > 23) {
		throw new ApiError(
			400,
			"invalid_appointment_time",
			"24-hour appointment time must use hours from 0 to 23.",
		)
	}

	return hours * 60 + minutes
}

function buildStartsAt(appointmentDate, appointmentTime) {
	const minutes = parseAppointmentTimeToMinutes(appointmentTime)
	const hours = String(Math.floor(minutes / 60)).padStart(2, "0")
	const remainingMinutes = String(minutes % 60).padStart(2, "0")
	const parsed = new Date(
		`${appointmentDate}T${hours}:${remainingMinutes}:00${DEFAULT_TIMEZONE_OFFSET}`,
	)

	if (Number.isNaN(parsed.getTime())) {
		throw new ApiError(
			400,
			"invalid_appointment_datetime",
			"Appointment date and time could not be converted to a valid start timestamp.",
		)
	}

	return parsed.toISOString()
}

function normalizeLegacySlotTimeKey(value = "") {
	const compact = String(value || "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/:/g, "")
		.replace(/\./g, "")
	const parsedMinutes = parseLegacySlotTimeKeyToMinutes(compact)
	return parsedMinutes === null ? compact : `minutes:${parsedMinutes}`
}

function parseLegacySlotTimeKeyToMinutes(compactValue = "") {
	const match = String(compactValue || "").match(
		/^(\d{1,2})(\d{2})?(am|pm)?$/,
	)
	if (!match) return null

	let hours = Number(match[1])
	const minutes = match[2] === undefined ? 0 : Number(match[2])
	const meridiem = match[3]

	if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
	if (minutes < 0 || minutes > 59) return null

	if (meridiem) {
		if (hours < 1 || hours > 12) return null
		if (meridiem === "pm" && hours !== 12) hours += 12
		if (meridiem === "am" && hours === 12) hours = 0
	} else if (hours < 0 || hours > 23) {
		return null
	}

	return hours * 60 + minutes
}

function normalizeLegacyStylistKey(value = "") {
	const raw = String(value || "")
		.trim()
		.toLowerCase()
	if (!raw || raw === "any" || raw === "any available" || raw === "any-available") {
		return DEFAULT_STYLIST_KEY
	}
	return slugifyStylistKey(raw)
}

function parseLegacySlotId(legacySlotId = "") {
	const [slotDate, stylistKey, ...timeParts] = String(legacySlotId || "")
		.trim()
		.split("__")
	const timeKey = timeParts.join("__")

	if (!slotDate || !stylistKey || !timeKey) {
		throw new ApiError(
			400,
			"legacy_booking_slot_id_invalid",
			"Legacy booking slot identifiers must use date__stylist__time format.",
		)
	}

	return {
		slot_date: slotDate,
		stylist_key: normalizeLegacyStylistKey(stylistKey),
		time_key: normalizeLegacySlotTimeKey(timeKey),
	}
}

function formatOrdinalPosition(value = 0) {
	const position = Math.max(0, Number(value || 0))
	if (!position) return ""
	const mod100 = position % 100
	if (mod100 >= 11 && mod100 <= 13) return `${position}th`

	switch (position % 10) {
		case 1:
			return `${position}st`
		case 2:
			return `${position}nd`
		case 3:
			return `${position}rd`
		default:
			return `${position}th`
	}
}

function buildWaitlistQueueInfo(waitlistEntry = {}, queue = []) {
	const active = WAITLIST_QUEUE_STATUSES.includes(waitlistEntry.status)
	const position = active
		? Number(waitlistEntry.queue_position || 0) || null
		: null
	const size = active ? Number(waitlistEntry.queue_size || queue.length || 0) || null : null

	return {
		active: Boolean(active && position),
		position,
		label: position ? formatOrdinalPosition(position) : "",
		size,
		status: waitlistEntry.status,
		slotId: waitlistEntry.preferred_slot_id || "",
		waitlistId: waitlistEntry.id || "",
		source: "render-waitlist-queue",
	}
}

function addMinutes(isoTimestamp, minutesToAdd) {
	const date = new Date(isoTimestamp)
	return new Date(date.getTime() + minutesToAdd * 60 * 1000).toISOString()
}

function toValidDate(value) {
	const date = new Date(value || 0)
	return Number.isNaN(date.getTime()) ? null : date
}

function getSlotStartsAt(slot = {}) {
	if (slot.starts_at) {
		return toValidDate(slot.starts_at)
	}

	if (slot.slot_date && slot.slot_time) {
		return toValidDate(buildStartsAt(slot.slot_date, slot.slot_time))
	}

	return null
}

function isExpiredSlot(slot = {}, { nowIso, graceMinutes } = {}) {
	const startsAt = getSlotStartsAt(slot)
	if (!startsAt) return false

	const now = toValidDate(nowIso || new Date().toISOString()) || new Date()
	const safeGraceMinutes = Math.max(
		0,
		Number(graceMinutes || DEFAULT_EXPIRED_SLOT_GRACE_MINUTES),
	)
	return startsAt.getTime() + safeGraceMinutes * 60 * 1000 <= now.getTime()
}

function getAutoReleaseStatusForBooking(booking = {}) {
	if (booking.status === BOOKING_STATUSES.PENDING)
		return BOOKING_STATUSES.EXPIRED
	if (booking.status === BOOKING_STATUSES.CONFIRMED)
		return BOOKING_STATUSES.NO_SHOW
	return ""
}

function resolveStartsAt(payload) {
	if (payload.starts_at) {
		const parsed = new Date(payload.starts_at)

		if (Number.isNaN(parsed.getTime())) {
			throw new ApiError(
				400,
				"invalid_starts_at",
				"starts_at must be a valid date-time value.",
			)
		}

		return parsed.toISOString()
	}

	return buildStartsAt(payload.appointment_date, payload.appointment_time)
}

function resolveEndsAt(payload, startsAt) {
	if (payload.ends_at === null) {
		return null
	}

	if (payload.ends_at) {
		const parsed = new Date(payload.ends_at)

		if (Number.isNaN(parsed.getTime())) {
			throw new ApiError(
				400,
				"invalid_ends_at",
				"ends_at must be a valid date-time value.",
			)
		}

		return parsed.toISOString()
	}

	return addMinutes(startsAt, DEFAULT_SLOT_DURATION_MINUTES)
}

function buildSlotValues(payload) {
	const startsAt = resolveStartsAt(payload)
	const stylistKey = slugifyStylistKey(
		payload.stylist_key || payload.stylist || DEFAULT_STYLIST_KEY,
	)

	return pickDefined({
		tenant_id: payload.tenant_id,
		slot_date: payload.appointment_date,
		slot_time: payload.appointment_time,
		starts_at: startsAt,
		ends_at: resolveEndsAt(payload, startsAt),
		stylist_id: payload.stylist_id,
		stylist_key: stylistKey,
		metadata: {
			created_from: "render_booking_api",
		},
	})
}

function buildSlotValuesFromWaitlist(waitlistEntry) {
	const startsAt = buildStartsAt(
		waitlistEntry.preferred_date,
		waitlistEntry.preferred_time,
	)

	return pickDefined({
		tenant_id: waitlistEntry.tenant_id,
		slot_date: waitlistEntry.preferred_date,
		slot_time: waitlistEntry.preferred_time,
		starts_at: startsAt,
		ends_at: addMinutes(startsAt, DEFAULT_SLOT_DURATION_MINUTES),
		stylist_id: waitlistEntry.stylist_id,
		stylist_key: slugifyStylistKey(waitlistEntry.stylist),
		metadata: {
			created_from: "render_waitlist_promotion",
		},
	})
}

function buildBookingValues(authUser, payload, slot, status) {
	const email = payload.email || authUser.email

	if (!email) {
		throw new ApiError(
			400,
			"booking_email_required",
			"Booking email is required when the authenticated user has no email.",
		)
	}

	return pickDefined({
		tenant_id: payload.tenant_id,
		user_id: authUser.id,
		slot_id: status === BOOKING_STATUSES.WAITLISTED ? null : slot?.id,
		first_name: payload.first_name,
		last_name: payload.last_name,
		email,
		phone: payload.phone,
		service: payload.service,
		service_id: payload.service_id,
		stylist: payload.stylist,
		stylist_id: payload.stylist_id,
		appointment_date: payload.appointment_date,
		appointment_time: payload.appointment_time,
		starts_at: slot?.starts_at || resolveStartsAt(payload),
		status,
		notes: payload.notes,
		inspiration_image_url: payload.inspiration_image_url,
		metadata: payload.metadata || {},
	})
}

function buildWaitlistValues(authUser, payload, slot) {
	return pickDefined({
		tenant_id: payload.tenant_id,
		user_id: authUser.id,
		preferred_slot_id: slot?.id,
		preferred_date: payload.appointment_date,
		preferred_time: payload.appointment_time,
		service: payload.service,
		service_id: payload.service_id,
		stylist: payload.stylist,
		stylist_id: payload.stylist_id,
		status: WAITLIST_STATUSES.WAITING,
		metadata: {
			...(payload.metadata || {}),
			requested_stylist_key: slugifyStylistKey(
				payload.stylist_key || payload.stylist || DEFAULT_STYLIST_KEY,
			),
		},
	})
}

function queueFiltersFromWaitlist(waitlistEntry) {
	return {
		tenant_id: waitlistEntry.tenant_id,
		preferred_slot_id: waitlistEntry.preferred_slot_id,
		preferred_date: waitlistEntry.preferred_date,
		preferred_time: waitlistEntry.preferred_time,
		stylist_id: waitlistEntry.stylist_id,
	}
}

function queueFiltersFromSlot(slot) {
	return {
		tenant_id: slot.tenant_id,
		preferred_slot_id: slot.id,
		preferred_date: slot.slot_date,
		preferred_time: slot.slot_time,
		stylist_id: slot.stylist_id,
	}
}

function buildActivity({
	booking,
	actorUserId,
	activityType,
	title,
	description,
	metadata = {},
}) {
	return {
		tenant_id: booking.tenant_id,
		user_id: booking.user_id,
		actor_user_id: actorUserId,
		activity_type: activityType,
		title,
		description,
		entity_type: "booking",
		entity_id: booking.id,
		metadata,
	}
}

function createBookingService({ bookingRepository, notificationService } = {}) {
	const repository =
		bookingRepository || createBookingRepository(getSupabaseAdmin())
	const notifications =
		notificationService ||
		(isTest ? createNoopNotificationService() : createNotificationService())

	async function queueBookingNotification(booking, templateKey, options = {}) {
		return notifications.queueBookingNotification(booking, templateKey, options)
	}

	async function queueWaitlistNotification(
		waitlistEntry,
		templateKey,
		options = {},
	) {
		return notifications.queueWaitlistNotification(
			waitlistEntry,
			templateKey,
			options,
		)
	}

	async function queueSlotOpenNotifications(queue, slot, options = {}) {
		if (!slot || !queue?.length) {
			return { queued: [], skipped: true }
		}

		return notifications.queueWaitlistSlotOpenNotifications(
			queue,
			slot,
			options,
		)
	}

	async function getOrCreateSlot(slotValues) {
		const existing = await repository.findSlotByIdentity(slotValues)

		if (existing) {
			return existing
		}

		try {
			return await repository.createSlot(slotValues)
		} catch (error) {
			if (error.code !== "booking_slot_already_exists") {
				throw error
			}

			const createdByRace = await repository.findSlotByIdentity(slotValues)

			if (!createdByRace) {
				throw error
			}

			return createdByRace
		}
	}

	async function insertStatusEvent(
		booking,
		fromStatus,
		toStatus,
		actorUserId,
		reason,
		metadata = {},
	) {
		return repository.insertStatusEvent({
			tenant_id: booking.tenant_id,
			booking_id: booking.id,
			from_status: fromStatus,
			to_status: toStatus,
			changed_by: actorUserId,
			reason,
			metadata,
		})
	}

	async function recalculateWaitlistQueue(waitlistEntryOrFilters) {
		if (!waitlistEntryOrFilters) {
			return []
		}

		const filters = waitlistEntryOrFilters.preferred_date
			? queueFiltersFromWaitlist(waitlistEntryOrFilters)
			: waitlistEntryOrFilters

		const queue = await repository.listWaitlistQueue(filters)
		const queueSize = queue.length
		const updates = queue.map((entry, index) => ({
			id: entry.id,
			queue_position: index + 1,
			queue_size: queueSize,
		}))

		if (!updates.length) {
			return []
		}

		return repository.bulkUpdateWaitlistPositions(updates)
	}

	async function createWaitlistedBooking(
		authUser,
		payload,
		slot,
		metadata = {},
	) {
		const waitlistEntry = await repository.createWaitlistEntry(
			buildWaitlistValues(authUser, payload, slot),
		)
		const booking = await repository.createBooking({
			...buildBookingValues(
				authUser,
				payload,
				slot,
				BOOKING_STATUSES.WAITLISTED,
			),
			waitlist_id: waitlistEntry.id,
			metadata: {
				...(payload.metadata || {}),
				waitlist_reason: metadata.reason || "slot_unavailable",
			},
		})

		const linkedWaitlistEntry = await repository.updateWaitlistEntry(
			waitlistEntry.id,
			{ booking_id: booking.id },
		)
		const queue = await recalculateWaitlistQueue(linkedWaitlistEntry)
		const refreshedWaitlistEntry =
			queue.find((entry) => entry.id === linkedWaitlistEntry.id) ||
			linkedWaitlistEntry

		await insertStatusEvent(
			booking,
			null,
			BOOKING_STATUSES.WAITLISTED,
			authUser.id,
			metadata.reason || "slot_unavailable",
			{ source: "render_booking_api" },
		)
		await repository.insertActivity(
			buildActivity({
				booking,
				actorUserId: authUser.id,
				activityType: "waitlist_updated",
				title: "Booking added to waitlist",
				description:
					"Requested slot was unavailable, so the booking was added to the waitlist.",
				metadata: {
					waitlist_id: refreshedWaitlistEntry.id,
					queue_position: refreshedWaitlistEntry.queue_position,
					queue_size: refreshedWaitlistEntry.queue_size,
				},
			}),
		)
		await queueWaitlistNotification(
			refreshedWaitlistEntry,
			NOTIFICATION_TEMPLATE_KEYS.WAITLIST_JOINED,
			{
				booking,
				slot,
				markWaitlistNotified: false,
				source: "render_booking_api",
				metadata: {
					reason: metadata.reason || "slot_unavailable",
				},
			},
		)

		return {
			booking,
			slot,
			waitlistEntry: refreshedWaitlistEntry,
			queue,
			waitlisted: true,
		}
	}

	async function releaseBookingSlot(booking, reason) {
		if (!booking.slot_id) {
			return { releasedSlot: null, queue: [] }
		}

		const releasedSlot = await repository.releaseSlot(booking.slot_id, {
			release_reason: reason,
		})
		const queue = await recalculateWaitlistQueue(
			queueFiltersFromSlot(releasedSlot),
		)

		return { releasedSlot, queue }
	}

	async function releaseExpiredSlotDocumentWorkflow({
		slot,
		actorUserId = null,
		nowIso,
		graceMinutes = DEFAULT_EXPIRED_SLOT_GRACE_MINUTES,
		source = "manual",
	} = {}) {
		if (!slot?.id) {
			return { released: false, reason: "not-found" }
		}

		if (slot.taken !== true) {
			return { released: false, reason: "already-open", slot }
		}

		if (!isExpiredSlot(slot, { nowIso, graceMinutes })) {
			return { released: false, reason: "not-expired", slot }
		}

		const booking = slot.booking_id
			? await repository.findBookingById(slot.booking_id)
			: null
		const bookingStatus = booking?.status || ""
		const nextBookingStatus = booking
			? getAutoReleaseStatusForBooking(booking)
			: ""

		let releaseReason = nextBookingStatus || "expired_orphaned"
		if (booking) {
			if (booking.status === BOOKING_STATUSES.COMPLETED) {
				releaseReason = "completed"
			} else if (booking.status === BOOKING_STATUSES.CANCELLED) {
				releaseReason = "cancelled"
			} else if (
				booking.status === BOOKING_STATUSES.EXPIRED ||
				booking.status === BOOKING_STATUSES.NO_SHOW
			) {
				releaseReason = booking.status
			} else if (!nextBookingStatus) {
				return {
					released: false,
					reason: "booking-status-not-autoreleasable",
					bookingId: booking.id,
					bookingStatus: booking.status,
					slot,
				}
			}
		}

		let updatedBooking = booking
		if (booking && nextBookingStatus) {
			const updateValues = {
				status: nextBookingStatus,
				metadata: {
					...(booking.metadata || {}),
					auto_release_source: source,
					previous_status_before_auto_release: booking.status,
				},
			}
			const timestampField = timestampFieldForBookingStatus(nextBookingStatus)
			if (timestampField) {
				updateValues[timestampField] = nowIso || new Date().toISOString()
			}
			updatedBooking = await repository.updateBooking(booking.id, updateValues)
			await insertStatusEvent(
				updatedBooking,
				booking.status,
				nextBookingStatus,
				actorUserId,
				releaseReason,
				{ source },
			)
		}

		const releasedSlot = await repository.releaseSlot(slot.id, {
			release_reason: releaseReason,
		})
		const queue = await recalculateWaitlistQueue(
			queueFiltersFromSlot(releasedSlot),
		)
		await queueSlotOpenNotifications(queue, releasedSlot, {
			source: `render_${source}_expired_slot_release`,
			metadata: { reason: releaseReason },
		})

		if (updatedBooking) {
			await repository.insertActivity(
				buildActivity({
					booking: updatedBooking,
					actorUserId,
					activityType: "booking_status_changed",
					title: "Expired booking slot released",
					description: `Expired booking slot was released with reason ${releaseReason}.`,
					metadata: {
						slot_id: releasedSlot.id,
						release_reason: releaseReason,
						source,
					},
				}),
			)
		}

		return {
			released: true,
			reason: releaseReason,
			bookingId: booking?.id || slot.booking_id || "",
			bookingStatus,
			nextBookingStatus,
			slot: releasedSlot,
			booking: updatedBooking,
			queue,
		}
	}

	async function updateBookingStatusWorkflow({
		booking,
		toStatus,
		actorUserId,
		reason,
		metadata = {},
		releaseSlot = false,
	}) {
		if (!canTransitionBookingStatus(booking.status, toStatus)) {
			throw new ApiError(
				400,
				"booking_status_transition_invalid",
				`Cannot transition booking from ${booking.status} to ${toStatus}.`,
			)
		}

		const now = new Date().toISOString()
		const timestampField = timestampFieldForBookingStatus(toStatus)
		const updateValues = {
			status: toStatus,
			metadata: {
				...(booking.metadata || {}),
				...metadata,
			},
		}

		if (timestampField) {
			updateValues[timestampField] = now
		}

		const updatedBooking = await repository.updateBooking(
			booking.id,
			updateValues,
		)

		let waitlistEntry = null
		let queue = []

		if (booking.waitlist_id && toStatus === BOOKING_STATUSES.CANCELLED) {
			waitlistEntry = await repository.updateWaitlistEntry(
				booking.waitlist_id,
				{
					status: WAITLIST_STATUSES.CANCELLED,
				},
			)
			queue = await recalculateWaitlistQueue(waitlistEntry)
		}

		let releasedSlot = null
		if (releaseSlot && booking.slot_id) {
			const releaseResult = await releaseBookingSlot(updatedBooking, reason)
			releasedSlot = releaseResult.releasedSlot
			queue = releaseResult.queue
		}

		await insertStatusEvent(
			updatedBooking,
			booking.status,
			toStatus,
			actorUserId,
			reason,
			metadata,
		)
		await repository.insertActivity(
			buildActivity({
				booking: updatedBooking,
				actorUserId,
				activityType:
					toStatus === BOOKING_STATUSES.CANCELLED
						? "booking_canceled"
						: "booking_status_changed",
				title: "Booking status changed",
				description: `Booking status changed from ${booking.status} to ${toStatus}.`,
				metadata: {
					from_status: booking.status,
					to_status: toStatus,
					reason,
				},
			}),
		)

		const templateKey = BOOKING_STATUS_NOTIFICATION_TEMPLATES[toStatus]
		if (templateKey) {
			await queueBookingNotification(updatedBooking, templateKey, {
				uniqueKey: toStatus,
				source: "render_booking_status_workflow",
				event: {
					from_status: booking.status,
					to_status: toStatus,
					reason,
				},
			})
		}

		await queueSlotOpenNotifications(queue, releasedSlot, {
			source: "render_booking_slot_release",
			metadata: { reason },
		})

		return {
			booking: updatedBooking,
			releasedSlot,
			waitlistEntry,
			queue,
		}
	}

	return {
		async listPublicBookingSlots(filters = {}) {
			return repository.listPublicBookingSlots(filters)
		},

		async createBooking(authUser, payload) {
			assertAuthenticatedUser(authUser)

			const slot = await getOrCreateSlot(buildSlotValues(payload))

			if (slot.taken || slot.booking_id) {
				return createWaitlistedBooking(authUser, payload, slot, {
					reason: "slot_unavailable",
				})
			}

			const heldSlot = await repository.reserveSlot(slot.id, {
				user_id: authUser.id,
			})

			if (!heldSlot) {
				return createWaitlistedBooking(authUser, payload, slot, {
					reason: "slot_reserved_by_another_request",
				})
			}

			let booking
			try {
				booking = await repository.createBooking(
					buildBookingValues(
						authUser,
						payload,
						heldSlot,
						BOOKING_STATUSES.CONFIRMED,
					),
				)
			} catch (error) {
				await repository.releaseSlot(heldSlot.id, {
					release_reason: "booking_create_failed",
				})

				if (error.code === "booking_slot_conflict") {
					return createWaitlistedBooking(authUser, payload, slot, {
						reason: "slot_conflict",
					})
				}

				throw error
			}

			const reservedSlot = await repository.attachSlotBooking(
				heldSlot.id,
				booking.id,
			)

			await insertStatusEvent(
				booking,
				null,
				BOOKING_STATUSES.CONFIRMED,
				authUser.id,
				"booking_confirmed_on_create",
				{ source: "render_booking_api" },
			)
			await repository.insertActivity(
				buildActivity({
					booking,
					actorUserId: authUser.id,
					activityType: "booking_created",
					title: "Booking confirmed",
					description:
						"Customer booked an available slot and it was confirmed automatically.",
					metadata: {
						slot_id: reservedSlot.id,
					},
				}),
			)
			await queueBookingNotification(
				booking,
				NOTIFICATION_TEMPLATE_KEYS.BOOKING_CONFIRMED,
				{
					slot: reservedSlot,
					source: "render_booking_api",
				},
			)

			return {
				booking,
				slot: reservedSlot,
				waitlistEntry: null,
				queue: [],
				waitlisted: false,
			}
		},

		async listOwnBookings(authUser, filters = {}) {
			assertAuthenticatedUser(authUser)
			return repository.listBookingsForUser(authUser.id, filters)
		},

		async cancelOwnBooking(authUser, bookingId, payload = {}) {
			assertAuthenticatedUser(authUser)

			const booking = await repository.findBookingById(bookingId)

			if (!booking) {
				throw new ApiError(404, "booking_not_found", "Booking was not found.")
			}

			assertBookingOwnership(booking, authUser)

			if (!isCancellableBookingStatus(booking.status)) {
				throw new ApiError(
					400,
					"booking_not_cancellable",
					`Booking with status ${booking.status} cannot be cancelled.`,
				)
			}

			return updateBookingStatusWorkflow({
				booking,
				toStatus: BOOKING_STATUSES.CANCELLED,
				actorUserId: authUser.id,
				reason: payload.reason || "customer_cancelled",
				metadata: payload.metadata || {},
				releaseSlot: Boolean(booking.slot_id),
			})
		},

		async rescheduleOwnBooking(authUser, bookingId, payload = {}) {
			assertAuthenticatedUser(authUser)

			const booking = await repository.findBookingById(bookingId)

			if (!booking) {
				throw new ApiError(404, "booking_not_found", "Booking was not found.")
			}

			assertBookingOwnership(booking, authUser)

			if (
				![BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED].includes(
					booking.status,
				)
			) {
				throw new ApiError(
					400,
					"booking_not_reschedulable",
					`Booking with status ${booking.status} cannot be rescheduled.`,
				)
			}

			const slotPayload = {
				...payload,
				tenant_id: payload.tenant_id ?? booking.tenant_id,
				stylist: payload.stylist ?? booking.stylist,
				stylist_id: payload.stylist_id ?? booking.stylist_id,
			}
			const targetSlot = await getOrCreateSlot(buildSlotValues(slotPayload))

			if (targetSlot.taken || targetSlot.booking_id) {
				throw new ApiError(
					409,
					"booking_slot_unavailable",
					"The requested reschedule slot is not available.",
				)
			}

			const heldTargetSlot = await repository.reserveSlot(targetSlot.id, {
				user_id: authUser.id,
			})

			if (!heldTargetSlot) {
				throw new ApiError(
					409,
					"booking_slot_unavailable",
					"The requested reschedule slot is not available.",
				)
			}

			let updatedBooking
			try {
				updatedBooking = await repository.updateBooking(booking.id, {
					slot_id: heldTargetSlot.id,
					appointment_date: payload.appointment_date,
					appointment_time: payload.appointment_time,
					starts_at: heldTargetSlot.starts_at,
					stylist: payload.stylist ?? booking.stylist,
					stylist_id: payload.stylist_id ?? booking.stylist_id,
					metadata: {
						...(booking.metadata || {}),
						...(payload.metadata || {}),
						rescheduled_from: {
							slot_id: booking.slot_id,
							appointment_date: booking.appointment_date,
							appointment_time: booking.appointment_time,
						},
					},
				})
			} catch (error) {
				await repository.releaseSlot(heldTargetSlot.id, {
					release_reason: "reschedule_failed",
				})
				throw error
			}

			let releasedPreviousSlot = null
			let previousSlotQueue = []
			if (booking.slot_id && booking.slot_id !== heldTargetSlot.id) {
				releasedPreviousSlot = await repository.releaseSlot(booking.slot_id, {
					release_reason: "booking_rescheduled",
				})
				previousSlotQueue = await recalculateWaitlistQueue(
					queueFiltersFromSlot(releasedPreviousSlot),
				)
			}

			const reservedSlot = await repository.attachSlotBooking(
				heldTargetSlot.id,
				updatedBooking.id,
			)

			await insertStatusEvent(
				updatedBooking,
				booking.status,
				updatedBooking.status,
				authUser.id,
				payload.reason || "booking_rescheduled",
				{ source: "render_booking_api" },
			)
			await repository.insertActivity(
				buildActivity({
					booking: updatedBooking,
					actorUserId: authUser.id,
					activityType: "booking_status_changed",
					title: "Booking rescheduled",
					description: "Customer rescheduled their booking.",
					metadata: {
						previous_slot_id: booking.slot_id,
						next_slot_id: reservedSlot.id,
					},
				}),
			)
			await queueBookingNotification(
				updatedBooking,
				NOTIFICATION_TEMPLATE_KEYS.BOOKING_RESCHEDULED,
				{
					slot: reservedSlot,
					uniqueKey: reservedSlot.starts_at,
					source: "render_booking_api",
					event: {
						previous_slot_id: booking.slot_id,
						next_slot_id: reservedSlot.id,
					},
				},
			)
			await queueSlotOpenNotifications(
				previousSlotQueue,
				releasedPreviousSlot,
				{
					source: "render_booking_reschedule",
					metadata: { reason: "booking_rescheduled" },
				},
			)

			return {
				booking: updatedBooking,
				slot: reservedSlot,
			}
		},

		async getWaitlistQueue(authUser, waitlistId) {
			assertAuthenticatedUser(authUser)

			const waitlistEntry = await repository.findWaitlistById(waitlistId)

			if (!waitlistEntry) {
				throw new ApiError(
					404,
					"waitlist_entry_not_found",
					"Waitlist entry was not found.",
				)
			}

			if (waitlistEntry.user_id !== authUser.id) {
				throw new ApiError(
					403,
					"waitlist_access_denied",
					"You do not have access to this waitlist entry.",
				)
			}

			const queue = await recalculateWaitlistQueue(waitlistEntry)
			const refreshedWaitlistEntry =
				queue.find((entry) => entry.id === waitlistEntry.id) || waitlistEntry

			return {
				...buildWaitlistQueueInfo(refreshedWaitlistEntry, queue),
				waitlistEntry: refreshedWaitlistEntry,
				queue,
			}
		},

		async getWaitlistQueueByBooking(authUser, bookingId) {
			assertAuthenticatedUser(authUser)

			const booking = await repository.findBookingById(bookingId)

			if (!booking) {
				throw new ApiError(404, "booking_not_found", "Booking was not found.")
			}

			assertBookingOwnership(booking, authUser)

			const waitlistEntry = booking.waitlist_id
				? await repository.findWaitlistById(booking.waitlist_id)
				: await repository.findWaitlistByBookingId(booking.id)

			if (!waitlistEntry) {
				throw new ApiError(
					404,
					"waitlist_entry_not_found",
					"Waitlist entry was not found for this booking.",
				)
			}

			const queue = await recalculateWaitlistQueue(waitlistEntry)
			const refreshedWaitlistEntry =
				queue.find((entry) => entry.id === waitlistEntry.id) || waitlistEntry

			return {
				...buildWaitlistQueueInfo(refreshedWaitlistEntry, queue),
				bookingId: booking.id,
				booking,
				waitlistEntry: refreshedWaitlistEntry,
				queue,
			}
		},

		async releaseExpiredBookingSlotForClient(authUser, slotId, options = {}) {
			assertAuthenticatedUser(authUser)

			const slot = await repository.findSlotById(slotId)
			if (!slot) {
				throw new ApiError(
					404,
					"booking_slot_not_found",
					"Booking slot was not found.",
				)
			}

			return releaseExpiredSlotDocumentWorkflow({
				slot,
				actorUserId: authUser.id,
				graceMinutes:
					options.graceMinutes || DEFAULT_EXPIRED_SLOT_GRACE_MINUTES,
				nowIso: options.nowIso,
				source: "client",
			})
		},

		async releaseExpiredBookingSlotForClientByLegacyId(
			authUser,
			legacySlotId,
			options = {},
		) {
			assertAuthenticatedUser(authUser)

			const legacy = parseLegacySlotId(legacySlotId)
			const slots = await repository.listSlotsByDateAndStylist(legacy)
			const slot = slots.find(
				(item) =>
					normalizeLegacySlotTimeKey(item.slot_time) === legacy.time_key,
			)

			if (!slot) {
				throw new ApiError(
					404,
					"booking_slot_not_found",
					"Booking slot was not found.",
				)
			}

			return releaseExpiredSlotDocumentWorkflow({
				slot,
				actorUserId: authUser.id,
				graceMinutes:
					options.graceMinutes || DEFAULT_EXPIRED_SLOT_GRACE_MINUTES,
				nowIso: options.nowIso,
				source: "client_legacy_slot_id",
			})
		},

		async listAdminBookings(filters = {}) {
			return repository.listAdminBookings(filters)
		},

		async listAdminWaitlist(filters = {}) {
			return repository.listAdminWaitlist(filters)
		},

		async updateWaitlistStatusAsAdmin(actorAdmin, waitlistId, payload = {}) {
			const waitlistEntry = await repository.findWaitlistById(waitlistId)

			if (!waitlistEntry) {
				throw new ApiError(
					404,
					"waitlist_entry_not_found",
					"Waitlist entry was not found.",
				)
			}

			const nextStatus = payload.status
			const now = new Date().toISOString()
			const waitlistValues = {
				status: nextStatus,
				metadata: {
					...(waitlistEntry.metadata || {}),
					...(payload.metadata || {}),
					admin_status_updated_by: actorAdmin.user_id,
					admin_status_updated_at: now,
					previous_status: waitlistEntry.status,
					reason: payload.reason || null,
				},
			}

			if (!WAITLIST_QUEUE_STATUSES.includes(nextStatus)) {
				waitlistValues.queue_position = null
				waitlistValues.queue_size = null
			}

			const updatedWaitlistEntry = await repository.updateWaitlistEntry(
				waitlistId,
				waitlistValues,
			)

			let bookingResult = null
			if (
				nextStatus === WAITLIST_STATUSES.CANCELLED &&
				waitlistEntry.booking_id
			) {
				const linkedBooking = await repository.findBookingById(
					waitlistEntry.booking_id,
				)
				if (linkedBooking?.status === BOOKING_STATUSES.WAITLISTED) {
					bookingResult = await updateBookingStatusWorkflow({
						booking: linkedBooking,
						toStatus: BOOKING_STATUSES.CANCELLED,
						actorUserId: actorAdmin.user_id,
						reason: payload.reason || "admin_waitlist_cancelled",
						metadata: {
							...(payload.metadata || {}),
							waitlist_id: waitlistEntry.id,
							source: "render_api",
						},
						releaseSlot: false,
					})
				}
			}

			const queue = await recalculateWaitlistQueue(updatedWaitlistEntry)
			const refreshedWaitlistEntry =
				queue.find((entry) => entry.id === updatedWaitlistEntry.id) ||
				updatedWaitlistEntry

			await repository.insertAuditLog({
				tenant_id: refreshedWaitlistEntry.tenant_id,
				actor_user_id: actorAdmin.user_id,
				target_user_id: refreshedWaitlistEntry.user_id,
				action: "waitlist.status_updated",
				resource_type: "waitlist_entry",
				resource_id: refreshedWaitlistEntry.id,
				changes: {
					status: {
						before: waitlistEntry.status,
						after: refreshedWaitlistEntry.status,
					},
				},
				metadata: {
					source: "render_api",
					reason: payload.reason,
				},
			})

			return {
				waitlistEntry: refreshedWaitlistEntry,
				booking: bookingResult?.booking || null,
				queue,
			}
		},

		async updateBookingStatusAsAdmin(actorAdmin, bookingId, payload = {}) {
			const booking = await repository.findBookingById(bookingId)

			if (!booking) {
				throw new ApiError(404, "booking_not_found", "Booking was not found.")
			}

			const releaseSlot = [
				BOOKING_STATUSES.CANCELLED,
				BOOKING_STATUSES.COMPLETED,
				BOOKING_STATUSES.EXPIRED,
				BOOKING_STATUSES.NO_SHOW,
			].includes(payload.status)

			const result = await updateBookingStatusWorkflow({
				booking,
				toStatus: payload.status,
				actorUserId: actorAdmin.user_id,
				reason: payload.reason || "admin_status_update",
				metadata: payload.metadata || {},
				releaseSlot,
			})

			await repository.insertAuditLog({
				tenant_id: result.booking.tenant_id,
				actor_user_id: actorAdmin.user_id,
				target_user_id: result.booking.user_id,
				action: "booking.status_updated",
				resource_type: "booking",
				resource_id: result.booking.id,
				changes: {
					status: {
						before: booking.status,
						after: result.booking.status,
					},
				},
				metadata: {
					source: "render_api",
					reason: payload.reason,
				},
			})

			return result
		},

		async releaseBookingSlotAsAdmin(actorAdmin, bookingId, payload = {}) {
			const booking = await repository.findBookingById(bookingId)

			if (!booking) {
				throw new ApiError(404, "booking_not_found", "Booking was not found.")
			}

			const targetStatus =
				payload.status ||
				(isTerminalBookingStatus(booking.status)
					? booking.status
					: BOOKING_STATUSES.CANCELLED)

			if (!isTerminalBookingStatus(targetStatus)) {
				throw new ApiError(
					400,
					"booking_release_status_invalid",
					"Releasing a slot requires a terminal booking status.",
				)
			}

			const result =
				targetStatus === booking.status
					? {
							booking,
							...(await releaseBookingSlot(
								booking,
								payload.reason || "admin_released_slot",
							)),
						}
					: await updateBookingStatusWorkflow({
							booking,
							toStatus: targetStatus,
							actorUserId: actorAdmin.user_id,
							reason: payload.reason || "admin_released_slot",
							metadata: payload.metadata || {},
							releaseSlot: true,
						})

			await repository.insertAuditLog({
				tenant_id: result.booking.tenant_id,
				actor_user_id: actorAdmin.user_id,
				target_user_id: result.booking.user_id,
				action: "booking.slot_released",
				resource_type: "booking",
				resource_id: result.booking.id,
				changes: {
					status: {
						before: booking.status,
						after: result.booking.status,
					},
					slot_id: {
						before: booking.slot_id,
						after: null,
					},
				},
				metadata: {
					source: "render_api",
					reason: payload.reason,
				},
			})

			if (targetStatus === booking.status) {
				await queueSlotOpenNotifications(result.queue, result.releasedSlot, {
					source: "render_admin_slot_release",
					metadata: {
						reason: payload.reason || "admin_released_slot",
					},
				})
			}

			return result
		},

		async moveWaitlistToConfirmed(actorAdmin, waitlistId, payload = {}) {
			const waitlistEntry = await repository.findWaitlistById(waitlistId)

			if (!waitlistEntry) {
				throw new ApiError(
					404,
					"waitlist_entry_not_found",
					"Waitlist entry was not found.",
				)
			}

			if (!WAITLIST_QUEUE_STATUSES.includes(waitlistEntry.status)) {
				throw new ApiError(
					400,
					"waitlist_entry_not_promotable",
					`Waitlist entry with status ${waitlistEntry.status} cannot be promoted.`,
				)
			}

			if (!waitlistEntry.booking_id) {
				throw new ApiError(
					400,
					"waitlist_booking_required",
					"Waitlist entry must be linked to a waitlisted booking before promotion.",
				)
			}

			const booking = await repository.findBookingById(waitlistEntry.booking_id)

			if (!booking) {
				throw new ApiError(
					404,
					"waitlist_booking_not_found",
					"Linked waitlisted booking was not found.",
				)
			}

			if (booking.status !== BOOKING_STATUSES.WAITLISTED) {
				throw new ApiError(
					400,
					"waitlist_booking_status_invalid",
					"Only waitlisted bookings can be moved to confirmed.",
				)
			}

			const slot = waitlistEntry.preferred_slot_id
				? await repository.findSlotById(waitlistEntry.preferred_slot_id)
				: await getOrCreateSlot(buildSlotValuesFromWaitlist(waitlistEntry))

			if (!slot) {
				throw new ApiError(
					404,
					"waitlist_slot_not_found",
					"Preferred waitlist slot was not found.",
				)
			}

			if (slot.taken || slot.booking_id) {
				throw new ApiError(
					409,
					"waitlist_slot_occupied",
					WAITLIST_SLOT_OCCUPIED_MESSAGE,
					buildWaitlistSlotOccupiedDetails({
						slotId: slot.id,
						currentBookingId: slot.booking_id,
						waitlistBookingId: booking.id,
					}),
				)
			}

			const heldSlot = await repository.reserveSlot(slot.id, {
				user_id: booking.user_id,
			})

			if (!heldSlot) {
				throw new ApiError(
					409,
					"waitlist_slot_occupied",
					WAITLIST_SLOT_OCCUPIED_MESSAGE,
					buildWaitlistSlotOccupiedDetails({
						slotId: slot.id,
						currentBookingId: slot.booking_id,
						waitlistBookingId: booking.id,
					}),
				)
			}

			let confirmedBooking
			try {
				confirmedBooking = await repository.updateBooking(booking.id, {
					status: BOOKING_STATUSES.CONFIRMED,
					slot_id: heldSlot.id,
					appointment_date: heldSlot.slot_date,
					appointment_time: heldSlot.slot_time,
					starts_at: heldSlot.starts_at,
					metadata: {
						...(booking.metadata || {}),
						...(payload.metadata || {}),
						promoted_from_waitlist_id: waitlistEntry.id,
					},
				})
			} catch (error) {
				await repository.releaseSlot(heldSlot.id, {
					release_reason: "waitlist_promotion_failed",
				})
				throw error
			}

			const reservedSlot = await repository.attachSlotBooking(
				heldSlot.id,
				confirmedBooking.id,
			)
			const bookedWaitlistEntry = await repository.updateWaitlistEntry(
				waitlistEntry.id,
				{
					status: WAITLIST_STATUSES.BOOKED,
					queue_position: null,
					queue_size: null,
				},
			)
			const queue = await recalculateWaitlistQueue(waitlistEntry)

			await insertStatusEvent(
				confirmedBooking,
				booking.status,
				BOOKING_STATUSES.CONFIRMED,
				actorAdmin.user_id,
				payload.reason || "admin_promoted_waitlist",
				{ source: "render_api" },
			)
			await repository.insertActivity(
				buildActivity({
					booking: confirmedBooking,
					actorUserId: actorAdmin.user_id,
					activityType: "waitlist_updated",
					title: "Waitlist booking confirmed",
					description: "Admin promoted waitlisted booking to confirmed.",
					metadata: {
						waitlist_id: waitlistEntry.id,
						slot_id: reservedSlot.id,
					},
				}),
			)
			await repository.insertAuditLog({
				tenant_id: confirmedBooking.tenant_id,
				actor_user_id: actorAdmin.user_id,
				target_user_id: confirmedBooking.user_id,
				action: "waitlist.promoted_to_confirmed",
				resource_type: "waitlist_entry",
				resource_id: waitlistEntry.id,
				changes: {
					booking_status: {
						before: booking.status,
						after: confirmedBooking.status,
					},
					waitlist_status: {
						before: waitlistEntry.status,
						after: bookedWaitlistEntry.status,
					},
				},
				metadata: {
					source: "render_api",
					reason: payload.reason,
				},
			})
			await queueBookingNotification(
				confirmedBooking,
				NOTIFICATION_TEMPLATE_KEYS.BOOKING_CONFIRMED,
				{
					waitlistEntry: bookedWaitlistEntry,
					slot: reservedSlot,
					uniqueKey: `waitlist:${waitlistEntry.id}`,
					source: "render_waitlist_promotion",
				},
			)

			return {
				booking: confirmedBooking,
				slot: reservedSlot,
				waitlistEntry: bookedWaitlistEntry,
				queue,
			}
		},

		async releaseExpiredBookingSlots(options = {}) {
			const nowIso = options.nowIso || new Date().toISOString()
			const graceMinutes =
				options.graceMinutes || DEFAULT_EXPIRED_SLOT_GRACE_MINUTES
			const cutoffIso =
				options.cutoffIso ||
				new Date(
					new Date(nowIso).getTime() - graceMinutes * 60 * 1000,
				).toISOString()
			const slotCandidates =
				typeof repository.listExpiredTakenSlots === "function"
					? await repository.listExpiredTakenSlots({
							cutoffIso,
							limit: options.limit || 500,
						})
					: []
			const bookingCandidates =
				typeof repository.listExpiredActiveBookings === "function"
					? await repository.listExpiredActiveBookings({
							cutoffIso,
							limit: options.bookingLimit || options.limit || 50,
						})
					: []
			const released = []
			const processedBookingIds = new Set()

			for (const slot of slotCandidates) {
				if (slot.booking_id) {
					processedBookingIds.add(String(slot.booking_id))
				}

				released.push(
					await releaseExpiredSlotDocumentWorkflow({
						slot,
						actorUserId: options.actorUserId || null,
						graceMinutes,
						nowIso,
						source: "scheduled",
					}),
				)
			}

			for (const booking of bookingCandidates) {
				if (processedBookingIds.has(String(booking.id))) {
					continue
				}

				const nextBookingStatus = getAutoReleaseStatusForBooking(booking)
				if (!nextBookingStatus) {
					released.push({
						released: false,
						reason: "booking-status-not-autoreleasable",
						bookingId: booking.id,
						bookingStatus: booking.status,
					})
					continue
				}

				const slot = booking.slot_id
					? await repository.findSlotById(booking.slot_id)
					: null
				const result = slot
					? await releaseExpiredSlotDocumentWorkflow({
							slot,
							actorUserId: options.actorUserId || null,
							graceMinutes,
							nowIso,
							source: "scheduled",
						})
					: await updateBookingStatusWorkflow({
							booking,
							toStatus: nextBookingStatus,
							actorUserId: options.actorUserId || null,
							reason: options.reason || "scheduled_slot_expiration",
							metadata: {
								...(options.metadata || {}),
								source: "render_expired_slot_job",
								cutoff_at: cutoffIso,
							},
							releaseSlot: false,
						})

				released.push(result)
			}

			return {
				cutoffIso,
				candidates: slotCandidates.length + bookingCandidates.length,
				released,
			}
		},
	}
}

module.exports = {
	buildStartsAt,
	createBookingService,
	parseAppointmentTimeToMinutes,
	slugifyStylistKey,
}
