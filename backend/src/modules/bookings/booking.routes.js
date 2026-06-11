const express = require("express")

const { requireAdmin } = require("../../middleware/requireAdmin")
const { requireAuth } = require("../../middleware/requireAuth")
const bookingController = require("./booking.controller")

const router = express.Router()

router.get("/api/v1/booking-slots", bookingController.listPublicBookingSlots)
router.post("/api/v1/bookings", requireAuth, bookingController.createBooking)
router.get(
	"/api/v1/bookings/me",
	requireAuth,
	bookingController.listOwnBookings,
)
router.post(
	"/api/v1/bookings/:bookingId/cancel",
	requireAuth,
	bookingController.cancelOwnBooking,
)
router.post(
	"/api/v1/bookings/:bookingId/reschedule",
	requireAuth,
	bookingController.rescheduleOwnBooking,
)
router.get(
	"/api/v1/waitlist/:waitlistId/queue",
	requireAuth,
	bookingController.getWaitlistQueue,
)
router.get(
	"/api/v1/bookings/:bookingId/waitlist-queue",
	requireAuth,
	bookingController.getWaitlistQueueByBooking,
)
router.post(
	"/api/v1/booking-slots/legacy/:legacySlotId/release-expired",
	requireAuth,
	bookingController.releaseExpiredBookingSlotByLegacyId,
)
router.post(
	"/api/v1/booking-slots/:slotId/release-expired",
	requireAuth,
	bookingController.releaseExpiredBookingSlot,
)

router.get(
	"/api/v1/admin/bookings",
	requireAuth,
	requireAdmin("canManageBookings"),
	bookingController.listAdminBookings,
)
router.post(
	"/api/v1/admin/bookings/:bookingId/status",
	requireAuth,
	requireAdmin("canManageBookings"),
	bookingController.updateAdminBookingStatus,
)
router.post(
	"/api/v1/admin/bookings/:bookingId/release-slot",
	requireAuth,
	requireAdmin("canManageBookings"),
	bookingController.releaseAdminBookingSlot,
)
router.get(
	"/api/v1/admin/waitlist",
	requireAuth,
	requireAdmin("canManageBookings"),
	bookingController.listAdminWaitlist,
)
router.post(
	"/api/v1/admin/waitlist/:waitlistId/status",
	requireAuth,
	requireAdmin("canManageBookings"),
	bookingController.updateAdminWaitlistStatus,
)
router.post(
	"/api/v1/admin/waitlist/:waitlistId/move-to-confirmed",
	requireAuth,
	requireAdmin("canManageBookings"),
	bookingController.moveAdminWaitlistToConfirmed,
)

module.exports = router
