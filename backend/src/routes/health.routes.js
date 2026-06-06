const express = require("express")

const { env, isSupabaseConfigured } = require("../config/env")

const router = express.Router()

router.get("/health", (_req, res) => {
	res.status(200).json({
		ok: true,
		service: "salon-render-backend",
		environment: env.NODE_ENV,
		supabaseConfigured: isSupabaseConfigured,
		uptimeSeconds: Math.round(process.uptime()),
		timestamp: new Date().toISOString(),
	})
})

module.exports = router
