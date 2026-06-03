const {
	onDocumentCreated,
	onDocumentDeleted,
	onDocumentUpdated,
} = require("firebase-functions/v2/firestore")
const { onCall, HttpsError } = require("firebase-functions/v2/https")
const { onSchedule } = require("firebase-functions/v2/scheduler")
const { defineSecret } = require("firebase-functions/params")
const logger = require("firebase-functions/logger")
const admin = require("firebase-admin")
const CLIENT_CONFIG = require("./client-config")
const {
	WAITLIST_SLOT_OCCUPIED_MESSAGE,
	buildWaitlistSlotOccupiedDetails,
} = require("./waitlist-action-messages")

const CLOUDINARY_CLOUD_NAME = defineSecret("CLOUDINARY_CLOUD_NAME")
const CLOUDINARY_API_KEY = defineSecret("CLOUDINARY_API_KEY")
const CLOUDINARY_API_SECRET = defineSecret("CLOUDINARY_API_SECRET")

admin.initializeApp()

const RESEND_API_KEY = defineSecret("RESEND_API_KEY")
const RESEND_FROM_EMAIL = defineSecret("RESEND_FROM_EMAIL")
const WHATSAPP_CLOUD_ACCESS_TOKEN = defineSecret("WHATSAPP_CLOUD_ACCESS_TOKEN")
const WHATSAPP_CLOUD_PHONE_NUMBER_ID = defineSecret(
	"WHATSAPP_CLOUD_PHONE_NUMBER_ID",
)
const WHATSAPP_CLOUD_API_VERSION = "v20.0"
const CLIENT_BUSINESS_NAME =
	String(CLIENT_CONFIG.businessName || "Royal Braids").trim() || "Royal Braids"
const CLIENT_TEAM_NAME =
	String(CLIENT_CONFIG.teamName || `${CLIENT_BUSINESS_NAME} Team`).trim() ||
	`${CLIENT_BUSINESS_NAME} Team`
const CLIENT_CONTACT_NOTIFICATION_EMAIL = normalizeEmailAddress(
	CLIENT_CONFIG.contactNotificationEmail || "",
)
const CLIENT_CLOUDINARY_FOLDER =
	String(CLIENT_CONFIG.cloudinaryFolder || "royal-braids/uploads").trim() ||
	"royal-braids/uploads"
const NAIROBI_TIMEZONE =
	String(CLIENT_CONFIG.timezone || "Africa/Nairobi").trim() || "Africa/Nairobi"
const NAIROBI_UTC_OFFSET_HOURS = Number.isFinite(
	Number(CLIENT_CONFIG.utcOffsetHours),
)
	? Number(CLIENT_CONFIG.utcOffsetHours)
	: 3
const REVIEW_RATE_LIMIT_COOLDOWN_MS = 2 * 60 * 1000
const CONTACT_RATE_LIMIT_COOLDOWN_MS = 60 * 1000
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000
const LOGIN_FAILED_WINDOW_MS = 5 * 60 * 1000
const LOGIN_LOCK_THRESHOLD = 5
const LOGIN_REPEAT_FAILURE_THRESHOLD = 3
const LOGIN_LOCK_DURATION_MS = 30 * 60 * 1000
const WHATSAPP_REMINDER_LEAD_TIME_HOURS = 2
const WHATSAPP_REMINDER_WINDOW_MINUTES = 15
const EXPIRED_BOOKING_RELEASE_GRACE_MS = 2 * 60 * 60 * 1000
const SECURITY_ALERT_SEVERITY = {
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
}

const ACCOUNT_CHANGE_LABELS = {
	password_changed: "Password changed",
	email_changed: "Email changed",
	phone_changed: "Phone changed",
	profile_updated: "Profile updated",
	account_deleted: "Account deleted",
	account_deactivated: "Account deactivated",
}

const ACCOUNT_CHANGE_TYPES = Object.keys(ACCOUNT_CHANGE_LABELS)
const ACTIVITY_TIMELINE_TYPES = {
	booking_created: "booking_created",
	booking_canceled: "booking_canceled",
	review_posted: "review_posted",
	review_edited: "review_edited",
	contact_submitted: "contact_submitted",
}
const ADMIN_ROLES = {
	superAdmin: "super_admin",
	admin: "admin",
}
const ADMIN_PERMISSION_KEYS = {
	canManageAdmins: "canManageAdmins",
	canManageBookings: "canManageBookings",
	canManageContent: "canManageContent",
	canManageSecurity: "canManageSecurity",
}
const DEFAULT_ADMIN_PERMISSIONS = {
	[ADMIN_PERMISSION_KEYS.canManageAdmins]: false,
	[ADMIN_PERMISSION_KEYS.canManageBookings]: true,
	[ADMIN_PERMISSION_KEYS.canManageContent]: true,
	[ADMIN_PERMISSION_KEYS.canManageSecurity]: false,
}
const ADMIN_USERS_COLLECTION = "adminUsers"
const ADMIN_AUDIT_LOG_COLLECTION = "adminAuditLogs"
const ADMIN_RESTRICTION_ACTIONS = new Set([
	"temporary_block",
	"force_logout",
	"force_password_reset",
	"clear_restrictions",
])
let ResendClient = null

function getResendClient() {
	if (!ResendClient) {
		const { Resend } = require("resend")
		ResendClient = Resend
	}
	return new ResendClient(RESEND_API_KEY.value())
}

function normalizeLoginMethod(method = "") {
	const raw = String(method || "")
		.trim()
		.toLowerCase()
	if (raw === "google") return "google"
	if (raw === "email/password" || raw === "email" || raw === "password") {
		return "email/password"
	}
	if (raw === "anonymous") return "anonymous"
	return "unknown"
}

function normalizeLoginStatus(status = "") {
	const raw = String(status || "")
		.trim()
		.toLowerCase()
	return raw === "failure" ? "failure" : "success"
}

function normalizeDeviceType(deviceType = "") {
	const raw = String(deviceType || "")
		.trim()
		.toLowerCase()
	if (["mobile", "desktop", "tablet"].includes(raw)) return raw
	return "unknown"
}

function normalizeShortText(value = "", maxLen = 80) {
	return String(value || "")
		.trim()
		.slice(0, maxLen)
}

function normalizeEmailAddress(value = "") {
	const email = String(value || "")
		.trim()
		.toLowerCase()
		.slice(0, 254)
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ""
}

function normalizeEmailSubjectLine(value = "", maxLen = 160) {
	return normalizeShortText(value || "", maxLen).replace(/[\r\n]+/g, " ")
}

