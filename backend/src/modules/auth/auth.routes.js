const express = require("express")

const { requireAuth } = require("../../middleware/requireAuth")
const authController = require("./auth.controller")

const router = express.Router()

router.get("/api/v1/auth/me", requireAuth, authController.getMe)

module.exports = router
