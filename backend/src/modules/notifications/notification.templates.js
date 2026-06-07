const { NOTIFICATION_TEMPLATE_KEYS } = require("./notification.constants")

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
}

function compact(value, fallback = "") {
	const text = String(value ?? "").trim()
	return text.length ? text : fallback
}

function getBooking(payload = {}) {
	return payload.booking || {}
}

function getWaitlistEntry(payload = {}) {
	return payload.waitlistEntry || payload.waitlist_entry || {}
}

function getSlot(payload = {}) {
	return payload.slot || {}
}

function getCustomerName(payload = {}) {
	const booking = getBooking(payload)
	const firstName = compact(booking.first_name)
	const lastName = compact(booking.last_name)
	const combined = [firstName, lastName].filter(Boolean).join(" ")

	return combined || compact(booking.customer_name, "there")
}

function getBusinessName(payload = {}) {
	return compact(payload.site?.business_name, "our salon")
}

function formatAppointment(payload = {}) {
	const booking = getBooking(payload)
	const waitlistEntry = getWaitlistEntry(payload)
	const slot = getSlot(payload)
	const date = compact(
		booking.appointment_date || waitlistEntry.preferred_date || slot.slot_date,
		"your selected date",
	)
	const time = compact(
		booking.appointment_time || waitlistEntry.preferred_time || slot.slot_time,
		"your selected time",
	)
	const service = compact(
		booking.service || waitlistEntry.service,
		"your selected service",
	)

	return `${service} on ${date} at ${time}`
}

function buildHtml({ greeting, lines }) {
	const body = [greeting, ...lines]
		.filter(Boolean)
		.map((line) => `<p>${escapeHtml(line)}</p>`)
		.join("\n")

	return `<!doctype html><html><body>${body}</body></html>`
}

function buildMessage(payload, intro, outro = "Thank you for choosing us.") {
	const name = getCustomerName(payload)
	const appointment = formatAppointment(payload)
	const businessName = getBusinessName(payload)
	const greeting = `Hi ${name},`
	const lines = [intro(appointment, businessName), outro]
	const text = [greeting, ...lines].join("\n\n")

	return {
		text,
		html: buildHtml({ greeting, lines }),
		whatsappText: text,
	}
}

const templateDefinitions = {
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_CREATED]: {
		subject: (payload) =>
			`Booking request received - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment, businessName) =>
					`We received your booking request for ${appointment}. ${businessName} will confirm it shortly.`,
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_CONFIRMED]: {
		subject: (payload) => `Booking confirmed - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment, businessName) =>
					`Your booking for ${appointment} is confirmed with ${businessName}.`,
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_CANCELLED]: {
		subject: (payload) => `Booking cancelled - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment) => `Your booking for ${appointment} has been cancelled.`,
				"If this was unexpected, please contact us and we will help.",
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_RESCHEDULED]: {
		subject: (payload) => `Booking rescheduled - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment) => `Your booking has been rescheduled to ${appointment}.`,
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_COMPLETED]: {
		subject: (payload) => `Thank you for visiting ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				() => "Your appointment is marked as completed.",
				"We hope you loved your service and look forward to seeing you again.",
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_EXPIRED]: {
		subject: (payload) => `Booking expired - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment) => `Your pending booking for ${appointment} has expired.`,
				"Please create a new booking if you still need this appointment.",
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.BOOKING_NO_SHOW]: {
		subject: (payload) => `Missed appointment - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment) =>
					`Your confirmed booking for ${appointment} was marked as missed.`,
				"Please contact us if this needs to be corrected.",
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.UPCOMING_BOOKING_REMINDER]: {
		subject: (payload) =>
			`Upcoming booking reminder - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment) =>
					`This is a reminder for your upcoming appointment: ${appointment}.`,
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.WAITLIST_JOINED]: {
		subject: (payload) =>
			`You are on the waitlist - ${getBusinessName(payload)}`,
		message: (payload) => {
			const waitlistEntry = getWaitlistEntry(payload)
			const position = waitlistEntry.queue_position
				? ` You are currently number ${waitlistEntry.queue_position} of ${waitlistEntry.queue_size || "the queue"}.`
				: ""

			return buildMessage(
				payload,
				(appointment) =>
					`The requested slot for ${appointment} is unavailable, so we added you to the waitlist.${position}`,
			)
		},
	},
	[NOTIFICATION_TEMPLATE_KEYS.WAITLIST_SLOT_OPEN]: {
		subject: (payload) =>
			`A waitlist slot opened - ${getBusinessName(payload)}`,
		message: (payload) =>
			buildMessage(
				payload,
				(appointment) =>
					`A slot matching your waitlist request for ${appointment} is now open. Please contact us or check your booking dashboard to confirm availability.`,
			),
	},
	[NOTIFICATION_TEMPLATE_KEYS.CONTACT_MESSAGE_RECEIVED]: {
		subject: (payload) => `New contact message - ${getBusinessName(payload)}`,
		message: (payload) => {
			const contact = payload.contactMessage || payload.contact_message || {}
			const name =
				[contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
				"Website visitor"
			const text = `New contact message from ${name}:\n\n${compact(contact.message, "No message body provided.")}`

			return {
				text,
				html: buildHtml({
					greeting: `New contact message from ${name}`,
					lines: [compact(contact.message, "No message body provided.")],
				}),
				whatsappText: text,
			}
		},
	},
}

function renderTemplate(templateKey, payload = {}) {
	const definition = templateDefinitions[templateKey]

	if (!definition) {
		const fallback = buildMessage(
			payload,
			() => `There is an update for ${formatAppointment(payload)}.`,
		)

		return {
			subject: `Notification from ${getBusinessName(payload)}`,
			...fallback,
		}
	}

	return {
		subject: definition.subject(payload),
		...definition.message(payload),
	}
}

module.exports = {
	renderTemplate,
}