function escapeHtml(value = "") {
	const replacements = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	}
	return String(value || "").replace(/[&<>"']/g, (char) => replacements[char])
}

function getCallerEmailFromRequest(request) {
	return String(request?.auth?.token?.email || "")
		.trim()
		.toLowerCase()
}

function normalizeAdminRole(role = "") {
	const value = String(role || "")
		.trim()
		.toLowerCase()
	if (value === ADMIN_ROLES.superAdmin) return ADMIN_ROLES.superAdmin
	if (value === ADMIN_ROLES.admin) return ADMIN_ROLES.admin
	return ""
}

function normalizeAdminPermissions(input = {}) {
	const source =
		typeof input === "object" && input && !Array.isArray(input) ? input : {}
	return {
		[ADMIN_PERMISSION_KEYS.canManageAdmins]:
			source[ADMIN_PERMISSION_KEYS.canManageAdmins] === true,
		[ADMIN_PERMISSION_KEYS.canManageBookings]:
			source[ADMIN_PERMISSION_KEYS.canManageBookings] !== false,
		[ADMIN_PERMISSION_KEYS.canManageContent]:
			source[ADMIN_PERMISSION_KEYS.canManageContent] !== false,
		[ADMIN_PERMISSION_KEYS.canManageSecurity]:
			source[ADMIN_PERMISSION_KEYS.canManageSecurity] === true,
	}
}

async function getCallerAdminAccessContext(request) {
	if (!request?.auth?.uid) {
		throw new HttpsError("unauthenticated", "Admin authentication required")
	}

	const uid = String(request.auth.uid || "").trim()
	const email = getCallerEmailFromRequest(request)
	const docRef = admin.firestore().collection(ADMIN_USERS_COLLECTION).doc(uid)
	const snapshot = await docRef.get()
	if (!snapshot.exists) {
		throw new HttpsError("permission-denied", "Admin access record not found")
	}

	const data = snapshot.data() || {}
	if (data.active !== true) {
		throw new HttpsError("permission-denied", "Admin account is inactive")
	}

	const role = normalizeAdminRole(data.role)
	if (!role) {
		throw new HttpsError(
			"permission-denied",
			"Invalid admin role configuration",
		)
	}

	const permissions = normalizeAdminPermissions(data.permissions)
	return {
		uid,
		email,
		role,
		permissions,
		isSuperAdmin: role === ADMIN_ROLES.superAdmin,
		hasPermission(permissionKey = "") {
			if (role === ADMIN_ROLES.superAdmin) return true
			return permissions[String(permissionKey || "")] === true
		},
	}
}

async function assertCanManageAdmins(request) {
	const context = await getCallerAdminAccessContext(request)
	if (context.isSuperAdmin !== true) {
		throw new HttpsError(
			"permission-denied",
			"Only super admins can manage admin users",
		)
	}
	return context
}

async function assertCanManageBookings(request) {
	const context = await getCallerAdminAccessContext(request)
	if (!context.hasPermission(ADMIN_PERMISSION_KEYS.canManageBookings)) {
		throw new HttpsError(
			"permission-denied",
			"Admin booking management permission required",
		)
	}
	return context
}

async function createAdminAuditLogEntry({
	action = "",
	actorUid = "",
	actorEmail = "",
	targetUid = "",
	targetEmail = "",
	before = null,
	after = null,
	metadata = {},
} = {}) {
	const safeAction = normalizeShortText(action || "admin_action", 100)
	const safeActorUid = String(actorUid || "").trim()
	const safeActorEmail = String(actorEmail || "")
		.trim()
		.toLowerCase()
	const safeTargetUid = String(targetUid || "").trim()
	const safeTargetEmail = String(targetEmail || "")
		.trim()
		.toLowerCase()
	const safeMetadata =
		typeof metadata === "object" && metadata && !Array.isArray(metadata)
			? metadata
			: {}

	await admin.firestore().collection(ADMIN_AUDIT_LOG_COLLECTION).add({
		action: safeAction,
		actorUid: safeActorUid,
		actorEmail: safeActorEmail,
		targetUid: safeTargetUid,
		targetEmail: safeTargetEmail,
		before,
		after,
		metadata: safeMetadata,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	})
}

function cloudinarySignParams(params = {}, apiSecret = "") {
	const serialized = Object.keys(params)
		.sort()
		.map((key) => `${key}=${params[key]}`)
		.join("&")
	return require("crypto")
		.createHash("sha1")
		.update(`${serialized}${apiSecret}`)
		.digest("hex")
}

function sanitizeAdminUserDocForResponse(uid = "", data = {}) {
	const safeUid = String(uid || "").trim()
	const source =
		typeof data === "object" && data && !Array.isArray(data) ? data : {}
	const role = normalizeAdminRole(source.role) || ADMIN_ROLES.admin
	const permissions = normalizeAdminPermissions(source.permissions)
	return {
		uid: safeUid,
		email: String(source.email || "")
			.trim()
			.toLowerCase(),
		displayName: normalizeShortText(source.displayName || "", 160),
		role,
		permissions,
		active: source.active === true,
		createdBy: String(source.createdBy || "")
			.trim()
			.toLowerCase(),
		updatedBy: String(source.updatedBy || "")
			.trim()
			.toLowerCase(),
		createdAt: source.createdAt || null,
		updatedAt: source.updatedAt || null,
	}
}

async function resolveUidFromUserIdentity({ uid = "", email = "" } = {}) {
	const cleanUid = String(uid || "").trim()
	if (cleanUid) return cleanUid

	const cleanEmail = String(email || "")
		.trim()
		.toLowerCase()
	if (!cleanEmail) {
		throw new HttpsError(
			"invalid-argument",
			"Provide a target admin uid or email",
		)
	}

	try {
		const userRecord = await admin.auth().getUserByEmail(cleanEmail)
		return String(userRecord.uid || "").trim()
	} catch (_error) {
		throw new HttpsError("not-found", "Target admin user account not found")
	}
}

function normalizeAdminCreatePayload(data = {}) {
	const source =
		typeof data === "object" && data && !Array.isArray(data) ? data : {}
	const email = String(source.email || "")
		.trim()
		.toLowerCase()
	const displayName = normalizeShortText(source.displayName || "", 160)
	const role = normalizeAdminRole(source.role) || ADMIN_ROLES.admin
	const permissions = normalizeAdminPermissions({
		...DEFAULT_ADMIN_PERMISSIONS,
		...(source.permissions || {}),
	})
	const active = source.active !== false

	if (!email || !email.includes("@")) {
		throw new HttpsError("invalid-argument", "Valid admin email is required")
	}

	if (role === ADMIN_ROLES.admin) {
		permissions[ADMIN_PERMISSION_KEYS.canManageAdmins] =
			source.permissions?.[ADMIN_PERMISSION_KEYS.canManageAdmins] === true
	}

	return {
		email,
		displayName,
		role,
		permissions,
		active,
	}
}

function normalizeAdminUpdatePayload(data = {}) {
	const source =
		typeof data === "object" && data && !Array.isArray(data) ? data : {}
	const patch = {}

	if (Object.prototype.hasOwnProperty.call(source, "displayName")) {
		patch.displayName = normalizeShortText(source.displayName || "", 160)
	}

	if (Object.prototype.hasOwnProperty.call(source, "role")) {
		const role = normalizeAdminRole(source.role)
		if (!role) {
			throw new HttpsError("invalid-argument", "Invalid admin role")
		}
		patch.role = role
	}

	if (Object.prototype.hasOwnProperty.call(source, "permissions")) {
		patch.permissions = normalizeAdminPermissions({
			...DEFAULT_ADMIN_PERMISSIONS,
			...(source.permissions || {}),
		})
	}

	if (Object.prototype.hasOwnProperty.call(source, "active")) {
		patch.active = source.active === true
	}

	if (!Object.keys(patch).length) {
		throw new HttpsError(
			"invalid-argument",
			"At least one admin field must be provided to update",
		)
	}

	return patch
}

async function createCloudinarySignedUpload({
	folder = CLIENT_CLOUDINARY_FOLDER,
	tags = "",
} = {}) {
	const cloudName = String(CLOUDINARY_CLOUD_NAME.value() || "").trim()
	const apiKey = String(CLOUDINARY_API_KEY.value() || "").trim()
	const apiSecret = String(CLOUDINARY_API_SECRET.value() || "").trim()

	if (!cloudName || !apiKey || !apiSecret) {
		throw new HttpsError(
			"failed-precondition",
			"Cloudinary secrets are not configured",
		)
	}

	const timestamp = Math.floor(Date.now() / 1000)
	const safeFolder = normalizeShortText(folder || CLIENT_CLOUDINARY_FOLDER, 200)
	const safeTags = normalizeShortText(tags || "", 200)

	const signingParams = {
		folder: safeFolder,
		timestamp,
	}
	if (safeTags) {
		signingParams.tags = safeTags
	}

	const signature = cloudinarySignParams(signingParams, apiSecret)

	return {
		cloudName,
		apiKey,
		timestamp,
		folder: safeFolder,
		tags: safeTags,
		signature,
		uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
	}
}

exports.createCloudinarySignedUpload = onCall(
	{
		region: "us-central1",
		secrets: [CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET],
	},
	async (request) => {
		if (!request.auth?.uid) {
			throw new HttpsError("unauthenticated", "Sign in required")
		}

		const data = request.data || {}
		const folder = normalizeShortText(
			data.folder || CLIENT_CLOUDINARY_FOLDER,
			200,
		)
		const tags = normalizeShortText(data.tags || "", 200)

		const upload = await createCloudinarySignedUpload({
			folder,
			tags,
		})

		return {
			ok: true,
			...upload,
		}
	},
)

async function assertAdminCaller(request) {
	const context = await getCallerAdminAccessContext(request)
	return context.email || context.uid
}

async function resolveTargetUserRecord({ uid = "", email = "" } = {}) {
	const cleanUid = String(uid || "").trim()
	const cleanEmail = String(email || "")
		.trim()
		.toLowerCase()

	if (cleanUid) {
		try {
			return await admin.auth().getUser(cleanUid)
		} catch (_error) {
			throw new HttpsError("not-found", "Target user account not found")
		}
	}

	if (cleanEmail) {
		try {
			return await admin.auth().getUserByEmail(cleanEmail)
		} catch (_error) {
			throw new HttpsError("not-found", "Target user account not found")
		}
	}

	throw new HttpsError(
		"invalid-argument",
		"Provide a valid target uid or email",
	)
}

function normalizeAccountChangeType(value = "") {
	const raw = String(value || "")
		.trim()
		.toLowerCase()
	if (ACCOUNT_CHANGE_TYPES.includes(raw)) return raw
	return ""
}

function getAccountChangeLabel(changeType = "") {
	return ACCOUNT_CHANGE_LABELS[changeType] || "Account updated"
}

function extractRequestIp(request) {
	const forwarded = request?.headers?.["x-forwarded-for"]
	if (typeof forwarded === "string" && forwarded.trim()) {
		return forwarded.split(",")[0].trim()
	}
	return String(request?.ip || "").trim()
}

function maskIpAddress(ipAddress = "") {
	const ip = String(ipAddress || "").trim()
	if (!ip) return "masked"

	if (ip.includes(".")) {
		const parts = ip.split(".")
		if (parts.length === 4) {
			return `${parts[0]}.${parts[1]}.xxx.xxx`
		}
	}

	if (ip.includes(":")) {
		const parts = ip.split(":")
		if (parts.length >= 2) {
			return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx`
		}
	}

	return "masked"
}

function extractApproxLocation(request) {
	const city = normalizeShortText(
		request?.headers?.["x-appengine-city"] || "",
		80,
	)
	const countryRaw = normalizeShortText(
		request?.headers?.["x-appengine-country"] || "",
		80,
	)
	const country = countryRaw && countryRaw !== "ZZ" ? countryRaw : "Unknown"
	const locationLabel = [city, country].filter(Boolean).join(", ") || "Unknown"

	return {
		city: city || "Unknown",
		country,
		locationLabel,
	}
}

function toMillis(value) {
	if (!value) return 0
	if (typeof value?.toMillis === "function") return value.toMillis()
	if (typeof value === "number" && Number.isFinite(value)) return value
	if (value?.seconds && Number.isFinite(value.seconds)) {
		return value.seconds * 1000
	}
	const parsed = Date.parse(String(value))
	return Number.isNaN(parsed) ? 0 : parsed
}

function normalizeRiskLevel(level = "") {
	const raw = String(level || "")
		.trim()
		.toLowerCase()
	if (raw === "high") return "high"
	if (raw === "medium") return "medium"
	return "low"
}

function buildLoginRiskAssessment({
	hasKnownDevice = true,
	hasKnownCity = true,
	hasKnownCountry = true,
	failedAttemptsIn5m = 0,
	failedAttemptsIn15m = 0,
	accountLockTriggered = false,
	isDifferentCountryQuickly = false,
} = {}) {
	const reasons = []
	let score = 0

	if (!hasKnownDevice) {
		score += 25
		reasons.push("new_browser")
	}

	if (!hasKnownCity) {
		score += 15
		reasons.push("new_city")
	}

	if (!hasKnownCountry || isDifferentCountryQuickly) {
		score += 40
		reasons.push("different_country")
	}

	if (failedAttemptsIn5m >= LOGIN_REPEAT_FAILURE_THRESHOLD) {
		score += 25
		reasons.push("many_failed_logins_short_window")
	}

	if (failedAttemptsIn15m >= LOGIN_LOCK_THRESHOLD) {
		score += 35
		reasons.push("many_failed_logins_lock_window")
	}

	if (accountLockTriggered) {
		score += 45
		reasons.push("account_locked")
	}

	const boundedScore = Math.max(0, Math.min(100, score))
	let level = "low"
	// Risk bands tuned to admin expectations:
	// - New browser should be at least MEDIUM
	// - Different country + repeated failed logins should become HIGH
	if (boundedScore >= 60) {
		level = "high"
	} else if (boundedScore >= 25) {
		level = "medium"
	}

	return {
		riskScore: boundedScore,
		riskLevel: normalizeRiskLevel(level),
		riskReasons: [...new Set(reasons)],
		trustScore: Math.max(0, 100 - boundedScore),
	}
}

function buildRateLimitDocId(uid = "") {
	const safeUid = String(uid || "").trim()
	if (!safeUid) return ""
	return safeUid
}

async function upsertRateLimit({ kind = "", uid = "", cooldownMs = 0 } = {}) {
	const safeKind = String(kind || "")
		.trim()
		.toLowerCase()
	const docId = buildRateLimitDocId(uid)
	if (!docId) return

	const cooldownUntil = admin.firestore.Timestamp.fromMillis(
		Date.now() + Math.max(0, Number(cooldownMs || 0)),
	)
	const payload = {
		uid: String(uid || "").trim(),
		lastSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	}

	if (safeKind === "review") {
		payload.reviewCooldownUntil = cooldownUntil
	} else if (safeKind === "contact") {
		payload.contactCooldownUntil = cooldownUntil
	} else {
		return
	}

	await admin
		.firestore()
		.collection("rateLimits")
		.doc(docId)
		.set(payload, { merge: true })
}

function buildCustomerName(booking = {}) {
	const fullName = `${booking.firstName || ""} ${booking.lastName || ""}`.trim()
	return fullName || "Customer"
}

function normalizePhoneForWhatsApp(input = "") {
	const raw = String(input || "").trim()
	if (!raw) return ""

	const plusPrefixed = raw.startsWith("+")
	const digits = raw.replace(/\D/g, "")
	if (!digits) return ""

	if (plusPrefixed) return `+${digits}`
	if (digits.startsWith("0") && digits.length === 10)
		return `+254${digits.slice(1)}`
	if (digits.startsWith("254")) return `+${digits}`
	if (digits.length >= 10) return `+${digits}`
	return ""
}

function parseTimeTo24Hour(timeText = "") {
	const match = String(timeText)
		.trim()
		.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
	if (!match) return null

	let hours = Number(match[1])
	const minutes = Number(match[2])
	const period = String(match[3] || "").toUpperCase()

	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
	if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null

	if (period === "PM" && hours !== 12) hours += 12
	if (period === "AM" && hours === 12) hours = 0

	return { hours, minutes }
}

function getBookingAppointmentDate(booking = {}) {
	const dateText = String(booking.date || "").trim()
	const timeText = String(booking.time || "").trim()
	const parsedTime = parseTimeTo24Hour(timeText)
	if (!dateText || !parsedTime) return null

	const dateParts = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!dateParts) return null

	const year = Number(dateParts[1])
	const month = Number(dateParts[2])
	const day = Number(dateParts[3])
	if (!year || !month || !day) return null

	const utcMs = Date.UTC(
		year,
		month - 1,
		day,
		parsedTime.hours - NAIROBI_UTC_OFFSET_HOURS,
		parsedTime.minutes,
		0,
		0,
	)

	return new Date(utcMs)
}

function getNairobiDateString(referenceMs = Date.now()) {
	const offsetMs = NAIROBI_UTC_OFFSET_HOURS * 60 * 60 * 1000
	return new Date(referenceMs + offsetMs).toISOString().slice(0, 10)
}

function isServerBookingSlotExpired(
	slotData = {},
	referenceMs = Date.now(),
	graceMs = EXPIRED_BOOKING_RELEASE_GRACE_MS,
) {
	const appointmentDate = getBookingAppointmentDate(slotData)
	const safeGraceMs = Math.max(0, Number(graceMs || 0))
	return Boolean(
		appointmentDate &&
		Number.isFinite(appointmentDate.getTime()) &&
		appointmentDate.getTime() + safeGraceMs <= referenceMs,
	)
}

function getAutoReleaseBookingStatus(status = "") {
	const normalizedStatus = normalizeServerBookingStatus(status)
	if (normalizedStatus === "pending") return "expired"
	if (normalizedStatus === "confirmed") return "no_show"
	return ""
}

async function releaseExpiredBookingSlotDocument(
	slotRef,
	{ nowMs = Date.now(), source = "manual" } = {},
) {
	if (!slotRef) return { released: false, reason: "missing-ref" }

	let result = { released: false, reason: "not-found" }
	const db = admin.firestore()
	const serverNow = admin.firestore.FieldValue.serverTimestamp()
	const releaseSource = normalizeShortText(source || "manual", 40)

	await db.runTransaction(async (transaction) => {
		const slotSnap = await transaction.get(slotRef)
		if (!slotSnap.exists) {
			result = { released: false, reason: "not-found" }
			return
		}

		const slotData = slotSnap.data() || {}
		if (slotData.taken !== true) {
			result = { released: false, reason: "already-open" }
			return
		}

		if (!isServerBookingSlotExpired(slotData, nowMs)) {
			result = { released: false, reason: "not-expired" }
			return
		}

		const releasedBookingId = String(slotData.bookingId || "").trim()
		let bookingStatus = ""
		let nextBookingStatus = ""
		let releaseReason = "expired"
		let bookingRef = null
		let bookingSnap = null

		if (releasedBookingId) {
			bookingRef = db.collection("bookings").doc(releasedBookingId)
			bookingSnap = await transaction.get(bookingRef)

			if (bookingSnap.exists) {
				const bookingData = bookingSnap.data() || {}
				bookingStatus = normalizeServerBookingStatus(bookingData.status)
				nextBookingStatus = getAutoReleaseBookingStatus(bookingStatus)

				if (bookingStatus === "completed") {
					releaseReason = "completed"
				} else if (bookingStatus === "cancelled") {
					releaseReason = "cancelled"
				} else if (bookingStatus === "expired" || bookingStatus === "no_show") {
					releaseReason = bookingStatus
				} else if (nextBookingStatus) {
					releaseReason = nextBookingStatus
				} else {
					result = {
						released: false,
						reason: "booking-status-not-autoreleasable",
						bookingId: releasedBookingId,
						bookingStatus,
					}
					return
				}
			} else {
				releaseReason = "expired_orphaned"
			}
		} else {
			releaseReason = "expired_orphaned"
		}

		transaction.set(
			slotRef,
			{
				taken: false,
				bookingId: "",
				uid: "",
				releasedAt: serverNow,
				releasedBookingId,
				releaseReason,
				releaseSource,
				bookingStatusBeforeRelease: bookingStatus,
				bookingAutoStatus: nextBookingStatus,
				updatedAt: serverNow,
			},
			{ merge: true },
		)

		if (bookingRef && bookingSnap?.exists) {
			const bookingPatch = {
				releasedSlotId: slotRef.id,
				slotReleasedAt: serverNow,
				slotReleaseReason: releaseReason,
				slotReleaseSource: releaseSource,
				updatedAt: serverNow,
			}

			if (nextBookingStatus) {
				bookingPatch.status = nextBookingStatus
				bookingPatch.previousStatusBeforeAutoRelease = bookingStatus
				bookingPatch.autoReleasedAt = serverNow

				if (nextBookingStatus === "expired") {
					bookingPatch.expiredAt = serverNow
				} else if (nextBookingStatus === "no_show") {
					bookingPatch.noShowAt = serverNow
				}
			}

			transaction.set(bookingRef, bookingPatch, { merge: true })
		}

		result = {
			released: true,
			reason: releaseReason,
			bookingId: releasedBookingId,
			bookingStatus,
			nextBookingStatus,
		}
	})

	return result
}

function formatBookingDateTimeForMessage(booking = {}) {
	const appointmentDate = getBookingAppointmentDate(booking)
	if (!appointmentDate) {
		return {
			dateLabel: booking.date || "N/A",
			timeLabel: booking.time || "N/A",
		}
	}

	return {
		dateLabel: appointmentDate.toLocaleDateString("en-KE", {
			year: "numeric",
			month: "long",
			day: "numeric",
			timeZone: NAIROBI_TIMEZONE,
		}),
		timeLabel: appointmentDate.toLocaleTimeString("en-KE", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
			timeZone: NAIROBI_TIMEZONE,
		}),
	}
}

function normalizeServerBookingStatus(status = "") {
	const raw = String(status || "pending")
		.trim()
		.toLowerCase()
	if (raw === "complete") return "completed"
	if (raw === "canceled") return "cancelled"
	if (raw === "booked") return "confirmed"
	if (raw === "waitlist" || raw === "waiting") return "waitlisted"
	if (raw === "no-show" || raw === "no show" || raw === "noshow") {
		return "no_show"
	}
	if (raw === "in progress" || raw === "in_progress" || raw === "in-progress") {
		return "confirmed"
	}
	if (
		[
			"pending",
			"confirmed",
			"completed",
			"cancelled",
			"waitlisted",
			"expired",
			"no_show",
		].includes(raw)
	) {
		return raw
	}
	return "pending"
}

function normalizeServerWaitlistStatus(status = "") {
	const raw = String(status || "waiting")
		.trim()
		.toLowerCase()
	if (raw === "waitlist" || raw === "waitlisted") return "waiting"
	if (raw === "canceled") return "cancelled"
	if (
		[
			"waiting",
			"notified",
			"contacted",
			"booked",
			"cancelled",
			"notification_failed",
		].includes(raw)
	) {
		return raw
	}
	return "waiting"
}

const CLIENT_BOOKING_ACTION_STATUSES = new Set(["pending", "confirmed"])
const KNOWN_STYLIST_KEYS = new Set([
	"any",
	"fatima",
	"zainab",
	"grace",
	"amina",
	"sarah",
])
const STYLIST_LABEL_BY_KEY = {
	any: "Any Available",
	fatima: "Fatima Hassan - Master Braider",
	zainab: "Zainab Mohamed - Senior Stylist",
	grace: "Grace Wanjiku - Natural Hair Expert",
	amina: "Amina Diallo - Braiding Specialist",
	sarah: "Sarah Omondi - Kids Specialist",
}

function normalizeServerStylistKey(value = "") {
	const raw = String(value || "")
		.trim()
		.toLowerCase()

	if (!raw || raw === "any" || raw === "any available") return "any"
	if (KNOWN_STYLIST_KEYS.has(raw)) return raw
	if (raw.includes("fatima")) return "fatima"
	if (raw.includes("zainab")) return "zainab"
	if (raw.includes("grace")) return "grace"
	if (raw.includes("amina")) return "amina"
	if (raw.includes("sarah")) return "sarah"
	return "any"
}

function getServerStylistDisplayName(value = "") {
	const key = normalizeServerStylistKey(value)
	return STYLIST_LABEL_BY_KEY[key] || STYLIST_LABEL_BY_KEY.any
}

function getServerSlotId(date = "", stylistKey = "any", time = "") {
	const safeDate = String(date || "").trim()
	const safeStylistKey = normalizeServerStylistKey(stylistKey)
	const normalizedTime = String(time || "")
		.trim()
		.replace(/\s+/g, "")
		.replace(/[:]/g, "")
	return `${safeDate}__${safeStylistKey}__${normalizedTime}`
}

function getCallableClientContext(request) {
	if (!request?.auth?.uid) {
		throw new HttpsError("unauthenticated", "Sign in required")
	}

	const uid = String(request.auth.uid || "").trim()
	if (!uid) {
		throw new HttpsError("unauthenticated", "Invalid auth session")
	}

	return {
		uid,
		email: getCallerEmailFromRequest(request),
	}
}

function assertClientOwnsBooking(booking = {}, caller = {}) {
	const bookingUid = String(booking.uid || "").trim()
	if (bookingUid && bookingUid === caller.uid) return

	const bookingEmail = String(booking.email || "")
		.trim()
		.toLowerCase()
	if (caller.email && bookingEmail && bookingEmail === caller.email) return

	throw new HttpsError(
		"permission-denied",
		"You can only manage your own booking",
	)
}

function assertClientBookingIsActionable(booking = {}) {
	const status = normalizeServerBookingStatus(booking.status)
	if (!CLIENT_BOOKING_ACTION_STATUSES.has(status)) {
		throw new HttpsError(
			"failed-precondition",
			"This booking can no longer be changed",
		)
	}
	return status
}

function normalizeClientBookingDate(value = "") {
	const safeDate = normalizeShortText(value || "", 20)
	if (!/^\d{4}-\d{2}-\d{2}$/.test(safeDate)) {
		throw new HttpsError("invalid-argument", "A valid date is required")
	}
	return safeDate
}

function normalizeClientBookingTime(value = "") {
	const safeTime = normalizeShortText(value || "", 20)
	if (!safeTime) {
		throw new HttpsError("invalid-argument", "A valid time is required")
	}
	return safeTime
}

function shouldReleaseSlotForBooking(
	slotData = {},
	bookingId = "",
	booking = {},
) {
	const slotBookingId = String(slotData.bookingId || "").trim()
	if (slotBookingId) return slotBookingId === bookingId

	// Legacy slots may not have bookingId. In that case, trust the slotId stored
	// on the verified owner booking unless the slot clearly belongs to another uid.
	const slotUid = String(slotData.uid || "").trim()
	const bookingUid = String(booking.uid || "").trim()
	return !slotUid || !bookingUid || slotUid === bookingUid
}

function isActiveWaitlistQueueStatus(status = "") {
	return ["waiting", "notified", "contacted", "notification_failed"].includes(
		normalizeServerWaitlistStatus(status),
	)
}

function formatOrdinalPosition(value = 0) {
	const n = Math.max(0, Number(value || 0))
	if (!n) return "N/A"
	const mod100 = n % 100
	if (mod100 >= 11 && mod100 <= 13) return `${n}th`
	switch (n % 10) {
		case 1:
			return `${n}st`
		case 2:
			return `${n}nd`
		case 3:
			return `${n}rd`
		default:
			return `${n}th`
	}
}

function getWaitlistQueueSlotId(entry = {}) {
	return String(entry.preferredSlotId || entry.slotId || "").trim()
}

async function getWaitlistQueueEntriesForSlot(
	slotId = "",
	db = admin.firestore(),
) {
	const safeSlotId = String(slotId || "").trim()
	if (!safeSlotId) return []

	const entriesById = new Map()
	const snapshots = await Promise.allSettled([
		db
			.collection("waitlist")
			.where("preferredSlotId", "==", safeSlotId)
			.limit(300)
			.get(),
		db
			.collection("waitlist")
			.where("slotId", "==", safeSlotId)
			.limit(300)
			.get(),
	])

	snapshots.forEach((result) => {
		if (result.status !== "fulfilled") return
		result.value.docs.forEach((doc) => {
			if (entriesById.has(doc.id)) return
			entriesById.set(doc.id, {
				id: doc.id,
				ref: doc.ref,
				data: doc.data() || {},
			})
		})
	})

	return [...entriesById.values()]
}

function sortWaitlistQueueEntriesByCreatedAt(a = {}, b = {}) {
	const createdDiff = toMillis(a.data?.createdAt) - toMillis(b.data?.createdAt)
	if (createdDiff !== 0) return createdDiff
	return String(a.id || "").localeCompare(String(b.id || ""))
}

async function calculateWaitlistQueueInfoForEntry({
	slotId = "",
	waitlistId = "",
	targetStatus = "waiting",
	db = admin.firestore(),
} = {}) {
	const safeSlotId = String(slotId || "").trim()
	const safeWaitlistId = String(waitlistId || "").trim()
	const normalizedTargetStatus = normalizeServerWaitlistStatus(targetStatus)

	if (!safeSlotId || !safeWaitlistId) {
		return {
			active: false,
			position: null,
			label: "",
			size: null,
			status: normalizedTargetStatus,
			slotId: safeSlotId,
			waitlistId: safeWaitlistId,
			source: "live-waitlist-calc",
		}
	}

	const waitlistEntries = await getWaitlistQueueEntriesForSlot(safeSlotId, db)
	const targetEntry = waitlistEntries.find(
		(entry) => entry.id === safeWaitlistId,
	)
	const targetEntryStatus = targetEntry
		? normalizeServerWaitlistStatus(targetEntry.data?.status)
		: normalizedTargetStatus
	const activeEntries = waitlistEntries
		.filter((entry) => isActiveWaitlistQueueStatus(entry.data?.status))
		.sort(sortWaitlistQueueEntriesByCreatedAt)
	const activeIndex = activeEntries.findIndex(
		(entry) => entry.id === safeWaitlistId,
	)
	const position = activeIndex >= 0 ? activeIndex + 1 : null

	return {
		active: Boolean(position),
		position,
		label: position ? formatOrdinalPosition(position) : "",
		size: activeEntries.length,
		status: targetEntryStatus,
		slotId: safeSlotId,
		waitlistId: safeWaitlistId,
		source: "live-waitlist-calc",
	}
}

async function commitFirestoreWritesInChunks(writes = []) {
	const db = admin.firestore()
	for (let index = 0; index < writes.length; index += 450) {
		const batch = db.batch()
		writes.slice(index, index + 450).forEach((write) => {
			batch.set(write.ref, write.payload, { merge: true })
		})
		await batch.commit()
	}
}

async function recalculateWaitlistQueuePositionsForSlot(slotId = "") {
	const safeSlotId = String(slotId || "").trim()
	if (!safeSlotId) return

	const db = admin.firestore()
	const waitlistEntries = await getWaitlistQueueEntriesForSlot(safeSlotId, db)

	const activeEntries = waitlistEntries
		.filter((entry) => isActiveWaitlistQueueStatus(entry.data.status))
		.sort(sortWaitlistQueueEntriesByCreatedAt)

	const positionByWaitlistId = new Map()
	activeEntries.forEach((entry, index) => {
		const position = index + 1
		positionByWaitlistId.set(entry.id, {
			position,
			label: formatOrdinalPosition(position),
			total: activeEntries.length,
		})
	})

	const writes = []
	waitlistEntries.forEach((entry) => {
		const position = positionByWaitlistId.get(entry.id)
		writes.push({
			ref: entry.ref,
			payload: {
				queuePosition: position?.position || null,
				queuePositionLabel: position?.label || "",
				queueSize: activeEntries.length,
				positionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
		})
	})

	try {
		const bookingsSnapshot = await db
			.collection("bookings")
			.where("preferredSlotId", "==", safeSlotId)
			.limit(300)
			.get()

		bookingsSnapshot.docs.forEach((doc) => {
			const booking = doc.data() || {}
			const waitlistId = String(booking.waitlistId || "").trim()
			const position = waitlistId ? positionByWaitlistId.get(waitlistId) : null
			if (
				normalizeServerBookingStatus(booking.status) !== "waitlisted" &&
				!position
			) {
				return
			}

			writes.push({
				ref: doc.ref,
				payload: {
					waitlistPosition: position?.position || null,
					waitlistPositionLabel: position?.label || "",
					waitlistQueueSize: activeEntries.length,
					waitlistPositionUpdatedAt:
						admin.firestore.FieldValue.serverTimestamp(),
				},
			})
		})
	} catch (error) {
		logger.warn("Could not mirror waitlist positions onto bookings", {
			slotId: safeSlotId,
			errorMessage: error?.message || "Unknown error",
		})
	}

	if (writes.length) {
		await commitFirestoreWritesInChunks(writes)
	}
}

async function sendWhatsAppMessage({ toPhoneNumber, messageBody }) {
	const accessToken = WHATSAPP_CLOUD_ACCESS_TOKEN.value()
	const phoneNumberId = WHATSAPP_CLOUD_PHONE_NUMBER_ID.value()
	const destination = String(toPhoneNumber || "").replace(/^\+/, "")

	if (typeof fetch !== "function") {
		throw new Error("Global fetch is not available in this Node runtime")
	}
	if (!destination) {
		throw new Error("WhatsApp destination phone number is missing")
	}

	const endpoint = `https://graph.facebook.com/${WHATSAPP_CLOUD_API_VERSION}/${phoneNumberId}/messages`

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: destination,
			type: "text",
			text: {
				preview_url: false,
				body: messageBody,
			},
		}),
	})

	const responseText = await response.text()
	if (!response.ok) {
		throw new Error(
			`WhatsApp Cloud API send failed (${response.status}): ${responseText.slice(0, 500)}`,
		)
	}

	try {
		return JSON.parse(responseText)
	} catch (_error) {
		return { raw: responseText }
	}
}

