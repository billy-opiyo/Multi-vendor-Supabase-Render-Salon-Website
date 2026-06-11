const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const { createBookingService } = require("./booking.service")
const {
	adminBookingReleaseSlotSchema,
	adminBookingStatusUpdateSchema,
	adminWaitlistStatusUpdateSchema,
	bookingSlotListQuerySchema,
	bookingCancelSchema,
	bookingCreateSchema,
	bookingParamsSchema,
	bookingRescheduleSchema,
	bookingSlotParamsSchema,
	legacyBookingSlotParamsSchema,
	listQuerySchema,
	normalizeBookingPayload,
	waitlistListQuerySchema,
	waitlistParamsSchema,
} = require("./booking.validators")

const createBooking = asyncHandler(async (req, res) => {
	const payload = parseRequest(
		bookingCreateSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().createBooking(
		req.auth.user,
		payload,
	)

	res.status(result.waitlisted ? 202 : 201).json({
		ok: true,
		data: result,
	})
})

const listOwnBookings = asyncHandler(async (req, res) => {
	const filters = parseRequest(listQuerySchema, req.query, {
		message: "Invalid booking list filters.",
	})
	const bookings = await createBookingService().listOwnBookings(
		req.auth.user,
		filters,
	)

	res.status(200).json({
		ok: true,
		data: {
			bookings,
		},
	})
})

const listPublicBookingSlots = asyncHandler(async (req, res) => {
	const filters = parseRequest(bookingSlotListQuerySchema, req.query, {
		message: "Invalid booking slot filters.",
	})
	const bookingSlots =
		await createBookingService().listPublicBookingSlots(filters)

	res.status(200).json({
		ok: true,
		data: {
			bookingSlots,
		},
	})
})

const cancelOwnBooking = asyncHandler(async (req, res) => {
	const params = parseRequest(bookingParamsSchema, req.params, {
		message: "Invalid booking identifier.",
	})
	const payload = parseRequest(
		bookingCancelSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().cancelOwnBooking(
		req.auth.user,
		params.bookingId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const rescheduleOwnBooking = asyncHandler(async (req, res) => {
	const params = parseRequest(bookingParamsSchema, req.params, {
		message: "Invalid booking identifier.",
	})
	const payload = parseRequest(
		bookingRescheduleSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().rescheduleOwnBooking(
		req.auth.user,
		params.bookingId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const getWaitlistQueue = asyncHandler(async (req, res) => {
	const params = parseRequest(waitlistParamsSchema, req.params, {
		message: "Invalid waitlist identifier.",
	})
	const result = await createBookingService().getWaitlistQueue(
		req.auth.user,
		params.waitlistId,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const getWaitlistQueueByBooking = asyncHandler(async (req, res) => {
	const params = parseRequest(bookingParamsSchema, req.params, {
		message: "Invalid booking identifier.",
	})
	const result = await createBookingService().getWaitlistQueueByBooking(
		req.auth.user,
		params.bookingId,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const releaseExpiredBookingSlot = asyncHandler(async (req, res) => {
	const params = parseRequest(bookingSlotParamsSchema, req.params, {
		message: "Invalid booking slot identifier.",
	})
	const result =
		await createBookingService().releaseExpiredBookingSlotForClient(
			req.auth.user,
			params.slotId,
		)

	res.status(200).json({
		ok: true,
		data: {
			slotId: params.slotId,
			...result,
		},
	})
})

const releaseExpiredBookingSlotByLegacyId = asyncHandler(async (req, res) => {
	const params = parseRequest(legacyBookingSlotParamsSchema, req.params, {
		message: "Invalid legacy booking slot identifier.",
	})
	const result =
		await createBookingService().releaseExpiredBookingSlotForClientByLegacyId(
			req.auth.user,
			params.legacySlotId,
		)

	res.status(200).json({
		ok: true,
		data: {
			legacySlotId: params.legacySlotId,
			...result,
		},
	})
})

const listAdminBookings = asyncHandler(async (req, res) => {
	const filters = parseRequest(listQuerySchema, req.query, {
		message: "Invalid admin booking list filters.",
	})
	const bookings = await createBookingService().listAdminBookings(filters)

	res.status(200).json({
		ok: true,
		data: {
			bookings,
		},
	})
})

const updateAdminBookingStatus = asyncHandler(async (req, res) => {
	const params = parseRequest(bookingParamsSchema, req.params, {
		message: "Invalid booking identifier.",
	})
	const payload = parseRequest(
		adminBookingStatusUpdateSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().updateBookingStatusAsAdmin(
		req.admin,
		params.bookingId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const releaseAdminBookingSlot = asyncHandler(async (req, res) => {
	const params = parseRequest(bookingParamsSchema, req.params, {
		message: "Invalid booking identifier.",
	})
	const payload = parseRequest(
		adminBookingReleaseSlotSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().releaseBookingSlotAsAdmin(
		req.admin,
		params.bookingId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const listAdminWaitlist = asyncHandler(async (req, res) => {
	const filters = parseRequest(waitlistListQuerySchema, req.query, {
		message: "Invalid admin waitlist list filters.",
	})
	const waitlistEntries =
		await createBookingService().listAdminWaitlist(filters)

	res.status(200).json({
		ok: true,
		data: {
			waitlistEntries,
		},
	})
})

const updateAdminWaitlistStatus = asyncHandler(async (req, res) => {
	const params = parseRequest(waitlistParamsSchema, req.params, {
		message: "Invalid waitlist identifier.",
	})
	const payload = parseRequest(
		adminWaitlistStatusUpdateSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().updateWaitlistStatusAsAdmin(
		req.admin,
		params.waitlistId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

const moveAdminWaitlistToConfirmed = asyncHandler(async (req, res) => {
	const params = parseRequest(waitlistParamsSchema, req.params, {
		message: "Invalid waitlist identifier.",
	})
	const payload = parseRequest(
		bookingCancelSchema,
		normalizeBookingPayload(req.body),
	)
	const result = await createBookingService().moveWaitlistToConfirmed(
		req.admin,
		params.waitlistId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: result,
	})
})

module.exports = {
	cancelOwnBooking,
	createBooking,
	getWaitlistQueue,
	getWaitlistQueueByBooking,
	listAdminBookings,
	listAdminWaitlist,
	listOwnBookings,
	listPublicBookingSlots,
	moveAdminWaitlistToConfirmed,
	releaseAdminBookingSlot,
	releaseExpiredBookingSlot,
	releaseExpiredBookingSlotByLegacyId,
	rescheduleOwnBooking,
	updateAdminBookingStatus,
	updateAdminWaitlistStatus,
}
