process.env.NODE_ENV = "test"

const {
	NOTIFICATION_TEMPLATE_KEYS,
} = require("../src/modules/notifications/notification.constants")
const {
	renderTemplate,
} = require("../src/modules/notifications/notification.templates")

describe("notification templates", () => {
	it("renders booking confirmation content", () => {
		const rendered = renderTemplate(
			NOTIFICATION_TEMPLATE_KEYS.BOOKING_CONFIRMED,
			{
				site: { business_name: "Salon Test" },
				booking: {
					first_name: "Ada",
					last_name: "Lovelace",
					service: "Braids",
					appointment_date: "2026-07-01",
					appointment_time: "09:00",
				},
			},
		)

		expect(rendered.subject).toBe("Booking confirmed - Salon Test")
		expect(rendered.text).toContain("Hi Ada Lovelace")
		expect(rendered.text).toContain("Braids on 2026-07-01 at 09:00")
		expect(rendered.html).toContain("<!doctype html>")
	})

	it("escapes HTML in rendered message bodies", () => {
		const rendered = renderTemplate(
			NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED,
			{
				booking: {
					first_name: "<Ada>",
					service: "Braids & Color",
					appointment_date: "2026-07-01",
					appointment_time: "09:00",
				},
			},
		)

		expect(rendered.html).toContain("&lt;Ada&gt;")
		expect(rendered.html).toContain("Braids &amp; Color")
	})
})