async function createSecurityAlert({
	type = "",
	uid = "",
	email = "",
	displayName = "",
	severity = "medium",
	message = "",
	metadata = {},
} = {}) {
	const alertType = String(type || "")
		.trim()
		.toLowerCase()
	if (!alertType) return

	const safeSeverity = ["low", "medium", "high"].includes(
		String(severity || "")
			.trim()
			.toLowerCase(),
	)
		? String(severity || "")
				.trim()
				.toLowerCase()
		: "medium"

	const safeUid = String(uid || "").trim()
	const safeEmail = String(email || "")
		.trim()
		.toLowerCase()
	const safeDisplayName = normalizeShortText(displayName || "", 120)
	const safeMessage = normalizeShortText(message || "", 220)

	await admin
		.firestore()
		.collection("securityAlerts")
		.add({
			type: alertType,
			severity: safeSeverity,
			status: "open",
			message: safeMessage,
			uid: safeUid,
			email: safeEmail,
			displayName: safeDisplayName,
			metadata:
				typeof metadata === "object" && metadata && !Array.isArray(metadata)
					? metadata
					: {},
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		})
}

function sanitizeTimelineType(type = "") {
	const normalized = String(type || "")
		.trim()
		.toLowerCase()
	return Object.values(ACTIVITY_TIMELINE_TYPES).includes(normalized)
		? normalized
		: "activity"
}

