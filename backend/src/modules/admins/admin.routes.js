const express = require("express")

const { requireAdmin } = require("../../middleware/requireAdmin")
const { requireAuth } = require("../../middleware/requireAuth")
const adminController = require("./admin.controller")

const router = express.Router()

router.get(
	"/api/v1/admin/users/me",
	requireAuth,
	requireAdmin(),
	adminController.getCurrentAdmin,
)
router.get(
	"/api/v1/admin/users",
	requireAuth,
	requireAdmin("canManageAdmins"),
	adminController.listAdminUsers,
)
router.post(
	"/api/v1/admin/users",
	requireAuth,
	requireAdmin("canManageAdmins"),
	adminController.createAdminUser,
)
router.patch(
	"/api/v1/admin/users/:adminUserId",
	requireAuth,
	requireAdmin("canManageAdmins"),
	adminController.updateAdminUser,
)

module.exports = router
