const {
	WAITLIST_SLOT_OCCUPIED_MESSAGE,
	WAITLIST_SLOT_OCCUPIED_REASON,
	buildWaitlistSlotOccupiedDetails,
} = require("../waitlist-action-messages")

describe("waitlist action messages", () => {
	it("explains occupied slots and returns structured details", () => {
		expect(WAITLIST_SLOT_OCCUPIED_MESSAGE).toContain(
			"preferred slot is still occupied",
		)
		expect(WAITLIST_SLOT_OCCUPIED_MESSAGE).toContain(
			"Cancel or release the existing booking first",
		)

		expect(
			buildWaitlistSlotOccupiedDetails({
				slotId: " 2099-01-20__fatima__1000AM ",
				currentBookingId: " confirmed-1 ",
				waitlistBookingId: " waitlisted-1 ",
			}),
		).toEqual({
			reason: WAITLIST_SLOT_OCCUPIED_REASON,
			slotId: "2099-01-20__fatima__1000AM",
			currentBookingId: "confirmed-1",
			waitlistBookingId: "waitlisted-1",
		})
	})

	it("normalizes missing waitlist slot detail values", () => {
		expect(buildWaitlistSlotOccupiedDetails()).toEqual({
			reason: WAITLIST_SLOT_OCCUPIED_REASON,
			slotId: "",
			currentBookingId: "",
			waitlistBookingId: "",
		})

		expect(
			buildWaitlistSlotOccupiedDetails({
				slotId: null,
				currentBookingId: 42,
				waitlistBookingId: undefined,
			}),
		).toMatchObject({
			reason: WAITLIST_SLOT_OCCUPIED_REASON,
			slotId: "",
			currentBookingId: "42",
			waitlistBookingId: "",
		})
	})
})