function buildTimelineSummary({
	type = "",
	actorName = "",
	context = {},
} = {}) {
	const safeName = String(actorName || "").trim() || "User"
	const safeContext =
		typeof context === "object" && context && !Array.isArray(context)
			? context
			: {}

	if (type === ACTIVITY_TIMELINE_TYPES.booking_created) {
		return `${safeName} booked ${safeContext.service || "a service"}`
	}

	if (type === ACTIVITY_TIMELINE_TYPES.booking_canceled) {
		return `${safeName} canceled ${safeContext.service || "a booking"}`
	}

	if (type === ACTIVITY_TIMELINE_TYPES.review_posted) {
		return `${safeName} posted a review`
	}

	if (type === ACTIVITY_TIMELINE_TYPES.review_edited) {
		return `${safeName} edited a review`
	}

	if (type === ACTIVITY_TIMELINE_TYPES.contact_submitted) {
		return `${safeName} submitted contact form`
	}

	return `${safeName} performed an account action`
}

async function createActivityTimelineEvent({
	type = "",
	uid = "",
	email = "",
	displayName = "",
	context = {},
	source = "",
} = {}) {
	const safeType = sanitizeTimelineType(type)
	const safeUid = String(uid || "").trim()
	const safeEmail = normalizeShortText(email || "", 160)
		.toLowerCase()
		.trim()
	const safeDisplayName = normalizeShortText(displayName || "", 120)
	const safeSource = normalizeShortText(source || "", 80)
	const safeContext =
		typeof context === "object" && context && !Array.isArray(context)
			? context
			: {}

	await admin
		.firestore()
		.collection("activityTimeline")
		.add({
			type: safeType,
			uid: safeUid,
			email: safeEmail,
			displayName: safeDisplayName,
			source: safeSource,
			summary: buildTimelineSummary({
				type: safeType,
				actorName: safeDisplayName || safeEmail || safeUid,
				context: safeContext,
			}),
			context: safeContext,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})
}

exports.logLoginActivity = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const data = request.data || {}
		const method = normalizeLoginMethod(data.method)
		const status = normalizeLoginStatus(data.status)
		const isFailure = status === "failure"
		const isAuthenticated = Boolean(request.auth?.uid)

		if (!isAuthenticated && !isFailure) {
			throw new HttpsError("unauthenticated", "Sign in required")
		}

		const uid = isAuthenticated ? String(request.auth.uid || "").trim() : ""
		if (isAuthenticated && !uid) {
			throw new HttpsError("unauthenticated", "Invalid auth session")
		}

		const deviceType = normalizeDeviceType(data.deviceType)
		const browser =
			normalizeShortText(data.browser || "Unknown", 80) || "Unknown"
		const locale = normalizeShortText(data.locale || "", 40)
		const timezone = normalizeShortText(data.timezone || "", 80)
		const source = normalizeShortText(data.source || "", 60)
		const failureCode = normalizeShortText(data.failureCode || "", 80)
		const attemptedEmail = normalizeShortText(data.attemptedEmail || "", 160)
			.toLowerCase()
			.trim()

		const authToken = request.auth?.token || {}
		const displayName = normalizeShortText(authToken.name || "", 120)
		const authEmail = normalizeShortText(authToken.email || "", 160)
		const email = (authEmail || (isFailure ? attemptedEmail : ""))
			.toLowerCase()
			.trim()

		const rawIp = extractRequestIp(request.rawRequest)
		const ipMasked = maskIpAddress(rawIp)
		const location = extractApproxLocation(request.rawRequest)
		const identityType = uid ? "uid" : email ? "email" : "masked_ip"
		const identityValue = uid || email || ipMasked

		let suspiciousFlags = []
		let failedAttemptsIn5m = 0
		let failedAttemptsIn15m = 0
		let accountLockTriggered = false
		let lockUntilMs = 0
		let hasKnownDeviceBrowser = true
		let hasKnownCity = true
		let hasKnownCountry = true
		let countryChangedQuickly = false
		try {
			let recentQuery = admin
				.firestore()
				.collection("loginActivities")
				.orderBy("createdAt", "desc")
				.limit(25)

			if (uid) {
				recentQuery = recentQuery.where("uid", "==", uid)
			} else if (email) {
				recentQuery = recentQuery.where("email", "==", email)
			} else {
				recentQuery = recentQuery.where("ipMasked", "==", ipMasked)
			}

			const recentSnapshot = await recentQuery.get()

			const recent = recentSnapshot.docs.map((doc) => doc.data() || {})
			const nowMs = Date.now()
			const repeatedAttemptsInShortWindow = recent.filter((entry) => {
				const age = nowMs - toMillis(entry.createdAt)
				return age >= 0 && age <= 2 * 60 * 1000
			}).length
			if (repeatedAttemptsInShortWindow >= 4) {
				suspiciousFlags.push("rapid_repeated_logins")
			}

			if (isFailure) {
				// Include this current failed attempt in counters so thresholds trigger
				// on the exact attempt users/admins expect (e.g. 3rd/5th failure).
				failedAttemptsIn5m =
					recent.filter((entry) => {
						if (String(entry.status || "") !== "failure") return false
						const age = nowMs - toMillis(entry.createdAt)
						return age >= 0 && age <= LOGIN_FAILED_WINDOW_MS
					}).length + 1

				failedAttemptsIn15m =
					recent.filter((entry) => {
						if (String(entry.status || "") !== "failure") return false
						const age = nowMs - toMillis(entry.createdAt)
						return age >= 0 && age <= LOGIN_LOCK_WINDOW_MS
					}).length + 1

				if (failedAttemptsIn5m >= LOGIN_REPEAT_FAILURE_THRESHOLD) {
					suspiciousFlags.push("repeated_failures")
				}

				if (failedAttemptsIn15m >= LOGIN_LOCK_THRESHOLD) {
					accountLockTriggered = true
					lockUntilMs = nowMs + LOGIN_LOCK_DURATION_MS
					suspiciousFlags.push("locked_account")
				}
			}

			if (status === "success") {
				const priorSuccess = recent.filter(
					(entry) => String(entry.status || "") === "success",
				)

				if (priorSuccess.length) {
					hasKnownDeviceBrowser = priorSuccess.some(
						(entry) =>
							String(entry.deviceType || "") === deviceType &&
							String(entry.browser || "") === browser,
					)
					if (!hasKnownDeviceBrowser) {
						suspiciousFlags.push("new_device_or_browser")
					}

					hasKnownCity = priorSuccess.some(
						(entry) =>
							String(entry.locationCity || "") === String(location.city || ""),
					)
					hasKnownCountry = priorSuccess.some(
						(entry) =>
							String(entry.locationCountry || "") ===
							String(location.country || ""),
					)

					const lastSuccess = priorSuccess[0]
					const lastCountry = String(lastSuccess.locationCountry || "")
					const lastSuccessAge = nowMs - toMillis(lastSuccess.createdAt)
					if (
						location.country !== "Unknown" &&
						lastCountry &&
						lastCountry !== "Unknown" &&
						lastCountry !== location.country &&
						lastSuccessAge >= 0 &&
						lastSuccessAge <= 24 * 60 * 60 * 1000
					) {
						countryChangedQuickly = true
						suspiciousFlags.push("country_changed_quickly")
					}
				}
			}
		} catch (analysisError) {
			logger.warn("Login activity risk analysis skipped", {
				uid,
				email,
				errorMessage: analysisError?.message || "Unknown error",
			})
		}

		suspiciousFlags = [...new Set(suspiciousFlags)]
		const suspicious = suspiciousFlags.length > 0
		const lockActive = Boolean(accountLockTriggered && lockUntilMs > Date.now())
		const riskAssessment = buildLoginRiskAssessment({
			hasKnownDevice: hasKnownDeviceBrowser,
			hasKnownCity,
			hasKnownCountry,
			failedAttemptsIn5m,
			failedAttemptsIn15m,
			accountLockTriggered,
			isDifferentCountryQuickly: countryChangedQuickly,
		})

		const activityRef = await admin
			.firestore()
			.collection("loginActivities")
			.add({
				uid,
				displayName,
				email,
				attemptedEmail,
				identityType,
				identityValue,
				method,
				status,
				deviceType,
				browser,
				locationCity: location.city,
				locationCountry: location.country,
				locationLabel: location.locationLabel,
				ipMasked,
				failureCode,
				failedAttemptsIn5m,
				failedAttemptsIn15m,
				accountLockTriggered,
				lockActive,
				lockUntil: lockUntilMs
					? admin.firestore.Timestamp.fromMillis(lockUntilMs)
					: null,
				riskScore: riskAssessment.riskScore,
				riskLevel: riskAssessment.riskLevel,
				riskReasons: riskAssessment.riskReasons,
				trustScore: riskAssessment.trustScore,
				suspicious,
				suspiciousFlags,
				source,
				locale,
				timezone,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			})

		const alertSpecs = []
		if (suspiciousFlags.includes("repeated_failures")) {
			alertSpecs.push({
				type: "multiple_failed_login_attempts",
				message: "Multiple failed login attempts detected",
			})
		}
		if (suspiciousFlags.includes("new_device_or_browser")) {
			alertSpecs.push({
				type: "new_device_detected",
				message: "Login from a new device or browser detected",
			})
		}
		if (suspiciousFlags.includes("country_changed_quickly")) {
			alertSpecs.push({
				type: "login_unusual_country",
				message: "Login from unusual country detected",
			})
		}
		if (suspiciousFlags.includes("rapid_repeated_logins")) {
			alertSpecs.push({
				type: "rapid_repeated_logins",
				message: "Rapid repeated login attempts detected",
			})
		}
		if (accountLockTriggered) {
			alertSpecs.push({
				type: "multiple_failed_login_attempts",
				message:
					"Account temporarily locked due to repeated failed login attempts",
			})
		}

		if (alertSpecs.length) {
			await Promise.allSettled(
				alertSpecs.map((spec) =>
					createSecurityAlert({
						type: spec.type,
						uid,
						email,
						displayName,
						severity: SECURITY_ALERT_SEVERITY[spec.type] || "medium",
						message: spec.message,
						metadata: {
							loginActivityId: activityRef.id,
							method,
							status,
							deviceType,
							browser,
							locationLabel: location.locationLabel,
							ipMasked,
							suspiciousFlags,
						},
					}),
				),
			)
		}

		return { ok: true }
	},
)

