const { z } = require("zod")

const flushOutboxSchema = z
	.object({
		limit: z.number().int().min(1).max(200).optional(),
		maxAttempts: z.number().int().min(1).max(20).optional(),
		baseRetrySeconds: z.number().int().min(1).max(3600).optional(),
	})
	.strict()

const upcomingReminderSchema = z
	.object({
		limit: z.number().int().min(1).max(200).optional(),
		windowMinutes: z
			.number()
			.int()
			.min(1)
			.max(7 * 24 * 60)
			.optional(),
	})
	.strict()

module.exports = {
	flushOutboxSchema,
	upcomingReminderSchema,
}
