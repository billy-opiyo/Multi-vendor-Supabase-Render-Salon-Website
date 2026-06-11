const WAITLIST_SLOT_OCCUPIED_REASON = "slot-occupied"
const WAITLIST_SLOT_OCCUPIED_MESSAGE =
	"Cannot move this waitlisted client to confirmed because the preferred slot is still occupied by another booking. Cancel or release the existing booking first, then try again."

function cleanWaitlistDetailValue(value = "") {
	return String(value || "").trim()
}

function buildWaitlistSlotOccupiedDetails({
	slotId = "",
	currentBookingId = "",
	waitlistBookingId = "",
} = {}) {
	return {
		reason: WAITLIST_SLOT_OCCUPIED_REASON,
		slotId: cleanWaitlistDetailValue(slotId),
		currentBookingId: cleanWaitlistDetailValue(currentBookingId),
		waitlistBookingId: cleanWaitlistDetailValue(waitlistBookingId),
	}
}

module.exports = {
	WAITLIST_SLOT_OCCUPIED_MESSAGE,
	WAITLIST_SLOT_OCCUPIED_REASON,
	buildWaitlistSlotOccupiedDetails,
}
