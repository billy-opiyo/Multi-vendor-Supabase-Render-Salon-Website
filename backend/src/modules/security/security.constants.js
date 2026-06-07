const LOGIN_METHODS = ["google", "email/password", "anonymous", "unknown"]
const LOGIN_STATUSES = ["success", "failure"]
const DEVICE_TYPES = ["mobile", "desktop", "tablet", "unknown"]
const RISK_LEVELS = ["low", "medium", "high"]

const ACCOUNT_CHANGE_TYPES = [
	"account_deleted",
	"account_deactivated",
	"password_changed",
	"email_changed",
	"phone_changed",
	"profile_updated",
]

const SECURITY_ALERT_TYPES = [
	"multiple_failed_login_attempts",
	"new_device_detected",
	"login_unusual_country",
	"rapid_repeated_logins",
	"account_deleted",
	"account_deactivated",
	"password_changed",
	"email_changed",
	"phone_changed",
	"profile_updated",
]

const SECURITY_ALERT_SEVERITY = Object.freeze({
	multiple_failed_login_attempts: "high",
	new_device_detected: "medium",
	login_unusual_country: "high",
	rapid_repeated_logins: "high",
	account_deleted: "high",
	account_deactivated: "high",
	password_changed: "medium",
	email_changed: "medium",
	phone_changed: "low",
	profile_updated: "low",
})

const SECURITY_ALERT_STATUSES = ["open", "acknowledged", "resolved", "dismissed"]

const ADMIN_SECURITY_ACTIONS = [
	"temporary_block",
	"force_logout",
	"force_password_reset",
	"clear_restrictions",
]

const ACCOUNT_CHANGE_LABELS = Object.freeze({
	account_deleted: "Account deleted",
	account_deactivated: "Account deactivated",
	password_changed: "Password changed",
	email_changed: "Email changed",
	phone_changed: "Phone changed",
	profile_updated: "Profile updated",
})

const LOGIN_RISK_THRESHOLDS = Object.freeze({
	failedWindowMs: 5 * 60 * 1000,
	lockWindowMs: 15 * 60 * 1000,
	repeatFailureThreshold: 3,
	lockThreshold: 5,
	rapidWindowMs: 2 * 60 * 1000,
	rapidAttemptThreshold: 4,
})

const DEFAULT_SECURITY_LIMIT = 50
const MAX_SECURITY_LIMIT = 200

function getAccountChangeLabel(changeType) {
	return ACCOUNT_CHANGE_LABELS[changeType] || String(changeType || "Security change")
}

module.exports = {
	ACCOUNT_CHANGE_LABELS,
	ACCOUNT_CHANGE_TYPES,
	ADMIN_SECURITY_ACTIONS,
	DEFAULT_SECURITY_LIMIT,
	DEVICE_TYPES,
	LOGIN_METHODS,
	LOGIN_RISK_THRESHOLDS,
	LOGIN_STATUSES,
	MAX_SECURITY_LIMIT,
	RISK_LEVELS,
	SECURITY_ALERT_SEVERITY,
	SECURITY_ALERT_STATUSES,
	SECURITY_ALERT_TYPES,
	getAccountChangeLabel,
}