exports.logAccountSecurityChange = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		if (!request.auth?.uid) {
			throw new HttpsError("unauthenticated", "Sign in required")
		}

		const data = request.data || {}
		const changeType = normalizeAccountChangeType(data.changeType)
		if (!changeType) {
			throw new HttpsError("invalid-argument", "Invalid account change type")
		}

		const uid = String(request.auth.uid || "").trim()
		const authToken = request.auth.token || {}
		const email = normalizeShortText(authToken.email || "", 160)
			.toLowerCase()
			.trim()
		const displayName = normalizeShortText(authToken.name || "", 120)
		const details = normalizeShortText(data.details || "", 280)
		const source = normalizeShortText(data.source || "", 80)

		await admin
			.firestore()
			.collection("accountChangeHistory")
			.add({
				uid,
				email,
				displayName,
				changeType,
				changeLabel: getAccountChangeLabel(changeType),
				details,
				source,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			})

		const shouldAlert = [
			"password_changed",
			"email_changed",
			"account_deleted",
			"account_deactivated",
		].includes(changeType)

		if (shouldAlert) {
			await createSecurityAlert({
				type: changeType,
				uid,
				email,
				displayName,
				severity: SECURITY_ALERT_SEVERITY[changeType] || "medium",
				message: `${getAccountChangeLabel(changeType)} event recorded`,
				metadata: {
					source,
					details,
				},
			})
		}

		return { ok: true }
	},
)

exports.adminRestrictUserAccount = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const adminEmail = await assertAdminCaller(request)
		const data = request.data || {}
		const action = String(data.action || "")
			.trim()
			.toLowerCase()

		if (!ADMIN_RESTRICTION_ACTIONS.has(action)) {
			throw new HttpsError("invalid-argument", "Invalid restriction action")
		}

		const targetUser = await resolveTargetUserRecord({
			uid: data.uid,
			email: data.email,
		})

		const nowMs = Date.now()
		const nowTs = admin.firestore.Timestamp.fromMillis(nowMs)
		const targetUid = String(targetUser.uid || "").trim()
		const targetEmail = String(targetUser.email || "")
			.trim()
			.toLowerCase()

		const userRef = admin.firestore().collection("users").doc(targetUid)
		const userSnap = await userRef.get()
		const existingRestrictions =
			userSnap.exists &&
			typeof userSnap.data()?.securityRestrictions === "object" &&
			userSnap.data()?.securityRestrictions &&
			!Array.isArray(userSnap.data()?.securityRestrictions)
				? userSnap.data().securityRestrictions
				: {}

		const nextRestrictions = {
			...existingRestrictions,
			updatedAt: nowTs,
			updatedBy: adminEmail,
		}
		const nextClaims = { ...(targetUser.customClaims || {}) }

		let blockedUntilMs = 0
		let forceLogoutAtMs = 0
		let passwordResetRequired = false

		if (action === "temporary_block") {
			const blockMinutes = Math.max(
				5,
				Math.min(10080, Number(data.blockMinutes || 60)),
			)
			blockedUntilMs = nowMs + blockMinutes * 60 * 1000
			nextRestrictions.blockedUntilMs = blockedUntilMs
			nextRestrictions.blockReason =
				normalizeShortText(
					data.reason || "Temporary block applied by admin",
					200,
				) || "Temporary block applied by admin"
			nextClaims.accountBlockedUntilMs = blockedUntilMs
		}

		if (action === "force_logout") {
			forceLogoutAtMs = nowMs
			nextRestrictions.forceLogoutAtMs = forceLogoutAtMs
			nextClaims.forceLogoutAfterMs = forceLogoutAtMs
		}

		if (action === "force_password_reset") {
			passwordResetRequired = true
			nextRestrictions.passwordResetRequired = true
			nextRestrictions.passwordResetRequestedAtMs = nowMs
			nextClaims.passwordResetRequired = true
			nextClaims.passwordResetRequiredAtMs = nowMs
		}

		if (action === "clear_restrictions") {
			blockedUntilMs = 0
			forceLogoutAtMs = 0
			passwordResetRequired = false
			nextRestrictions.blockedUntilMs = 0
			nextRestrictions.blockReason = ""
			nextRestrictions.forceLogoutAtMs = 0
			nextRestrictions.passwordResetRequired = false
			nextRestrictions.passwordResetRequestedAtMs = 0
			nextRestrictions.clearedAt = nowTs
			nextRestrictions.clearedBy = adminEmail

			nextClaims.accountBlockedUntilMs = 0
			nextClaims.forceLogoutAfterMs = 0
			nextClaims.passwordResetRequired = false
			nextClaims.passwordResetRequiredAtMs = 0
		}

		await userRef.set(
			{
				email: targetEmail,
				securityRestrictions: nextRestrictions,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		)

		await admin.auth().setCustomUserClaims(targetUid, nextClaims)
		await admin.auth().revokeRefreshTokens(targetUid)

		await admin
			.firestore()
			.collection("adminSecurityActions")
			.add({
				action,
				targetUid,
				targetEmail,
				blockedUntilMs: blockedUntilMs || null,
				forceLogoutAtMs: forceLogoutAtMs || null,
				passwordResetRequired,
				performedBy: adminEmail,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			})

		return {
			ok: true,
			action,
			targetUid,
			targetEmail,
			blockedUntilMs,
			forceLogoutAtMs,
			passwordResetRequired,
		}
	},
)

exports.adminCreateAdminUser = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const actor = await assertCanManageAdmins(request)
		const payload = normalizeAdminCreatePayload(request.data || {})

		const targetAuthUser = await resolveTargetUserRecord({
			email: payload.email,
		})
		const targetUid = String(targetAuthUser.uid || "").trim()
		if (!targetUid) {
			throw new HttpsError("not-found", "Target user account not found")
		}

		const adminDocRef = admin
			.firestore()
			.collection(ADMIN_USERS_COLLECTION)
			.doc(targetUid)
		const existing = await adminDocRef.get()
		if (existing.exists) {
			throw new HttpsError(
				"already-exists",
				"This user already has an admin access record",
			)
		}

		const nowTs = admin.firestore.FieldValue.serverTimestamp()
		const docPayload = {
			email: payload.email,
			displayName: payload.displayName,
			role: payload.role,
			permissions: payload.permissions,
			active: payload.active,
			createdBy: actor.email,
			updatedBy: actor.email,
			createdAt: nowTs,
			updatedAt: nowTs,
		}

		await adminDocRef.set(docPayload)

		await createAdminAuditLogEntry({
			action: "admin_user_created",
			actorUid: actor.uid,
			actorEmail: actor.email,
			targetUid,
			targetEmail: payload.email,
			after: {
				role: payload.role,
				permissions: payload.permissions,
				active: payload.active,
			},
		})

		return {
			ok: true,
			admin: sanitizeAdminUserDocForResponse(targetUid, docPayload),
		}
	},
)

exports.adminUpdateAdminUser = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const actor = await assertCanManageAdmins(request)
		const data = request.data || {}
		const targetUid = await resolveUidFromUserIdentity({
			uid: data.uid,
			email: data.email,
		})
		if (!targetUid) {
			throw new HttpsError("invalid-argument", "Target admin uid is required")
		}

		if (targetUid === actor.uid) {
			throw new HttpsError(
				"failed-precondition",
				"Use a separate self-service flow to edit your own admin access",
			)
		}

		const patch = normalizeAdminUpdatePayload(data)
		const adminDocRef = admin
			.firestore()
			.collection(ADMIN_USERS_COLLECTION)
			.doc(targetUid)
		const beforeSnap = await adminDocRef.get()
		if (!beforeSnap.exists) {
			throw new HttpsError("not-found", "Admin access record not found")
		}

		const before = beforeSnap.data() || {}
		if (before.role === ADMIN_ROLES.superAdmin && actor.isSuperAdmin !== true) {
			throw new HttpsError(
				"permission-denied",
				"Only super admins can modify another super admin",
			)
		}

		if (patch.role === ADMIN_ROLES.superAdmin && actor.isSuperAdmin !== true) {
			throw new HttpsError(
				"permission-denied",
				"Only super admins can assign super admin role",
			)
		}

		if (
			before.role === ADMIN_ROLES.superAdmin &&
			patch.active === false &&
			actor.isSuperAdmin !== true
		) {
			throw new HttpsError(
				"permission-denied",
				"Only super admins can deactivate a super admin",
			)
		}

		const updatedPayload = {
			...patch,
			updatedBy: actor.email,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		}

		await adminDocRef.set(updatedPayload, { merge: true })
		const afterSnap = await adminDocRef.get()
		const after = afterSnap.data() || {}

		await createAdminAuditLogEntry({
			action: "admin_user_updated",
			actorUid: actor.uid,
			actorEmail: actor.email,
			targetUid,
			targetEmail: String(after.email || before.email || "")
				.trim()
				.toLowerCase(),
			before: sanitizeAdminUserDocForResponse(targetUid, before),
			after: sanitizeAdminUserDocForResponse(targetUid, after),
			metadata: {
				updatedFields: Object.keys(patch),
			},
		})

		return {
			ok: true,
			admin: sanitizeAdminUserDocForResponse(targetUid, after),
		}
	},
)

exports.adminListAdminUsers = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		await assertCanManageAdmins(request)

		const snapshot = await admin
			.firestore()
			.collection(ADMIN_USERS_COLLECTION)
			.limit(300)
			.get()

		const admins = snapshot.docs
			.map((doc) => sanitizeAdminUserDocForResponse(doc.id, doc.data() || {}))
			.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

		return {
			ok: true,
			admins,
		}
	},
)

exports.adminMoveWaitlistBookingToConfirmed = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const actor = await assertCanManageBookings(request)
		const data = request.data || {}
		const bookingId = String(data.bookingId || "").trim()
		const suppliedWaitlistId = String(data.waitlistId || "").trim()
		if (!bookingId) {
			throw new HttpsError("invalid-argument", "Booking ID is required")
		}

		const db = admin.firestore()
		const bookingRef = db.collection("bookings").doc(bookingId)
		let convertedSlotId = ""
		let waitlistId = suppliedWaitlistId
		let beforeBooking = null
		let afterBooking = null

		await db.runTransaction(async (transaction) => {
			const bookingSnap = await transaction.get(bookingRef)
			if (!bookingSnap.exists) {
				throw new HttpsError("not-found", "Waitlisted booking not found")
			}

			const booking = bookingSnap.data() || {}
			beforeBooking = booking
			const currentStatus = normalizeServerBookingStatus(booking.status)
			if (currentStatus !== "waitlisted") {
				throw new HttpsError(
					"failed-precondition",
					"Only waitlisted bookings can be moved to confirmed",
				)
			}

			const preferredSlotId = String(
				booking.preferredSlotId || booking.slotId || "",
			).trim()
			if (!preferredSlotId) {
				throw new HttpsError(
					"failed-precondition",
					"This waitlisted booking has no preferred slot to confirm",
				)
			}

			const date = String(booking.date || "").trim()
			const time = String(booking.time || "").trim()
			const stylistKey = String(booking.stylistKey || "any").trim() || "any"
			if (!date || !time) {
				throw new HttpsError(
					"failed-precondition",
					"This waitlisted booking is missing date or time details",
				)
			}

			waitlistId = waitlistId || String(booking.waitlistId || "").trim()
			const slotRef = db.collection("bookingSlots").doc(preferredSlotId)
			const slotSnap = await transaction.get(slotRef)
			if (slotSnap.exists) {
				const slotData = slotSnap.data() || {}
				const slotBookingId = String(slotData.bookingId || "").trim()
				if (
					slotData.taken === true &&
					slotBookingId &&
					slotBookingId !== bookingId
				) {
					throw new HttpsError(
						"already-exists",
						WAITLIST_SLOT_OCCUPIED_MESSAGE,
						buildWaitlistSlotOccupiedDetails({
							slotId: preferredSlotId,
							currentBookingId: slotBookingId,
							waitlistBookingId: bookingId,
						}),
					)
				}
			}

			const serverNow = admin.firestore.FieldValue.serverTimestamp()
			transaction.set(
				slotRef,
				{
					taken: true,
					date,
					time,
					stylistKey,
					bookingId,
					uid: String(booking.uid || "").trim(),
					createdAt: slotSnap.exists
						? slotSnap.data()?.createdAt || serverNow
						: serverNow,
					updatedAt: serverNow,
				},
				{ merge: true },
			)

			const bookingPatch = {
				status: "confirmed",
				bookingType: "confirmed",
				isWaitlisted: false,
				waitlistStatus: "booked",
				slotId: preferredSlotId,
				waitlistPosition: null,
				waitlistPositionLabel: "",
				waitlistQueueSize: null,
				waitlistConvertedAt: serverNow,
				waitlistConvertedBy: actor.email || actor.uid,
				updatedAt: serverNow,
			}

			transaction.set(bookingRef, bookingPatch, { merge: true })
			afterBooking = { ...booking, ...bookingPatch }

			if (waitlistId) {
				const waitlistRef = db.collection("waitlist").doc(waitlistId)
				transaction.set(
					waitlistRef,
					{
						status: "booked",
						bookedAt: serverNow,
						bookedBy: actor.email || actor.uid,
						convertedBookingId: bookingId,
						queuePosition: null,
						queuePositionLabel: "",
						updatedAt: serverNow,
					},
					{ merge: true },
				)
			}

			convertedSlotId = preferredSlotId
		})

		if (convertedSlotId) {
			await recalculateWaitlistQueuePositionsForSlot(convertedSlotId)
		}

		await createAdminAuditLogEntry({
			action: "waitlist_booking_moved_to_confirmed",
			actorUid: actor.uid,
			actorEmail: actor.email,
			targetUid: String(afterBooking?.uid || "").trim(),
			targetEmail: String(afterBooking?.email || "")
				.trim()
				.toLowerCase(),
			before: beforeBooking
				? {
						status: normalizeServerBookingStatus(beforeBooking.status),
						slotId: String(beforeBooking.slotId || "").trim(),
						preferredSlotId: String(beforeBooking.preferredSlotId || "").trim(),
						waitlistId: String(beforeBooking.waitlistId || "").trim(),
					}
				: null,
			after: {
				status: "confirmed",
				slotId: convertedSlotId,
				waitlistId,
			},
			metadata: { bookingId, waitlistId },
		})

		return {
			ok: true,
			bookingId,
			waitlistId,
			slotId: convertedSlotId,
			status: "confirmed",
		}
	},
)

