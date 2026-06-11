const { z } = require("zod")

const {
	BOOKING_STATUS_VALUES,
	TERMINAL_BOOKING_STATUSES,
	WAITLIST_STATUS_VALUES,
} = require("./booking.constants")

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
	message: "Date must use YYYY-MM-DD format.",
})

const timeSchema = z.string().trim().min(1).max(32)

const nullableUuid = z.string().uuid().nullable().optional()

const nullableTrimmedString = (maxLength) =>
	z.preprocess((value) => {
		if (typeof value !== "string") {
			return value
		}

		const trimmed = value.trim()
		return trimmed.length === 0 ? null : trimmed
	}, z.string().min(1).max(maxLength).nullable().optional())

const trimmedString = (maxLength) => z.string().trim().min(1).max(maxLength)

const metadataSchema = z.record(z.string(), z.unknown()).default({})

const bookingCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		first_name: trimmedString(120),
		last_name: nullableTrimmedString(120),
		email: z.string().trim().email().optional(),
		phone: nullableTrimmedString(40),
		service: trimmedString(160),
		service_id: nullableUuid,
		stylist: nullableTrimmedString(120),
		stylist_id: nullableUuid,
		stylist_key: nullableTrimmedString(80),
		appointment_date: dateSchema,
		appointment_time: timeSchema,
		starts_at: z.string().trim().min(1).optional(),
		ends_at: z.string().trim().min(1).nullable().optional(),
		notes: nullableTrimmedString(2000),
		inspiration_image_url: nullableTrimmedString(1000),
		metadata: metadataSchema,
	})
	.strict()

const bookingRescheduleSchema = z
	.object({
		tenant_id: nullableUuid,
		stylist: nullableTrimmedString(120),
		stylist_id: nullableUuid,
		stylist_key: nullableTrimmedString(80),
		appointment_date: dateSchema,
		appointment_time: timeSchema,
		starts_at: z.string().trim().min(1).optional(),
		ends_at: z.string().trim().min(1).nullable().optional(),
		reason: nullableTrimmedString(240),
		metadata: metadataSchema,
	})
	.strict()

const bookingCancelSchema = z
	.object({
		reason: nullableTrimmedString(240),
		metadata: metadataSchema,
	})
	.strict()

const adminBookingStatusUpdateSchema = z
	.object({
		status: z.enum(BOOKING_STATUS_VALUES),
		reason: nullableTrimmedString(240),
		metadata: metadataSchema,
	})
	.strict()

const adminBookingReleaseSlotSchema = z
	.object({
		reason: nullableTrimmedString(240),
		status: z.enum(TERMINAL_BOOKING_STATUSES).optional(),
		metadata: metadataSchema,
	})
	.strict()

const adminWaitlistStatusUpdateSchema = z
	.object({
		status: z.enum(WAITLIST_STATUS_VALUES),
		reason: nullableTrimmedString(240),
		metadata: metadataSchema,
	})
	.strict()

const bookingParamsSchema = z.object({
	bookingId: z.string().uuid(),
})

const bookingSlotParamsSchema = z.object({
	slotId: z.string().uuid(),
})

const waitlistParamsSchema = z.object({
	waitlistId: z.string().uuid(),
})

const listQuerySchema = z
	.object({
		status: z.enum(BOOKING_STATUS_VALUES).optional(),
		limit: z.coerce.number().int().min(1).max(200).default(50),
		offset: z.coerce.number().int().min(0).default(0),
	})
	.strict()

const waitlistListQuerySchema = z
	.object({
		status: z.string().trim().min(1).max(80).optional(),
		limit: z.coerce.number().int().min(1).max(200).default(50),
		offset: z.coerce.number().int().min(0).default(0),
	})
	.strict()

const FIELD_ALIASES = Object.freeze({
	tenantId: "tenant_id",
	firstName: "first_name",
	lastName: "last_name",
	serviceId: "service_id",
	stylistId: "stylist_id",
	stylistKey: "stylist_key",
	appointmentDate: "appointment_date",
	appointmentTime: "appointment_time",
	startsAt: "starts_at",
	endsAt: "ends_at",
	inspirationImageUrl: "inspiration_image_url",
})

function normalizeBookingPayload(payload = {}) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return payload
	}

	const normalized = { ...payload }

	for (const [camelKey, snakeKey] of Object.entries(FIELD_ALIASES)) {
		if (
			normalized[camelKey] !== undefined &&
			normalized[snakeKey] === undefined
		) {
			normalized[snakeKey] = normalized[camelKey]
		}

		delete normalized[camelKey]
	}

	return normalized
}

module.exports = {
	adminBookingReleaseSlotSchema,
	adminBookingStatusUpdateSchema,
	adminWaitlistStatusUpdateSchema,
	bookingCancelSchema,
	bookingCreateSchema,
	bookingParamsSchema,
	bookingRescheduleSchema,
	bookingSlotParamsSchema,
	listQuerySchema,
	normalizeBookingPayload,
	waitlistListQuerySchema,
	waitlistParamsSchema,
}
