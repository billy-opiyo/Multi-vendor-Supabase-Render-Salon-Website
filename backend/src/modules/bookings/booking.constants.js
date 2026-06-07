const BOOKING_STATUSES = Object.freeze({
	PENDING: "pending",
	CONFIRMED: "confirmed",
	COMPLETED: "completed",
	CANCELLED: "cancelled",
	WAITLISTED: "waitlisted",
	EXPIRED: "expired",
	NO_SHOW: "no_show",
})

const WAITLIST_STATUSES = Object.freeze({
	WAITING: "waiting",
	NOTIFIED: "notified",
	CONTACTED: "contacted",
	BOOKED: "booked",
	CANCELLED: "cancelled",
	NOTIFICATION_FAILED: "notification_failed",
})

const BOOKING_STATUS_VALUES = Object.freeze(Object.values(BOOKING_STATUSES))
const WAITLIST_STATUS_VALUES = Object.freeze(Object.values(WAITLIST_STATUSES))

const ACTIVE_BOOKING_STATUSES = Object.freeze([
	BOOKING_STATUSES.PENDING,
	BOOKING_STATUSES.CONFIRMED,
])

const CANCELLABLE_BOOKING_STATUSES = Object.freeze([
	BOOKING_STATUSES.PENDING,
	BOOKING_STATUSES.CONFIRMED,
	BOOKING_STATUSES.WAITLISTED,
])

const TERMINAL_BOOKING_STATUSES = Object.freeze([
	BOOKING_STATUSES.COMPLETED,
	BOOKING_STATUSES.CANCELLED,
	BOOKING_STATUSES.EXPIRED,
	BOOKING_STATUSES.NO_SHOW,
])

const WAITLIST_QUEUE_STATUSES = Object.freeze([
	WAITLIST_STATUSES.WAITING,
	WAITLIST_STATUSES.NOTIFIED,
	WAITLIST_STATUSES.CONTACTED,
	WAITLIST_STATUSES.NOTIFICATION_FAILED,
])

const DEFAULT_STYLIST_KEY = "any"
const DEFAULT_SLOT_DURATION_MINUTES = 60

function isActiveBookingStatus(status) {
	return ACTIVE_BOOKING_STATUSES.includes(status)
}

function isCancellableBookingStatus(status) {
	return CANCELLABLE_BOOKING_STATUSES.includes(status)
}

function isTerminalBookingStatus(status) {
	return TERMINAL_BOOKING_STATUSES.includes(status)
}

function isWaitlistQueueStatus(status) {
	return WAITLIST_QUEUE_STATUSES.includes(status)
}

function canTransitionBookingStatus(fromStatus, toStatus) {
	if (fromStatus === toStatus) {
		return true
	}

	if (isTerminalBookingStatus(fromStatus)) {
		return false
	}

	const allowedTransitions = {
		[BOOKING_STATUSES.PENDING]: [
			BOOKING_STATUSES.CONFIRMED,
			BOOKING_STATUSES.CANCELLED,
			BOOKING_STATUSES.EXPIRED,
		],
		[BOOKING_STATUSES.CONFIRMED]: [
			BOOKING_STATUSES.COMPLETED,
			BOOKING_STATUSES.CANCELLED,
			BOOKING_STATUSES.NO_SHOW,
		],
		[BOOKING_STATUSES.WAITLISTED]: [
			BOOKING_STATUSES.CONFIRMED,
			BOOKING_STATUSES.CANCELLED,
		],
	}

	return allowedTransitions[fromStatus]?.includes(toStatus) || false
}

function timestampFieldForBookingStatus(status) {
	const timestampFields = {
		[BOOKING_STATUSES.CANCELLED]: "cancelled_at",
		[BOOKING_STATUSES.COMPLETED]: "completed_at",
		[BOOKING_STATUSES.EXPIRED]: "expired_at",
		[BOOKING_STATUSES.NO_SHOW]: "no_show_at",
	}

	return timestampFields[status]
}

module.exports = {
	ACTIVE_BOOKING_STATUSES,
	BOOKING_STATUSES,
	BOOKING_STATUS_VALUES,
	CANCELLABLE_BOOKING_STATUSES,
	DEFAULT_SLOT_DURATION_MINUTES,
	DEFAULT_STYLIST_KEY,
	TERMINAL_BOOKING_STATUSES,
	WAITLIST_QUEUE_STATUSES,
	WAITLIST_STATUSES,
	WAITLIST_STATUS_VALUES,
	canTransitionBookingStatus,
	isActiveBookingStatus,
	isCancellableBookingStatus,
	isTerminalBookingStatus,
	isWaitlistQueueStatus,
	timestampFieldForBookingStatus,
}