const express = require("express")

const { requireAuth } = require("../../middleware/requireAuth")
const profileController = require("./profile.controller")

const router = express.Router()

router.post(
	"/api/v1/profiles/sync",
	requireAuth,
	profileController.syncOwnProfile,
)
router.get("/api/v1/profiles/me", requireAuth, profileController.getOwnProfile)
router.patch(
	"/api/v1/profiles/me",
	requireAuth,
	profileController.updateOwnProfile,
)

module.exports = router
