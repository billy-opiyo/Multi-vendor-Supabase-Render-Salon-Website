require("dotenv").config()

function splitCsv(value = "") {
	return String(value || "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)
}

function getEnv(name, fallback = "") {
	return String(process.env[name] || fallback).trim()
}

const config = {
	nodeEnv: getEnv("NODE_ENV", "development"),
	port: Number(process.env.PORT || 5000),
	publicSiteUrl: getEnv("PUBLIC_SITE_URL", "http://localhost:5000"),
	corsOrigins: splitCsv(
		process.env.CORS_ORIGINS ||
			process.env.PUBLIC_SITE_URL ||
			"http://localhost:5000",
	),
	supabase: {
		url: getEnv("SUPABASE_URL"),
		anonKey: getEnv("SUPABASE_ANON_KEY"),
		serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
	},
	resend: {
		apiKey: getEnv("RESEND_API_KEY"),
		fromEmail: getEnv("RESEND_FROM_EMAIL"),
		contactNotificationEmail: getEnv("CONTACT_NOTIFICATION_EMAIL"),
	},
	cloudinary: {
		cloudName: getEnv("CLOUDINARY_CLOUD_NAME"),
		apiKey: getEnv("CLOUDINARY_API_KEY"),
		apiSecret: getEnv("CLOUDINARY_API_SECRET"),
		uploadFolder: getEnv("CLOUDINARY_UPLOAD_FOLDER", "royal-braids/gallery"),
	},
}

function isSupabaseConfigured() {
	return Boolean(
		config.supabase.url &&
		config.supabase.anonKey &&
		config.supabase.serviceRoleKey &&
		!config.supabase.serviceRoleKey.includes("YOUR_SUPABASE"),
	)
}

module.exports = {
	config,
	isSupabaseConfigured,
}
