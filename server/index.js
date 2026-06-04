const crypto = require("crypto")
const cors = require("cors")
const express = require("express")
const { Resend } = require("resend")
const { config, isSupabaseConfigured } = require("./src/config")
const { getSupabaseAdmin } = require("./src/supabaseAdmin")
const { requireAdmin } = require("./src/middleware/auth")

const app = express()

app.use(
	cors({
		credentials: true,
		origin(origin, callback) {
			if (!origin || config.corsOrigins.length === 0) {
				return callback(null, true)
			}
			if (config.corsOrigins.includes(origin)) {
				return callback(null, true)
			}
			return callback(new Error(`CORS blocked origin: ${origin}`))
		},
	}),
)
app.use(express.json({ limit: "1mb" }))

function normalizeShortText(value = "", maxLen = 160) {
	return String(value || "")
		.trim()
		.slice(0, maxLen)
}

function normalizeEmail(value = "") {
	const email = normalizeShortText(value, 254).toLowerCase()
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ""
}

function requireConfiguredSupabase() {
	if (!isSupabaseConfigured()) {
		const error = new Error(
			"Supabase backend environment variables are missing",
		)
		error.statusCode = 503
		throw error
	}
}

async function maybeSendContactNotification(message) {
	if (
		!config.resend.apiKey ||
		!config.resend.fromEmail ||
		!config.resend.contactNotificationEmail
	) {
		return { skipped: true, reason: "resend-not-configured" }
	}

	const resend = new Resend(config.resend.apiKey)
	await resend.emails.send({
		from: config.resend.fromEmail,
		to: config.resend.contactNotificationEmail,
		subject: `New contact message from ${message.name}`,
		replyTo: message.email,
		text: [
			`Name: ${message.name}`,
			`Email: ${message.email}`,
			`Phone: ${message.phone || "Not provided"}`,
			"",
			message.message,
		].join("\n"),
	})

	return { skipped: false }
}

function buildCloudinarySignature(params, apiSecret) {
	const payload = Object.entries(params)
		.filter(
			([, value]) => value !== undefined && value !== null && value !== "",
		)
		.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
		.map(([key, value]) => `${key}=${value}`)
		.join("&")

	return crypto
		.createHash("sha1")
		.update(`${payload}${apiSecret}`)
		.digest("hex")
}

app.get("/health", (request, response) => {
	response.json({
		ok: true,
		service: "salon-shop-render-api",
		environment: config.nodeEnv,
		supabaseConfigured: isSupabaseConfigured(),
	})
})

app.get("/api/config", (request, response) => {
	response.json({
		supabaseUrl: config.supabase.url,
		supabaseAnonKeyConfigured: Boolean(config.supabase.anonKey),
		publicSiteUrl: config.publicSiteUrl,
	})
})

app.post("/api/contact/messages", async (request, response, next) => {
	try {
		requireConfiguredSupabase()
		const payload = request.body || {}
		const message = {
			name: normalizeShortText(payload.name, 120),
			email: normalizeEmail(payload.email),
			phone: normalizeShortText(payload.phone, 40),
			subject: normalizeShortText(payload.subject || "Website contact", 160),
			message: normalizeShortText(payload.message, 3000),
		}

		if (!message.name || !message.email || !message.message) {
			return response.status(400).json({
				error: "Name, valid email, and message are required",
			})
		}

		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from("contact_messages")
			.insert({
				name: message.name,
				email: message.email,
				phone: message.phone,
				subject: message.subject,
				message: message.message,
				status: "new",
				source: "website",
				metadata: {
					userAgent: request.get("user-agent") || "",
					ip: request.ip,
				},
			})
			.select("id, created_at")
			.single()

		if (error) throw error

		const emailResult = await maybeSendContactNotification(message)
		return response.status(201).json({ data, email: emailResult })
	} catch (error) {
		return next(error)
	}
})

app.get("/api/admin/me", requireAdmin, (request, response) => {
	response.json({ user: request.user, adminUser: request.adminUser })
})

app.get(
	"/api/admin/bookings",
	requireAdmin,
	async (request, response, next) => {
		try {
			const supabase = getSupabaseAdmin()
			const { data, error } = await supabase
				.from("bookings")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(100)

			if (error) throw error
			return response.json({ data })
		} catch (error) {
			return next(error)
		}
	},
)

app.post(
	"/api/cloudinary/signature",
	requireAdmin,
	(request, response, next) => {
		try {
			const { cloudName, apiKey, apiSecret, uploadFolder } = config.cloudinary
			if (!cloudName || !apiKey || !apiSecret) {
				return response.status(503).json({
					error: "Cloudinary environment variables are not configured",
				})
			}

			const timestamp = Math.round(Date.now() / 1000)
			const folder = normalizeShortText(
				request.body?.folder || uploadFolder,
				180,
			).replace(/^\/+|\/+$|\.\./g, "")
			const params = { folder, timestamp }
			const signature = buildCloudinarySignature(params, apiSecret)

			return response.json({
				cloudName,
				apiKey,
				folder,
				timestamp,
				signature,
			})
		} catch (error) {
			return next(error)
		}
	},
)

app.use((request, response) => {
	response.status(404).json({ error: "Route not found" })
})

app.use((error, request, response, next) => {
	const statusCode = error.statusCode || 500
	if (statusCode >= 500) {
		console.error(error)
	}
	response.status(statusCode).json({
		error:
			config.nodeEnv === "production" && statusCode >= 500
				? "Internal server error"
				: error.message,
	})
})

if (require.main === module) {
	app.listen(config.port, () => {
		console.log(`Salon Shop Render API listening on port ${config.port}`)
	})
}

module.exports = app
