process.env.NODE_ENV = "test"

const {
	createResendClient,
} = require("../src/integrations/resend/resendClient")
const {
	createWhatsappClient,
	normalizeWhatsappRecipient,
} = require("../src/integrations/whatsapp/whatsappClient")

describe("notification providers", () => {
	it("skips Resend sends in dry-run mode", async () => {
		const fetchImpl = vi.fn()
		const client = createResendClient({ dryRun: true, fetchImpl })

		const result = await client.sendEmail({
			to: "customer@example.com",
			subject: "Test",
			text: "Hello",
		})

		expect(result).toMatchObject({
			skipped: true,
			reason: "notification_dry_run",
		})
		expect(fetchImpl).not.toHaveBeenCalled()
	})

	it("normalizes WhatsApp recipients and skips dry-run sends", async () => {
		const fetchImpl = vi.fn()
		const client = createWhatsappClient({ dryRun: true, fetchImpl })

		expect(normalizeWhatsappRecipient("+254 700-000-000")).toBe("254700000000")

		const result = await client.sendTextMessage({
			to: "+254 700-000-000",
			text: "Hello",
		})

		expect(result).toMatchObject({
			skipped: true,
			reason: "notification_dry_run",
		})
		expect(fetchImpl).not.toHaveBeenCalled()
	})
})