function normalizeAdminTerminalBookingStatus(value = "") {
	const raw = String(value || "")
		.trim()
		.toLowerCase()
	if (raw === "cancel-release" || raw === "cancel") return "cancelled"
	const normalized = normalizeServerBookingStatus(raw)
	return ["completed", "cancelled"].includes(normalized) ? normalized : ""
}

function assertAdminReleaseBookingTransitionAllowed(currentStatus, targetStatus) {
	const current = normalizeServerBookingStatus(currentStatus)
	const target = normalizeAdminTerminalBookingStatus(targetStatus)

	if (!target) {
		throw new HttpsError("invalid-argument", "Invalid booking release action")
	}

	if (current === "waitlisted") {
		throw new HttpsError(
			"failed-precondition",
			"Move waitlisted bookings to confirmed first, or cancel them from the Waitlist tab so linked waitlist records stay synced",
		)
	}

	if (target === "completed" && !["confirmed", "completed"].includes(current)) {
		throw new HttpsError(
			"failed-precondition",
			"Only confirmed bookings can be completed and released",
		)
	}

	if (
		target === "cancelled" &&
		!["pending", "confirmed", "cancelled"].includes(current)
	) {
		throw new HttpsError(
			"failed-precondition",
			"Only pending or confirmed bookings can be cancelled and released",
		)
	}
}

exports.adminUpdateBookingStatusAndReleaseSlot = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const actor = await assertCanManageBookings(request)
		const data = request.data || {}
		const bookingId = String(data.bookingId || "").trim()
		const targetStatus = normalizeAdminTerminalBookingStatus(
			data.status || data.action,
		)

		if (!bookingId) {
			throw new HttpsError("invalid-argument", "Booking ID is required")
		}

		if (!targetStatus) {
			throw new HttpsError(
				"invalid-argument",
				"Use completed or cancelled for slot release actions",
			)
		}

		const db = admin.firestore()
		const bookingRef = db.collection("bookings").doc(bookingId)
		const actorLabel = actor.email || actor.uid
		let releasedSlotId = ""
		let beforeAudit = null
		let afterAudit = null

		await db.runTransaction(async (transaction) => {
			const bookingSnap = await transaction.get(bookingRef)
			if (!bookingSnap.exists) {
				throw new HttpsError("not-found", "Booking no longer exists")
			}

			const booking = bookingSnap.data() || {}
			const currentStatus = normalizeServerBookingStatus(booking.status)
			assertAdminReleaseBookingTransitionAllowed(currentStatus, targetStatus)

			const slotId = String(booking.slotId || "").trim()
			beforeAudit = {
				status: currentStatus,
				slotId,
				waitlistId: String(booking.waitlistId || "").trim(),
				uid: String(booking.uid || "").trim(),
				email: String(booking.email || "")
					.trim()
					.toLowerCase(),
			}

			if (slotId) {
				const slotRef = db.collection("bookingSlots").doc(slotId)
				const slotSnap = await transaction.get(slotRef)
				if (slotSnap.exists) {
					const slotData = slotSnap.data() || {}
					if (!shouldReleaseSlotForBooking(slotData, bookingId, booking)) {
						throw new HttpsError(
							"failed-precondition",
							"This slot is linked to another booking, so it was not released",
						)
					}

					const slotBookingId = String(slotData.bookingId || "").trim()
					if (slotData.taken === true || slotBookingId === bookingId) {
						transaction.delete(slotRef)
						releasedSlotId = slotId
					}
				}
			}

			const serverNow = admin.firestore.FieldValue.serverTimestamp()
			const bookingPatch = {
				status: targetStatus,
				updatedAt: serverNow,
				adminActionUpdatedBy: actorLabel,
			}

			if (targetStatus === "completed") {
				bookingPatch.completedAt = serverNow
				bookingPatch.completedBy = actorLabel
			} else {
				bookingPatch.cancelledAt = serverNow
				bookingPatch.cancelledBy = actorLabel
			}

			if (releasedSlotId) {
				bookingPatch.releasedSlotId = releasedSlotId
				bookingPatch.slotReleasedAt = serverNow
				bookingPatch.slotReleaseReason = targetStatus
				bookingPatch.slotReleaseSource = "admin_action"
				bookingPatch.slotReleasedBy = actorLabel
			}

			transaction.set(bookingRef, bookingPatch, { merge: true })

			afterAudit = {
				status: targetStatus,
				slotId,
				releasedSlotId,
				slotReleaseReason: releasedSlotId ? targetStatus : "none",
			}
		})

		await createAdminAuditLogEntry({
			action:
				targetStatus === "completed"
					? "booking_completed_and_slot_released"
					: "booking_cancelled_and_slot_released",
			actorUid: actor.uid,
			actorEmail: actor.email,
			targetUid: beforeAudit?.uid || "",
			targetEmail: beforeAudit?.email || "",
			before: beforeAudit,
			after: afterAudit,
			metadata: { bookingId, releasedSlotId },
		})

		return {
			ok: true,
			bookingId,
			status: targetStatus,
			releasedSlotId,
		}
	},
)

exports.clientGetWaitlistQueueInfo = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const caller = getCallableClientContext(request)
		const data = request.data || {}
		const bookingId = String(data.bookingId || "").trim()
		const suppliedWaitlistId = String(data.waitlistId || "").trim()
		if (!bookingId && !suppliedWaitlistId) {
			throw new HttpsError(
				"invalid-argument",
				"Booking ID or waitlist ID is required",
			)
		}

		const db = admin.firestore()
		let booking = null
		let waitlistEntry = null
		let waitlistId = suppliedWaitlistId
		let slotId = ""
		let waitlistStatus = "waiting"

		if (bookingId) {
			const bookingSnap = await db.collection("bookings").doc(bookingId).get()
			if (!bookingSnap.exists) {
				throw new HttpsError("not-found", "Booking no longer exists")
			}

			booking = bookingSnap.data() || {}
			assertClientOwnsBooking(booking, caller)

			const linkedWaitlistId = String(booking.waitlistId || "").trim()
			if (
				suppliedWaitlistId &&
				linkedWaitlistId &&
				suppliedWaitlistId !== linkedWaitlistId
			) {
				throw new HttpsError(
					"permission-denied",
					"This waitlist request is not linked to your booking",
				)
			}

			waitlistId = linkedWaitlistId || suppliedWaitlistId
			slotId = String(booking.preferredSlotId || booking.slotId || "").trim()
			waitlistStatus = normalizeServerWaitlistStatus(
				booking.waitlistStatus || "waiting",
			)
		}

		if (!waitlistId) {
			throw new HttpsError(
				"failed-precondition",
				"This booking is not linked to a waitlist request",
			)
		}

		const waitlistSnap = await db.collection("waitlist").doc(waitlistId).get()
		if (!waitlistSnap.exists) {
			if (!booking) {
				throw new HttpsError("not-found", "Waitlist request no longer exists")
			}
		} else {
			waitlistEntry = waitlistSnap.data() || {}

			const waitlistUid = String(waitlistEntry.uid || "").trim()
			const waitlistEmail = String(waitlistEntry.email || "")
				.trim()
				.toLowerCase()
			const linkedToOwnedBooking = Boolean(
				booking && String(booking.waitlistId || "").trim() === waitlistId,
			)
			if (
				!linkedToOwnedBooking &&
				waitlistUid !== caller.uid &&
				(!caller.email || waitlistEmail !== caller.email)
			) {
				throw new HttpsError(
					"permission-denied",
					"You can only view your own waitlist queue position",
				)
			}

			slotId = slotId || getWaitlistQueueSlotId(waitlistEntry)
			waitlistStatus = normalizeServerWaitlistStatus(
				waitlistEntry.status || waitlistStatus,
			)
		}

		if (!slotId && waitlistEntry) {
			const preferredDate = String(waitlistEntry.preferredDate || "").trim()
			const preferredTime = String(waitlistEntry.preferredTime || "").trim()
			const stylistKey = normalizeServerStylistKey(
				waitlistEntry.stylistKey || "any",
			)
			if (preferredDate && preferredTime) {
				slotId = getServerSlotId(preferredDate, stylistKey, preferredTime)
			}
		}

		const queueInfo = await calculateWaitlistQueueInfoForEntry({
			slotId,
			waitlistId,
			targetStatus: waitlistStatus,
			db,
		})

		return {
			ok: true,
			bookingId,
			...queueInfo,
		}
	},
)

exports.clientCancelBooking = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const caller = getCallableClientContext(request)
		const bookingId = String(request.data?.bookingId || "").trim()
		if (!bookingId) {
			throw new HttpsError("invalid-argument", "Booking ID is required")
		}

		const db = admin.firestore()
		const bookingRef = db.collection("bookings").doc(bookingId)
		let releasedSlotId = ""

		await db.runTransaction(async (transaction) => {
			const bookingSnap = await transaction.get(bookingRef)
			if (!bookingSnap.exists) {
				throw new HttpsError("not-found", "Booking no longer exists")
			}

			const booking = bookingSnap.data() || {}
			assertClientOwnsBooking(booking, caller)
			assertClientBookingIsActionable(booking)

			const slotId = String(booking.slotId || "").trim()
			if (slotId) {
				const slotRef = db.collection("bookingSlots").doc(slotId)
				const slotSnap = await transaction.get(slotRef)
				if (
					slotSnap.exists &&
					shouldReleaseSlotForBooking(slotSnap.data() || {}, bookingId, booking)
				) {
					transaction.delete(slotRef)
					releasedSlotId = slotId
				}
			}

			transaction.set(
				bookingRef,
				{
					status: "cancelled",
					uid: caller.uid,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
		})

		return {
			ok: true,
			bookingId,
			releasedSlotId,
			status: "cancelled",
		}
	},
)

exports.clientReleaseExpiredBookingSlot = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		getCallableClientContext(request)

		const slotId = String(request.data?.slotId || "").trim()
		if (!slotId) {
			throw new HttpsError("invalid-argument", "Slot ID is required")
		}

		const slotRef = admin.firestore().collection("bookingSlots").doc(slotId)
		const result = await releaseExpiredBookingSlotDocument(slotRef, {
			source: "client",
		})

		return {
			ok: true,
			slotId,
			...result,
		}
	},
)

exports.clientRescheduleBooking = onCall(
	{
		region: "us-central1",
	},
	async (request) => {
		const caller = getCallableClientContext(request)
		const data = request.data || {}
		const bookingId = String(data.bookingId || "").trim()
		if (!bookingId) {
			throw new HttpsError("invalid-argument", "Booking ID is required")
		}

		const nextDate = normalizeClientBookingDate(data.date)
		const nextTime = normalizeClientBookingTime(data.time)
		const nextStylistKey = normalizeServerStylistKey(data.stylistKey || "any")
		const nextSlotId = getServerSlotId(nextDate, nextStylistKey, nextTime)
		let previousSlotId = ""
		let nextStatus = "confirmed"

		const db = admin.firestore()
		const bookingRef = db.collection("bookings").doc(bookingId)
		const nextSlotRef = db.collection("bookingSlots").doc(nextSlotId)

		await db.runTransaction(async (transaction) => {
			const bookingSnap = await transaction.get(bookingRef)
			if (!bookingSnap.exists) {
				throw new HttpsError("not-found", "Booking no longer exists")
			}

			const booking = bookingSnap.data() || {}
			assertClientOwnsBooking(booking, caller)
			const currentStatus = assertClientBookingIsActionable(booking)
			nextStatus = currentStatus === "pending" ? "pending" : "confirmed"

			previousSlotId = String(booking.slotId || "").trim()
			if (nextSlotId === previousSlotId) {
				throw new HttpsError(
					"failed-precondition",
					"Please choose a different time from your current booking",
				)
			}

			const nextSlotSnap = await transaction.get(nextSlotRef)
			if (nextSlotSnap.exists && nextSlotSnap.data()?.taken === true) {
				const nextSlotBookingId = String(
					nextSlotSnap.data()?.bookingId || "",
				).trim()
				if (!nextSlotBookingId || nextSlotBookingId !== bookingId) {
					throw new HttpsError(
						"already-exists",
						"Selected slot is no longer available",
					)
				}
			}

			let previousSlotRef = null
			let previousSlotSnap = null
			if (previousSlotId) {
				previousSlotRef = db.collection("bookingSlots").doc(previousSlotId)
				previousSlotSnap = await transaction.get(previousSlotRef)
			}

			const serverNow = admin.firestore.FieldValue.serverTimestamp()
			transaction.set(
				nextSlotRef,
				{
					taken: true,
					date: nextDate,
					time: nextTime,
					stylistKey: nextStylistKey,
					bookingId,
					uid: caller.uid,
					createdAt: nextSlotSnap.exists
						? nextSlotSnap.data()?.createdAt || serverNow
						: serverNow,
					updatedAt: serverNow,
				},
				{ merge: true },
			)

			if (
				previousSlotRef &&
				previousSlotSnap?.exists &&
				shouldReleaseSlotForBooking(
					previousSlotSnap.data() || {},
					bookingId,
					booking,
				)
			) {
				transaction.delete(previousSlotRef)
			}

			transaction.set(
				bookingRef,
				{
					date: nextDate,
					time: nextTime,
					stylistKey: nextStylistKey,
					stylist:
						nextStylistKey === "any"
							? ""
							: getServerStylistDisplayName(nextStylistKey),
					slotId: nextSlotId,
					uid: caller.uid,
					status: nextStatus,
					updatedAt: serverNow,
				},
				{ merge: true },
			)
		})

		return {
			ok: true,
			bookingId,
			previousSlotId,
			slotId: nextSlotId,
			status: nextStatus,
		}
	},
)

