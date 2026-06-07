const { env } = require("../config/env")
const { createBookingService } = require("../modules/bookings/booking.service")

async function releaseExpiredBookingSlots(options = {}) {
	return createBookingService().releaseExpiredBookingSlots({
		graceMinutes: env.EXPIRED_SLOT_GRACE_MINUTES,
		...options,
	})
}

module.exports = {
	releaseExpiredBookingSlots,
}
