const path = require("node:path")

const dotenv = require("dotenv")
const { z } = require("zod")

const backendEnvPath = path.resolve(__dirname, "..", "..", ".env")
const cwdEnvPath = path.resolve(process.cwd(), ".env")

for (const envPath of [...new Set([backendEnvPath, cwdEnvPath])]) {
	dotenv.config({ path: envPath })
}

const booleanFromEnv = z.preprocess((value) => {
	if (typeof value !== "string") {
		return value
	}

	const normalized = value.trim().toLowerCase()

	if (["1", "true", "yes", "on"].includes(normalized)) {
		return true
	}

	if (["0", "false", "no", "off"].includes(normalized)) {
		return false
	}

	return value
}, z.boolean())

const emptyStringToUndefined = (schema) =>
	z.preprocess((value) => {
		if (typeof value === "string" && value.trim() === "") {
			return undefined
		}

		return value
	}, schema.optional())

const optionalUrl = emptyStringToUndefined(z.string().url())

const optionalSecret = emptyStringToUndefined(z.string().min(1))

const optionalNonEmptyString = z.preprocess((value) => {
	if (typeof value === "string" && value.trim() === "") {
		return undefined
	}

	return value
}, z.string().min(1).optional())

const envSchema = z
	.object({
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		PORT: z.coerce.number().int().positive().default(4000),
		SUPABASE_URL: optionalUrl,
		SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
		SUPABASE_ANON_KEY: optionalSecret,
		FRONTEND_ORIGIN: z
			.string()
			.min(1)
			.default("http://localhost:3000,http://127.0.0.1:3000"),
		RESEND_API_KEY: optionalSecret,
		RESEND_FROM_EMAIL: optionalSecret,
		WHATSAPP_ACCESS_TOKEN: optionalSecret,
		WHATSAPP_PHONE_NUMBER_ID: optionalSecret,
		WHATSAPP_GRAPH_API_VERSION: optionalNonEmptyString.default("v21.0"),
		CLOUDINARY_CLOUD_NAME: optionalSecret,
		CLOUDINARY_API_KEY: optionalSecret,
		CLOUDINARY_API_SECRET: optionalSecret,
		CLOUDINARY_UPLOAD_FOLDER: optionalSecret,
		JOB_SECRET: optionalSecret,
		NOTIFICATION_DRY_RUN: booleanFromEnv.default(false),
		UPCOMING_REMINDER_WINDOW_MINUTES: z.coerce
			.number()
			.int()
			.positive()
			.default(1440),
		EXPIRED_SLOT_GRACE_MINUTES: z.coerce.number().int().positive().default(60),
	})
	.superRefine((value, ctx) => {
		if (value.NODE_ENV === "test") {
			return
		}

		if (!value.SUPABASE_URL) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["SUPABASE_URL"],
				message: "SUPABASE_URL is required outside test mode.",
			})
		}

		if (!value.SUPABASE_SERVICE_ROLE_KEY) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["SUPABASE_SERVICE_ROLE_KEY"],
				message: "SUPABASE_SERVICE_ROLE_KEY is required outside test mode.",
			})
		}
	})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
	const formattedErrors = parsedEnv.error.issues
		.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
		.join("; ")

	throw new Error(
		`Invalid backend environment configuration: ${formattedErrors}`,
	)
}

const env = parsedEnv.data

const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean)

module.exports = {
	env,
	allowedOrigins,
	isProduction: env.NODE_ENV === "production",
	isTest: env.NODE_ENV === "test",
	isSupabaseConfigured: Boolean(
		env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
	),
}