exports.sendBookingConfirmationEmail = onDocumentCreated(
	{
		document: "bookings/{bookingId}",
		secrets: [RESEND_API_KEY, RESEND_FROM_EMAIL],
		region: "europe-west1",
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return

		const bookingId = event.params.bookingId
		const booking = snapshot.data()

		if (!booking?.email) {
			logger.warn("Booking missing email. Skipping send.", { bookingId })
			return
		}

		const resend = getResendClient()

		const customerName = buildCustomerName(booking)

		const textContent = [
			`Hi ${customerName},`,
			"",
			"Your booking has been confirmed.",
			`Booking ID: ${bookingId}`,
			`Service: ${booking.service || "N/A"}`,
			`Stylist: ${booking.stylist || "Any Available"}`,
			`Date: ${booking.date || "N/A"}`,
			`Time: ${booking.time || "N/A"}`,
			"",
			`Thank you for choosing ${CLIENT_BUSINESS_NAME}!`,
		].join("\n")

		const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <h2 style="margin-bottom: 8px;">Booking Confirmed ✅</h2>
          <p>Hi <strong>${customerName}</strong>,</p>
          <p>Your appointment at <strong>${CLIENT_BUSINESS_NAME}</strong> has been confirmed.</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 10px; font-weight: bold;">Booking ID:</td><td style="padding: 6px 10px;">${bookingId}</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: bold;">Service:</td><td style="padding: 6px 10px;">${booking.service || "N/A"}</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: bold;">Stylist:</td><td style="padding: 6px 10px;">${booking.stylist || "Any Available"}</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: bold;">Date:</td><td style="padding: 6px 10px;">${booking.date || "N/A"}</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: bold;">Time:</td><td style="padding: 6px 10px;">${booking.time || "N/A"}</td></tr>
          </table>
          <p>We look forward to seeing you.</p>
          <p>— ${CLIENT_TEAM_NAME}</p>
        </div>
      `

		const message = {
			to: booking.email,
			from: RESEND_FROM_EMAIL.value(),
			subject: `${CLIENT_BUSINESS_NAME} Booking Confirmation`,
			text: textContent,
			html: htmlContent,
		}

		try {
			await resend.emails.send(message)
			await snapshot.ref.set(
				{
					emailStatus: "sent",
					emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
			logger.info("Booking confirmation email sent", { bookingId })
		} catch (error) {
			logger.error("Failed to send booking confirmation email", {
				bookingId,
				errorMessage: error?.message || "Unknown error",
			})

			await snapshot.ref.set(
				{
					emailStatus: "failed",
					emailError: error?.message || "Unknown error",
					emailTriedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
		}
	},
)

exports.sendBookingConfirmationWhatsApp = onDocumentCreated(
	{
		document: "bookings/{bookingId}",
		secrets: [WHATSAPP_CLOUD_ACCESS_TOKEN, WHATSAPP_CLOUD_PHONE_NUMBER_ID],
		region: "europe-west1",
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return

		const bookingId = event.params.bookingId
		const booking = snapshot.data()
		const normalizedPhone = normalizePhoneForWhatsApp(booking?.phone)

		if (!normalizedPhone) {
			logger.warn(
				"Booking missing valid phone. Skipping WhatsApp confirmation.",
				{
					bookingId,
				},
			)
			await snapshot.ref.set(
				{
					whatsappStatus: "confirmation_skipped_no_phone",
					whatsappTriedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
			return
		}

		const customerName = buildCustomerName(booking)
		const { dateLabel, timeLabel } = formatBookingDateTimeForMessage(booking)
		const messageBody = [
			`Hi ${customerName}, your ${CLIENT_BUSINESS_NAME} booking is confirmed ✅`,
			`Booking ID: ${bookingId}`,
			`Service: ${booking?.service || "N/A"}`,
			`Stylist: ${booking?.stylist || "Any Available"}`,
			`Date: ${dateLabel}`,
			`Time: ${timeLabel}`,
			"See you soon!",
		].join("\n")

		try {
			await sendWhatsAppMessage({
				toPhoneNumber: normalizedPhone,
				messageBody,
			})

			await snapshot.ref.set(
				{
					whatsappStatus: "confirmation_sent",
					whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)

			logger.info("Booking confirmation WhatsApp sent", { bookingId })
		} catch (error) {
			logger.error("Failed to send booking confirmation WhatsApp", {
				bookingId,
				errorMessage: error?.message || "Unknown error",
			})

			await snapshot.ref.set(
				{
					whatsappStatus: "confirmation_failed",
					whatsappError: error?.message || "Unknown error",
					whatsappTriedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
		}
	},
)

exports.sendUpcomingBookingWhatsAppReminders = onSchedule(
	{
		schedule: "every 15 minutes",
		timeZone: NAIROBI_TIMEZONE,
		region: "us-central1",
		secrets: [WHATSAPP_CLOUD_ACCESS_TOKEN, WHATSAPP_CLOUD_PHONE_NUMBER_ID],
	},
	async () => {
		const nowMs = Date.now()
		const reminderLeadTimeMs =
			WHATSAPP_REMINDER_LEAD_TIME_HOURS * 60 * 60 * 1000
		const reminderWindowMs = WHATSAPP_REMINDER_WINDOW_MINUTES * 60 * 1000
		const minDiffMs = reminderLeadTimeMs - reminderWindowMs
		const maxDiffMs = reminderLeadTimeMs + reminderWindowMs

		const bookingsSnap = await admin
			.firestore()
			.collection("bookings")
			.where("status", "==", "confirmed")
			.where("reminderSentAt", "==", null)
			.limit(300)
			.get()

		if (bookingsSnap.empty) {
			logger.info("No candidate bookings for WhatsApp reminders")
			return
		}

		let sentCount = 0
		let failedCount = 0
		let skippedCount = 0

		for (const doc of bookingsSnap.docs) {
			const booking = doc.data()
			const appointmentDate = getBookingAppointmentDate(booking)
			if (!appointmentDate) {
				skippedCount += 1
				continue
			}

			const diffMs = appointmentDate.getTime() - nowMs
			if (diffMs < minDiffMs || diffMs > maxDiffMs) {
				continue
			}

			const normalizedPhone = normalizePhoneForWhatsApp(booking?.phone)
			if (!normalizedPhone) {
				skippedCount += 1
				await doc.ref.set(
					{
						whatsappStatus: "reminder_skipped_no_phone",
						reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
					},
					{ merge: true },
				)
				continue
			}

			const customerName = buildCustomerName(booking)
			const { dateLabel, timeLabel } = formatBookingDateTimeForMessage(booking)
			const messageBody = [
				`Hi ${customerName}, reminder from ${CLIENT_BUSINESS_NAME} ⏰`,
				"Your appointment is in about 2 hours.",
				`Service: ${booking?.service || "N/A"}`,
				`Stylist: ${booking?.stylist || "Any Available"}`,
				`Date: ${dateLabel}`,
				`Time: ${timeLabel}`,
				"Reply to this message if you need help rescheduling.",
			].join("\n")

			try {
				await sendWhatsAppMessage({
					toPhoneNumber: normalizedPhone,
					messageBody,
				})

				sentCount += 1
				await doc.ref.set(
					{
						whatsappStatus: "reminder_sent",
						reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
					},
					{ merge: true },
				)
			} catch (error) {
				failedCount += 1
				logger.error("Failed to send 2h WhatsApp reminder", {
					bookingId: doc.id,
					errorMessage: error?.message || "Unknown error",
				})

				await doc.ref.set(
					{
						whatsappStatus: "reminder_failed",
						whatsappError: error?.message || "Unknown error",
						reminderTriedAt: admin.firestore.FieldValue.serverTimestamp(),
					},
					{ merge: true },
				)
			}
		}

		logger.info("WhatsApp reminder run completed", {
			totalCandidates: bookingsSnap.size,
			sentCount,
			failedCount,
			skippedCount,
		})
	},
)

exports.releaseExpiredBookingSlots = onSchedule(
	{
		schedule: "every 15 minutes",
		timeZone: NAIROBI_TIMEZONE,
		region: "us-central1",
	},
	async () => {
		const nowMs = Date.now()
		const todayDate = getNairobiDateString(nowMs)
		let releasedCount = 0
		let skippedCount = 0
		let failedCount = 0

		const slotsSnap = await admin
			.firestore()
			.collection("bookingSlots")
			.where("taken", "==", true)
			.limit(500)
			.get()

		if (slotsSnap.empty) {
			logger.info("No booked slots found for expiry cleanup")
			return
		}

		for (const doc of slotsSnap.docs) {
			const slotData = doc.data() || {}
			const slotDate = String(slotData.date || "").trim()
			if (slotDate && slotDate > todayDate) {
				skippedCount += 1
				continue
			}

			if (!isServerBookingSlotExpired(slotData, nowMs)) {
				skippedCount += 1
				continue
			}

			try {
				const result = await releaseExpiredBookingSlotDocument(doc.ref, {
					nowMs,
					source: "schedule",
				})
				if (result.released) {
					releasedCount += 1
				} else {
					skippedCount += 1
				}
			} catch (error) {
				failedCount += 1
				logger.error("Failed releasing expired booking slot", {
					slotId: doc.id,
					errorMessage: error?.message || "Unknown error",
				})
			}
		}

		logger.info("Expired booking slot cleanup completed", {
			totalCandidates: slotsSnap.size,
			releasedCount,
			skippedCount,
			failedCount,
			todayDate,
			releaseGraceMinutes: Math.round(
				EXPIRED_BOOKING_RELEASE_GRACE_MS / (60 * 1000),
			),
		})
	},
)

exports.initializeBookingSystemFields = onDocumentCreated(
	{
		document: "bookings/{bookingId}",
		region: "europe-west1",
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return

		const data = snapshot.data() || {}
		const patch = {}
		if (typeof data.whatsappStatus !== "string")
			patch.whatsappStatus = "pending"
		if (!("reminderSentAt" in data)) patch.reminderSentAt = null

		if (!Object.keys(patch).length) return
		patch.updatedAt = admin.firestore.FieldValue.serverTimestamp()
		await snapshot.ref.set(patch, { merge: true })
	},
)

exports.updateReviewRateLimit = onDocumentCreated(
	{
		document: "reviews/{reviewId}",
		region: "europe-west1",
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return
		const review = snapshot.data() || {}
		if (!review.uid) return

		await createActivityTimelineEvent({
			type: ACTIVITY_TIMELINE_TYPES.review_posted,
			uid: String(review.uid || "").trim(),
			email: String(review.email || "").trim(),
			displayName: String(review.name || "").trim(),
			source: "reviews",
			context: {
				reviewId: String(event.params.reviewId || "").trim(),
				rating: Number(review.rating || 0) || 0,
				service: normalizeShortText(review.service || "", 80),
			},
		})

		await upsertRateLimit({
			kind: "review",
			uid: review.uid,
			cooldownMs: REVIEW_RATE_LIMIT_COOLDOWN_MS,
		})
	},
)

exports.trackReviewEdited = onDocumentUpdated(
	{
		document: "reviews/{reviewId}",
		region: "europe-west1",
	},
	async (event) => {
		const before = event.data?.before?.data() || {}
		const after = event.data?.after?.data() || {}
		if (!after.uid) return

		const beforeText = String(before.text || "").trim()
		const afterText = String(after.text || "").trim()
		const beforeRating = Number(before.rating || 0) || 0
		const afterRating = Number(after.rating || 0) || 0
		const beforeService = String(before.service || "").trim()
		const afterService = String(after.service || "").trim()

		const wasEdited =
			beforeText !== afterText ||
			beforeRating !== afterRating ||
			beforeService !== afterService

		if (!wasEdited) return

		await createActivityTimelineEvent({
			type: ACTIVITY_TIMELINE_TYPES.review_edited,
			uid: String(after.uid || "").trim(),
			email: String(after.email || "").trim(),
			displayName: String(after.name || "").trim(),
			source: "reviews",
			context: {
				reviewId: String(event.params.reviewId || "").trim(),
				rating: afterRating,
				service: normalizeShortText(after.service || "", 80),
				updatedBy: String(after.uid || "").trim(),
			},
		})
	},
)

exports.updateContactRateLimit = onDocumentCreated(
	{
		document: "contactMessages/{messageId}",
		region: "europe-west1",
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return
		const message = snapshot.data() || {}
		if (!message.uid) return

		await createActivityTimelineEvent({
			type: ACTIVITY_TIMELINE_TYPES.contact_submitted,
			uid: String(message.uid || "").trim(),
			email: String(message.email || "").trim(),
			displayName: String(message.name || "").trim(),
			source: "contact",
			context: {
				messageId: String(event.params.messageId || "").trim(),
				subject: normalizeShortText(message.subject || "", 120),
			},
		})

		await upsertRateLimit({
			kind: "contact",
			uid: message.uid,
			cooldownMs: CONTACT_RATE_LIMIT_COOLDOWN_MS,
		})
	},
)

exports.sendContactMessageNotificationEmail = onDocumentCreated(
	{
		document: "contactMessages/{messageId}",
		secrets: [RESEND_API_KEY, RESEND_FROM_EMAIL],
		region: "europe-west1",
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return

		const messageId = String(event.params.messageId || "").trim()
		const contact = snapshot.data() || {}
		const notificationEmail = CLIENT_CONTACT_NOTIFICATION_EMAIL
		const serverNow = admin.firestore.FieldValue.serverTimestamp()

		if (!notificationEmail) {
			logger.warn("Contact notification email is not configured", { messageId })
			await snapshot.ref.set(
				{
					contactEmailStatus: "skipped_no_recipient",
					contactEmailTriedAt: serverNow,
					contactEmailError:
						"functions/client-config.js contactNotificationEmail is missing or invalid",
				},
				{ merge: true },
			)
			return
		}

		const fromEmail = String(RESEND_FROM_EMAIL.value() || "").trim()
		if (!fromEmail) {
			throw new Error("RESEND_FROM_EMAIL secret is not configured")
		}

		const customerName = normalizeShortText(
			contact.name || "Website visitor",
			120,
		)
		const customerEmailRaw = normalizeShortText(contact.email || "", 160)
		const customerEmail = normalizeEmailAddress(customerEmailRaw)
		const subject =
			normalizeEmailSubjectLine(contact.subject || "", 160) ||
			"New contact message"
		const contactMessage = normalizeShortText(contact.message || "", 3000)
		const submittedAt = new Date().toLocaleString("en-KE", {
			timeZone: NAIROBI_TIMEZONE,
			dateStyle: "medium",
			timeStyle: "short",
		})

		const textContent = [
			`New contact-form message for ${CLIENT_BUSINESS_NAME}`,
			"",
			`Message ID: ${messageId || "N/A"}`,
			`Name: ${customerName || "N/A"}`,
			`Email: ${customerEmailRaw || "N/A"}`,
			`Subject: ${subject}`,
			`Submitted: ${submittedAt}`,
			"",
			"Message:",
			contactMessage || "N/A",
			"",
			"This email was sent by Firebase Functions + Resend from the website contact form.",
		].join("\n")

		const htmlContent = `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
				<h2 style="margin-bottom: 8px;">New Contact Message 📩</h2>
				<p>A visitor sent a message from the <strong>${escapeHtml(CLIENT_BUSINESS_NAME)}</strong> website.</p>
				<table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 680px;">
					<tr><td style="padding: 8px 10px; font-weight: bold; border: 1px solid #e5e7eb;">Message ID</td><td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(messageId || "N/A")}</td></tr>
					<tr><td style="padding: 8px 10px; font-weight: bold; border: 1px solid #e5e7eb;">Name</td><td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(customerName || "N/A")}</td></tr>
					<tr><td style="padding: 8px 10px; font-weight: bold; border: 1px solid #e5e7eb;">Email</td><td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(customerEmailRaw || "N/A")}</td></tr>
					<tr><td style="padding: 8px 10px; font-weight: bold; border: 1px solid #e5e7eb;">Subject</td><td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(subject)}</td></tr>
					<tr><td style="padding: 8px 10px; font-weight: bold; border: 1px solid #e5e7eb;">Submitted</td><td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(submittedAt)}</td></tr>
				</table>
				<div style="margin-top: 16px; padding: 14px 16px; border-left: 4px solid #C8963E; background: #f9fafb; white-space: pre-line;">${escapeHtml(contactMessage || "N/A")}</div>
				<p style="margin-top: 18px; color: #6b7280; font-size: 13px;">Sent by Firebase Functions + Resend. No FormSubmit activation is required.</p>
			</div>
		`

		const resend = getResendClient()
		const emailPayload = {
			to: notificationEmail,
			from: fromEmail,
			subject: `${CLIENT_BUSINESS_NAME} Contact Form: ${subject}`,
			text: textContent,
			html: htmlContent,
		}

		if (customerEmail) {
			emailPayload.replyTo = customerEmail
		}

		try {
			await resend.emails.send(emailPayload)
			await snapshot.ref.set(
				{
					contactEmailStatus: "sent",
					contactEmailRecipient: notificationEmail,
					contactEmailError: "",
					contactEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
					contactEmailTriedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
			logger.info("Contact notification email sent", {
				messageId,
				to: notificationEmail,
			})
		} catch (error) {
			const errorMessage = error?.message || "Unknown error"
			logger.error("Failed to send contact notification email", {
				messageId,
				to: notificationEmail,
				errorMessage,
			})

			await snapshot.ref.set(
				{
					contactEmailStatus: "failed",
					contactEmailRecipient: notificationEmail,
					contactEmailError: errorMessage,
					contactEmailTriedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			)
		}
	},
)

exports.trackBookingCreated = onDocumentCreated(
	{
		document: "bookings/{bookingId}",
		region: "europe-west1",
	},
	async (event) => {
		const booking = event.data?.data() || {}
		if (!booking.uid) return

		await createActivityTimelineEvent({
			type: ACTIVITY_TIMELINE_TYPES.booking_created,
			uid: String(booking.uid || "").trim(),
			email: String(booking.email || "").trim(),
			displayName: buildCustomerName(booking),
			source: "bookings",
			context: {
				bookingId: String(event.params.bookingId || "").trim(),
				service: normalizeShortText(booking.service || "", 80),
				stylist: normalizeShortText(booking.stylist || "", 80),
				date: normalizeShortText(booking.date || "", 20),
				time: normalizeShortText(booking.time || "", 20),
			},
		})
	},
)

exports.trackBookingCanceled = onDocumentUpdated(
	{
		document: "bookings/{bookingId}",
		region: "europe-west1",
	},
	async (event) => {
		const before = event.data?.before?.data() || {}
		const after = event.data?.after?.data() || {}
		if (!after.uid) return

		const prevStatus = String(before.status || "")
			.trim()
			.toLowerCase()
		const nextStatus = String(after.status || "")
			.trim()
			.toLowerCase()
		if (prevStatus === "cancelled" || nextStatus !== "cancelled") return

		await createActivityTimelineEvent({
			type: ACTIVITY_TIMELINE_TYPES.booking_canceled,
			uid: String(after.uid || "").trim(),
			email: String(after.email || "").trim(),
			displayName: buildCustomerName(after),
			source: "bookings",
			context: {
				bookingId: String(event.params.bookingId || "").trim(),
				service: normalizeShortText(after.service || "", 80),
				stylist: normalizeShortText(after.stylist || "", 80),
				date: normalizeShortText(after.date || "", 20),
				time: normalizeShortText(after.time || "", 20),
				fromStatus: prevStatus,
				toStatus: nextStatus,
			},
		})
	},
)

exports.syncWaitlistQueuePositions = onDocumentUpdated(
	{
		document: "waitlist/{waitlistId}",
		region: "europe-west1",
	},
	async (event) => {
		const before = event.data?.before?.data() || {}
		const after = event.data?.after?.data() || {}
		const beforeSlotId = getWaitlistQueueSlotId(before)
		const afterSlotId = getWaitlistQueueSlotId(after)
		const queueAffectingChange =
			beforeSlotId !== afterSlotId ||
			normalizeServerWaitlistStatus(before.status) !==
				normalizeServerWaitlistStatus(after.status) ||
			toMillis(before.createdAt) !== toMillis(after.createdAt)

		if (!queueAffectingChange) return

		const slotIds = new Set([beforeSlotId, afterSlotId].filter(Boolean))

		await Promise.allSettled(
			[...slotIds].map((slotId) =>
				recalculateWaitlistQueuePositionsForSlot(slotId),
			),
		)
	},
)

exports.initializeWaitlistQueuePosition = onDocumentCreated(
	{
		document: "waitlist/{waitlistId}",
		region: "europe-west1",
	},
	async (event) => {
		const data = event.data?.data() || {}
		const slotId = getWaitlistQueueSlotId(data)
		if (!slotId) return
		await recalculateWaitlistQueuePositionsForSlot(slotId)
	},
)

exports.notifyWaitlistOnSlotOpen = onDocumentDeleted(
	{
		document: "bookingSlots/{slotId}",
		region: "europe-west1",
		secrets: [
			RESEND_API_KEY,
			RESEND_FROM_EMAIL,
			WHATSAPP_CLOUD_ACCESS_TOKEN,
			WHATSAPP_CLOUD_PHONE_NUMBER_ID,
		],
	},
	async (event) => {
		const snapshot = event.data
		if (!snapshot) return

		const slotId = String(event.params.slotId || "").trim()
		if (!slotId) return

		const slotData = snapshot.data() || {}
		const db = admin.firestore()
		let waitlistDocs = []

		try {
			const indexed = await db
				.collection("waitlist")
				.where("preferredSlotId", "==", slotId)
				.where("status", "==", "waiting")
				.orderBy("createdAt", "asc")
				.limit(20)
				.get()
			waitlistDocs = indexed.docs
		} catch (queryError) {
			logger.warn("Waitlist indexed query failed. Using fallback query.", {
				slotId,
				errorMessage: queryError?.message || "Unknown error",
			})
			const fallback = await db
				.collection("waitlist")
				.where("preferredSlotId", "==", slotId)
				.where("status", "==", "waiting")
				.limit(50)
				.get()
			waitlistDocs = fallback.docs.sort(
				(a, b) => toMillis(a.data()?.createdAt) - toMillis(b.data()?.createdAt),
			)
		}

		if (!waitlistDocs.length) {
			logger.info("No waitlist entries for released slot", { slotId })
			return
		}

		const nextEntryDoc = waitlistDocs[0]
		const entry = nextEntryDoc.data() || {}
		const fullName =
			`${entry.firstName || ""} ${entry.lastName || ""}`.trim() || "Client"
		const dateLabel = String(slotData.date || entry.preferredDate || "N/A")
		const timeLabel = String(slotData.time || entry.preferredTime || "N/A")
		const stylistLabel = String(
			entry.stylist || slotData.stylistKey || "Any Available",
		)
		const serviceLabel = String(entry.service || "your selected service")

		const textBody = [
			`Hi ${fullName},`,
			"",
			"Good news — your waitlisted appointment slot is now available! 🎉",
			`Service: ${serviceLabel}`,
			`Date: ${dateLabel}`,
			`Time: ${timeLabel}`,
			`Stylist: ${stylistLabel}`,
			"",
			`Please return to ${CLIENT_BUSINESS_NAME} booking page to secure it.`,
		].join("\n")

		let emailSent = false
		let whatsappSent = false

		if (entry.email) {
			try {
				const resend = getResendClient()
				await resend.emails.send({
					to: entry.email,
					from: RESEND_FROM_EMAIL.value(),
					subject: `Slot Available: Your ${CLIENT_BUSINESS_NAME} Waitlist Alert`,
					text: textBody,
				})
				emailSent = true
			} catch (emailError) {
				logger.error("Failed sending waitlist email notification", {
					slotId,
					waitlistId: nextEntryDoc.id,
					errorMessage: emailError?.message || "Unknown error",
				})
			}
		}

		const normalizedPhone = normalizePhoneForWhatsApp(entry.phone)
		if (normalizedPhone) {
			try {
				await sendWhatsAppMessage({
					toPhoneNumber: normalizedPhone,
					messageBody: textBody,
				})
				whatsappSent = true
			} catch (whatsError) {
				logger.error("Failed sending waitlist WhatsApp notification", {
					slotId,
					waitlistId: nextEntryDoc.id,
					errorMessage: whatsError?.message || "Unknown error",
				})
			}
		}

		const anySent = emailSent || whatsappSent
		await nextEntryDoc.ref.set(
			{
				status: anySent ? "notified" : "notification_failed",
				notifiedAt: anySent
					? admin.firestore.FieldValue.serverTimestamp()
					: null,
				notificationChannel: anySent
					? emailSent && whatsappSent
						? "email_whatsapp"
						: emailSent
							? "email"
							: "whatsapp"
					: "none",
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		)

		logger.info("Processed waitlist notification for released slot", {
			slotId,
			waitlistId: nextEntryDoc.id,
			emailSent,
			whatsappSent,
		})
	},
)
