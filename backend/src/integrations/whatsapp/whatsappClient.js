const { env } = require("../../config/env")

function normalizeWhatsappRecipient(phone) {
	return String(phone || "").replace(/[^0-9]/g, "")
}

function createWhatsappClient(options = {}) {
	const accessToken = options.accessToken ?? env.WHATSAPP_ACCESS_TOKEN
	const phoneNumberId = options.phoneNumberId ?? env.WHATSAPP_PHONE_NUMBER_ID
	const graphApiVersion =
		options.graphApiVersion ?? env.WHATSAPP_GRAPH_API_VERSION
	const dryRun = options.dryRun ?? env.NOTIFICATION_DRY_RUN
	const fetchImpl = options.fetchImpl || global.fetch

	return {
		async sendTextMessage({ to, text }) {
			const recipient = normalizeWhatsappRecipient(to)

			if (!recipient) {
				return { skipped: true, reason: "missing_recipient_phone" }
			}

			if (dryRun) {
				return { skipped: true, reason: "notification_dry_run" }
			}

			if (!accessToken || !phoneNumberId) {
				return { skipped: true, reason: "whatsapp_not_configured" }
			}

			const response = await fetchImpl(
				`https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						messaging_product: "whatsapp",
						to: recipient,
						type: "text",
						text: {
							preview_url: false,
							body: text,
						},
					}),
				},
			)

			const responseText = await response.text()
			let body
			try {
				body = responseText ? JSON.parse(responseText) : {}
			} catch (_error) {
				body = { raw: responseText }
			}

			if (!response.ok) {
				const message =
					body?.error?.message || body?.message || response.statusText
				throw new Error(`WhatsApp message failed: ${message}`)
			}

			return {
				provider: "whatsapp_cloud_api",
				providerMessageId: body.messages?.[0]?.id || null,
				response: body,
			}
		},
	}
}

module.exports = {
	createWhatsappClient,
	normalizeWhatsappRecipient,
}
