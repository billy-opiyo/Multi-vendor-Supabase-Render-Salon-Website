// Backend white-label configuration.
// Change this file for each deployed client so emails, WhatsApp messages,
// time calculations, and media folders use the client's business name.

module.exports = {
	businessName: "Royal Braids",
	teamName: "Royal Braids Team",
	// Contact-form notifications are sent server-side via Firebase Functions + Resend.
	// This replaces the old FormSubmit browser endpoint so Gmail does not require
	// repeated FormSubmit activation.
	contactNotificationEmail: "billyopiyo597@gmail.com",
	timezone: "Africa/Nairobi",
	utcOffsetHours: 3,
	cloudinaryFolder: "royal-braids/uploads",
}
