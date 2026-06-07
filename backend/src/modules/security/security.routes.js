const express = require("express")

const { rateLimit } = require("../../middleware/rateLimit")
const { requireAdmin } = require("../../middleware/requireAdmin")
const {
	optionalAuth,
	requireAuth,
	requireAuthAllowingPasswordReset,
} = require("../../middleware/requireAuth")
const securityController = require("./security.controller")

const router = express.Router()
const requireSecurityAdmin = [requireAuth, requireAdmin("canManageSecurity")]

router.post(
	"/api/v1/security/login-activity",
	optionalAuth,
	rateLimit({ action: "login", limit: 30, windowMs: 15 * 60 * 1000 }),
	securityController.recordLoginActivity,
)
router.post(
	"/api/v1/account/security-change",
	requireAuthAllowingPasswordReset,
	rateLimit({ action: "api", limit: 20, windowMs: 15 * 60 * 1000 }),
	securityController.recordAccountSecurityChange,
)

router.get(
	"/api/v1/admin/security/login-activities",
	...requireSecurityAdmin,
	securityController.listAdminLoginActivities,
)
router.get(
	"/api/v1/admin/security/alerts",
	...requireSecurityAdmin,
	securityController.listAdminSecurityAlerts,
)
router.patch(
	"/api/v1/admin/security/alerts/:alertId",
	...requireSecurityAdmin,
	securityController.updateAdminSecurityAlert,
)
router.get(
	"/api/v1/admin/security/account-change-history",
	...requireSecurityAdmin,
	securityController.listAdminAccountChangeHistory,
)
router.get(
	"/api/v1/admin/security/actions",
	...requireSecurityAdmin,
	securityController.listAdminSecurityActions,
)
router.post(
	"/api/v1/admin/security/users/:userId/restrict",
	...requireSecurityAdmin,
	rateLimit({ action: "api", limit: 10, windowMs: 15 * 60 * 1000 }),
	securityController.restrictAdminUserAccount,
)
router.get(
	"/api/v1/admin/security/dashboard",
	...requireSecurityAdmin,
	securityController.getAdminSecurityDashboard,
)

module.exports = router