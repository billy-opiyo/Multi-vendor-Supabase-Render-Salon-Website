const { env } = require("../../config/env")

function createResendClient(options = {}) {
	const apiKey = options.apiKey ?? env.RESEND_API_KEY
	const defaultFromEmail = options.fromEmail ?? env.RESEND_FROM_EMAIL
	const dryRun = options.dryRun ?? env.NOTIFICATION_DRY_RUN
	const fetchImpl = options.fetchImpl || global.fetch

	return {
		async sendEmail({ to, from, subject, html, text }) {
			if (!to) {
				return { skipped: true, reason: "missing_recipient_email" }
			}

			if (dryRun) {
				return { skipped: true, reason: "notification_dry_run" }
			}

			if (!apiKey || !(from || defaultFromEmail)) {
				return { skipped: true, reason: "resend_not_configured" }
			}

			const response = await fetchImpl("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from: from || defaultFromEmail,
					to,
					subject,
					html,
					text,
				}),
			})

			const responseText = await response.text()
			let body
			try {
				body = responseText ? JSON.parse(responseText) : {}
			} catch (_error) {
				body = { raw: responseText }
			}

			if (!response.ok) {
				const message = body?.message || body?.error || response.statusText
				throw new Error(`Resend email failed: ${message}`)
			}

			return {
				provider: "resend",
				providerMessageId: body.id || body.message_id || null,
				response: body,
			}
		},
	}
}

module.exports = {
	createResendClient,
}
