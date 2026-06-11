const appConfig = window.APP_CONFIG || {}
const clientCloudinaryFolder =
	String(appConfig.cloudinaryFolder || "royal-braids/gallery").trim() ||
	"royal-braids/gallery"

let appServicesReady = false
let db = null
let auth = null
let adminCallableService = null
let adminUnlocked = false
let adminBookingsUnsubscribe = null
let adminGalleryUnsubscribe = null
let adminBlogsUnsubscribe = null
let adminReviewsUnsubscribe = null
let adminContactUnsubscribe = null
let adminWaitlistUnsubscribe = null
let adminSecurityUnsubscribe = null
let adminSecurityAlertsUnsubscribe = null
let adminAccountHistoryUnsubscribe = null
let adminSessionsUnsubscribe = null
let adminTimelineUnsubscribe = null
let adminUsersUnsubscribe = null
let adminServiceSettingsUnsubscribe = null
let adminGalleryDocs = []
let adminBlogDocs = []
let adminReviewDocs = []
let adminReviewRawDocs = []
let adminContactDocs = []
let adminWaitlistDocs = []
let adminBookingDocs = []
let adminBookingStatusFilter = "all"
let adminReviewStatusFilter = "all"
let adminContactStatusFilter = "all"
let adminReviewsSortMode = "featured"
let adminMessagesSortMode = "newest"
let adminWaitlistSortMode = "newest"
let adminSecuritySortMode = "newest"
let adminSecurityRiskFilter = "all"
let adminSecurityDateFilter = ""
let adminSecurityDateFromFilter = ""
let adminSecurityDateToFilter = ""
let adminSecurityDeviceFilter = "all"
let adminSecurityProviderFilter = "all"
let adminSecurityUserFilter = "all"
let adminSecurityCountryFilter = ""
let adminSecurityStatusFilter = "all"
let adminSecuritySearchTerm = ""
let adminSessionsSortMode = "online-first"
let adminSecurityAlertsSortMode = "newest"
let adminAccountHistorySortMode = "newest"
let adminTimelineSortMode = "newest"
let adminSecurityDocs = []
let adminSessionsDocs = []
let adminSecurityAlertsDocs = []
let adminAccountHistoryDocs = []
let adminTimelineDocs = []
let adminSecurityRawDocs = []
let adminUserDocs = []
let adminManagedUsersDocs = []
let adminAdminsSearchTerm = ""
let adminAdminsRoleFilter = "all"
let adminAdminsStatusFilter = "all"
let adminSecurityVisibleRows = []
let adminGalleryPreviewObjectUrl = ""
let activeAdminGalleryServiceCategory = "braids-services"
const ADMIN_SCHEDULE_VIEWS = {
	day: "day",
	week: "week",
}
let adminScheduleView = ADMIN_SCHEDULE_VIEWS.week
let adminScheduleSelectedBookingId = ""
let adminScheduleVisibleBookingIds = []
let adminScheduleAnchorDate = new Date()
adminScheduleAnchorDate.setHours(0, 0, 0, 0)
const adminMessageTimers = new Map()
const adminMessageHideTimers = new Map()
const defaultAdminSection = "bookings"
const ADMIN_APP_NAME = "royalBraidsAdminApp"
const ADMIN_SESSION_STALE_AFTER_MS = 2 * 60 * 1000
const ADMIN_SECURITY_BLOCK_DEFAULT_MINUTES = 60
const ADMIN_SECURITY_RESTRICTION_NOTICE_KEY = "rb_admin_security_restriction"
const ADMIN_SERVICE_SETTINGS_DOC_PATH = ["siteSettings", "serviceCategories"]
const ADMIN_SERVICE_CATEGORY_DEFINITIONS = [
	{ key: "braids-services", label: "Braids Services" },
	{ key: "hair-services", label: "Hair Services" },
	{ key: "beauty-spa-services", label: "Beauty Spa Services" },
	{ key: "nail-services", label: "Nail Services" },
	{ key: "makeup-services", label: "Makeup Services" },
	{ key: "barber-services", label: "Barber Services" },
	{ key: "massage-wellness", label: "Massage & Wellness" },
	{ key: "eyebrow-lash-services", label: "Eyebrow & Lash Services" },
	{ key: "bridal-event-packages", label: "Bridal / Event Packages" },
]
const ADMIN_GALLERY_SERVICE_FILTER_DEFINITIONS = [
	{ key: "braids-services", label: "Braids" },
	{ key: "hair-services", label: "Hair" },
	{ key: "beauty-spa-services", label: "Beauty Spa" },
	{ key: "nail-services", label: "Nails" },
	{ key: "makeup-services", label: "Makeup" },
	{ key: "barber-services", label: "Barber" },
	{ key: "massage-wellness", label: "Massage" },
	{ key: "eyebrow-lash-services", label: "Eyebrows & Lash" },
	{ key: "bridal-event-packages", label: "Bridal / Event Packages" },
]
const ADMIN_GALLERY_SERVICE_LABEL_MAP = Object.fromEntries(
	ADMIN_GALLERY_SERVICE_FILTER_DEFINITIONS.map((item) => [
		item.key,
		item.label,
	]),
)
const ADMIN_GALLERY_CATEGORY_KEYWORDS = {
	"hair-services": [
		"hair styling",
		"hair cutting",
		"hair coloring",
		"hair relaxing",
		"hair treatment",
		"wig",
		"weaving",
		"extension",
		"blow dry",
		"blow-dry",
		"hair washing",
		"silk press",
		"retouch",
	],
	"braids-services": ["braid", "twist", "cornrow", "knotless", "fulani", "loc"],
	"massage-wellness": [
		"massage",
		"wellness",
		"therapy",
		"hot stone",
		"deep tissue",
	],
}
const ADMIN_REVIEW_KEYS = {
	profanityWords: "rb_admin_profanity_words",
}
const DEFAULT_ADMIN_PROFANITY_WORDS = [
	"fuck",
	"shit",
	"bitch",
	"asshole",
	"idiot",
	"scam",
]
let adminConfirmState = {
	resolve: null,
	isOpen: false,
}
let adminServiceCategoriesDraft = Object.fromEntries(
	ADMIN_SERVICE_CATEGORY_DEFINITIONS.map((item) => [item.key, true]),
)
let adminAccessProfile = null
let adminPendingLogoutToast = false

function closeAdminConfirmModal(result = false) {
	const modal = document.getElementById("adminConfirmModal")
	if (!modal || !adminConfirmState.isOpen) return

	modal.classList.remove("active")
	modal.setAttribute("aria-hidden", "true")
	document.body.style.overflow = ""

	adminConfirmState.isOpen = false
	const resolver = adminConfirmState.resolve
	adminConfirmState.resolve = null
	if (typeof resolver === "function") {
		resolver(result)
	}
}

function showAdminConfirmModal(
	message = "Are you sure you want to continue?",
	confirmLabel = "Confirm",
) {
	const modal = document.getElementById("adminConfirmModal")
	const messageEl = document.getElementById("adminConfirmMessage")
	const confirmBtn = document.getElementById("adminConfirmOk")
	if (!modal || !messageEl || !confirmBtn) {
		return Promise.resolve(window.confirm(message))
	}

	messageEl.textContent = message
	confirmBtn.textContent = confirmLabel

	modal.classList.add("active")
	modal.setAttribute("aria-hidden", "false")
	document.body.style.overflow = "hidden"
	adminConfirmState.isOpen = true

	return new Promise((resolve) => {
		adminConfirmState.resolve = resolve
	})
}

function setActiveAdminSection(sectionKey = defaultAdminSection) {
	const tabs = document.querySelectorAll("[data-admin-section-tab]")
	const sections = document.querySelectorAll("[data-admin-section]")
	if (!tabs.length || !sections.length) return

	const normalizedSection = String(
		sectionKey || defaultAdminSection,
	).toLowerCase()

	tabs.forEach((tab) => {
		const isActive = tab.dataset.adminSectionTab === normalizedSection
		tab.classList.toggle("active", isActive)
		tab.setAttribute("aria-selected", isActive ? "true" : "false")
	})

	sections.forEach((section) => {
		const isActive = section.dataset.adminSection === normalizedSection
		section.classList.toggle("active", isActive)
		section.setAttribute("aria-hidden", isActive ? "false" : "true")
	})
}

function initializeAdminSectionTabs() {
	const tabList = document.querySelector(".admin-section-tabs")
	if (!tabList) return

	tabList.addEventListener("click", (event) => {
		const tab = event.target.closest("[data-admin-section-tab]")
		if (!tab) return
		setActiveAdminSection(tab.dataset.adminSectionTab)
	})

	setActiveAdminSection(defaultAdminSection)
}

function isAdminHomepageUrl(urlValue = "") {
	if (!urlValue) return false

	try {
		const url = new URL(urlValue, window.location.href)
		if (url.origin !== window.location.origin) return false

		const path = url.pathname.replace(/\/+$/, "")
		return path === "" || /\/(index\.html)?$/i.test(path)
	} catch (error) {
		return false
	}
}

function initializeAdminHomepageNavigation() {
	const homeLink = document.querySelector("[data-admin-home-link]")
	if (!homeLink) return

	homeLink.addEventListener("click", (event) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return
		}

		event.preventDefault()

		const fallbackUrl = homeLink.getAttribute("href") || "index.html"
		const cameFromHomepage =
			window.history.length > 1 && isAdminHomepageUrl(document.referrer)

		if (cameFromHomepage) {
			window.history.back()
			return
		}

		window.location.assign(fallbackUrl)
	})
}

function initializeAdminBackToTop() {
	const backToTop = document.getElementById("backToTop")
	if (!backToTop) return

	const updateBackToTopVisibility = () => {
		backToTop.classList.toggle("visible", window.scrollY > 500)
	}

	window.addEventListener("scroll", updateBackToTopVisibility, {
		passive: true,
	})
	updateBackToTopVisibility()
}

function initializeAdminFloatingTooltips() {
	if (window.__adminFloatingTooltipsInitialized) return
	window.__adminFloatingTooltipsInitialized = true

	const tooltipSelector = ".admin-action-btn[data-tooltip]"
	const desktopQuery = window.matchMedia("(min-width: 601px)")
	const viewportPadding = 12
	let tooltipEl = null
	let activeTarget = null

	const hasDatasetValue = (element, key) =>
		Boolean(element?.dataset) &&
		Object.prototype.hasOwnProperty.call(element.dataset, key)

	const ensureTooltipElement = () => {
		if (tooltipEl) return tooltipEl
		if (!document.body) return null

		tooltipEl = document.createElement("div")
		tooltipEl.id = "adminFloatingTooltip"
		tooltipEl.className = "admin-floating-tooltip"
		tooltipEl.setAttribute("role", "tooltip")
		tooltipEl.setAttribute("aria-hidden", "true")
		document.body.appendChild(tooltipEl)
		return tooltipEl
	}

	const restoreTargetAttributes = () => {
		if (!activeTarget) return

		activeTarget.classList.remove("is-floating-tooltip-active")

		if (hasDatasetValue(activeTarget, "adminTooltipNativeTitle")) {
			activeTarget.setAttribute(
				"title",
				activeTarget.dataset.adminTooltipNativeTitle,
			)
			delete activeTarget.dataset.adminTooltipNativeTitle
		}

		if (hasDatasetValue(activeTarget, "adminTooltipDescribedby")) {
			activeTarget.setAttribute(
				"aria-describedby",
				activeTarget.dataset.adminTooltipDescribedby,
			)
			delete activeTarget.dataset.adminTooltipDescribedby
		} else {
			activeTarget.removeAttribute("aria-describedby")
		}
	}

	const hideTooltip = () => {
		if (tooltipEl) {
			tooltipEl.classList.remove("is-visible")
			tooltipEl.setAttribute("aria-hidden", "true")
		}

		restoreTargetAttributes()
		activeTarget = null
	}

	const positionTooltip = (target) => {
		const tooltip = ensureTooltipElement()
		if (!tooltip || !target?.isConnected) {
			hideTooltip()
			return
		}

		const targetRect = target.getBoundingClientRect()
		const tooltipRect = tooltip.getBoundingClientRect()
		const viewportWidth =
			window.innerWidth || document.documentElement.clientWidth
		const viewportHeight =
			window.innerHeight || document.documentElement.clientHeight
		const targetCenter = targetRect.left + targetRect.width / 2
		let placement = "top"
		let top = targetRect.top - tooltipRect.height - 10

		if (top < viewportPadding) {
			placement = "bottom"
			top = targetRect.bottom + 10
		}

		if (top + tooltipRect.height > viewportHeight - viewportPadding) {
			top = Math.max(
				viewportPadding,
				viewportHeight - tooltipRect.height - viewportPadding,
			)
		}

		let left = targetCenter - tooltipRect.width / 2
		left = Math.max(
			viewportPadding,
			Math.min(left, viewportWidth - tooltipRect.width - viewportPadding),
		)

		const arrowLeft = Math.max(
			12,
			Math.min(targetCenter - left, tooltipRect.width - 12),
		)

		tooltip.dataset.placement = placement
		tooltip.style.left = `${Math.round(left)}px`
		tooltip.style.top = `${Math.round(top)}px`
		tooltip.style.setProperty(
			"--tooltip-arrow-left",
			`${Math.round(arrowLeft)}px`,
		)
	}

	const showTooltip = (target) => {
		if (!desktopQuery.matches || !target) {
			hideTooltip()
			return
		}

		const tooltipText = String(target.getAttribute("data-tooltip") || "").trim()
		if (!tooltipText) {
			hideTooltip()
			return
		}

		const tooltip = ensureTooltipElement()
		if (!tooltip) return

		if (activeTarget !== target) {
			restoreTargetAttributes()
			activeTarget = target

			if (target.hasAttribute("title")) {
				target.dataset.adminTooltipNativeTitle =
					target.getAttribute("title") || ""
				target.removeAttribute("title")
			}

			if (target.hasAttribute("aria-describedby")) {
				target.dataset.adminTooltipDescribedby =
					target.getAttribute("aria-describedby") || ""
			}

			target.classList.add("is-floating-tooltip-active")
			target.setAttribute("aria-describedby", tooltip.id)
		}

		tooltip.textContent = tooltipText
		tooltip.setAttribute("aria-hidden", "false")
		tooltip.classList.add("is-visible")
		positionTooltip(target)
	}

	const getTooltipTargetAtPoint = (event) => {
		const pointedElement = document.elementFromPoint(
			event.clientX,
			event.clientY,
		)
		return pointedElement?.closest?.(tooltipSelector) || null
	}

	document.addEventListener(
		"pointermove",
		(event) => {
			const target = desktopQuery.matches
				? getTooltipTargetAtPoint(event)
				: null

			if (target) {
				showTooltip(target)
			} else if (activeTarget) {
				hideTooltip()
			}
		},
		true,
	)

	document.addEventListener("pointerdown", hideTooltip, true)
	document.addEventListener(
		"focusin",
		(event) => {
			const target = event.target?.closest?.(tooltipSelector) || null
			showTooltip(target)
		},
		true,
	)
	document.addEventListener("focusout", hideTooltip, true)
	window.addEventListener(
		"scroll",
		() => {
			if (activeTarget) positionTooltip(activeTarget)
		},
		true,
	)
	window.addEventListener("resize", () => {
		if (activeTarget) positionTooltip(activeTarget)
	})

	if (typeof desktopQuery.addEventListener === "function") {
		desktopQuery.addEventListener("change", hideTooltip)
	} else if (typeof desktopQuery.addListener === "function") {
		desktopQuery.addListener(hideTooltip)
	}
}

function setAdminPasswordVisibility(isVisible) {
	const passwordInput = document.getElementById("adminPassword")
	const passwordToggle = document.getElementById("adminPasswordToggle")
	if (!passwordInput || !passwordToggle) return

	const shouldShow = isVisible === true
	passwordInput.type = shouldShow ? "text" : "password"
	passwordToggle.setAttribute("aria-pressed", shouldShow ? "true" : "false")
	passwordToggle.setAttribute(
		"aria-label",
		shouldShow ? "Hide password" : "Show password",
	)

	const icon = passwordToggle.querySelector("i")
	if (icon) {
		icon.classList.toggle("fa-eye", !shouldShow)
		icon.classList.toggle("fa-eye-slash", shouldShow)
	}
}

function resetAdminLoginCredentials() {
	const emailInput = document.getElementById("adminEmail")
	const passwordInput = document.getElementById("adminPassword")

	if (emailInput) {
		emailInput.value = ""
	}

	if (passwordInput) {
		passwordInput.value = ""
	}

	setAdminPasswordVisibility(false)
}

function normalizeAdminLoginDeviceType(userAgent = navigator.userAgent || "") {
	const ua = String(userAgent || "").toLowerCase()
	if (/ipad|tablet/.test(ua)) return "tablet"
	if (/mobi|android|iphone|ipod/.test(ua)) return "mobile"
	if (ua) return "desktop"
	return "unknown"
}

function getAdminLoginBrowserLabel(userAgent = navigator.userAgent || "") {
	const ua = String(userAgent || "")
	if (/Edg\//.test(ua)) return "Edge"
	if (/OPR\//.test(ua)) return "Opera"
	if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) return "Chrome"
	if (/Firefox\//.test(ua)) return "Firefox"
	if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari"
	return "Unknown"
}

function buildAdminLoginActivityPayload({
	email = "",
	status = "success",
	error = null,
} = {}) {
	const userAgent = navigator.userAgent || ""
	return {
		loginMethod: "email/password",
		status: status === "failure" ? "failure" : "success",
		deviceType: normalizeAdminLoginDeviceType(userAgent),
		browser: getAdminLoginBrowserLabel(userAgent),
		locale: navigator.language || "",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
		source: "admin-console",
		failureCode:
			status === "failure"
				? String(error?.code || error?.status || "admin_login_failed").slice(
						0,
						80,
					)
				: undefined,
		attemptedEmail:
			String(email || "")
				.trim()
				.toLowerCase() || undefined,
		metadata: {
			path: window.location.pathname || "/admin.html",
			userAgent,
		},
	}
}

async function logAdminLoginActivity({
	email = "",
	status = "success",
	error = null,
} = {}) {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		return
	}

	try {
		const callable = adminCallableService.httpsCallable("logLoginActivity")
		await callable(buildAdminLoginActivityPayload({ email, status, error }))
	} catch (logError) {
		console.warn("Admin login telemetry failed:", logError)
	}
}

function takeAdminSecurityRestrictionNotice() {
	try {
		const raw = sessionStorage.getItem(ADMIN_SECURITY_RESTRICTION_NOTICE_KEY)
		if (!raw) return null
		sessionStorage.removeItem(ADMIN_SECURITY_RESTRICTION_NOTICE_KEY)
		const parsed = JSON.parse(raw)
		return parsed && typeof parsed === "object" ? parsed : null
	} catch (_error) {
		return null
	}
}

function getAdminSecurityRestrictionMessage(notice = {}) {
	const fallback =
		"This session needs attention before continuing. Please sign in again."
	const message = String(notice.message || "").trim() || fallback
	if (notice.code === "force_logout_required") {
		return "Your session was refreshed for security. Please sign in again."
	}
	return message
}

function showStoredAdminSecurityRestrictionNotice() {
	const notice = takeAdminSecurityRestrictionNotice()
	if (!notice) return false
	setAdminMessage(
		"error",
		`Security notice: ${getAdminSecurityRestrictionMessage(notice)}`,
		"adminAuthMessage",
	)
	return true
}

function getAdminAppServices() {
	return window.AppServices || {}
}

function getServerTimestamp() {
	const services = getAdminAppServices()
	return typeof services.serverTimestamp === "function"
		? services.serverTimestamp()
		: new Date().toISOString()
}

function canInitializeAppServices() {
	const services = getAdminAppServices()
	return Boolean(services.auth && services.db)
}

function normalizeAdminRoleValue(value = "") {
	const role = String(value || "")
		.trim()
		.toLowerCase()
	if (role === "super_admin") return "super_admin"
	if (role === "admin") return "admin"
	return ""
}

function normalizeAdminPermissionsValue(raw = {}) {
	const source =
		typeof raw === "object" && raw && !Array.isArray(raw) ? raw : {}
	return {
		canManageAdmins: source.canManageAdmins === true,
		canManageBookings: source.canManageBookings !== false,
		canManageContent: source.canManageContent !== false,
		canManageSecurity: source.canManageSecurity === true,
	}
}

function hasAdminAccessPermission(permissionKey = "") {
	const key = String(permissionKey || "").trim()
	if (!key) return false
	if (!adminAccessProfile) return false
	if (adminAccessProfile.role === "super_admin") return true
	return adminAccessProfile.permissions?.[key] === true
}

function isCurrentSuperAdmin() {
	return normalizeAdminRoleValue(adminAccessProfile?.role) === "super_admin"
}

function canStartAdminRealtimeListener(permissionKey = "") {
	if (!appServicesReady || !db || !adminUnlocked) return false
	const key = String(permissionKey || "").trim()
	return key ? hasAdminAccessPermission(key) : true
}

function isAuthorizedAdminAccessProfile(profile = null) {
	if (!profile || typeof profile !== "object") return false
	if (profile.active !== true) return false
	const role = normalizeAdminRoleValue(profile.role)
	if (!role) return false
	return true
}

async function fetchAdminAccessProfile(uid = "") {
	const cleanUid = String(uid || "").trim()
	if (!cleanUid || !db) return null

	const snapshot = await db.collection("adminUsers").doc(cleanUid).get()
	if (!snapshot.exists) return null

	const source = snapshot.data() || {}
	const sourceUid = String(
		source.uid || source.userId || source.user_id || snapshot.id || cleanUid,
	).trim()
	return {
		adminUserId: String(
			source.adminUserId || source.admin_user_id || source.adminId || "",
		).trim(),
		uid: sourceUid || snapshot.id,
		email: String(source.email || "")
			.trim()
			.toLowerCase(),
		displayName: String(source.displayName || source.display_name || "").trim(),
		role: normalizeAdminRoleValue(source.role),
		active: source.active === true,
		permissions: normalizeAdminPermissionsValue(source.permissions),
		createdAt: source.createdAt || source.created_at || null,
		updatedAt: source.updatedAt || source.updated_at || null,
	}
}

function applyAdminSectionPermissions() {
	const tabsBySection = {
		bookings: hasAdminAccessPermission("canManageBookings"),
		schedule: hasAdminAccessPermission("canManageBookings"),
		gallery: hasAdminAccessPermission("canManageContent"),
		blogs: hasAdminAccessPermission("canManageContent"),
		reviews: hasAdminAccessPermission("canManageContent"),
		messages: hasAdminAccessPermission("canManageContent"),
		waitlist: hasAdminAccessPermission("canManageBookings"),
		services: hasAdminAccessPermission("canManageContent"),
		admins: isCurrentSuperAdmin(),
		security: hasAdminAccessPermission("canManageSecurity"),
	}

	Object.entries(tabsBySection).forEach(([section, allowed]) => {
		const tab = document.querySelector(`[data-admin-section-tab="${section}"]`)
		const panel = document.querySelector(`[data-admin-section="${section}"]`)
		if (tab) tab.style.display = allowed ? "" : "none"
		if (panel) panel.style.display = allowed ? "" : "none"
	})

	const visibleTabs = Array.from(
		document.querySelectorAll("[data-admin-section-tab]"),
	).filter((tab) => tab.style.display !== "none")

	if (!visibleTabs.length) return
	const activeVisible = visibleTabs.find((tab) =>
		tab.classList.contains("active"),
	)
	if (!activeVisible) {
		setActiveAdminSection(visibleTabs[0].dataset.adminSectionTab || "bookings")
	}
}

function getStatusClass(status) {
	switch (normalizeStatus(status)) {
		case "confirmed":
			return "admin-status-confirmed"
		case "completed":
			return "admin-status-completed"
		case "cancelled":
			return "admin-status-cancelled"
		case "waitlisted":
			return "admin-status-waitlisted"
		case "expired":
			return "admin-status-expired"
		case "no_show":
			return "admin-status-no-show"
		default:
			return "admin-status-pending"
	}
}

function getStatusLabel(status) {
	const normalized = normalizeStatus(status)
	if (normalized === "no_show") return "no show"
	return normalized
}

function normalizeStatus(status) {
	const raw = String(status || "pending")
		.trim()
		.toLowerCase()

	if (raw === "complete") return "completed"
	if (raw === "canceled") return "cancelled"
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

function normalizeAdminBookingFilter(filter = "all") {
	const raw = String(filter || "all")
		.trim()
		.toLowerCase()
	return [
		"pending",
		"confirmed",
		"completed",
		"cancelled",
		"waitlisted",
	].includes(raw)
		? raw
		: "all"
}

function extractRawStatus(booking = {}) {
	return (
		booking.status ??
		booking.bookingStatus ??
		booking.state ??
		booking.booking_state ??
		booking.currentStatus ??
		"pending"
	)
}

function toTimestampMs(value) {
	if (!value) return 0

	if (typeof value?.toMillis === "function") {
		return value.toMillis()
	}

	if (typeof value === "number") return value

	const parsed = Date.parse(String(value))
	return Number.isNaN(parsed) ? 0 : parsed
}

function formatAdminDate(value) {
	if (!value) return "N/A"
	const raw = String(value).trim()
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
		const [year, month, day] = raw.split("-").map(Number)
		const localDate = new Date(year, month - 1, day)
		if (!Number.isNaN(localDate.getTime())) {
			return localDate.toLocaleDateString()
		}
	}
	const ms = toTimestampMs(value)
	if (!ms) return raw
	return new Date(ms).toLocaleString()
}

function normalizeAdminScheduleView(view) {
	return view === ADMIN_SCHEDULE_VIEWS.day
		? ADMIN_SCHEDULE_VIEWS.day
		: ADMIN_SCHEDULE_VIEWS.week
}

function formatAdminDateKey(dateValue) {
	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ""
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

function parseAdminBookingDate(value) {
	if (!value) return null
	const raw = String(value).trim()
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
		const [year, month, day] = raw.split("-").map(Number)
		const date = new Date(year, month - 1, day)
		if (!Number.isNaN(date.getTime())) {
			date.setHours(0, 0, 0, 0)
			return date
		}
	}

	const ms = toTimestampMs(value)
	if (!ms) return null
	const parsed = new Date(ms)
	if (Number.isNaN(parsed.getTime())) return null
	parsed.setHours(0, 0, 0, 0)
	return parsed
}

function parseAdminBookingTimeToMinutes(value) {
	const text = String(value || "")
		.trim()
		.toLowerCase()
	if (!text) return 9 * 60

	const compact = text.replace(/\./g, "").replace(/\s+/g, "")
	const match = compact.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)?$/)
	if (!match) return 9 * 60

	let hours = Number(match[1])
	const minutes = Number(match[2] || 0)
	const meridiem = match[3] || ""

	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60
	if (minutes < 0 || minutes > 59) return 9 * 60

	if (meridiem === "pm" && hours < 12) hours += 12
	if (meridiem === "am" && hours === 12) hours = 0

	if (!meridiem && hours === 24 && minutes === 0) hours = 0
	if (hours < 0 || hours > 23) return 9 * 60

	return hours * 60 + minutes
}

function getAdminBookingStartDate(booking = {}) {
	const dateSource =
		booking.date ??
		booking.bookingDate ??
		booking.appointmentDate ??
		booking.serviceDate ??
		booking.slotDate ??
		booking.createdAt
	const dayDate = parseAdminBookingDate(dateSource)
	if (!dayDate) return null

	const minutes = parseAdminBookingTimeToMinutes(
		booking.time ?? booking.bookingTime ?? booking.slotTime ?? "",
	)
	const startDate = new Date(dayDate)
	startDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
	return startDate
}

function getAdminBookingCustomerName(booking = {}) {
	return (
		`${booking.firstName || ""} ${booking.lastName || ""}`.trim() ||
		String(booking.name || "").trim() ||
		"Unknown Customer"
	)
}

function getAdminScheduleWeekStart(dateValue) {
	const date = new Date(dateValue)
	date.setHours(0, 0, 0, 0)
	const day = date.getDay()
	const diff = day === 0 ? -6 : 1 - day
	date.setDate(date.getDate() + diff)
	return date
}

function getAdminVisibleScheduleDates() {
	const anchor = parseAdminBookingDate(adminScheduleAnchorDate) || new Date()
	anchor.setHours(0, 0, 0, 0)

	if (
		normalizeAdminScheduleView(adminScheduleView) === ADMIN_SCHEDULE_VIEWS.day
	) {
		return [anchor]
	}

	const start = getAdminScheduleWeekStart(anchor)
	return Array.from({ length: 7 }, (_, idx) => {
		const day = new Date(start)
		day.setDate(start.getDate() + idx)
		return day
	})
}

function formatAdminScheduleRangeLabel(visibleDates = []) {
	if (!visibleDates.length) return "Schedule"
	if (visibleDates.length === 1) {
		return visibleDates[0].toLocaleDateString(undefined, {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		})
	}

	const start = visibleDates[0]
	const end = visibleDates[visibleDates.length - 1]
	const sameYear = start.getFullYear() === end.getFullYear()
	const startLabel = start.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		...(sameYear ? {} : { year: "numeric" }),
	})
	const endLabel = end.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	})
	return `${startLabel} - ${endLabel}`
}

function moveAdminScheduleAnchorByDays(days = 0) {
	const anchor = parseAdminBookingDate(adminScheduleAnchorDate) || new Date()
	anchor.setDate(anchor.getDate() + Number(days || 0))
	anchor.setHours(0, 0, 0, 0)
	adminScheduleAnchorDate = anchor
}

function getAdminScheduleTimeBucketLabel(dateValue) {
	const date = new Date(dateValue)
	const hour = Number.isNaN(date.getTime()) ? 9 : date.getHours()

	if (hour < 6) return "Late Night"
	if (hour < 12) return "Morning"
	if (hour < 17) return "Afternoon"
	if (hour < 22) return "Evening"
	return "Late Night"
}

function selectPreviousAdminScheduleBooking() {
	const ids = Array.isArray(adminScheduleVisibleBookingIds)
		? adminScheduleVisibleBookingIds.filter(Boolean)
		: []

	if (!ids.length) {
		adminScheduleSelectedBookingId = ""
		renderAdminSchedule()
		return
	}

	const currentId = String(adminScheduleSelectedBookingId || "")
	const currentIndex = currentId ? ids.indexOf(currentId) : -1
	const prevIndex =
		currentIndex >= 0
			? (currentIndex - 1 + ids.length) % ids.length
			: ids.length - 1

	adminScheduleSelectedBookingId = ids[prevIndex]
	renderAdminSchedule()
}

function selectNextAdminScheduleBooking() {
	const ids = Array.isArray(adminScheduleVisibleBookingIds)
		? adminScheduleVisibleBookingIds.filter(Boolean)
		: []

	if (!ids.length) {
		adminScheduleSelectedBookingId = ""
		renderAdminSchedule()
		return
	}

	const currentId = String(adminScheduleSelectedBookingId || "")
	const currentIndex = currentId ? ids.indexOf(currentId) : -1
	const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % ids.length : 0

	adminScheduleSelectedBookingId = ids[nextIndex]
	renderAdminSchedule()
}

function renderAdminBookingLifecycleActions({
	bookingId = "",
	waitlistId = "",
	status = "pending",
	actionAttribute = "data-action",
} = {}) {
	const normalizedStatus = normalizeStatus(status)
	const safeBookingId = escapeHtml(String(bookingId || "").trim())
	const safeWaitlistId = escapeHtml(String(waitlistId || "").trim())
	const actionAttr =
		actionAttribute === "data-schedule-action"
			? "data-schedule-action"
			: "data-action"

	if (!safeBookingId) return ""

	if (normalizedStatus === "waitlisted") {
		return `
			<button class="admin-action-btn" ${actionAttr}="move-waitlist-confirmed" data-id="${safeBookingId}" data-waitlist-id="${safeWaitlistId}">Move to Confirmed</button>
		`
	}

	if (normalizedStatus === "pending") {
		return `
			<button class="admin-action-btn" ${actionAttr}="confirmed" data-id="${safeBookingId}">Confirm</button>
			<button class="admin-action-btn danger" ${actionAttr}="cancel-release" data-id="${safeBookingId}">Cancel + Release Slot</button>
		`
	}

	if (normalizedStatus === "confirmed") {
		return `
			<button class="admin-action-btn" ${actionAttr}="completed" data-id="${safeBookingId}">Complete + Release Slot</button>
			<button class="admin-action-btn danger" ${actionAttr}="cancel-release" data-id="${safeBookingId}">Cancel + Release Slot</button>
		`
	}

	return `<button class="admin-action-btn" disabled title="This booking is already ${escapeHtml(getStatusLabel(normalizedStatus))} and cannot be changed from this view.">No quick actions available</button>`
}

function renderAdminScheduleDetails(booking = null) {
	const details = document.getElementById("adminScheduleDetails")
	if (!details) return

	if (!booking) {
		details.innerHTML =
			'<div class="admin-empty-state">Click a calendar event to view booking details and quick actions.</div>'
		return
	}

	const status = normalizeStatus(extractRawStatus(booking))
	const isWaitlisted = status === "waitlisted"
	const bookingId = String(booking.id || "").trim()
	const waitlistId = String(booking.waitlistId || "").trim()
	const customerName = getAdminBookingCustomerName(booking)
	const specialRequest = String(
		booking.notes || booking.specialRequest || "",
	).trim()
	const inspirationImageUrl = String(
		booking.inspirationImageUrl ||
			booking.inspirationImage ||
			booking.referenceImageUrl ||
			"",
	).trim()

	details.innerHTML = `
		<article class="admin-booking-item admin-schedule-detail-card">
			<div class="admin-booking-item-head">
				<div>
					<div class="admin-booking-name">${escapeHtml(customerName)}</div>
					<div class="admin-booking-id">Booking ID: ${escapeHtml(booking.id || "N/A")}</div>
				</div>
				<span class="admin-status-badge ${getStatusClass(status)}">${escapeHtml(getStatusLabel(status))}</span>
			</div>

			<div class="admin-booking-meta">
				<div><span>Service:</span> ${escapeHtml(booking.service || "N/A")}</div>
				<div><span>Stylist:</span> ${escapeHtml(booking.stylist || "Any Available")}</div>
				<div><span>Date:</span> ${escapeHtml(formatAdminDate(booking.date))}</div>
				<div><span>Time:</span> ${escapeHtml(booking.time || "N/A")}</div>
				<div><span>Email:</span> ${escapeHtml(booking.email || "N/A")}</div>
				<div><span>Phone:</span> ${escapeHtml(booking.phone || "N/A")}</div>
			</div>

			<div class="admin-booking-special-request">
				<span>Special Request:</span>
				<p>${specialRequest ? escapeHtml(specialRequest) : "No special request provided."}</p>
			</div>

			<div class="admin-booking-inspiration">
				<div><span>Inspiration Image:</span> ${inspirationImageUrl ? `<a class="admin-inline-link" href="${escapeHtml(inspirationImageUrl)}" target="_blank" rel="noopener">Open full image</a>` : "Not provided"}</div>
			</div>

			<div class="admin-booking-actions admin-schedule-detail-actions">
				<button class="admin-action-btn admin-schedule-prev-btn" data-schedule-nav="previous">← Previous Booking</button>
				<button class="admin-action-btn admin-schedule-next-btn" data-schedule-nav="next">Next Booking →</button>
				${renderAdminBookingLifecycleActions({
					bookingId,
					waitlistId,
					status,
					actionAttribute: "data-schedule-action",
				})}
			</div>
		</article>
	`
}

function renderAdminSchedule() {
	const grid = document.getElementById("adminScheduleGrid")
	const rangeLabel = document.getElementById("adminScheduleRangeLabel")
	if (!grid) return

	const view = normalizeAdminScheduleView(adminScheduleView)
	adminScheduleView = view

	const viewButtons = document.querySelectorAll("[data-schedule-view]")
	viewButtons.forEach((button) => {
		const active = button.dataset.scheduleView === view
		button.classList.toggle("active", active)
		button.setAttribute("aria-pressed", active ? "true" : "false")
	})

	const visibleDates = getAdminVisibleScheduleDates()
	if (rangeLabel) {
		rangeLabel.textContent = formatAdminScheduleRangeLabel(visibleDates)
	}

	const normalizedDocs = (
		Array.isArray(adminBookingDocs) ? adminBookingDocs : []
	).map((booking) => ({
		...booking,
		status: normalizeStatus(extractRawStatus(booking)),
	}))

	const grouped = new Map()
	visibleDates.forEach((date) => {
		grouped.set(formatAdminDateKey(date), [])
	})

	let selectedBooking = null
	normalizedDocs.forEach((booking) => {
		const startDate = getAdminBookingStartDate(booking)
		if (!startDate) return

		const dateKey = formatAdminDateKey(startDate)
		if (!grouped.has(dateKey)) return

		const scheduleBooking = {
			...booking,
			__scheduleStart: startDate,
		}
		grouped.get(dateKey).push(scheduleBooking)

		if (booking.id && booking.id === adminScheduleSelectedBookingId) {
			selectedBooking = scheduleBooking
		}
	})

	grouped.forEach((items) => {
		items.sort(
			(a, b) => a.__scheduleStart.getTime() - b.__scheduleStart.getTime(),
		)
	})

	if (adminScheduleSelectedBookingId && !selectedBooking) {
		adminScheduleSelectedBookingId = ""
	}

	const orderedVisibleBookings = []
	visibleDates.forEach((date) => {
		const items = grouped.get(formatAdminDateKey(date)) || []
		orderedVisibleBookings.push(...items)
	})

	adminScheduleVisibleBookingIds = orderedVisibleBookings
		.map((booking) => String(booking.id || "").trim())
		.filter(Boolean)

	if (!selectedBooking) {
		const firstVisible = orderedVisibleBookings[0] || null
		if (firstVisible) {
			selectedBooking = firstVisible
			adminScheduleSelectedBookingId = String(firstVisible.id || "")
		}
	}

	grid.classList.toggle("is-week-view", view === ADMIN_SCHEDULE_VIEWS.week)
	grid.innerHTML = visibleDates
		.map((date) => {
			const dateKey = formatAdminDateKey(date)
			const items = grouped.get(dateKey) || []
			const dayLabel = date.toLocaleDateString(undefined, { weekday: "short" })
			const dateLabel = date.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
			})

			const itemsHtml = items.length
				? (() => {
						const bucketOrder = [
							"Morning",
							"Afternoon",
							"Evening",
							"Late Night",
						]
						const groupedByBucket = new Map()

						items.forEach((booking) => {
							const bucket = getAdminScheduleTimeBucketLabel(
								booking.__scheduleStart,
							)
							if (!groupedByBucket.has(bucket)) {
								groupedByBucket.set(bucket, [])
							}
							groupedByBucket.get(bucket).push(booking)
						})

						return bucketOrder
							.filter((bucket) => groupedByBucket.has(bucket))
							.map((bucket) => {
								const bucketItems = groupedByBucket.get(bucket) || []
								const eventsHtml = bucketItems
									.map((booking) => {
										const status = normalizeStatus(extractRawStatus(booking))
										const selectedClass =
											booking.id === adminScheduleSelectedBookingId
												? " is-selected"
												: ""
										const displayTime =
											String(booking.time || "").trim() ||
											booking.__scheduleStart.toLocaleTimeString(undefined, {
												hour: "2-digit",
												minute: "2-digit",
											})

										return `
											<button
												type="button"
												class="admin-schedule-event ${getStatusClass(status)}${selectedClass}"
												data-schedule-booking="${escapeHtml(booking.id || "")}" 
											>
												<div class="admin-schedule-event-time">${escapeHtml(displayTime)}</div>
												<div class="admin-schedule-event-name">${escapeHtml(getAdminBookingCustomerName(booking))}</div>
												<div class="admin-schedule-event-service">${escapeHtml(booking.service || "Service not set")}</div>
											</button>
										`
									})
									.join("")

								return `
									<div class="admin-schedule-bucket">
										<div class="admin-schedule-bucket-label">${escapeHtml(bucket)}</div>
										${eventsHtml}
									</div>
								`
							})
							.join("")
					})()
				: '<div class="admin-schedule-empty-day">No bookings</div>'

			return `
				<section class="admin-schedule-day-column">
					<header class="admin-schedule-day-header">
						<h4>${escapeHtml(dayLabel)}</h4>
						<p>${escapeHtml(dateLabel)}</p>
					</header>
					<div class="admin-schedule-day-events">${itemsHtml}</div>
				</section>
			`
		})
		.join("")

	renderAdminScheduleDetails(selectedBooking)
}

function stopAdminBookingsListener() {
	if (typeof adminBookingsUnsubscribe === "function") {
		adminBookingsUnsubscribe()
		adminBookingsUnsubscribe = null
	}
}

function stopAdminGalleryListener() {
	if (typeof adminGalleryUnsubscribe === "function") {
		adminGalleryUnsubscribe()
		adminGalleryUnsubscribe = null
	}
}

function stopAdminBlogsListener() {
	if (typeof adminBlogsUnsubscribe === "function") {
		adminBlogsUnsubscribe()
		adminBlogsUnsubscribe = null
	}
}

function stopAdminReviewsListener() {
	if (typeof adminReviewsUnsubscribe === "function") {
		adminReviewsUnsubscribe()
		adminReviewsUnsubscribe = null
	}
}

function stopAdminContactListener() {
	if (typeof adminContactUnsubscribe === "function") {
		adminContactUnsubscribe()
		adminContactUnsubscribe = null
	}
}

function stopAdminWaitlistListener() {
	if (typeof adminWaitlistUnsubscribe === "function") {
		adminWaitlistUnsubscribe()
		adminWaitlistUnsubscribe = null
	}
}

function stopAdminSecurityListener() {
	if (typeof adminSecurityUnsubscribe === "function") {
		adminSecurityUnsubscribe()
		adminSecurityUnsubscribe = null
	}
}

function stopAdminSecurityAlertsListener() {
	if (typeof adminSecurityAlertsUnsubscribe === "function") {
		adminSecurityAlertsUnsubscribe()
		adminSecurityAlertsUnsubscribe = null
	}
}

function stopAdminAccountHistoryListener() {
	if (typeof adminAccountHistoryUnsubscribe === "function") {
		adminAccountHistoryUnsubscribe()
		adminAccountHistoryUnsubscribe = null
	}
}

function stopAdminSessionsListener() {
	if (typeof adminSessionsUnsubscribe === "function") {
		adminSessionsUnsubscribe()
		adminSessionsUnsubscribe = null
	}
}

function stopAdminTimelineListener() {
	if (typeof adminTimelineUnsubscribe === "function") {
		adminTimelineUnsubscribe()
		adminTimelineUnsubscribe = null
	}
}

function stopAdminUsersListener() {
	if (typeof adminUsersUnsubscribe === "function") {
		adminUsersUnsubscribe()
		adminUsersUnsubscribe = null
	}
}

function stopAdminServiceSettingsListener() {
	if (typeof adminServiceSettingsUnsubscribe === "function") {
		adminServiceSettingsUnsubscribe()
		adminServiceSettingsUnsubscribe = null
	}
}

function startAdminServiceSettingsListener() {
	if (!canStartAdminRealtimeListener("canManageContent")) {
		stopAdminServiceSettingsListener()
		return
	}

	stopAdminServiceSettingsListener()

	adminServiceSettingsUnsubscribe = db
		.collection(ADMIN_SERVICE_SETTINGS_DOC_PATH[0])
		.doc(ADMIN_SERVICE_SETTINGS_DOC_PATH[1])
		.onSnapshot(
			(snapshot) => {
				const data = snapshot.exists ? snapshot.data() || {} : {}
				adminServiceCategoriesDraft = normalizeAdminServiceCategoriesState(
					data.categories,
				)
				renderAdminServiceCategorySettings()
			},
			(error) => {
				console.error("Admin service settings listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch service category settings in realtime: ${error.message || "unknown error"}`,
					"adminServicesMessage",
				)
			},
		)
}

function getAdminDefaultServiceCategoriesState() {
	return Object.fromEntries(
		ADMIN_SERVICE_CATEGORY_DEFINITIONS.map((item) => [item.key, true]),
	)
}

function normalizeAdminServiceCategoriesState(raw = {}) {
	const defaults = getAdminDefaultServiceCategoriesState()
	const source =
		typeof raw === "object" && raw && !Array.isArray(raw) ? raw : defaults

	ADMIN_SERVICE_CATEGORY_DEFINITIONS.forEach((item) => {
		defaults[item.key] = source[item.key] !== false
	})

	return defaults
}

function renderAdminServiceCategorySettings() {
	const mount = document.getElementById("adminServiceCategoryToggles")
	if (!mount) return

	const categories = ADMIN_SERVICE_CATEGORY_DEFINITIONS.map((item) => ({
		...item,
		enabled: adminServiceCategoriesDraft[item.key] !== false,
	}))

	const activeCount = categories.filter((item) => item.enabled).length
	const inactiveCount = categories.length - activeCount

	const renderCategoryCard = (item) => {
		const switchId = `adminServiceCategory_${item.key}`
		const stateText = item.enabled ? "Visible on website" : "Hidden on website"
		const stateClass = item.enabled ? "is-visible" : "is-hidden"

		return `
				<article class="admin-service-category-card ${item.enabled ? "is-enabled" : "is-disabled"}">
					<div class="admin-service-category-main">
						<div class="admin-service-category-copy">
							<div class="admin-service-category-title-row">
								<h4 class="admin-service-category-title">${escapeHtml(item.label)}</h4>
								<span class="admin-service-category-pill ${stateClass}">${item.enabled ? "ACTIVE" : "OFF"}</span>
							</div>
							<p class="admin-service-category-state ${stateClass}">${escapeHtml(stateText)}</p>
						</div>
						<label class="admin-service-toggle" for="${escapeHtml(switchId)}" aria-label="Toggle ${escapeHtml(item.label)}">
							<input
								type="checkbox"
								id="${escapeHtml(switchId)}"
								data-service-category-toggle="${escapeHtml(item.key)}"
								${item.enabled ? "checked" : ""}
							/>
							<span class="admin-service-toggle-slider" aria-hidden="true"></span>
						</label>
					</div>
				</article>
			`
	}

	const sortedActive = categories
		.filter((item) => item.enabled)
		.sort((a, b) => a.label.localeCompare(b.label))
	const sortedInactive = categories
		.filter((item) => !item.enabled)
		.sort((a, b) => a.label.localeCompare(b.label))

	const activeCardsHtml = sortedActive.map(renderCategoryCard).join("")
	const inactiveCardsHtml = sortedInactive.map(renderCategoryCard).join("")

	mount.innerHTML = `
		<div class="admin-service-settings-summary" aria-live="polite">
			<div class="admin-service-settings-summary-item is-active">Active: <strong>${activeCount}</strong></div>
			<div class="admin-service-settings-summary-item is-inactive">Inactive: <strong>${inactiveCount}</strong></div>
		</div>
		<div class="admin-service-settings-groups">
			<section class="admin-service-settings-group is-active-group">
				<header class="admin-service-settings-group-head">
					<h4 class="admin-service-settings-group-title"><span class="admin-service-settings-group-icon is-active" aria-hidden="true">✓</span> Active Services</h4>
					<p>These categories are visible on the live website and booking form.</p>
				</header>
				<div class="admin-service-settings-cards">${
					activeCardsHtml ||
					'<div class="admin-service-settings-empty">No active categories right now.</div>'
				}</div>
			</section>
			<section class="admin-service-settings-group is-inactive-group">
				<header class="admin-service-settings-group-head">
					<h4 class="admin-service-settings-group-title"><span class="admin-service-settings-group-icon is-inactive" aria-hidden="true">⏸</span> Inactive Services</h4>
					<p>These categories are hidden from public view until re-enabled.</p>
				</header>
				<div class="admin-service-settings-cards">${
					inactiveCardsHtml ||
					'<div class="admin-service-settings-empty">All categories are currently active.</div>'
				}</div>
			</section>
		</div>
	`
}

async function saveAdminServiceCategorySettings() {
	if (!adminUnlocked || !db || !auth?.currentUser) return

	const saveBtn = document.getElementById("adminSaveServiceCategoriesBtn")

	try {
		setAdminButtonLoadingState(saveBtn, true, {
			loadingText: "Saving...",
		})

		await db
			.collection(ADMIN_SERVICE_SETTINGS_DOC_PATH[0])
			.doc(ADMIN_SERVICE_SETTINGS_DOC_PATH[1])
			.set(
				{
					categories: normalizeAdminServiceCategoriesState(
						adminServiceCategoriesDraft,
					),
					updatedAt: getServerTimestamp(),
					updatedBy: auth?.currentUser?.email || "admin",
				},
				{ merge: true },
			)

		setAdminMessage(
			"success",
			"✅ Service category settings saved and applied live.",
			"adminServicesMessage",
		)
	} catch (error) {
		console.error("Saving service category settings failed:", error)
		setAdminMessage(
			"error",
			`❌ Failed to save category settings: ${error.message || "unknown error"}`,
			"adminServicesMessage",
		)
	} finally {
		setAdminButtonLoadingState(saveBtn, false, {
			resetText: "Save Category Settings",
		})
	}
}

function setAdminMessage(type, text, targetId = "adminMessage") {
	const msg = document.getElementById(targetId)
	if (!msg) return
	const shouldUseToast = type === "success" || type === "error"

	const existingTimer = adminMessageTimers.get(targetId)
	if (existingTimer) {
		clearTimeout(existingTimer)
		adminMessageTimers.delete(targetId)
	}

	const existingHideTimer = adminMessageHideTimers.get(targetId)
	if (existingHideTimer) {
		clearTimeout(existingHideTimer)
		adminMessageHideTimers.delete(targetId)
	}

	const hideMessage = (animated = false) => {
		if (animated) {
			msg.classList.remove("is-visible")
			msg.classList.add("is-leaving")
			const hideTimer = setTimeout(() => {
				msg.className = "form-message"
				msg.style.display = "none"
				msg.textContent = ""
				adminMessageHideTimers.delete(targetId)
			}, 320)
			adminMessageHideTimers.set(targetId, hideTimer)
			return
		}

		msg.className = "form-message"
		msg.style.display = "none"
		msg.textContent = ""
	}

	if (!text) {
		hideMessage(false)
		return
	}

	msg.className = shouldUseToast
		? `form-message ${type} form-message--toast`
		: `form-message ${type}`
	msg.textContent = text
	msg.style.display = "block"
	msg.classList.remove("is-leaving")
	requestAnimationFrame(() => {
		msg.classList.add("is-visible")
	})

	const shouldAutoDismiss = type === "success" || type === "error"
	if (!shouldAutoDismiss) return

	const timer = setTimeout(() => {
		hideMessage(true)
		adminMessageTimers.delete(targetId)
	}, 4200)

	adminMessageTimers.set(targetId, timer)
}

async function callAdminRestrictUserAction(payload = {}) {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const callable = adminCallableService.httpsCallable(
		"adminRestrictUserAccount",
	)
	const response = await callable(payload)
	return response?.data || { ok: true }
}

async function callAdminCreateAdminUserAction(payload = {}) {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const callable = adminCallableService.httpsCallable("adminCreateAdminUser")
	const response = await callable(payload)
	return response?.data || { ok: true }
}

async function callAdminUpdateAdminUserAction(payload = {}) {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const callable = adminCallableService.httpsCallable("adminUpdateAdminUser")
	const response = await callable(payload)
	return response?.data || { ok: true }
}

async function callAdminListAdminUsersAction() {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const callable = adminCallableService.httpsCallable("adminListAdminUsers")
	const response = await callable({})
	return response?.data || { ok: true, admins: [] }
}

async function callAdminMoveWaitlistBookingToConfirmedAction(payload = {}) {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const callable = adminCallableService.httpsCallable(
		"adminMoveWaitlistBookingToConfirmed",
	)
	const response = await callable(payload)
	const data = response?.data || { ok: true }
	await refreshAdminActionCollections(["bookings", "waitlist"])
	return data
}

async function callAdminUpdateBookingStatusAndReleaseSlotAction(payload = {}) {
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const callable = adminCallableService.httpsCallable(
		"adminUpdateBookingStatusAndReleaseSlot",
	)
	const response = await callable(payload)
	const data = response?.data || { ok: true }
	await refreshAdminActionCollections(["bookings", "waitlist"])
	return data
}

function getAdminCollectionRefreshLimit(collectionName = "") {
	const limits = {
		bookings: 100,
		waitlist: 300,
		reviews: 300,
		contactMessages: 300,
		galleryStyles: 200,
		blogs: 300,
	}
	return limits[collectionName] || 300
}

async function loadAdminCollectionDocs(collectionName = "") {
	if (!db || !collectionName) return []
	const snapshot = await db
		.collection(collectionName)
		.limit(getAdminCollectionRefreshLimit(collectionName))
		.get()
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

function renderAdminRefreshedCollection(collectionName = "", docs = []) {
	if (collectionName === "bookings") {
		renderAdminBookings(docs)
		return
	}
	if (collectionName === "waitlist") {
		renderAdminWaitlist(docs)
		return
	}
	if (collectionName === "reviews") {
		renderAdminReviews(docs)
		return
	}
	if (collectionName === "contactMessages") {
		renderAdminContactMessages(docs)
		return
	}
	if (collectionName === "galleryStyles") {
		renderAdminGallery(docs)
		return
	}
	if (collectionName === "blogs") {
		renderAdminBlogs(docs)
	}
}

async function refreshAdminActionCollections(collectionNames = []) {
	if (!adminUnlocked || !db || !Array.isArray(collectionNames)) return
	const uniqueNames = [...new Set(collectionNames.filter(Boolean))]
	if (!uniqueNames.length) return

	const results = await Promise.allSettled(
		uniqueNames.map(async (collectionName) => ({
			collectionName,
			docs: await loadAdminCollectionDocs(collectionName),
		})),
	)
	const docsByCollection = new Map()
	results.forEach((result) => {
		if (result.status === "fulfilled") {
			docsByCollection.set(result.value.collectionName, result.value.docs)
		} else {
			console.warn("Admin action refresh failed:", result.reason)
		}
	})

	const renderOrder = [
		"bookings",
		"waitlist",
		"reviews",
		"contactMessages",
		"galleryStyles",
		"blogs",
	]
	renderOrder
		.filter((collectionName) => docsByCollection.has(collectionName))
		.forEach((collectionName) => {
			renderAdminRefreshedCollection(
				collectionName,
				docsByCollection.get(collectionName),
			)
		})
}

function getAdminReleasedSlotId(result = {}) {
	const payload = result?.data || result || {}
	return String(
		payload.releasedSlotId ||
			payload.released_slot_id ||
			payload.releasedSlot?.id ||
			payload.released_slot?.id ||
			"",
	).trim()
}

function normalizeManagedAdminUserDoc(doc = {}) {
	const role = normalizeAdminRoleValue(doc.role || "") || "admin"
	const permissions = normalizeAdminPermissionsValue(doc.permissions)
	const uid = String(
		doc.uid ||
			doc.userId ||
			doc.user_id ||
			doc.authUserId ||
			doc.auth_user_id ||
			"",
	).trim()
	const adminUserId = String(
		doc.adminUserId ||
			doc.admin_user_id ||
			doc.adminId ||
			doc.admin_id ||
			doc.id ||
			"",
	).trim()
	return {
		id: adminUserId || uid,
		adminUserId,
		uid,
		email: String(doc.email || "")
			.trim()
			.toLowerCase(),
		displayName: String(doc.displayName || doc.display_name || "").trim(),
		role,
		active: doc.active !== false,
		permissions,
		createdAt: doc.createdAt || doc.created_at || null,
		updatedAt: doc.updatedAt || doc.updated_at || null,
	}
}

function getCurrentAdminManagedUserDoc() {
	if (!adminAccessProfile && !auth?.currentUser) return null
	const currentUser = auth?.currentUser || {}
	return normalizeManagedAdminUserDoc({
		...(adminAccessProfile || {}),
		uid: adminAccessProfile?.uid || currentUser.uid,
		email: adminAccessProfile?.email || currentUser.email || "",
		displayName:
			adminAccessProfile?.displayName || currentUser.displayName || "",
		active: adminAccessProfile?.active === true,
	})
}

function mergeCurrentAdminIntoManagedUsers(docs = []) {
	const normalizedDocs = (Array.isArray(docs) ? docs : [])
		.map(normalizeManagedAdminUserDoc)
		.filter((item) => item.uid || item.adminUserId)
	const currentAdmin = getCurrentAdminManagedUserDoc()

	if (!currentAdmin?.uid) return normalizedDocs

	const currentIndex = normalizedDocs.findIndex(
		(item) => item.uid && item.uid === currentAdmin.uid,
	)

	if (currentIndex >= 0) {
		const existing = normalizedDocs[currentIndex]
		normalizedDocs[currentIndex] = {
			...existing,
			...currentAdmin,
			adminUserId: existing.adminUserId || currentAdmin.adminUserId,
			id:
				existing.adminUserId ||
				currentAdmin.adminUserId ||
				existing.id ||
				currentAdmin.id,
			active: currentAdmin.active === true ? true : existing.active,
		}
		return normalizedDocs
	}

	normalizedDocs.unshift(currentAdmin)
	return normalizedDocs
}

function getManagedAdminRoleLabel(role = "") {
	return normalizeAdminRoleValue(role) === "super_admin"
		? "Super Admin"
		: "Admin"
}

function getManagedAdminRoleBadgeClass(role = "") {
	return normalizeAdminRoleValue(role) === "super_admin"
		? "admin-role-badge super"
		: "admin-role-badge standard"
}

function getFilteredManagedAdmins(docs = []) {
	const list = Array.isArray(docs) ? docs : []
	const searchTerm = String(adminAdminsSearchTerm || "")
		.trim()
		.toLowerCase()
	const roleFilter = String(adminAdminsRoleFilter || "all")
		.trim()
		.toLowerCase()
	const statusFilter = String(adminAdminsStatusFilter || "all")
		.trim()
		.toLowerCase()

	return list.filter((item) => {
		const role = normalizeAdminRoleValue(item.role || "") || "admin"
		const status = item.active === true ? "active" : "inactive"

		if (roleFilter !== "all" && role !== roleFilter) return false
		if (statusFilter !== "all" && status !== statusFilter) return false
		if (!searchTerm) return true

		const haystack = [item.displayName, item.email, item.uid]
			.map((value) =>
				String(value || "")
					.trim()
					.toLowerCase(),
			)
			.join(" ")

		return haystack.includes(searchTerm)
	})
}

function canCurrentAdminToggleManagedAdmin(item = {}) {
	if (!item || typeof item !== "object") return false
	if (!adminUnlocked || !isCurrentSuperAdmin()) return false
	const targetUid = String(item.uid || "").trim()
	if (!targetUid) return false
	if (targetUid === auth?.currentUser?.uid) return false
	return true
}

function getManagedAdminToggleTooltip(item = {}) {
	if (!adminUnlocked || !isCurrentSuperAdmin()) {
		return "Only Super Admins can manage admin accounts."
	}
	if (String(item.uid || "").trim() === auth?.currentUser?.uid) {
		return "You cannot disable your own account."
	}
	return ""
}

function getAdminManagementFormElements() {
	return {
		form: document.getElementById("adminAdminsForm"),
		list: document.getElementById("adminAdminsList"),
		message: document.getElementById("adminAdminsMessage"),
		formTitle: document.getElementById("adminAdminsFormTitle"),
		saveBtn: document.getElementById("adminAdminsSaveBtn"),
		cancelEditBtn: document.getElementById("adminAdminsCancelEdit"),
		editUid: document.getElementById("adminAdminEditUid"),
		email: document.getElementById("adminManageEmail"),
		displayName: document.getElementById("adminManageDisplayName"),
		role: document.getElementById("adminManageRole"),
		active: document.getElementById("adminManageActive"),
		permManageAdmins: document.getElementById("adminPermManageAdmins"),
		permManageBookings: document.getElementById("adminPermManageBookings"),
		permManageContent: document.getElementById("adminPermManageContent"),
		permManageSecurity: document.getElementById("adminPermManageSecurity"),
	}
}

function getAdminManagementFormValues() {
	const el = getAdminManagementFormElements()
	const role = normalizeAdminRoleValue(el.role?.value || "") || "admin"
	const editUid = String(el.editUid?.value || "").trim()
	const existingAdminRecord = editUid
		? adminManagedUsersDocs.find((item) => item.uid === editUid)
		: null
	const payload = {
		adminUserId: existingAdminRecord?.adminUserId || "",
		uid: editUid,
		email: String(el.email?.value || "")
			.trim()
			.toLowerCase(),
		displayName: String(el.displayName?.value || "").trim(),
		role,
		active: el.active?.checked !== false,
		permissions: {
			canManageAdmins: el.permManageAdmins?.checked === true,
			canManageBookings: el.permManageBookings?.checked !== false,
			canManageContent: el.permManageContent?.checked !== false,
			canManageSecurity: el.permManageSecurity?.checked === true,
		},
	}

	if (payload.role === "super_admin") {
		payload.permissions = {
			canManageAdmins: true,
			canManageBookings: true,
			canManageContent: true,
			canManageSecurity: true,
		}
	}

	return payload
}

function syncAdminManagementPermissionsWithRole() {
	const el = getAdminManagementFormElements()
	if (!el.role) return

	const role = normalizeAdminRoleValue(el.role.value || "") || "admin"
	const lockPermissions = role === "super_admin"
	const permissionInputs = [
		el.permManageAdmins,
		el.permManageBookings,
		el.permManageContent,
		el.permManageSecurity,
	].filter(Boolean)

	permissionInputs.forEach((input) => {
		if (lockPermissions) input.checked = true
		input.disabled = lockPermissions
	})
}

function resetAdminManagementForm() {
	const el = getAdminManagementFormElements()
	if (!el.form) return

	el.form.reset()
	if (el.editUid) el.editUid.value = ""
	if (el.formTitle) el.formTitle.textContent = "Create Admin Access"
	if (el.saveBtn) el.saveBtn.textContent = "Create Admin"
	if (el.cancelEditBtn) el.cancelEditBtn.style.display = "none"
	if (el.role) el.role.value = "admin"
	if (el.active) el.active.checked = true
	if (el.permManageAdmins) el.permManageAdmins.checked = false
	if (el.permManageBookings) el.permManageBookings.checked = true
	if (el.permManageContent) el.permManageContent.checked = true
	if (el.permManageSecurity) el.permManageSecurity.checked = false
	syncAdminManagementPermissionsWithRole()
}

function focusAdminManagementForm(targetInput = null) {
	const el = getAdminManagementFormElements()
	if (!el.form) return

	setActiveAdminSection("admins")

	try {
		el.form.scrollIntoView({ behavior: "smooth", block: "start" })
	} catch (_) {
		el.form.scrollIntoView()
	}

	el.form.classList.remove("admin-gallery-form--focus-flash")
	void el.form.offsetWidth
	el.form.classList.add("admin-gallery-form--focus-flash")
	setTimeout(() => {
		el.form.classList.remove("admin-gallery-form--focus-flash")
	}, 1600)

	const focusTarget =
		targetInput || el.email || el.displayName || el.role || el.form
	setTimeout(() => {
		if (focusTarget && typeof focusTarget.focus === "function") {
			focusTarget.focus({ preventScroll: true })
			if (
				focusTarget.tagName === "INPUT" &&
				typeof focusTarget.select === "function"
			) {
				focusTarget.select()
			}
		}
	}, 260)
}

function loadManagedAdminUserIntoForm(uid = "") {
	const cleanUid = String(uid || "").trim()
	if (!cleanUid) return

	const item = adminManagedUsersDocs.find((doc) => doc.uid === cleanUid)
	if (!item) return

	const el = getAdminManagementFormElements()
	if (!el.form) return

	if (el.editUid) el.editUid.value = item.uid
	if (el.email) el.email.value = item.email || ""
	if (el.displayName) el.displayName.value = item.displayName || ""
	if (el.role) el.role.value = item.role || "admin"
	if (el.active) el.active.checked = item.active === true
	if (el.permManageAdmins)
		el.permManageAdmins.checked = item.permissions?.canManageAdmins === true
	if (el.permManageBookings)
		el.permManageBookings.checked =
			item.permissions?.canManageBookings !== false
	if (el.permManageContent)
		el.permManageContent.checked = item.permissions?.canManageContent !== false
	if (el.permManageSecurity)
		el.permManageSecurity.checked = item.permissions?.canManageSecurity === true

	if (el.formTitle) el.formTitle.textContent = "Update Admin Access"
	if (el.saveBtn) el.saveBtn.textContent = "Update Admin"
	if (el.cancelEditBtn) el.cancelEditBtn.style.display = "inline-flex"
	syncAdminManagementPermissionsWithRole()
	setAdminMessage("", "", "adminAdminsMessage")
	focusAdminManagementForm(el.email || el.displayName)
}

function renderAdminManagedUsers() {
	const el = getAdminManagementFormElements()
	if (!el.list) return

	const docs = Array.isArray(adminManagedUsersDocs)
		? [...adminManagedUsersDocs]
		: []
	const sorted = docs.sort((a, b) => {
		if (a.role !== b.role) return a.role === "super_admin" ? -1 : 1
		const aName = `${a.displayName || ""} ${a.email || ""}`.trim().toLowerCase()
		const bName = `${b.displayName || ""} ${b.email || ""}`.trim().toLowerCase()
		return aName.localeCompare(bName)
	})
	const filtered = getFilteredManagedAdmins(sorted)

	const total = sorted.length
	const active = sorted.filter((item) => item.active === true).length
	const superAdmins = sorted.filter(
		(item) => item.role === "super_admin",
	).length
	const standardAdmins = sorted.filter(
		(item) => item.role !== "super_admin",
	).length

	const totalEl = document.getElementById("adminAdminsTotalCount")
	const activeEl = document.getElementById("adminAdminsActiveCount")
	const superEl = document.getElementById("adminAdminsSuperCount")
	const standardEl = document.getElementById("adminAdminsStandardCount")

	if (totalEl) totalEl.textContent = String(total)
	if (activeEl) activeEl.textContent = String(active)
	if (superEl) superEl.textContent = String(superAdmins)
	if (standardEl) standardEl.textContent = String(standardAdmins)

	if (!sorted.length) {
		el.list.innerHTML =
			'<div class="admin-empty-state">No admin access records found.</div>'
		return
	}

	if (!filtered.length) {
		el.list.innerHTML =
			'<div class="admin-empty-state">No admins match the current search/filter.</div>'
		return
	}

	el.list.innerHTML = filtered
		.map((item) => {
			const canToggle = canCurrentAdminToggleManagedAdmin(item)
			const roleLabel = getManagedAdminRoleLabel(item.role)
			const roleBadgeClass = getManagedAdminRoleBadgeClass(item.role)
			const statusLabel = item.active ? "active" : "inactive"
			const toggleTooltip = getManagedAdminToggleTooltip(item)
			return `
      <article class="admin-review-item">
        <div class="admin-review-item-head">
          <div>
            <div class="admin-booking-name">${escapeHtml(item.displayName || item.email || item.uid)}</div>
            <div class="admin-booking-id">UID: ${escapeHtml(item.uid)}</div>
          </div>
	          <div class="admin-admin-inline-badges">
	            <span class="admin-status-badge ${item.active ? "admin-status-confirmed" : "admin-status-cancelled"}">${statusLabel}</span>
	            <span class="${roleBadgeClass}">${escapeHtml(roleLabel)}</span>
	          </div>
        </div>
        <div class="admin-review-meta">
          <div><span>Email:</span> ${escapeHtml(item.email || "N/A")}</div>
	          <div><span>Role:</span> ${escapeHtml(roleLabel)}</div>
          <div><span>Manage Admins:</span> ${item.permissions?.canManageAdmins ? "Yes" : "No"}</div>
          <div><span>Manage Bookings:</span> ${item.permissions?.canManageBookings ? "Yes" : "No"}</div>
          <div><span>Manage Content:</span> ${item.permissions?.canManageContent ? "Yes" : "No"}</div>
          <div><span>Manage Security:</span> ${item.permissions?.canManageSecurity ? "Yes" : "No"}</div>
        </div>
        <div class="admin-booking-actions">
          <button class="admin-action-btn" data-admin-user-action="edit" data-uid="${escapeHtml(item.uid)}">Edit</button>
	          <label class="admin-managed-toggle ${item.active ? "is-on" : "is-off"}">
	            <input
	              type="checkbox"
	              class="admin-managed-toggle-input"
	              data-admin-user-action="toggle-active"
	              data-uid="${escapeHtml(item.uid)}"
	              data-active="${item.active ? "true" : "false"}"
	              ${item.active ? "checked" : ""}
	              ${canToggle ? "" : "disabled"}
	              ${toggleTooltip ? `title="${escapeHtml(toggleTooltip)}"` : ""}
	            />
	            <span class="admin-managed-toggle-slider" aria-hidden="true"></span>
	            <span class="admin-managed-toggle-label">${item.active ? "Enabled" : "Disabled"}</span>
	          </label>
        </div>
      </article>
    `
		})
		.join("")
}

async function refreshAdminManagedUsers() {
	if (!adminUnlocked || !isCurrentSuperAdmin()) return

	const data = await callAdminListAdminUsersAction()
	const list = Array.isArray(data?.adminUsers)
		? data.adminUsers
		: Array.isArray(data?.admins)
			? data.admins
			: Array.isArray(data?.items)
				? data.items
				: []
	adminManagedUsersDocs = mergeCurrentAdminIntoManagedUsers(list)
	renderAdminManagedUsers()
}

async function saveManagedAdminUserFromForm(event) {
	event.preventDefault()
	if (!adminUnlocked || !isCurrentSuperAdmin()) return

	const el = getAdminManagementFormElements()
	const payload = getAdminManagementFormValues()
	const isEdit = Boolean(payload.uid)

	if (!payload.email || !payload.email.includes("@")) {
		setAdminMessage(
			"error",
			"❌ Please provide a valid admin email.",
			"adminAdminsMessage",
		)
		return
	}

	if (!payload.role) {
		setAdminMessage(
			"error",
			"❌ Please select a valid admin role.",
			"adminAdminsMessage",
		)
		return
	}

	setAdminButtonLoadingState(el.saveBtn, true, {
		loadingText: isEdit ? "Updating..." : "Creating...",
	})

	try {
		if (isEdit) {
			const targetAdmin = adminManagedUsersDocs.find(
				(item) => item.uid === payload.uid,
			)
			await callAdminUpdateAdminUserAction({
				adminUserId:
					payload.adminUserId || targetAdmin?.adminUserId || payload.uid,
				uid: payload.uid,
				email: payload.email,
				displayName: payload.displayName,
				role: payload.role,
				active: payload.active,
				permissions: payload.permissions,
			})
			setAdminMessage(
				"success",
				"✅ Admin access updated successfully.",
				"adminAdminsMessage",
			)
		} else {
			await callAdminCreateAdminUserAction({
				email: payload.email,
				displayName: payload.displayName,
				role: payload.role,
				active: payload.active,
				permissions: payload.permissions,
			})
			setAdminMessage(
				"success",
				"✅ Admin access created successfully.",
				"adminAdminsMessage",
			)
		}

		resetAdminManagementForm()
		await refreshAdminManagedUsers()
	} catch (error) {
		console.error("Save admin access failed:", error)
		setAdminMessage(
			"error",
			`❌ Failed to save admin access: ${error.message || "unknown error"}`,
			"adminAdminsMessage",
		)
	} finally {
		setAdminButtonLoadingState(el.saveBtn, false, {
			resetText: isEdit ? "Update Admin" : "Create Admin",
		})
	}
}

function setAdminUnlockedState(value) {
	adminUnlocked = value
	if (!value) {
		adminAccessProfile = null
		resetAdminLoginCredentials()
	}

	const panel = document.getElementById("adminPanel")
	const loginForm = document.getElementById("adminLoginForm")
	const logoutBtn = document.getElementById("adminLogoutBtn")
	const userState = document.getElementById("adminUserState")
	const currentUser = auth?.currentUser || null

	if (logoutBtn) {
		setAdminButtonLoadingState(logoutBtn, false, {
			resetText: "Log Out",
		})
	}

	if (panel) panel.style.display = value ? "block" : "none"
	if (loginForm) loginForm.style.display = value ? "none" : "grid"
	if (logoutBtn) logoutBtn.style.display = value ? "inline-flex" : "none"

	if (userState) {
		if (value && currentUser?.email) {
			const roleLabel =
				adminAccessProfile?.role === "super_admin" ? "Super Admin" : "Admin"
			userState.textContent = `Logged in as: ${currentUser.email} (${roleLabel})`
		} else {
			userState.textContent = "Not logged in"
		}
	}

	if (!value) {
		stopAdminBookingsListener()
		stopAdminGalleryListener()
		stopAdminBlogsListener()
		stopAdminReviewsListener()
		stopAdminContactListener()
		stopAdminWaitlistListener()
		stopAdminServiceSettingsListener()
		stopAdminSecurityListener()
		stopAdminSecurityAlertsListener()
		stopAdminAccountHistoryListener()
		stopAdminSessionsListener()
		stopAdminTimelineListener()
		stopAdminUsersListener()
		setAdminMessage("", "")
		setAdminMessage("", "", "adminGalleryMessage")
		setAdminMessage("", "", "adminBlogsMessage")
		setAdminMessage("", "", "adminReviewsMessage")
		setAdminMessage("", "", "adminContactMessage")
		setAdminMessage("", "", "adminWaitlistMessage")
		setAdminMessage("", "", "adminServicesMessage")
		setAdminMessage("", "", "adminSecurityMessage")
		setAdminMessage("", "", "adminSecurityEventsMessage")
		setAdminMessage("", "", "adminScheduleMessage")
		adminBookingDocs = []
		adminWaitlistDocs = []
		adminSecurityDocs = []
		adminSessionsDocs = []
		adminSecurityAlertsDocs = []
		adminAccountHistoryDocs = []
		adminTimelineDocs = []
		adminSecurityRawDocs = []
		adminUserDocs = []
		adminManagedUsersDocs = []
		adminScheduleSelectedBookingId = ""
		updateAdminSecurityWidgets()
		resetAdminManagementForm()
		renderAdminManagedUsers()
		renderAdminSchedule()
	} else {
		applyAdminSectionPermissions()
		startAdminBookingsListener()
		startAdminGalleryListener()
		startAdminBlogsListener()
		startAdminReviewsListener()
		startAdminContactListener()
		startAdminWaitlistListener()
		startAdminServiceSettingsListener()
		startAdminSecurityListener()
		startAdminSecurityAlertsListener()
		startAdminAccountHistoryListener()
		startAdminSessionsListener()
		startAdminTimelineListener()
		startAdminUsersListener()
		if (isCurrentSuperAdmin()) {
			void refreshAdminManagedUsers().catch((error) => {
				console.error("Loading admin management records failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to load admin access records: ${error.message || "unknown error"}`,
					"adminAdminsMessage",
				)
			})
		}
		setAdminMessage("success", "✅ Admin login successful.", "adminAuthMessage")
	}
}

function normalizeContactStatus(status) {
	const raw = String(status || "new")
		.trim()
		.toLowerCase()
	if (["new", "read", "resolved"].includes(raw)) return raw
	return "new"
}

function normalizeAdminContactStatusFilter(filter = "all") {
	const raw = String(filter || "all")
		.trim()
		.toLowerCase()
	if (raw === "all") return "all"
	if (["new", "read", "resolved"].includes(raw)) return raw
	return "all"
}

function getAdminStatusFilterLabel(status = "") {
	return String(status || "")
		.replace(/[-_]/g, " ")
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

function updateAdminContactStatusFilterControls() {
	const activeFilter = normalizeAdminContactStatusFilter(
		adminContactStatusFilter,
	)
	const controls = document.getElementById("adminContactStatusFilterControls")
	if (controls) controls.dataset.activeStatusFilter = activeFilter

	document
		.querySelectorAll("[data-contact-status-filter]")
		.forEach((button) => {
			const buttonFilter = normalizeAdminContactStatusFilter(
				button.dataset.contactStatusFilter,
			)
			const isActive = activeFilter !== "all" && buttonFilter === activeFilter
			button.classList.toggle("active", isActive)
			button.setAttribute("aria-pressed", isActive ? "true" : "false")
		})
}

function getContactStatusClass(status) {
	switch (normalizeContactStatus(status)) {
		case "resolved":
			return "admin-status-completed"
		case "read":
			return "admin-status-confirmed"
		default:
			return "admin-status-pending"
	}
}

function normalizeWaitlistStatus(status) {
	const raw = String(status || "waiting")
		.trim()
		.toLowerCase()
	if (raw === "canceled") return "cancelled"
	if (
		[
			"waiting",
			"contacted",
			"notified",
			"booked",
			"cancelled",
			"notification_failed",
		].includes(raw)
	) {
		return raw
	}
	return "waiting"
}

function getWaitlistStatusClass(status) {
	switch (normalizeWaitlistStatus(status)) {
		case "booked":
			return "admin-status-completed"
		case "contacted":
		case "notified":
			return "admin-status-confirmed"
		case "cancelled":
		case "notification_failed":
			return "admin-status-cancelled"
		default:
			return "admin-status-pending"
	}
}

function getWaitlistStatusLabel(status) {
	const normalized = normalizeWaitlistStatus(status)
	if (normalized === "notification_failed") return "notification failed"
	return normalized
}

function isWaitlistSlotOccupiedError(error = {}) {
	const code = String(error?.code || "")
		.trim()
		.toLowerCase()
	const reason = String(error?.details?.reason || "")
		.trim()
		.toLowerCase()
	const message = String(error?.message || "")
		.trim()
		.toLowerCase()

	return (
		reason === "slot-occupied" ||
		message.includes("preferred slot is still occupied") ||
		message.includes("slot is already taken") ||
		(code.includes("already-exists") && message.includes("slot"))
	)
}

function formatAdminWaitlistActionFailureMessage(error = {}, action = "") {
	if (action === "move-confirmed" && isWaitlistSlotOccupiedError(error)) {
		return "❌ Cannot move to confirmed: this client's preferred slot is still occupied by another booking. Cancel or release the existing confirmed booking first, then try Move to Confirmed again."
	}

	return `❌ Waitlist action failed: ${error.message || "unknown error"}`
}

function normalizeSecurityStatus(status = "") {
	const raw = String(status || "success")
		.trim()
		.toLowerCase()
	return raw === "failure" ? "failure" : "success"
}

function normalizeSecurityMethod(method = "") {
	const raw = String(method || "unknown")
		.trim()
		.toLowerCase()
	if (raw === "google") return "Google"
	if (raw === "email/password" || raw === "password" || raw === "email") {
		return "Email/Password"
	}
	if (raw === "anonymous") return "Anonymous"
	return "Unknown"
}

function normalizeSecurityDeviceType(deviceType = "") {
	const raw = String(deviceType || "unknown")
		.trim()
		.toLowerCase()
	if (["mobile", "desktop", "tablet"].includes(raw)) {
		return raw.charAt(0).toUpperCase() + raw.slice(1)
	}
	return "Unknown"
}

function getSecurityRiskLevelFromScore(riskScore = 0) {
	const score = Math.max(0, Math.min(100, Number(riskScore || 0)))
	if (score >= 60) return "high"
	if (score >= 25) return "medium"
	return "low"
}

function normalizeSecurityDoc(doc = {}) {
	const status = normalizeSecurityStatus(doc.status)
	const methodRaw = String(doc.method || "")
		.trim()
		.toLowerCase()
	let methodKey = "unknown"
	if (methodRaw === "google") methodKey = "google"
	else if (
		methodRaw === "email/password" ||
		methodRaw === "password" ||
		methodRaw === "email"
	) {
		methodKey = "email/password"
	} else if (methodRaw === "anonymous") {
		methodKey = "anonymous"
	}
	const suspiciousFlags = Array.isArray(doc.suspiciousFlags)
		? doc.suspiciousFlags
				.map((flag) => String(flag || "").trim())
				.filter(Boolean)
		: []
	const isSuspicious = doc.suspicious === true || suspiciousFlags.length > 0
	const lockUntilMs = toTimestampMs(doc.lockUntil)
	const lockActive =
		doc.lockActive === true && Boolean(lockUntilMs && lockUntilMs > Date.now())
	const failedAttemptsIn5m = Math.max(0, Number(doc.failedAttemptsIn5m || 0))
	const failedAttemptsIn15m = Math.max(0, Number(doc.failedAttemptsIn15m || 0))
	const riskScore = Math.max(0, Math.min(100, Number(doc.riskScore || 0)))
	const riskLevelRaw = String(doc.riskLevel || "")
		.trim()
		.toLowerCase()
	const riskLevel = ["low", "medium", "high"].includes(riskLevelRaw)
		? riskLevelRaw
		: getSecurityRiskLevelFromScore(riskScore)
	const riskReasons = Array.isArray(doc.riskReasons)
		? doc.riskReasons.map((entry) => String(entry || "").trim()).filter(Boolean)
		: []

	return {
		id: String(doc.id || ""),
		uid: String(doc.uid || ""),
		displayName: String(doc.displayName || "").trim(),
		email: String(doc.email || "").trim(),
		attemptedEmail: String(doc.attemptedEmail || "").trim(),
		methodKey,
		method: normalizeSecurityMethod(doc.method),
		deviceType: normalizeSecurityDeviceType(doc.deviceType),
		browser: String(doc.browser || "Unknown").trim() || "Unknown",
		locationLabel:
			String(doc.locationLabel || "").trim() ||
			[
				String(doc.locationCity || "").trim(),
				String(doc.locationCountry || "").trim(),
			]
				.filter(Boolean)
				.join(", ") ||
			"Unknown",
		ipMasked: String(doc.ipMasked || "").trim() || "Masked",
		status,
		failureCode: String(doc.failureCode || "").trim(),
		failedAttemptsIn5m,
		failedAttemptsIn15m,
		accountLockTriggered: doc.accountLockTriggered === true,
		lockActive,
		lockUntilMs,
		lockUntil: doc.lockUntil || null,
		riskScore,
		riskLevel,
		riskReasons,
		trustScore: Math.max(
			0,
			Math.min(
				100,
				doc.trustScore === undefined || doc.trustScore === null
					? 100 - riskScore
					: Number(doc.trustScore || 0),
			),
		),
		isSuspicious,
		suspiciousFlags,
		createdAt: doc.createdAt || null,
	}
}

function getAdminSecurityDayStartMs() {
	const now = new Date()
	now.setHours(0, 0, 0, 0)
	return now.getTime()
}

function setAdminSecurityWidgetState(widgetKey = "", severity = "normal") {
	const card = document.querySelector(
		`[data-security-widget="${String(widgetKey || "")}"]`,
	)
	if (!card) return

	card.classList.remove(
		"security-widget-normal",
		"security-widget-warn",
		"security-widget-danger",
	)

	const next = ["normal", "warn", "danger"].includes(severity)
		? severity
		: "normal"
	card.classList.add(`security-widget-${next}`)
}

function updateAdminSecurityWidgets() {
	const todayStartMs = getAdminSecurityDayStartMs()
	const todayActivities = adminSecurityRawDocs.filter(
		(item) => toTimestampMs(item.createdAt) >= todayStartMs,
	)

	const totalLoginsToday = todayActivities.length
	const failedLoginAttempts = todayActivities.filter(
		(item) => item.status === "failure",
	).length

	const googleSignInCount = todayActivities.filter(
		(item) => item.status === "success" && item.methodKey === "google",
	).length
	const emailSignInCount = todayActivities.filter(
		(item) => item.status === "success" && item.methodKey === "email/password",
	).length

	const anonymousIdentities = new Set()
	todayActivities.forEach((item) => {
		if (item.methodKey !== "anonymous") return
		const key = String(
			item.uid || item.attemptedEmail || item.email || item.id || "",
		)
			.trim()
			.toLowerCase()
		if (key) anonymousIdentities.add(key)
	})

	const activeUsersNow = new Set(
		adminSessionsDocs.filter((item) => item.online).map((item) => item.uid),
	).size

	const newRegistrationUidSet = new Set()
	const newRegistrationEmailSet = new Set()
	adminUserDocs.forEach((item) => {
		const createdAtMs = toTimestampMs(item.createdAt)
		if (!createdAtMs || createdAtMs < todayStartMs) return
		const uidKey = String(item.id || item.uid || "")
			.trim()
			.toLowerCase()
		const emailKey = String(item.email || "")
			.trim()
			.toLowerCase()
		if (uidKey) newRegistrationUidSet.add(uidKey)
		if (emailKey) newRegistrationEmailSet.add(emailKey)
	})

	const returningCustomerSet = new Set()
	todayActivities.forEach((item) => {
		if (item.status !== "success") return
		if (item.methodKey === "anonymous") return
		const uidKey = String(item.uid || "")
			.trim()
			.toLowerCase()
		const emailKey = String(item.email || item.attemptedEmail || "")
			.trim()
			.toLowerCase()

		if (uidKey) {
			if (!newRegistrationUidSet.has(uidKey)) returningCustomerSet.add(uidKey)
			return
		}

		if (emailKey && !newRegistrationEmailSet.has(emailKey)) {
			returningCustomerSet.add(emailKey)
		}
	})

	const setCount = (id, value) => {
		const el = document.getElementById(id)
		if (el) el.textContent = String(value)
	}

	setCount("adminSecurityWidgetTotalLoginsToday", totalLoginsToday)
	setCount("adminSecurityWidgetActiveUsersNow", activeUsersNow)
	setCount("adminSecurityWidgetFailedLoginAttempts", failedLoginAttempts)
	setCount("adminSecurityWidgetNewRegistrations", newRegistrationUidSet.size)
	setCount("adminSecurityWidgetReturningCustomers", returningCustomerSet.size)
	setCount("adminSecurityWidgetAnonymousUsers", anonymousIdentities.size)
	setCount("adminSecurityWidgetGoogleSignIns", googleSignInCount)
	setCount("adminSecurityWidgetEmailSignIns", emailSignInCount)

	const failureRate =
		totalLoginsToday > 0 ? failedLoginAttempts / totalLoginsToday : 0
	const anonymousShare =
		totalLoginsToday > 0 ? anonymousIdentities.size / totalLoginsToday : 0

	setAdminSecurityWidgetState(
		"failed-login-attempts",
		failedLoginAttempts >= 8 || failureRate >= 0.35
			? "danger"
			: failedLoginAttempts >= 3 || failureRate >= 0.15
				? "warn"
				: "normal",
	)

	setAdminSecurityWidgetState(
		"anonymous-users",
		anonymousIdentities.size >= 5 || anonymousShare >= 0.4
			? "danger"
			: anonymousIdentities.size >= 2 || anonymousShare >= 0.2
				? "warn"
				: "normal",
	)

	setAdminSecurityWidgetState(
		"total-logins-today",
		totalLoginsToday >= 220
			? "danger"
			: totalLoginsToday >= 120
				? "warn"
				: "normal",
	)

	setAdminSecurityWidgetState(
		"active-users-now",
		activeUsersNow >= 100 ? "danger" : activeUsersNow >= 50 ? "warn" : "normal",
	)

	setAdminSecurityWidgetState(
		"new-registrations",
		newRegistrationUidSet.size >= 70
			? "danger"
			: newRegistrationUidSet.size >= 30
				? "warn"
				: "normal",
	)

	setAdminSecurityWidgetState(
		"returning-customers",
		returningCustomerSet.size >= 140
			? "danger"
			: returningCustomerSet.size >= 80
				? "warn"
				: "normal",
	)

	setAdminSecurityWidgetState(
		"google-signins",
		googleSignInCount >= 90 ? "warn" : "normal",
	)

	setAdminSecurityWidgetState(
		"email-signins",
		emailSignInCount >= 130 ? "warn" : "normal",
	)
}

function sortAdminSecurityActivities(items = [], mode = adminSecuritySortMode) {
	const data = [...items]
	if (mode === "oldest") {
		return data.sort(
			(a, b) => toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt),
		)
	}

	if (mode === "failed-first") {
		return data.sort((a, b) => {
			if (a.status !== b.status) {
				return a.status === "failure" ? -1 : 1
			}
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "suspicious-first") {
		return data.sort((a, b) => {
			if (a.isSuspicious !== b.isSuspicious) {
				return a.isSuspicious ? -1 : 1
			}
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	return data.sort(
		(a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt),
	)
}

function applyAdminSecurityRiskFilter(items = [], riskFilter = "all") {
	const mode = String(riskFilter || "all")
		.trim()
		.toLowerCase()
	if (!mode || mode === "all") return [...items]
	return items.filter(
		(item) => String(item.riskLevel || "").toLowerCase() === mode,
	)
}

function applyAdminSecurityAdvancedFilters(items = []) {
	const dateFilter = String(adminSecurityDateFilter || "").trim()
	const dateFromFilter = String(adminSecurityDateFromFilter || "").trim()
	const dateToFilter = String(adminSecurityDateToFilter || "").trim()
	const deviceFilter = String(adminSecurityDeviceFilter || "all")
		.trim()
		.toLowerCase()
	const providerFilter = String(adminSecurityProviderFilter || "all")
		.trim()
		.toLowerCase()
	const userFilter = String(adminSecurityUserFilter || "all")
		.trim()
		.toLowerCase()
	const countryFilter = String(adminSecurityCountryFilter || "")
		.trim()
		.toLowerCase()
	const statusFilter = String(adminSecurityStatusFilter || "all")
		.trim()
		.toLowerCase()
	const searchTerm = String(adminSecuritySearchTerm || "")
		.trim()
		.toLowerCase()

	if (
		!dateFilter &&
		!dateFromFilter &&
		!dateToFilter &&
		deviceFilter === "all" &&
		providerFilter === "all" &&
		userFilter === "all" &&
		!countryFilter &&
		statusFilter === "all" &&
		!searchTerm
	) {
		return [...items]
	}

	return items.filter((item) => {
		const createdAtMs = toTimestampMs(item.createdAt)
		const createdAtDateKey = createdAtMs
			? formatAdminDateKey(new Date(createdAtMs))
			: ""

		if (dateFilter && createdAtDateKey !== dateFilter) return false
		if (
			dateFromFilter &&
			(!createdAtDateKey || createdAtDateKey < dateFromFilter)
		) {
			return false
		}
		if (
			dateToFilter &&
			(!createdAtDateKey || createdAtDateKey > dateToFilter)
		) {
			return false
		}

		if (deviceFilter !== "all") {
			const itemDevice = String(item.deviceType || "unknown")
				.trim()
				.toLowerCase()
			if (itemDevice !== deviceFilter) return false
		}

		if (providerFilter !== "all") {
			const itemProvider = String(item.methodKey || "unknown")
				.trim()
				.toLowerCase()
			if (itemProvider !== providerFilter) return false
		}

		if (userFilter === "anonymous") {
			if (String(item.methodKey || "").toLowerCase() !== "anonymous") {
				return false
			}
		}
		if (userFilter === "known-user") {
			const isAnonymous =
				String(item.methodKey || "").toLowerCase() === "anonymous"
			if (isAnonymous) return false
		}

		if (countryFilter) {
			const locationText = String(item.locationLabel || "").toLowerCase()
			if (!locationText.includes(countryFilter)) return false
		}

		if (statusFilter === "success" && item.status !== "success") return false
		if (statusFilter === "failure" && item.status !== "failure") return false

		if (searchTerm) {
			const searchableText = [
				item.email,
				item.attemptedEmail,
				item.displayName,
				item.uid,
				item.id,
			]
				.map((value) => String(value || "").toLowerCase())
				.join(" ")
			if (!searchableText.includes(searchTerm)) return false
		}

		return true
	})
}

function downloadAdminSecurityExportFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement("a")
	anchor.href = url
	anchor.download = filename
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
	URL.revokeObjectURL(url)
}

function escapeAdminSecurityExportCell(value = "") {
	const text = String(value ?? "")
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`
	}
	return text
}

function exportAdminSecurityLogsAsCSV() {
	const rows = Array.isArray(adminSecurityVisibleRows)
		? adminSecurityVisibleRows
		: []
	if (!rows.length) {
		setAdminMessage(
			"error",
			"❌ No security logs available to export with current filters.",
			"adminSecurityEventsMessage",
		)
		return
	}

	const headers = [
		"Timestamp",
		"User",
		"Email",
		"UID",
		"Method",
		"Device",
		"Browser",
		"Country",
		"Location",
		"Status",
		"Risk Level",
		"Risk Score",
		"Trust Score",
		"Failed Attempts 5m",
		"Failed Attempts 15m",
		"Lock Active",
		"Booking ID",
	]

	const lines = [headers.map(escapeAdminSecurityExportCell).join(",")]

	rows.forEach((item) => {
		const values = [
			formatAdminDate(item.createdAt),
			item.displayName || "",
			item.email || item.attemptedEmail || "",
			item.uid || "",
			item.method || "",
			item.deviceType || "",
			item.browser || "",
			String(item.locationLabel || "")
				.split(",")
				.pop()
				?.trim() || "",
			item.locationLabel || "",
			item.status || "",
			item.riskLevel || "",
			item.riskScore || 0,
			item.trustScore || 0,
			item.failedAttemptsIn5m || 0,
			item.failedAttemptsIn15m || 0,
			item.lockActive ? "Yes" : "No",
			item.id || "",
		]

		lines.push(values.map(escapeAdminSecurityExportCell).join(","))
	})

	const dateTag = formatAdminDateKey(new Date()) || "export"
	downloadAdminSecurityExportFile(
		`${lines.join("\n")}`,
		`security-logs-${dateTag}.csv`,
		"text/csv;charset=utf-8;",
	)

	setAdminMessage(
		"success",
		"✅ Security logs exported as CSV.",
		"adminSecurityEventsMessage",
	)
}

function exportAdminSecurityLogsAsExcel() {
	const rows = Array.isArray(adminSecurityVisibleRows)
		? adminSecurityVisibleRows
		: []
	if (!rows.length) {
		setAdminMessage(
			"error",
			"❌ No security logs available to export with current filters.",
			"adminSecurityEventsMessage",
		)
		return
	}

	const headers = [
		"Timestamp",
		"User",
		"Email",
		"UID",
		"Method",
		"Device",
		"Browser",
		"Country",
		"Location",
		"Status",
		"Risk Level",
		"Risk Score",
		"Trust Score",
		"Failed Attempts 5m",
		"Failed Attempts 15m",
		"Lock Active",
		"Booking ID",
	]

	const tableRows = rows
		.map((item) => {
			const values = [
				formatAdminDate(item.createdAt),
				item.displayName || "",
				item.email || item.attemptedEmail || "",
				item.uid || "",
				item.method || "",
				item.deviceType || "",
				item.browser || "",
				String(item.locationLabel || "")
					.split(",")
					.pop()
					?.trim() || "",
				item.locationLabel || "",
				item.status || "",
				item.riskLevel || "",
				item.riskScore || 0,
				item.trustScore || 0,
				item.failedAttemptsIn5m || 0,
				item.failedAttemptsIn15m || 0,
				item.lockActive ? "Yes" : "No",
				item.id || "",
			]

			return `<tr>${values
				.map((value) => `<td>${escapeHtml(value)}</td>`)
				.join("")}</tr>`
		})
		.join("")

	const excelHtml = `
<html>
<head>
<meta charset="UTF-8" />
</head>
<body>
<table border="1">
<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
<tbody>${tableRows}</tbody>
</table>
</body>
</html>`

	const dateTag = formatAdminDateKey(new Date()) || "export"
	downloadAdminSecurityExportFile(
		excelHtml,
		`security-logs-${dateTag}.xls`,
		"application/vnd.ms-excel;charset=utf-8;",
	)

	setAdminMessage(
		"success",
		"✅ Security logs exported as Excel.",
		"adminSecurityEventsMessage",
	)
}

function getAdminRiskFilterBadgeText(riskFilter = "all") {
	const mode = String(riskFilter || "all")
		.trim()
		.toLowerCase()
	if (!mode || mode === "all") return ""
	if (mode === "high") return "Filtering: High Risk only"
	if (mode === "medium") return "Filtering: Medium Risk only"
	if (mode === "low") return "Filtering: Low Risk only"
	return ""
}

function renderAdminRiskFilterBadge(riskFilter = "all") {
	const badge = document.getElementById("adminSecurityRiskFilterBadge")
	if (!badge) return

	const text = getAdminRiskFilterBadgeText(riskFilter)
	if (!text) {
		badge.style.display = "none"
		badge.textContent = ""
		return
	}

	badge.style.display = "block"
	badge.textContent = text
}

function renderAdminSecurityActivities(docs = []) {
	const mount = document.getElementById("adminSecurityActivityList")
	if (!mount) return

	const normalized = docs.map(normalizeSecurityDoc)
	adminSecurityRawDocs = normalized
	const sorted = sortAdminSecurityActivities(normalized, adminSecuritySortMode)
	adminSecurityDocs = sorted
	const riskFilteredRows = applyAdminSecurityRiskFilter(
		sorted,
		adminSecurityRiskFilter,
	)
	const visibleRows = applyAdminSecurityAdvancedFilters(riskFilteredRows)
	adminSecurityVisibleRows = visibleRows
	renderAdminRiskFilterBadge(adminSecurityRiskFilter)

	const total = sorted.length
	const successCount = sorted.filter((item) => item.status === "success").length
	const failedCount = sorted.filter((item) => item.status === "failure").length
	const suspiciousCount = sorted.filter((item) => item.isSuspicious).length
	const userIdentityKey = (item = {}) =>
		String(
			item.uid || item.email || item.attemptedEmail || item.ipMasked || item.id,
		)
			.trim()
			.toLowerCase() || `activity:${String(item.id || "").trim()}`
	const lockedUsers = new Set(
		sorted
			.filter((item) => item.lockActive || item.accountLockTriggered)
			.map(userIdentityKey)
			.filter(Boolean),
	)
	const repeatedWrongUsers = new Set(
		sorted
			.filter(
				(item) =>
					item.failedAttemptsIn5m >= 3 ||
					item.failedAttemptsIn15m >= 5 ||
					item.suspiciousFlags.includes("repeated_failures"),
			)
			.map(userIdentityKey)
			.filter(Boolean),
	)
	const lockedCount = lockedUsers.size
	const repeatedWrongCount = repeatedWrongUsers.size
	const highRiskCount = sorted.filter(
		(item) => item.riskLevel === "high",
	).length

	const totalEl = document.getElementById("adminSecurityTotalCount")
	const successEl = document.getElementById("adminSecuritySuccessCount")
	const failedEl = document.getElementById("adminSecurityFailedCount")
	const suspiciousEl = document.getElementById("adminSecuritySuspiciousCount")
	const lockedEl = document.getElementById("adminSecurityLockedCount")
	const repeatedWrongEl = document.getElementById(
		"adminSecurityRepeatedWrongCount",
	)
	const highRiskEl = document.getElementById("adminSecurityHighRiskCount")

	if (totalEl) totalEl.textContent = String(total)
	if (successEl) successEl.textContent = String(successCount)
	if (failedEl) failedEl.textContent = String(failedCount)
	if (suspiciousEl) suspiciousEl.textContent = String(suspiciousCount)
	if (lockedEl) lockedEl.textContent = String(lockedCount)
	if (repeatedWrongEl) repeatedWrongEl.textContent = String(repeatedWrongCount)
	if (highRiskEl) highRiskEl.textContent = String(highRiskCount)
	updateAdminSecurityWidgets()

	const shouldEnableVerticalScroll = sorted.length > 4
	mount.classList.toggle(
		"is-vertical-scroll-active",
		shouldEnableVerticalScroll,
	)
	mount.setAttribute(
		"data-scroll-active",
		shouldEnableVerticalScroll ? "true" : "false",
	)

	if (!sorted.length) {
		mount.innerHTML =
			'<div class="admin-empty-state">No login activity yet. Activity appears here once users attempt sign-in.</div>'
		return
	}

	if (!visibleRows.length) {
		mount.innerHTML =
			'<div class="admin-empty-state">No login activity matches the selected risk filter.</div>'
		return
	}

	mount.innerHTML = `
		<table class="admin-security-table">
			<thead>
				<tr>
					<th>User</th>
					<th>Method</th>
					<th>Device/Browser</th>
					<th>Location</th>
					<th>IP (Masked)</th>
					<th>Status</th>
					<th>Failed Attempts</th>
					<th>Lock Status</th>
					<th>Risk</th>
					<th>Suspicious</th>
					<th>Actions</th>
					<th>Time</th>
				</tr>
			</thead>
			<tbody>
				${visibleRows
					.map((item) => {
						const userLabel =
							item.displayName || item.email || item.uid || "Unknown user"
						const userEmail = String(
							item.email || item.attemptedEmail || "",
						).trim()
						const userEmailHtml =
							userEmail && userEmail !== userLabel
								? `<div class="admin-booking-id">${escapeHtml(userEmail)}</div>`
								: ""
						const statusClass =
							item.status === "success"
								? "admin-status-completed"
								: "admin-status-cancelled"
						const suspiciousText = item.isSuspicious
							? item.suspiciousFlags.join(", ") || "Flagged"
							: "No"
						const failedAttemptsText = `${item.failedAttemptsIn5m}/5m • ${item.failedAttemptsIn15m}/15m`
						const lockText = item.lockActive
							? `Active until ${formatAdminDate(item.lockUntil)}`
							: item.accountLockTriggered
								? "Triggered"
								: "No"
						const riskText = `${item.riskLevel.toUpperCase()} (${item.riskScore})`
						const trustText = `Trust ${item.trustScore}`
						const riskClass = getRiskStatusClass(item.riskLevel)
						const riskReasonText = item.riskReasons.length
							? ` • ${item.riskReasons.join(", ")}`
							: ""
						const securityIdentity = String(item.uid || "").trim()
						const securityEmail = String(
							item.email || item.attemptedEmail || "",
						).trim()
						const actionControls = securityIdentity
							? `
								<div class="admin-booking-actions admin-security-inline-actions">
									<button class="admin-action-btn" data-security-action="temporary-block" data-uid="${escapeHtml(securityIdentity)}" data-email="${escapeHtml(securityEmail)}">Temp Block</button>
									<button class="admin-action-btn danger" data-security-action="force-logout" data-uid="${escapeHtml(securityIdentity)}" data-email="${escapeHtml(securityEmail)}">Force Logout</button>
									<button class="admin-action-btn" data-security-action="force-password-reset" data-uid="${escapeHtml(securityIdentity)}" data-email="${escapeHtml(securityEmail)}">Force Password Reset</button>
									<button class="admin-action-btn" data-security-action="clear-restrictions" data-uid="${escapeHtml(securityIdentity)}" data-email="${escapeHtml(securityEmail)}">Clear Restrictions</button>
								</div>
							`
							: '<span style="font-size:12px; opacity:.7;">No linked account for security actions</span>'
						const actionCols = 12

						return `
							<tr class="admin-security-row-main">
								<td><div>${escapeHtml(userLabel)}</div>${userEmailHtml}</td>
								<td>${escapeHtml(item.method)}</td>
								<td>${escapeHtml(`${item.deviceType} ${item.browser}`)}</td>
								<td>${escapeHtml(item.locationLabel)}</td>
								<td>${escapeHtml(item.ipMasked)}</td>
								<td><span class="admin-status ${statusClass}">${escapeHtml(item.status)}</span></td>
								<td>${escapeHtml(failedAttemptsText)}</td>
								<td>${escapeHtml(lockText)}</td>
								<td><span class="admin-status ${riskClass}">${escapeHtml(riskText)}</span><div style="margin-top:4px; font-size:12px; opacity:.85;">${escapeHtml(trustText)}</div>${riskReasonText ? `<div style="margin-top:4px; font-size:12px; opacity:.85;">${escapeHtml(riskReasonText)}</div>` : ""}</td>
								<td>${escapeHtml(suspiciousText)}</td>
								<td><span style="opacity:.7; font-size:12px;">See below</span></td>
								<td>${escapeHtml(formatAdminDate(item.createdAt))}</td>
							</tr>
							<tr class="admin-security-row-actions">
								<td colspan="${actionCols}">${actionControls}</td>
							</tr>
						`
					})
					.join("")}
			</tbody>
		</table>
	`
}

function normalizeSessionDoc(doc = {}) {
	const userPath = String(doc.__name__?.path || "")
	const pathMatch = userPath.match(/userSessions\/([^/]+)\/sessions\//i)
	const uidFromPath = pathMatch?.[1] || ""
	const uid = String(doc.uid || uidFromPath || "").trim()
	const sessionId = String(doc.sessionId || doc.id || "").trim()
	const online = doc.online === true
	const lastActiveMs =
		Number(doc.lastActiveAtMs || 0) || toTimestampMs(doc.lastActiveAt) || 0
	const startedAtMs =
		Number(doc.startedAtMs || 0) ||
		toTimestampMs(doc.startedAt) ||
		lastActiveMs ||
		0

	return {
		id: String(doc.id || ""),
		uid,
		sessionId,
		email: String(doc.email || "").trim(),
		displayName: String(doc.displayName || "").trim(),
		deviceType: normalizeSecurityDeviceType(doc.deviceType),
		browser: String(doc.browser || "Unknown").trim() || "Unknown",
		method: normalizeSecurityMethod(doc.methodHint || doc.method || "unknown"),
		timezone: String(doc.timezone || "").trim(),
		locale: String(doc.locale || "").trim(),
		online,
		lastActiveMs,
		startedAtMs,
		lastActiveAt: doc.lastActiveAt || null,
		startedAt: doc.startedAt || null,
	}
}

function sortAdminSessions(items = [], mode = adminSessionsSortMode) {
	const data = [...items]

	if (mode === "last-active-newest") {
		return data.sort((a, b) => (b.lastActiveMs || 0) - (a.lastActiveMs || 0))
	}

	if (mode === "longest-session") {
		const nowMs = Date.now()
		return data.sort((a, b) => {
			const aDuration = Math.max(0, nowMs - (a.startedAtMs || nowMs))
			const bDuration = Math.max(0, nowMs - (b.startedAtMs || nowMs))
			if (aDuration !== bDuration) return bDuration - aDuration
			return (b.lastActiveMs || 0) - (a.lastActiveMs || 0)
		})
	}

	if (mode === "multi-device-first") {
		const onlineCountByUid = new Map()
		data.forEach((item) => {
			if (!item.uid || !item.online) return
			onlineCountByUid.set(item.uid, (onlineCountByUid.get(item.uid) || 0) + 1)
		})

		return data.sort((a, b) => {
			const aMulti = (onlineCountByUid.get(a.uid) || 0) >= 2
			const bMulti = (onlineCountByUid.get(b.uid) || 0) >= 2
			if (aMulti !== bMulti) return aMulti ? -1 : 1
			if (a.online !== b.online) return a.online ? -1 : 1
			return (b.lastActiveMs || 0) - (a.lastActiveMs || 0)
		})
	}

	return data.sort((a, b) => {
		if (a.online !== b.online) return a.online ? -1 : 1
		return (b.lastActiveMs || 0) - (a.lastActiveMs || 0)
	})
}

function formatSessionDuration(startedAtMs = 0, endMs = Date.now()) {
	const durationMs = Math.max(0, Number(endMs || 0) - Number(startedAtMs || 0))
	const totalMinutes = Math.floor(durationMs / (60 * 1000))
	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60
	if (hours <= 0) return `${minutes}m`
	return `${hours}h ${minutes}m`
}

function renderAdminSessions(docs = []) {
	const mount = document.getElementById("adminSessionsList")
	if (!mount) return

	const nowMs = Date.now()
	const normalized = docs
		.map(normalizeSessionDoc)
		.filter((item) => item.uid && item.sessionId)
		.map((item) => {
			const isOnlineByHeartbeat =
				item.online &&
				nowMs - (item.lastActiveMs || 0) <= ADMIN_SESSION_STALE_AFTER_MS
			return {
				...item,
				online: isOnlineByHeartbeat,
			}
		})

	const dedupMap = new Map()
	normalized.forEach((item) => {
		const key = `${item.uid}::${item.sessionId}`
		const existing = dedupMap.get(key)
		if (!existing || (item.lastActiveMs || 0) > (existing.lastActiveMs || 0)) {
			dedupMap.set(key, item)
		}
	})

	const deduped = Array.from(dedupMap.values())
	const sorted = sortAdminSessions(deduped, adminSessionsSortMode)
	adminSessionsDocs = sorted
	updateAdminSecurityWidgets()

	const onlineSessions = sorted.filter((item) => item.online)
	const onlineUsers = new Set(
		onlineSessions.map((item) => item.uid).filter(Boolean),
	)
	const onlineCountByUid = new Map()
	onlineSessions.forEach((item) => {
		onlineCountByUid.set(item.uid, (onlineCountByUid.get(item.uid) || 0) + 1)
	})
	const multiDeviceUsers = Array.from(onlineCountByUid.values()).filter(
		(count) => count >= 2,
	).length

	const totalEl = document.getElementById("adminSessionsTotalCount")
	const onlineUsersEl = document.getElementById("adminSessionsOnlineUsersCount")
	const onlineSessionsEl = document.getElementById("adminSessionsOnlineCount")
	const multiDeviceEl = document.getElementById("adminSessionsMultiDeviceCount")

	if (totalEl) totalEl.textContent = String(sorted.length)
	if (onlineUsersEl) onlineUsersEl.textContent = String(onlineUsers.size)
	if (onlineSessionsEl)
		onlineSessionsEl.textContent = String(onlineSessions.length)
	if (multiDeviceEl) multiDeviceEl.textContent = String(multiDeviceUsers)

	const shouldEnableVerticalScroll = sorted.length > 4
	mount.classList.toggle(
		"is-vertical-scroll-active",
		shouldEnableVerticalScroll,
	)
	mount.setAttribute(
		"data-scroll-active",
		shouldEnableVerticalScroll ? "true" : "false",
	)

	if (!sorted.length) {
		mount.innerHTML =
			'<div class="admin-empty-state">No active session data yet. User sessions will appear here in realtime.</div>'
		return
	}

	mount.innerHTML = `
		<table class="admin-security-table">
			<thead>
				<tr>
					<th>User</th>
					<th>Device/Browser</th>
					<th>Status</th>
					<th>Last Active</th>
					<th>Duration</th>
					<th>Devices</th>
				</tr>
			</thead>
			<tbody>
				${sorted
					.map((item) => {
						const userLabel =
							item.displayName || item.email || item.uid || "Unknown user"
						const userOnlineDeviceCount = onlineCountByUid.get(item.uid) || 0
						const multiDeviceText =
							userOnlineDeviceCount >= 2
								? `User logged in from ${userOnlineDeviceCount} devices`
								: `${userOnlineDeviceCount || 0} active device`
						const durationText = formatSessionDuration(item.startedAtMs, nowMs)
						return `
							<tr>
								<td>${escapeHtml(userLabel)}</td>
								<td>${escapeHtml(`${item.deviceType} ${item.browser}`)}</td>
								<td><span class="admin-status ${item.online ? "admin-status-confirmed" : "admin-status-pending"}">${item.online ? "online" : "offline"}</span></td>
								<td>${escapeHtml(item.lastActiveMs ? formatAdminDate(item.lastActiveAt || item.lastActiveMs) : "N/A")}</td>
								<td>${escapeHtml(durationText)}</td>
								<td>${escapeHtml(multiDeviceText)}</td>
							</tr>
						`
					})
					.join("")}
			</tbody>
		</table>
	`
}

function normalizeAlertSeverity(severity = "") {
	const raw = String(severity || "")
		.trim()
		.toLowerCase()
	if (["low", "medium", "high"].includes(raw)) return raw
	return "medium"
}

function normalizeAlertStatus(status = "") {
	const raw = String(status || "")
		.trim()
		.toLowerCase()
	if (["open", "investigating", "resolved"].includes(raw)) return raw
	return "open"
}

function normalizeSecurityAlertDoc(doc = {}) {
	const type = String(doc.type || "")
		.trim()
		.toLowerCase()
	const severity = normalizeAlertSeverity(doc.severity)
	const status = normalizeAlertStatus(doc.status)
	const message =
		String(doc.message || "").trim() ||
		String(type || "security alert").replace(/_/g, " ")

	return {
		id: String(doc.id || ""),
		type,
		severity,
		status,
		message,
		email: String(doc.email || "").trim(),
		displayName: String(doc.displayName || "").trim(),
		uid: String(doc.uid || "").trim(),
		createdAt: doc.createdAt || null,
	}
}

function sortAdminSecurityAlerts(
	items = [],
	mode = adminSecurityAlertsSortMode,
) {
	const data = [...items]
	if (mode === "oldest") {
		return data.sort(
			(a, b) => toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt),
		)
	}

	if (mode === "high-first") {
		const priority = { high: 0, medium: 1, low: 2 }
		return data.sort((a, b) => {
			const pDiff = (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9)
			if (pDiff !== 0) return pDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "open-first") {
		return data.sort((a, b) => {
			const aOpen = a.status !== "resolved"
			const bOpen = b.status !== "resolved"
			if (aOpen !== bOpen) return aOpen ? -1 : 1
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	return data.sort(
		(a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt),
	)
}

function getAdminSeverityClass(severity = "medium") {
	if (severity === "high") return "admin-status-cancelled"
	if (severity === "low") return "admin-status-completed"
	return "admin-status-pending"
}

function getRiskStatusClass(riskLevel = "low") {
	if (riskLevel === "high") return "admin-status-cancelled"
	if (riskLevel === "medium") return "admin-status-pending"
	return "admin-status-completed"
}

function renderAdminSecurityAlerts(docs = []) {
	const mount = document.getElementById("adminSecurityAlertsList")
	if (!mount) return

	const normalized = docs.map(normalizeSecurityAlertDoc)
	const sorted = sortAdminSecurityAlerts(
		normalized,
		adminSecurityAlertsSortMode,
	)
	adminSecurityAlertsDocs = sorted

	const totalEl = document.getElementById("adminSecurityAlertsTotalCount")
	const openEl = document.getElementById("adminSecurityAlertsOpenCount")
	const highEl = document.getElementById("adminSecurityAlertsHighCount")

	const total = sorted.length
	const openCount = sorted.filter((item) => item.status !== "resolved").length
	const highCount = sorted.filter((item) => item.severity === "high").length

	if (totalEl) totalEl.textContent = String(total)
	if (openEl) openEl.textContent = String(openCount)
	if (highEl) highEl.textContent = String(highCount)

	const shouldEnableVerticalScroll = sorted.length > 4
	mount.classList.toggle(
		"is-vertical-scroll-active",
		shouldEnableVerticalScroll,
	)
	mount.setAttribute(
		"data-scroll-active",
		shouldEnableVerticalScroll ? "true" : "false",
	)

	if (!sorted.length) {
		mount.innerHTML =
			'<div class="admin-empty-state">No security alerts yet. Alerts will appear here in realtime.</div>'
		return
	}

	mount.innerHTML = `
		<table class="admin-security-table">
			<thead>
				<tr>
					<th>Alert</th>
					<th>User</th>
					<th>Severity</th>
					<th>Status</th>
					<th>Time</th>
				</tr>
			</thead>
			<tbody>
				${sorted
					.map((item) => {
						const userLabel =
							item.displayName || item.email || item.uid || "Unknown user"
						return `
							<tr>
								<td>${escapeHtml(item.message)}</td>
								<td>${escapeHtml(userLabel)}</td>
								<td><span class="admin-status ${getAdminSeverityClass(item.severity)}">${escapeHtml(item.severity)}</span></td>
								<td>${escapeHtml(item.status)}</td>
								<td>${escapeHtml(formatAdminDate(item.createdAt))}</td>
							</tr>
						`
					})
					.join("")}
			</tbody>
		</table>
	`
}

function normalizeAccountHistoryDoc(doc = {}) {
	const changeType = String(doc.changeType || "")
		.trim()
		.toLowerCase()
	const changeLabel =
		String(doc.changeLabel || "").trim() ||
		String(changeType || "account updated").replace(/_/g, " ")

	return {
		id: String(doc.id || ""),
		changeType,
		changeLabel,
		details: String(doc.details || "").trim(),
		email: String(doc.email || "").trim(),
		displayName: String(doc.displayName || "").trim(),
		uid: String(doc.uid || "").trim(),
		createdAt: doc.createdAt || null,
	}
}

function sortAdminAccountHistory(
	items = [],
	mode = adminAccountHistorySortMode,
) {
	const data = [...items]
	if (mode === "oldest") {
		return data.sort(
			(a, b) => toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt),
		)
	}

	if (mode === "critical-first") {
		const critical = new Set([
			"password_changed",
			"email_changed",
			"account_deleted",
			"account_deactivated",
		])
		return data.sort((a, b) => {
			const aCritical = critical.has(a.changeType)
			const bCritical = critical.has(b.changeType)
			if (aCritical !== bCritical) return aCritical ? -1 : 1
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "type") {
		return data.sort((a, b) => {
			const typeDiff = String(a.changeLabel || "").localeCompare(
				String(b.changeLabel || ""),
				undefined,
				{ sensitivity: "base" },
			)
			if (typeDiff !== 0) return typeDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	return data.sort(
		(a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt),
	)
}

function renderAdminAccountHistory(docs = []) {
	const mount = document.getElementById("adminAccountHistoryList")
	if (!mount) return

	const normalized = docs.map(normalizeAccountHistoryDoc)
	const sorted = sortAdminAccountHistory(
		normalized,
		adminAccountHistorySortMode,
	)
	adminAccountHistoryDocs = sorted

	const totalEl = document.getElementById("adminAccountHistoryTotalCount")
	if (totalEl) totalEl.textContent = String(sorted.length)

	const shouldEnableVerticalScroll = sorted.length > 4
	mount.classList.toggle(
		"is-vertical-scroll-active",
		shouldEnableVerticalScroll,
	)
	mount.setAttribute(
		"data-scroll-active",
		shouldEnableVerticalScroll ? "true" : "false",
	)

	if (!sorted.length) {
		mount.innerHTML =
			'<div class="admin-empty-state">No account change history yet. Entries will appear here in realtime.</div>'
		return
	}

	mount.innerHTML = `
		<table class="admin-security-table">
			<thead>
				<tr>
					<th>Change</th>
					<th>User</th>
					<th>Details</th>
					<th>Time</th>
				</tr>
			</thead>
			<tbody>
				${sorted
					.map((item) => {
						const userLabel =
							item.displayName || item.email || item.uid || "Unknown user"
						return `
							<tr>
								<td>${escapeHtml(item.changeLabel)}</td>
								<td>${escapeHtml(userLabel)}</td>
								<td>${escapeHtml(item.details || "-")}</td>
								<td>${escapeHtml(formatAdminDate(item.createdAt))}</td>
							</tr>
						`
					})
					.join("")}
			</tbody>
		</table>
	`
}

function normalizeTimelineType(type = "") {
	const raw = String(type || "")
		.trim()
		.toLowerCase()
	if (
		[
			"booking_created",
			"booking_canceled",
			"review_posted",
			"review_edited",
			"contact_submitted",
		].includes(raw)
	) {
		return raw
	}
	return "activity"
}

function getTimelineTypeLabel(type = "") {
	if (type === "booking_created") return "Booking Created"
	if (type === "booking_canceled") return "Booking Canceled"
	if (type === "review_posted") return "Review Posted"
	if (type === "review_edited") return "Review Edited"
	if (type === "contact_submitted") return "Contact Submitted"
	return "Activity"
}

function getTimelineTypeClass(type = "") {
	if (type === "booking_created") return "admin-status-completed"
	if (type === "booking_canceled") return "admin-status-cancelled"
	if (type === "review_posted" || type === "review_edited") {
		return "admin-status-confirmed"
	}
	if (type === "contact_submitted") return "admin-status-pending"
	return "admin-status-pending"
}

function normalizeTimelineDoc(doc = {}) {
	const type = normalizeTimelineType(doc.type)
	const context =
		typeof doc.context === "object" &&
		doc.context &&
		!Array.isArray(doc.context)
			? doc.context
			: {}
	const summary =
		String(doc.summary || "").trim() ||
		`${String(doc.displayName || doc.email || doc.uid || "User").trim() || "User"} ${getTimelineTypeLabel(type).toLowerCase()}`

	return {
		id: String(doc.id || "").trim(),
		type,
		typeLabel: getTimelineTypeLabel(type),
		summary,
		uid: String(doc.uid || "").trim(),
		email: String(doc.email || "").trim(),
		displayName: String(doc.displayName || "").trim(),
		source: String(doc.source || "").trim(),
		context,
		createdAt: doc.createdAt || null,
	}
}

function sortAdminTimeline(items = [], mode = adminTimelineSortMode) {
	const data = [...items]

	if (mode === "oldest") {
		return data.sort(
			(a, b) => toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt),
		)
	}

	if (mode === "bookings-first") {
		const priority = { booking_created: 0, booking_canceled: 0 }
		return data.sort((a, b) => {
			const pDiff = (priority[a.type] ?? 9) - (priority[b.type] ?? 9)
			if (pDiff !== 0) return pDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "reviews-first") {
		const priority = { review_posted: 0, review_edited: 0 }
		return data.sort((a, b) => {
			const pDiff = (priority[a.type] ?? 9) - (priority[b.type] ?? 9)
			if (pDiff !== 0) return pDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "contact-first") {
		const priority = { contact_submitted: 0 }
		return data.sort((a, b) => {
			const pDiff = (priority[a.type] ?? 9) - (priority[b.type] ?? 9)
			if (pDiff !== 0) return pDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	return data.sort(
		(a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt),
	)
}

function renderAdminTimeline(docs = []) {
	const mount = document.getElementById("adminTimelineList")
	if (!mount) return

	const normalized = docs.map(normalizeTimelineDoc)
	const sorted = sortAdminTimeline(normalized, adminTimelineSortMode)
	adminTimelineDocs = sorted

	const totalEl = document.getElementById("adminTimelineTotalCount")
	if (totalEl) totalEl.textContent = String(sorted.length)

	const shouldEnableVerticalScroll = sorted.length > 4
	mount.classList.toggle(
		"is-vertical-scroll-active",
		shouldEnableVerticalScroll,
	)
	mount.setAttribute(
		"data-scroll-active",
		shouldEnableVerticalScroll ? "true" : "false",
	)

	if (!sorted.length) {
		mount.innerHTML =
			'<div class="admin-empty-state">No booking/action timeline events yet. User behavior events will appear here in realtime.</div>'
		return
	}

	mount.innerHTML = `
		<table class="admin-security-table">
			<thead>
				<tr>
					<th>Time</th>
					<th>Event</th>
					<th>User</th>
					<th>Summary</th>
				</tr>
			</thead>
			<tbody>
				${sorted
					.map((item) => {
						const userLabel =
							item.displayName || item.email || item.uid || "Unknown user"
						return `
							<tr>
								<td>${escapeHtml(formatAdminDate(item.createdAt))}</td>
								<td><span class="admin-status ${getTimelineTypeClass(item.type)}">${escapeHtml(item.typeLabel)}</span></td>
								<td>${escapeHtml(userLabel)}</td>
								<td>${escapeHtml(item.summary)}</td>
							</tr>
						`
					})
					.join("")}
			</tbody>
		</table>
	`
}

function normalizeContactDoc(doc = {}) {
	return {
		id: String(doc.id || ""),
		name: String(doc.name || "Anonymous").trim() || "Anonymous",
		email: String(doc.email || "").trim(),
		subject: String(doc.subject || "").trim() || "No subject",
		message: String(doc.message || "").trim(),
		status: normalizeContactStatus(doc.status),
		uid: String(doc.uid || "").trim(),
		createdAt: doc.createdAt || null,
		updatedAt: doc.updatedAt || null,
	}
}

function sortAdminContactMessages(items = [], mode = adminMessagesSortMode) {
	const data = [...items]

	if (mode === "oldest") {
		return data.sort((a, b) => {
			const createdDiff =
				toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
			if (createdDiff !== 0) return createdDiff
			return toTimestampMs(a.updatedAt) - toTimestampMs(b.updatedAt)
		})
	}

	if (mode === "status-new-first") {
		const priority = { new: 0, read: 1, resolved: 2 }
		return data.sort((a, b) => {
			const pDiff =
				(priority[normalizeContactStatus(a.status)] ?? 9) -
				(priority[normalizeContactStatus(b.status)] ?? 9)
			if (pDiff !== 0) return pDiff
			const updatedDiff =
				toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
			if (updatedDiff !== 0) return updatedDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "status-unresolved-first") {
		return data.sort((a, b) => {
			const aResolved = normalizeContactStatus(a.status) === "resolved"
			const bResolved = normalizeContactStatus(b.status) === "resolved"
			if (aResolved !== bResolved) return aResolved ? 1 : -1
			const updatedDiff =
				toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
			if (updatedDiff !== 0) return updatedDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "name-az") {
		return data.sort((a, b) => {
			const nameDiff = String(a.name || "").localeCompare(
				String(b.name || ""),
				undefined,
				{
					sensitivity: "base",
				},
			)
			if (nameDiff !== 0) return nameDiff
			return toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
		})
	}

	return data.sort((a, b) => {
		const updatedDiff = toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
		if (updatedDiff !== 0) return updatedDiff
		return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
	})
}

function renderAdminContactMessages(docs) {
	const list = document.getElementById("adminContactList")
	if (!list) return

	const sourceDocs = Array.isArray(docs) ? docs : []
	const normalizedItems = sourceDocs.map(normalizeContactDoc)
	adminContactDocs = normalizedItems
	const items = sortAdminContactMessages(normalizedItems)
	adminContactStatusFilter = normalizeAdminContactStatusFilter(
		adminContactStatusFilter,
	)
	updateAdminContactStatusFilterControls()

	const total = items.length
	const newCount = items.filter((m) => m.status === "new").length
	const readCount = items.filter((m) => m.status === "read").length
	const resolvedCount = items.filter((m) => m.status === "resolved").length

	const totalEl = document.getElementById("adminMessagesTotalCount")
	const newEl = document.getElementById("adminMessagesNewCount")
	const readEl = document.getElementById("adminMessagesReadCount")
	const resolvedEl = document.getElementById("adminMessagesResolvedCount")

	if (totalEl) totalEl.textContent = String(total)
	if (newEl) newEl.textContent = String(newCount)
	if (readEl) readEl.textContent = String(readCount)
	if (resolvedEl) resolvedEl.textContent = String(resolvedCount)

	if (!items.length) {
		list.innerHTML =
			'<div class="admin-empty-state">No contact messages yet. New messages will appear in realtime.</div>'
		return
	}

	const visibleItems =
		adminContactStatusFilter === "all"
			? items
			: items.filter((item) => item.status === adminContactStatusFilter)

	if (!visibleItems.length) {
		const filterLabel = getAdminStatusFilterLabel(adminContactStatusFilter)
		list.innerHTML = `<div class="admin-empty-state">No ${escapeHtml(filterLabel)} messages match this filter right now.</div>`
		return
	}

	list.innerHTML = visibleItems
		.map(
			(item) => `
      <article class="admin-review-item">
        <div class="admin-review-item-head">
          <div>
            <div class="admin-booking-name">${escapeHtml(item.name)}</div>
            <div class="admin-booking-id">Message ID: ${escapeHtml(item.id)}</div>
          </div>
          <span class="admin-status-badge ${getContactStatusClass(item.status)}">${item.status}</span>
        </div>
        <div class="admin-review-meta">
          <div><span>Email:</span> ${item.email ? `<a class="admin-inline-link" href="mailto:${encodeURIComponent(item.email)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.email)}</a>` : "N/A"}</div>
          <div><span>Subject:</span> ${escapeHtml(item.subject)}</div>
          <div><span>Sent:</span> ${formatAdminDate(item.createdAt)}</div>
          <div><span>Updated:</span> ${formatAdminDate(item.updatedAt)}</div>
        </div>
        <div class="admin-booking-special-request">
          <span>Message Received:</span>
          <p>${item.message ? escapeHtml(item.message) : "No message content provided."}</p>
        </div>
        <div class="admin-booking-actions">
          <button class="admin-action-btn" data-contact-action="new" data-id="${item.id}">Mark New</button>
          <button class="admin-action-btn" data-contact-action="read" data-id="${item.id}">Mark Read</button>
          <button class="admin-action-btn" data-contact-action="resolved" data-id="${item.id}">Resolve</button>
          <button class="admin-action-btn danger" data-contact-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `,
		)
		.join("")
}

async function updateContactMessageStatus(messageId, status) {
	await db
		.collection("contactMessages")
		.doc(messageId)
		.set(
			{
				status: normalizeContactStatus(status),
				updatedAt: getServerTimestamp(),
			},
			{ merge: true },
		)
}

async function deleteContactMessage(messageId) {
	const confirmed = await showAdminConfirmModal(
		"Delete this contact message permanently? This action cannot be undone.",
		"Delete Message",
	)
	if (!confirmed) return
	await db.collection("contactMessages").doc(messageId).delete()
}

function getAdminWaitlistCustomerName(item = {}) {
	return (
		`${item.firstName || ""} ${item.lastName || ""}`.trim() ||
		String(item.name || "").trim() ||
		"Unknown Client"
	)
}

function formatAdminOrdinalPosition(value = 0) {
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

function isActiveAdminWaitlistQueueStatus(status = "") {
	return ["waiting", "notified", "contacted", "notification_failed"].includes(
		normalizeWaitlistStatus(status),
	)
}

function getAdminWaitlistQueueKey(item = {}) {
	const slotId = String(item.preferredSlotId || item.slotId || "").trim()
	if (slotId) return `slot:${slotId}`
	return [
		String(item.preferredDate || "").trim(),
		String(item.preferredTime || "").trim(),
		String(item.stylistKey || item.stylist || "any")
			.trim()
			.toLowerCase() || "any",
	]
		.join("|")
		.toLowerCase()
}

function decorateAdminWaitlistPositions(items = []) {
	const queueMap = new Map()
	items.forEach((item) => {
		if (!isActiveAdminWaitlistQueueStatus(item.status)) return
		const key = getAdminWaitlistQueueKey(item)
		if (!queueMap.has(key)) queueMap.set(key, [])
		queueMap.get(key).push(item)
	})

	queueMap.forEach((queueItems) => {
		queueItems.sort((a, b) => {
			const createdDiff =
				toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
			if (createdDiff !== 0) return createdDiff
			return String(a.id || "").localeCompare(String(b.id || ""))
		})
		queueItems.forEach((item, index) => {
			item.queuePosition = index + 1
			item.queuePositionLabel = formatAdminOrdinalPosition(index + 1)
			item.queueSize = queueItems.length
		})
	})

	return items.map((item) => ({
		...item,
		queuePosition: isActiveAdminWaitlistQueueStatus(item.status)
			? Number(item.queuePosition || 0) || null
			: null,
		queuePositionLabel: isActiveAdminWaitlistQueueStatus(item.status)
			? String(item.queuePositionLabel || "").trim()
			: "",
		queueSize: isActiveAdminWaitlistQueueStatus(item.status)
			? Number(item.queueSize || 0) || null
			: null,
	}))
}

function getAdminWaitlistQueueInfoForBooking(booking = {}) {
	const directPosition = Number(booking.waitlistPosition || 0) || null
	const directLabel = String(booking.waitlistPositionLabel || "").trim()
	const directSize = Number(booking.waitlistQueueSize || 0) || null
	if (directPosition || directLabel) {
		return {
			position: directPosition,
			label: directLabel || formatAdminOrdinalPosition(directPosition),
			size: directSize,
		}
	}

	const waitlistId = String(booking.waitlistId || "").trim()
	if (!waitlistId) return { position: null, label: "", size: null }
	const linked = adminWaitlistDocs.find(
		(item) => String(item.id || "") === waitlistId,
	)
	if (!linked) return { position: null, label: "", size: null }

	const position = Number(linked.queuePosition || 0) || null
	return {
		position,
		label:
			String(linked.queuePositionLabel || "").trim() ||
			formatAdminOrdinalPosition(position),
		size: Number(linked.queueSize || 0) || null,
	}
}

function getAdminWaitlistEntryForBooking(booking = {}) {
	const waitlistId = String(booking.waitlistId || "").trim()
	if (!waitlistId) return null
	return (
		adminWaitlistDocs.find(
			(item) => String(item.id || "").trim() === waitlistId,
		) || null
	)
}

function isAdminBookingVisibleInWaitlistFilter(booking = {}) {
	const status = normalizeStatus(extractRawStatus(booking))
	if (status !== "waitlisted") return false

	const linkedWaitlistEntry = getAdminWaitlistEntryForBooking(booking)
	if (!linkedWaitlistEntry) return true

	return isActiveAdminWaitlistQueueStatus(linkedWaitlistEntry.status)
}

function formatAdminQueueSummary(queueInfo = {}) {
	const label = String(queueInfo.label || "").trim()
	if (!label || label === "N/A") return "N/A"
	const size = Number(queueInfo.size || 0) || null
	return size ? `${label} of ${size}` : label
}

function renderAdminWaitlistQueueChip(queueInfo = {}, extraClass = "") {
	const label = String(queueInfo.label || "").trim()
	if (!label || label === "N/A") return ""

	const size = Number(queueInfo.size || 0) || null
	const chipClasses = [
		"waitlist-queue-chip",
		"admin-waitlist-queue-chip",
		String(extraClass || "").trim(),
	]
		.filter(Boolean)
		.join(" ")
	const accessibleLabel = size
		? `Waitlist place: ${label} of ${size}`
		: `Waitlist place: ${label}`

	return `
		<span class="${escapeHtml(chipClasses)}" aria-label="${escapeHtml(accessibleLabel)}">
			<span class="waitlist-queue-chip__rank">${escapeHtml(label)}</span>
			<span class="waitlist-queue-chip__text">in queue</span>
			${size ? `<span class="waitlist-queue-chip__size">of ${escapeHtml(size)}</span>` : ""}
		</span>
	`
}

function findAdminBookingForWaitlistEntry(waitlistItem = {}) {
	const waitlistId = String(waitlistItem.id || "").trim()
	if (!waitlistId) return null
	return adminBookingDocs.find((booking = {}) => {
		const status = normalizeStatus(extractRawStatus(booking))
		if (status !== "waitlisted") return false
		return String(booking.waitlistId || "").trim() === waitlistId
	})
}

function findAnyAdminBookingForWaitlistEntry(
	waitlistItem = {},
	bookings = adminBookingDocs,
) {
	const waitlistId = String(waitlistItem.id || "").trim()
	const explicitBookingIds = [
		waitlistItem.bookingId,
		waitlistItem.convertedBookingId,
	]
		.map((value) => String(value || "").trim())
		.filter(Boolean)
	const bookingDocs = Array.isArray(bookings) ? bookings : []

	return (
		bookingDocs.find((booking = {}) => {
			const bookingId = String(booking.id || "").trim()
			if (bookingId && explicitBookingIds.includes(bookingId)) return true
			return (
				waitlistId && String(booking.waitlistId || "").trim() === waitlistId
			)
		}) || null
	)
}

function buildAdminWaitlistFilterRows(bookings = []) {
	const bookingDocs = Array.isArray(bookings) ? bookings : []
	const waitlistEntries = Array.isArray(adminWaitlistDocs)
		? sortAdminWaitlistEntries(adminWaitlistDocs)
		: []

	if (!waitlistEntries.length) {
		return bookingDocs.filter((booking) =>
			isAdminBookingVisibleInWaitlistFilter(booking),
		)
	}

	return waitlistEntries.map((waitlistEntry) => {
		const linkedBooking = findAnyAdminBookingForWaitlistEntry(
			waitlistEntry,
			bookingDocs,
		)
		return {
			...(linkedBooking || {}),
			id: String(linkedBooking?.id || "").trim(),
			status: normalizeStatus(extractRawStatus(linkedBooking || {})),
			__adminWaitlistEntry: waitlistEntry,
			__adminLinkedBooking: linkedBooking || null,
			__adminWaitlistFilterRecord: true,
		}
	})
}

function renderAdminWaitlistActionButtons(item = {}, linkedBooking = null) {
	const status = normalizeWaitlistStatus(item.status)
	const safeWaitlistId = escapeHtml(String(item.id || "").trim())
	const linkedBookingId = String(linkedBooking?.id || "").trim()
	const linkedBookingStatus = linkedBookingId
		? normalizeStatus(extractRawStatus(linkedBooking || {}))
		: ""
	const linkedBookingIsWaitlisted =
		Boolean(linkedBookingId) && linkedBookingStatus === "waitlisted"
	const linkedBookingBlocksStatusOnlyActions =
		Boolean(linkedBookingId) && !linkedBookingIsWaitlisted
	const isQueued = isActiveAdminWaitlistQueueStatus(status)
	const buttons = []

	const addButton = (
		action,
		label,
		{
			className = "",
			tooltip = "",
			bookingId = linkedBookingId,
			disabled = false,
		} = {},
	) => {
		const safeAction = escapeHtml(action)
		const classes = ["admin-action-btn", className].filter(Boolean).join(" ")
		const tooltipAttr = tooltip
			? ` data-tooltip="${escapeHtml(tooltip)}" title="${escapeHtml(tooltip)}"`
			: ""
		const disabledAttr = disabled ? " disabled" : ""
		buttons.push(
			`<button class="${escapeHtml(classes)}"${tooltipAttr}${disabledAttr} data-waitlist-action="${safeAction}" data-id="${safeWaitlistId}" data-booking-id="${escapeHtml(bookingId)}">${escapeHtml(label)}</button>`,
		)
	}

	if (isQueued) {
		if (linkedBookingIsWaitlisted) {
			addButton("move-confirmed", "Move to Confirmed (Locks Slot)", {
				tooltip:
					"Converts this waitlisted booking to confirmed only when the preferred slot is available.",
			})
		} else {
			const moveTooltip = linkedBookingId
				? `Move to Confirmed is unavailable because the linked booking is already ${getStatusLabel(linkedBookingStatus)}.`
				: "Move to Confirmed requires a linked waitlisted booking so the slot can be safely locked. Use Mark Booked only for status-only closure."
			addButton("move-confirmed", "Move to Confirmed (Locks Slot)", {
				tooltip: moveTooltip,
				disabled: true,
			})
		}
	}

	if (!linkedBookingBlocksStatusOnlyActions && isQueued) {
		if (status !== "waiting") {
			addButton("waiting", "Set Waiting")
		}

		if (["waiting", "notified", "notification_failed"].includes(status)) {
			addButton("contacted", "Mark Contacted")
		}

		if (!linkedBookingIsWaitlisted) {
			addButton("booked", "Mark Booked / Close Waitlist", {
				tooltip:
					"Status-only action. It closes this waitlist entry without locking a booking slot.",
			})
		}

		addButton("cancelled", "Cancel Request", { className: "danger" })
	}

	if (!buttons.length) {
		return `<button class="admin-action-btn" disabled title="No valid waitlist actions are available for this row right now.">No quick actions available</button>`
	}

	return buttons.join("")
}

function normalizeWaitlistDoc(doc = {}) {
	return {
		id: String(doc.id || ""),
		bookingId: String(doc.bookingId || "").trim(),
		convertedBookingId: String(doc.convertedBookingId || "").trim(),
		firstName: String(doc.firstName || "").trim(),
		lastName: String(doc.lastName || "").trim(),
		name: String(doc.name || "").trim(),
		email: String(doc.email || "").trim(),
		phone: String(doc.phone || "").trim(),
		service: String(doc.service || "").trim(),
		stylist: String(doc.stylist || "").trim(),
		stylistKey: String(doc.stylistKey || "").trim(),
		preferredDate: String(doc.preferredDate || doc.date || "").trim(),
		preferredTime: String(doc.preferredTime || doc.time || "").trim(),
		preferredSlotId: String(doc.preferredSlotId || doc.slotId || "").trim(),
		notes: String(doc.notes || doc.specialRequest || "").trim(),
		inspirationImageUrl: String(
			doc.inspirationImageUrl ||
				doc.inspirationImage ||
				doc.referenceImageUrl ||
				"",
		).trim(),
		status: normalizeWaitlistStatus(doc.status),
		notificationChannel: String(doc.notificationChannel || "").trim(),
		uid: String(doc.uid || "").trim(),
		createdAt: doc.createdAt || null,
		updatedAt: doc.updatedAt || null,
		notifiedAt: doc.notifiedAt || null,
		contactedAt: doc.contactedAt || null,
		bookedAt: doc.bookedAt || null,
		cancelledAt: doc.cancelledAt || null,
		queuePosition: Number(doc.queuePosition || 0) || null,
		queuePositionLabel: String(doc.queuePositionLabel || "").trim(),
		queueSize: Number(doc.queueSize || 0) || null,
	}
}

function getAdminWaitlistAppointmentMs(item = {}) {
	const date = parseAdminBookingDate(item.preferredDate)
	if (!date) return 0
	const minutes = parseAdminBookingTimeToMinutes(item.preferredTime)
	date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
	return date.getTime()
}

function sortAdminWaitlistEntries(items = [], mode = adminWaitlistSortMode) {
	const data = [...items]

	if (mode === "oldest") {
		return data.sort((a, b) => {
			const createdDiff =
				toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
			if (createdDiff !== 0) return createdDiff
			return String(a.id || "").localeCompare(String(b.id || ""))
		})
	}

	if (mode === "date-time") {
		return data.sort((a, b) => {
			const aAppointment =
				getAdminWaitlistAppointmentMs(a) || Number.MAX_SAFE_INTEGER
			const bAppointment =
				getAdminWaitlistAppointmentMs(b) || Number.MAX_SAFE_INTEGER
			if (aAppointment !== bAppointment) return aAppointment - bAppointment
			return toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
		})
	}

	if (mode === "status-waiting-first") {
		const priority = {
			waiting: 0,
			notification_failed: 1,
			notified: 2,
			contacted: 2,
			booked: 3,
			cancelled: 4,
		}
		return data.sort((a, b) => {
			const pDiff =
				(priority[normalizeWaitlistStatus(a.status)] ?? 9) -
				(priority[normalizeWaitlistStatus(b.status)] ?? 9)
			if (pDiff !== 0) return pDiff
			return toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
		})
	}

	if (mode === "name-az") {
		return data.sort((a, b) => {
			const nameDiff = getAdminWaitlistCustomerName(a).localeCompare(
				getAdminWaitlistCustomerName(b),
				undefined,
				{ sensitivity: "base" },
			)
			if (nameDiff !== 0) return nameDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	return data.sort((a, b) => {
		const updatedDiff = toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
		if (updatedDiff !== 0) return updatedDiff
		return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
	})
}

function renderAdminWaitlist(docs = []) {
	const list = document.getElementById("adminWaitlistList")
	if (!list) return

	const normalizedItems = decorateAdminWaitlistPositions(
		docs.map(normalizeWaitlistDoc),
	)
	adminWaitlistDocs = normalizedItems
	renderAdminBookings(adminBookingDocs)

	const items = sortAdminWaitlistEntries(normalizedItems)

	const total = items.length
	const waiting = items.filter((item) => item.status === "waiting").length
	const contacted = items.filter((item) =>
		["contacted", "notified"].includes(item.status),
	).length
	const booked = items.filter((item) => item.status === "booked").length
	const cancelled = items.filter((item) => item.status === "cancelled").length

	const totalEl = document.getElementById("adminWaitlistTotalCount")
	const waitingEl = document.getElementById("adminWaitlistWaitingCount")
	const contactedEl = document.getElementById("adminWaitlistContactedCount")
	const bookedEl = document.getElementById("adminWaitlistBookedCount")
	const cancelledEl = document.getElementById("adminWaitlistCancelledCount")

	if (totalEl) totalEl.textContent = String(total)
	if (waitingEl) waitingEl.textContent = String(waiting)
	if (contactedEl) contactedEl.textContent = String(contacted)
	if (bookedEl) bookedEl.textContent = String(booked)
	if (cancelledEl) cancelledEl.textContent = String(cancelled)

	if (!items.length) {
		list.innerHTML =
			'<div class="admin-empty-state">No waitlist requests yet. Clients who join a booked slot waitlist will appear here in realtime.</div>'
		return
	}

	list.innerHTML = items
		.map((item) => {
			const customerName = getAdminWaitlistCustomerName(item)
			const statusLabel = getWaitlistStatusLabel(item.status)
			const stylistLabel = item.stylist || item.stylistKey || "Any Available"
			const notes = item.notes || "No notes provided."
			const notifiedMeta = item.notifiedAt
				? formatAdminDate(item.notifiedAt)
				: "Not notified"
			const channelLabel = item.notificationChannel || "N/A"
			const isQueued = isActiveAdminWaitlistQueueStatus(item.status)
			const queueSummary = isQueued
				? formatAdminQueueSummary({
						label: item.queuePositionLabel,
						size: item.queueSize,
					})
				: "N/A"
			const queueChip = isQueued
				? renderAdminWaitlistQueueChip({
						label: item.queuePositionLabel,
						size: item.queueSize,
					})
				: ""
			const linkedBooking = findAnyAdminBookingForWaitlistEntry(item)
			const linkedBookingId = String(linkedBooking?.id || "").trim()
			const waitlistActions = renderAdminWaitlistActionButtons(
				item,
				linkedBooking,
			)

			return `
	      <article class="admin-review-item admin-waitlist-card ${isQueued ? "admin-waitlist-card--queued" : ""}">
        <div class="admin-review-item-head">
          <div>
	            <div class="admin-booking-name-row">
	              <div class="admin-booking-name">${escapeHtml(customerName)}</div>
	              ${queueChip}
	            </div>
            <div class="admin-booking-id">Waitlist ID: ${escapeHtml(item.id)}</div>
            ${linkedBookingId ? `<div class="admin-booking-id">Linked Booking: ${escapeHtml(linkedBookingId)}</div>` : ""}
          </div>
          <span class="admin-status-badge ${getWaitlistStatusClass(item.status)}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="admin-review-meta">
          <div><span>Waitlist Place:</span> ${escapeHtml(queueSummary)}</div>
          <div><span>Service:</span> ${escapeHtml(item.service || "N/A")}</div>
          <div><span>Stylist:</span> ${escapeHtml(stylistLabel)}</div>
          <div><span>Preferred Date:</span> ${escapeHtml(formatAdminDate(item.preferredDate))}</div>
          <div><span>Preferred Time:</span> ${escapeHtml(item.preferredTime || "N/A")}</div>
          <div><span>Slot ID:</span> ${escapeHtml(item.preferredSlotId || "N/A")}</div>
          <div><span>Email:</span> ${item.email ? `<a class="admin-inline-link" href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email)}</a>` : "N/A"}</div>
          <div><span>Phone:</span> ${item.phone ? `<a class="admin-inline-link" href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a>` : "N/A"}</div>
          <div><span>Joined:</span> ${escapeHtml(formatAdminDate(item.createdAt))}</div>
          <div><span>Updated:</span> ${escapeHtml(formatAdminDate(item.updatedAt))}</div>
          <div><span>Notified:</span> ${escapeHtml(notifiedMeta)}</div>
          <div><span>Channel:</span> ${escapeHtml(channelLabel)}</div>
        </div>
        <div class="admin-booking-special-request">
          <span>Waitlist Notes:</span>
          <p>${escapeHtml(notes)}</p>
        </div>
        <div class="admin-booking-inspiration">
          <div><span>Inspiration Image:</span> ${item.inspirationImageUrl ? `<a class="admin-inline-link" href="${escapeHtml(item.inspirationImageUrl)}" target="_blank" rel="noopener">Open full image</a>` : "Not provided"}</div>
        </div>
        <div class="admin-booking-actions">
          ${waitlistActions}
        </div>
      </article>
    `
		})
		.join("")
}

function getLinkedBookingIdForWaitlist(waitlistId = "") {
	const safeWaitlistId = String(waitlistId || "").trim()
	if (!safeWaitlistId) return ""
	const linkedBooking = adminBookingDocs.find(
		(booking = {}) =>
			String(booking.waitlistId || "").trim() === safeWaitlistId,
	)
	return String(linkedBooking?.id || "").trim()
}

async function updateLinkedWaitlistBookingStatus(
	waitlistId,
	status,
	bookingId = "",
	actorEmail = "admin",
) {
	const safeBookingId =
		String(bookingId || "").trim() || getLinkedBookingIdForWaitlist(waitlistId)
	if (!safeBookingId) return

	const normalizedStatus = normalizeWaitlistStatus(status)
	const serverNow = getServerTimestamp()
	const payload = {
		waitlistStatus: normalizedStatus,
		waitlistAdminUpdatedBy: actorEmail,
		waitlistUpdatedAt: serverNow,
		updatedAt: serverNow,
	}

	if (normalizedStatus === "cancelled") {
		payload.status = "cancelled"
		payload.isWaitlisted = false
		payload.cancelledAt = serverNow
		payload.cancelledBy = actorEmail
	} else {
		payload.status = "waitlisted"
		payload.bookingType = "waitlist"
		payload.isWaitlisted = true
	}

	await db
		.collection("bookings")
		.doc(safeBookingId)
		.set(payload, { merge: true })
}

async function updateWaitlistStatus(waitlistId, status, bookingId = "") {
	const normalizedStatus = normalizeWaitlistStatus(status)
	const actorEmail = auth?.currentUser?.email || "admin"
	const serverNow = getServerTimestamp()
	const payload = {
		status: normalizedStatus,
		adminUpdatedBy: actorEmail,
		updatedAt: serverNow,
	}

	if (normalizedStatus === "contacted") {
		payload.contactedAt = serverNow
		payload.contactedBy = actorEmail
	}

	if (normalizedStatus === "booked") {
		payload.bookedAt = serverNow
		payload.bookedBy = actorEmail
	}

	if (normalizedStatus === "cancelled") {
		payload.cancelledAt = serverNow
		payload.cancelledBy = actorEmail
	}

	await db.collection("waitlist").doc(waitlistId).set(payload, { merge: true })

	const result = {
		waitlistUpdated: true,
		linkedBookingSynced: true,
		linkedBookingError: null,
	}

	try {
		await updateLinkedWaitlistBookingStatus(
			waitlistId,
			normalizedStatus,
			bookingId,
			actorEmail,
		)
	} catch (error) {
		console.warn("Linked waitlist booking sync failed:", error)
		result.linkedBookingSynced = false
		result.linkedBookingError = error
	}

	return result
}

async function handleAdminWaitlistActionButton(
	actionBtn,
	messageTargetId = "adminWaitlistMessage",
) {
	if (!actionBtn || !adminUnlocked || !auth?.currentUser) return

	const action = actionBtn.dataset.waitlistAction
	const waitlistId = actionBtn.dataset.id
	if (!action || !waitlistId) return

	setAdminButtonLoadingState(actionBtn, true, {
		loadingText: "Applying...",
	})

	try {
		if (action === "move-confirmed") {
			const bookingId = String(actionBtn.dataset.bookingId || "").trim()
			if (!bookingId) {
				throw new Error(
					"This waitlist row has no linked waitlisted booking yet.",
				)
			}
			await callAdminMoveWaitlistBookingToConfirmedAction({
				bookingId,
				waitlistId,
			})
			setAdminMessage(
				"success",
				"✅ Waitlist request moved to confirmed booking and slot locked.",
				messageTargetId,
			)
		} else {
			const updateResult = await updateWaitlistStatus(
				waitlistId,
				action,
				String(actionBtn.dataset.bookingId || "").trim(),
			)
			const syncWarning =
				updateResult?.linkedBookingSynced === false
					? ` ⚠️ Waitlist status was saved, but linked booking sync needs attention: ${updateResult.linkedBookingError?.message || "unknown error"}`
					: ""
			const successMessage =
				action === "booked"
					? "✅ Waitlist request marked as booked/closed. This is a status-only update and does not lock a slot. Use Move to Confirmed when the preferred slot is available."
					: `✅ Waitlist request marked as ${getWaitlistStatusLabel(action)}.`
			setAdminMessage(
				"success",
				`${successMessage}${syncWarning}`,
				messageTargetId,
			)
		}
	} catch (error) {
		console.error("Waitlist action failed:", error)
		setAdminMessage(
			"error",
			formatAdminWaitlistActionFailureMessage(error, action),
			messageTargetId,
		)
	} finally {
		setAdminButtonLoadingState(actionBtn, false)
	}
}

function normalizeReviewStatus(status) {
	const raw = String(status || "pending")
		.trim()
		.toLowerCase()
	if (["pending", "approved", "rejected"].includes(raw)) return raw
	return "pending"
}

function normalizeAdminReviewStatusFilter(filter = "all") {
	const raw = String(filter || "all")
		.trim()
		.toLowerCase()
	if (raw === "all") return "all"
	if (["pending", "approved", "rejected"].includes(raw)) return raw
	return "all"
}

function updateAdminReviewStatusFilterControls() {
	const activeFilter = normalizeAdminReviewStatusFilter(adminReviewStatusFilter)
	const controls = document.getElementById("adminReviewStatusFilterControls")
	if (controls) controls.dataset.activeStatusFilter = activeFilter

	document.querySelectorAll("[data-review-status-filter]").forEach((button) => {
		const buttonFilter = normalizeAdminReviewStatusFilter(
			button.dataset.reviewStatusFilter,
		)
		const isActive = activeFilter !== "all" && buttonFilter === activeFilter
		button.classList.toggle("active", isActive)
		button.setAttribute("aria-pressed", isActive ? "true" : "false")
	})
}

function extractReviewStatus(review = {}) {
	return review.status ?? review.reviewStatus ?? "pending"
}

function getReviewStatusClass(status) {
	switch (normalizeReviewStatus(status)) {
		case "approved":
			return "admin-status-confirmed"
		case "rejected":
			return "admin-status-cancelled"
		default:
			return "admin-status-pending"
	}
}

function normalizeReviewDoc(doc = {}) {
	const name =
		String(doc.name || "Anonymous Client").trim() || "Anonymous Client"
	const text = String(doc.text || "").trim()
	const source = String(doc.source || "Website").trim() || "Website"
	const service = String(doc.service || "").trim()
	const ratingRaw = Number(doc.rating)
	const rating = Number.isFinite(ratingRaw)
		? Math.max(1, Math.min(5, Math.round(ratingRaw)))
		: 5

	return {
		id: doc.id,
		name,
		text,
		source,
		service,
		rating,
		photoUrl: String(doc.photoUrl || "").trim(),
		adminReply: String(doc.adminReply || "").trim(),
		reportsCount: Number(doc.reportsCount || 0),
		verifiedBooking: doc.verifiedBooking === true,
		approvedBy: String(doc.approvedBy || "").trim(),
		approvedAt: doc.approvedAt || null,
		status: normalizeReviewStatus(extractReviewStatus(doc)),
		featured: doc.featured === true,
		uid: doc.uid || "",
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	}
}

function getAdminProfanityWords() {
	try {
		const raw = localStorage.getItem(ADMIN_REVIEW_KEYS.profanityWords)
		if (!raw) return [...DEFAULT_ADMIN_PROFANITY_WORDS]
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return [...DEFAULT_ADMIN_PROFANITY_WORDS]
		const cleaned = parsed
			.map((w) =>
				String(w || "")
					.trim()
					.toLowerCase(),
			)
			.filter(Boolean)
		return cleaned.length ? cleaned : [...DEFAULT_ADMIN_PROFANITY_WORDS]
	} catch (_error) {
		return [...DEFAULT_ADMIN_PROFANITY_WORDS]
	}
}

function setAdminProfanityWords(words = []) {
	const cleaned = words
		.map((w) =>
			String(w || "")
				.trim()
				.toLowerCase(),
		)
		.filter(Boolean)
	localStorage.setItem(
		ADMIN_REVIEW_KEYS.profanityWords,
		JSON.stringify(cleaned.length ? cleaned : DEFAULT_ADMIN_PROFANITY_WORDS),
	)
}

function getFlaggedWordsInText(text = "") {
	const normalized = String(text || "").toLowerCase()
	if (!normalized) return []
	return getAdminProfanityWords().filter((word) => normalized.includes(word))
}

function sortAdminReviewsList(items = [], mode = adminReviewsSortMode) {
	const data = [...items]

	if (mode === "newest") {
		return data.sort((a, b) => {
			const updatedDiff =
				toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
			if (updatedDiff !== 0) return updatedDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	if (mode === "highest-rated") {
		return data.sort((a, b) => {
			const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0)
			if (ratingDiff !== 0) return ratingDiff
			if (a.featured !== b.featured) return a.featured ? -1 : 1
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})
	}

	return data.sort((a, b) => {
		if (a.featured !== b.featured) return a.featured ? -1 : 1
		const aUpdated = toTimestampMs(a.updatedAt)
		const bUpdated = toTimestampMs(b.updatedAt)
		if (aUpdated !== bUpdated) return bUpdated - aUpdated
		return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
	})
}

function renderAdminReviews(docs) {
	const list = document.getElementById("adminReviewsList")
	if (!list) return

	const sourceDocs = Array.isArray(docs) ? docs : []
	adminReviewRawDocs = [...sourceDocs]
	const items = sortAdminReviewsList(sourceDocs.map(normalizeReviewDoc))

	adminReviewDocs = items
	adminReviewStatusFilter = normalizeAdminReviewStatusFilter(
		adminReviewStatusFilter,
	)
	updateAdminReviewStatusFilterControls()

	const total = items.length
	const pending = items.filter((r) => r.status === "pending").length
	const approved = items.filter((r) => r.status === "approved").length
	const rejected = items.filter((r) => r.status === "rejected").length

	const totalEl = document.getElementById("adminReviewsTotalCount")
	const pendingEl = document.getElementById("adminReviewsPendingCount")
	const approvedEl = document.getElementById("adminReviewsApprovedCount")
	const rejectedEl = document.getElementById("adminReviewsRejectedCount")

	if (totalEl) totalEl.textContent = String(total)
	if (pendingEl) pendingEl.textContent = String(pending)
	if (approvedEl) approvedEl.textContent = String(approved)
	if (rejectedEl) rejectedEl.textContent = String(rejected)

	if (!items.length) {
		list.innerHTML =
			'<div class="admin-empty-state">No reviews yet. New review submissions will appear in realtime.</div>'
		return
	}

	const visibleItems =
		adminReviewStatusFilter === "all"
			? items
			: items.filter((item) => item.status === adminReviewStatusFilter)

	if (!visibleItems.length) {
		const filterLabel = getAdminStatusFilterLabel(adminReviewStatusFilter)
		list.innerHTML = `<div class="admin-empty-state">No ${escapeHtml(filterLabel)} reviews match this filter right now.</div>`
		return
	}

	list.innerHTML = visibleItems
		.map((item) => {
			const stars = "★".repeat(item.rating) + "☆".repeat(5 - item.rating)
			const isNegative = item.rating <= 3
			return `
      <article class="admin-review-item">
        <div class="admin-review-item-head">
          <div>
            <div class="admin-booking-name">${escapeHtml(item.name)}</div>
            <div class="admin-booking-id">Review ID: ${escapeHtml(item.id)} • ${escapeHtml(item.source)}</div>
          </div>
          <span class="admin-status-badge ${getReviewStatusClass(item.status)}">${item.status}</span>
        </div>
        <div class="admin-review-meta">
          <div><span>Rating:</span> ${stars}</div>
          <div><span>Service:</span> ${escapeHtml(item.service || "N/A")}</div>
          <div><span>Featured:</span> ${item.featured ? "Yes" : "No"}</div>
          <div><span>Verified Booking:</span> ${item.verifiedBooking ? "Yes" : "No"}</div>
          <div><span>Reports:</span> ${item.reportsCount}</div>
          <div><span>Approved By:</span> ${escapeHtml(item.approvedBy || "N/A")}</div>
          <div><span>Approved At:</span> ${item.approvedAt ? formatAdminDate(item.approvedAt) : "N/A"}</div>
        </div>
        <p class="admin-review-text">"${escapeHtml(item.text || "")}"</p>
        <textarea class="form-control" data-review-edit-text="${item.id}" rows="3">${escapeHtml(item.text || "")}</textarea>
		${item.photoUrl ? `<div style="margin:8px 0"><img src="${escapeHtml(item.photoUrl)}" alt="Review Photo" loading="lazy" decoding="async" fetchpriority="low" style="max-width:180px;border-radius:8px"/></div>` : ""}
        ${isNegative ? `<textarea class="form-control" data-review-reply-text="${item.id}" rows="2" placeholder="Admin reply for negative feedback...">${escapeHtml(item.adminReply || "")}</textarea>` : ""}
        <div class="admin-booking-actions">
          <button class="admin-action-btn" data-review-action="save-edit" data-id="${item.id}">Save Edit</button>
          ${isNegative ? `<button class="admin-action-btn" data-review-action="save-reply" data-id="${item.id}">Save Reply</button>` : ""}
          <button class="admin-action-btn" data-review-action="pending" data-id="${item.id}">Set Pending</button>
          <button class="admin-action-btn" data-review-action="approved" data-id="${item.id}">Approve</button>
          <button class="admin-action-btn danger" data-review-action="rejected" data-id="${item.id}">Reject</button>
          <button class="admin-action-btn" data-review-action="toggle-featured" data-id="${item.id}">${item.featured ? "Unfeature" : "Feature"}</button>
          <button class="admin-action-btn danger" data-review-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `
		})
		.join("")
}

async function updateReviewStatus(reviewId, status) {
	const normalizedStatus = normalizeReviewStatus(status)
	const review = adminReviewDocs.find((r) => r.id === reviewId)
	if (normalizedStatus === "approved") {
		const flagged = getFlaggedWordsInText(review?.text || "")
		if (flagged.length) {
			throw new Error(
				`Cannot approve: flagged content found (${flagged.join(", ")}). Edit review text first.`,
			)
		}
	}

	const payload = {
		status: normalizedStatus,
		updatedAt: getServerTimestamp(),
	}

	if (normalizedStatus === "approved") {
		payload.approvedBy = auth?.currentUser?.email || "admin"
		payload.approvedAt = getServerTimestamp()
	}

	await db.collection("reviews").doc(reviewId).set(payload, { merge: true })
}

async function updateReviewText(reviewId, text) {
	await db
		.collection("reviews")
		.doc(reviewId)
		.set(
			{
				text: String(text || "").trim(),
				status: "pending",
				updatedAt: getServerTimestamp(),
			},
			{ merge: true },
		)
}

async function updateReviewReply(reviewId, reply) {
	await db
		.collection("reviews")
		.doc(reviewId)
		.set(
			{
				adminReply: String(reply || "").trim(),
				updatedAt: getServerTimestamp(),
			},
			{ merge: true },
		)
}

async function toggleReviewFeatured(reviewId) {
	const review = adminReviewDocs.find((r) => r.id === reviewId)
	const nextFeatured = !(review?.featured === true)
	await db.collection("reviews").doc(reviewId).set(
		{
			featured: nextFeatured,
			updatedAt: getServerTimestamp(),
		},
		{ merge: true },
	)
}

async function deleteReview(reviewId) {
	const confirmed = await showAdminConfirmModal(
		"Delete this review permanently? This action cannot be undone.",
		"Delete Review",
	)
	if (!confirmed) return
	await db.collection("reviews").doc(reviewId).delete()
}

async function handleAuthStateChange(user) {
	if (!user) {
		setAdminUnlockedState(false)
		if (showStoredAdminSecurityRestrictionNotice()) {
			adminPendingLogoutToast = false
		} else if (adminPendingLogoutToast) {
			setAdminMessage(
				"success",
				"✅ Logged Out Successfully",
				"adminAuthMessage",
			)
		}
		adminPendingLogoutToast = false
		return
	}

	try {
		const profile = await fetchAdminAccessProfile(user.uid)
		if (!isAuthorizedAdminAccessProfile(profile)) {
			setAdminMessage(
				"error",
				"❌ This account is not authorized for admin access.",
				"adminAuthMessage",
			)
			setAdminUnlockedState(false)
			return
		}

		adminAccessProfile = profile
		setAdminUnlockedState(true)
		setAdminMessage("success", "✅ Logged in Successfully", "adminAuthMessage")
	} catch (error) {
		console.error("Failed to evaluate admin access profile:", error)
		setAdminMessage(
			"error",
			`❌ Failed to verify admin permissions: ${error.message || "unknown error"}`,
			"adminAuthMessage",
		)
		setAdminUnlockedState(false)
	}
}

function renderAdminWaitlistBookingFilterCard(row = {}) {
	const waitlistEntry = row.__adminWaitlistEntry || null
	if (!waitlistEntry) return ""

	const linkedBooking = row.__adminLinkedBooking || null
	const linkedBookingId = String(linkedBooking?.id || "").trim()
	const customerName = getAdminWaitlistCustomerName(waitlistEntry)
	const waitlistStatus = normalizeWaitlistStatus(waitlistEntry.status)
	const waitlistStatusLabel = getWaitlistStatusLabel(waitlistStatus)
	const isQueued = isActiveAdminWaitlistQueueStatus(waitlistStatus)
	const queueInfo = isQueued
		? {
				label: waitlistEntry.queuePositionLabel,
				size: waitlistEntry.queueSize,
			}
		: { label: "", size: null }
	const queueSummary = isQueued ? formatAdminQueueSummary(queueInfo) : "N/A"
	const queueChip = isQueued ? renderAdminWaitlistQueueChip(queueInfo) : ""
	const stylistLabel =
		waitlistEntry.stylist || waitlistEntry.stylistKey || "Any Available"
	const notes = waitlistEntry.notes || "No notes provided."
	const waitlistActions = renderAdminWaitlistActionButtons(
		waitlistEntry,
		linkedBooking,
	)
	const inspirationImageUrl = String(
		waitlistEntry.inspirationImageUrl ||
			linkedBooking?.inspirationImageUrl ||
			linkedBooking?.inspirationImage ||
			linkedBooking?.referenceImageUrl ||
			"",
	).trim()

	return `
		<div class="admin-booking-item admin-booking-item-waitlisted admin-booking-item-waitlist-record">
			<div class="admin-booking-item-head">
				<div>
					<div class="admin-booking-name-row">
						<div class="admin-booking-name">${escapeHtml(customerName)}</div>
						<span class="admin-waitlist-chip">${escapeHtml(`Waitlist · ${waitlistStatusLabel}`)}</span>
						${queueChip}
					</div>
					<div class="admin-booking-id">Waitlist ID: ${escapeHtml(waitlistEntry.id || "N/A")}</div>
					${linkedBookingId ? `<div class="admin-booking-id">Linked Booking: ${escapeHtml(linkedBookingId)}</div>` : '<div class="admin-booking-id">Linked Booking: Not linked yet</div>'}
				</div>
				<span class="admin-status-badge ${getWaitlistStatusClass(waitlistStatus)}">${escapeHtml(waitlistStatusLabel)}</span>
			</div>
			<div class="admin-booking-meta">
				<div><span>Waitlist Place:</span> ${escapeHtml(queueSummary)}</div>
				<div><span>Waitlist Status:</span> ${escapeHtml(waitlistStatusLabel)}</div>
				<div><span>Service:</span> ${escapeHtml(waitlistEntry.service || linkedBooking?.service || "N/A")}</div>
				<div><span>Stylist:</span> ${escapeHtml(stylistLabel)}</div>
				<div><span>Preferred Date:</span> ${escapeHtml(formatAdminDate(waitlistEntry.preferredDate || linkedBooking?.date || ""))}</div>
				<div><span>Preferred Time:</span> ${escapeHtml(waitlistEntry.preferredTime || linkedBooking?.time || "N/A")}</div>
				<div><span>Slot ID:</span> ${escapeHtml(waitlistEntry.preferredSlotId || linkedBooking?.preferredSlotId || "N/A")}</div>
				<div><span>Email:</span> ${escapeHtml(waitlistEntry.email || linkedBooking?.email || "N/A")}</div>
				<div><span>Phone:</span> ${escapeHtml(waitlistEntry.phone || linkedBooking?.phone || "N/A")}</div>
				<div><span>Joined:</span> ${escapeHtml(formatAdminDate(waitlistEntry.createdAt))}</div>
				<div><span>Updated:</span> ${escapeHtml(formatAdminDate(waitlistEntry.updatedAt))}</div>
			</div>
			<div class="admin-booking-special-request">
				<span>Waitlist Notes:</span>
				<p>${escapeHtml(notes)}</p>
			</div>
			<div class="admin-booking-inspiration">
				<div><span>Inspiration Image:</span> ${inspirationImageUrl ? `<a href="${escapeHtml(inspirationImageUrl)}" target="_blank" rel="noopener">Open full image</a>` : "Not provided"}</div>
				${
					inspirationImageUrl
						? `<a class="admin-booking-inspiration-link" href="${escapeHtml(inspirationImageUrl)}" target="_blank" rel="noopener"><img src="${escapeHtml(inspirationImageUrl)}" alt="Inspiration image for ${escapeHtml(customerName)}" class="admin-booking-inspiration-image" loading="lazy" decoding="async" fetchpriority="low" /></a>`
						: ""
				}
			</div>
			<div class="admin-booking-actions">
				${waitlistActions}
			</div>
		</div>
	`
}

function renderAdminBookings(docs) {
	const list = document.getElementById("adminBookingsList")
	if (!list) return

	const normalizedDocs = (Array.isArray(docs) ? docs : []).map((b) => ({
		...b,
		status: normalizeStatus(extractRawStatus(b)),
	}))
	adminBookingDocs = normalizedDocs
	adminBookingStatusFilter = normalizeAdminBookingFilter(
		adminBookingStatusFilter,
	)
	const isWaitlistedFilterActive = adminBookingStatusFilter === "waitlisted"
	list.classList.toggle(
		"admin-bookings-list--waitlisted-filter",
		isWaitlistedFilterActive,
	)
	list.dataset.bookingStatusFilter = adminBookingStatusFilter

	const total = normalizedDocs.length
	const pending = normalizedDocs.filter((b) => b.status === "pending").length
	const confirmed = normalizedDocs.filter(
		(b) => b.status === "confirmed",
	).length
	const waitlisted =
		Array.isArray(adminWaitlistDocs) && adminWaitlistDocs.length
			? adminWaitlistDocs.length
			: normalizedDocs.filter((b) => isAdminBookingVisibleInWaitlistFilter(b))
					.length
	const completed = normalizedDocs.filter(
		(b) => b.status === "completed",
	).length
	const cancelled = normalizedDocs.filter(
		(b) => b.status === "cancelled",
	).length

	const totalEl = document.getElementById("adminTotalCount")
	const pendingEl = document.getElementById("adminPendingCount")
	const confirmedEl = document.getElementById("adminConfirmedCount")
	const waitlistedEl = document.getElementById("adminWaitlistedBookingCount")
	const completedEl = document.getElementById("adminCompletedCount")
	const cancelledEl = document.getElementById("adminCancelledCount")

	if (totalEl) totalEl.textContent = String(total)
	if (pendingEl) pendingEl.textContent = String(pending)
	if (confirmedEl) confirmedEl.textContent = String(confirmed)
	if (waitlistedEl) waitlistedEl.textContent = String(waitlisted)
	if (completedEl) completedEl.textContent = String(completed)
	if (cancelledEl) cancelledEl.textContent = String(cancelled)

	const filterButtons = document.querySelectorAll(
		"[data-booking-status-filter]",
	)
	filterButtons.forEach((button) => {
		const buttonFilter = normalizeAdminBookingFilter(
			button.dataset.bookingStatusFilter,
		)
		const isActive = buttonFilter === adminBookingStatusFilter
		button.classList.toggle("active", isActive)
		button.setAttribute("aria-pressed", isActive ? "true" : "false")
	})

	const visibleDocs =
		adminBookingStatusFilter === "all"
			? normalizedDocs
			: adminBookingStatusFilter === "waitlisted"
				? buildAdminWaitlistFilterRows(normalizedDocs)
				: normalizedDocs.filter((b) => b.status === adminBookingStatusFilter)

	if (!normalizedDocs.length && !visibleDocs.length) {
		list.innerHTML =
			'<div class="admin-empty-state">No bookings yet. New bookings will appear in realtime.</div>'
		renderAdminSchedule()
		return
	}

	if (!visibleDocs.length) {
		const emptyCopy =
			adminBookingStatusFilter === "waitlisted"
				? "No waitlist entries right now. Requests from the Waitlist tab will appear here too."
				: `No ${getStatusLabel(adminBookingStatusFilter)} bookings match this filter right now.`
		list.innerHTML = `<div class="admin-empty-state">${emptyCopy}</div>`
		renderAdminSchedule()
		return
	}

	const sortedDocs = [...visibleDocs].sort((a, b) => {
		const aUpdated = toTimestampMs(
			a.__adminWaitlistEntry?.updatedAt || a.updatedAt,
		)
		const bUpdated = toTimestampMs(
			b.__adminWaitlistEntry?.updatedAt || b.updatedAt,
		)
		if (aUpdated !== bUpdated) return bUpdated - aUpdated

		const aCreated = toTimestampMs(
			a.__adminWaitlistEntry?.createdAt || a.createdAt,
		)
		const bCreated = toTimestampMs(
			b.__adminWaitlistEntry?.createdAt || b.createdAt,
		)
		return bCreated - aCreated
	})

	list.innerHTML = sortedDocs
		.map((b) => {
			if (b.__adminWaitlistFilterRecord) {
				return renderAdminWaitlistBookingFilterCard(b)
			}

			const status = normalizeStatus(extractRawStatus(b))
			const isWaitlisted = status === "waitlisted"
			const linkedWaitlistEntry = isWaitlisted
				? getAdminWaitlistEntryForBooking(b)
				: null
			const customerName = linkedWaitlistEntry
				? getAdminWaitlistCustomerName(linkedWaitlistEntry)
				: getAdminBookingCustomerName(b)
			const specialRequest = String(
				linkedWaitlistEntry?.notes || b.notes || b.specialRequest || "",
			).trim()
			const waitlistQueueInfo = isWaitlisted
				? getAdminWaitlistQueueInfoForBooking(b)
				: { position: null, label: "", size: null }
			const waitlistQueueSummary = isWaitlisted
				? formatAdminQueueSummary(waitlistQueueInfo)
				: "N/A"
			const waitlistQueueChip = isWaitlisted
				? renderAdminWaitlistQueueChip(waitlistQueueInfo)
				: ""
			const waitlistId = String(b.waitlistId || "").trim()
			const waitlistStatusLabel = isWaitlisted
				? getWaitlistStatusLabel(linkedWaitlistEntry?.status || "waiting")
				: ""
			const displayDate =
				linkedWaitlistEntry?.preferredDate || b.date || b.bookingDate || ""
			const displayTime =
				linkedWaitlistEntry?.preferredTime || b.time || b.bookingTime || ""
			const displayEmail = linkedWaitlistEntry?.email || b.email || ""
			const displayPhone = linkedWaitlistEntry?.phone || b.phone || ""
			const inspirationImageUrl = String(
				linkedWaitlistEntry?.inspirationImageUrl ||
					b.inspirationImageUrl ||
					b.inspirationImage ||
					b.referenceImageUrl ||
					"",
			).trim()

			return `
        <div class="admin-booking-item ${isWaitlisted ? "admin-booking-item-waitlisted" : ""}">
          <div class="admin-booking-item-head">
            <div>
              <div class="admin-booking-name-row">
                <div class="admin-booking-name">${escapeHtml(customerName)}</div>
		                ${isWaitlisted ? `<span class="admin-waitlist-chip">${escapeHtml(`Waitlist · ${waitlistStatusLabel}`)}</span>` : ""}
	                ${waitlistQueueChip}
              </div>
              <div class="admin-booking-id">Booking ID: ${escapeHtml(b.id || "N/A")}</div>
            </div>
            <span class="admin-status-badge ${getStatusClass(status)}">${escapeHtml(status)}</span>
          </div>
          <div class="admin-booking-meta">
            ${isWaitlisted ? `<div><span>Waitlist Place:</span> ${escapeHtml(waitlistQueueSummary)}</div>` : ""}
	            ${isWaitlisted ? `<div><span>Waitlist Status:</span> ${escapeHtml(waitlistStatusLabel)}</div>` : ""}
            <div><span>Service:</span> ${escapeHtml(b.service || "N/A")}</div>
            <div><span>Stylist:</span> ${escapeHtml(b.stylist || "Any Available")}</div>
			<div><span>Date:</span> ${escapeHtml(formatAdminDate(displayDate))}</div>
	            <div><span>Time:</span> ${escapeHtml(displayTime || "N/A")}</div>
	            <div><span>Email:</span> ${escapeHtml(displayEmail || "N/A")}</div>
	            <div><span>Phone:</span> ${escapeHtml(displayPhone || "N/A")}</div>
            <div><span>WhatsApp:</span> ${escapeHtml(b.whatsappStatus || "pending")}</div>
            <div><span>Reminder Sent:</span> ${escapeHtml(b.reminderSentAt ? formatAdminDate(b.reminderSentAt) : "Not sent")}</div>
          </div>
          <div class="admin-booking-special-request">
            <span>Special Request:</span>
            <p>${specialRequest ? escapeHtml(specialRequest) : "No special request provided."}</p>
          </div>
          <div class="admin-booking-inspiration">
            <div><span>Inspiration Image:</span> ${inspirationImageUrl ? `<a href="${escapeHtml(inspirationImageUrl)}" target="_blank" rel="noopener">Open full image</a>` : "Not provided"}</div>
            ${
							inspirationImageUrl
								? `<a class="admin-booking-inspiration-link" href="${escapeHtml(inspirationImageUrl)}" target="_blank" rel="noopener"><img src="${escapeHtml(inspirationImageUrl)}" alt="Inspiration image for ${escapeHtml(customerName)}" class="admin-booking-inspiration-image" loading="lazy" decoding="async" fetchpriority="low" /></a>`
								: ""
						}
          </div>
          <div class="admin-booking-actions">
						${renderAdminBookingLifecycleActions({
							bookingId: b.id,
							waitlistId,
							status,
						})}
          </div>
        </div>
      `
		})
		.join("")

	renderAdminSchedule()
}

function galleryDocToViewModel(doc) {
	const inferredCategory = inferAdminGalleryServiceCategory(doc)
	return {
		id: doc.id,
		styleName: doc.styleName || "Untitled Style",
		serviceName: doc.serviceName || doc.styleName || "",
		serviceCategory: inferredCategory,
		styleType: doc.styleType || "N/A",
		length: doc.length || "N/A",
		size: doc.size || "N/A",
		timeTaken: doc.timeTaken || "N/A",
		priceRange: doc.priceRange || "",
		hairType: doc.hairType || "N/A",
		hairServiceType: doc.hairServiceType || "",
		hairTechnique: doc.hairTechnique || "",
		hairLengthDensity: doc.hairLengthDensity || "",
		hairProductsUsed: doc.hairProductsUsed || "",
		stylistName: doc.stylistName || "N/A",
		imageUrl: doc.imageUrl || "",
		beforeImageUrl: doc.beforeImageUrl || "",
		hasBeforeAfter:
			doc.hasBeforeAfter === true ||
			Boolean(doc.beforeImageUrl && String(doc.beforeImageUrl).trim()),
		featuredTrending: doc.featuredTrending === true,
		featuredMostBooked: doc.featuredMostBooked === true,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	}
}

function blogDocToViewModel(doc = {}) {
	return {
		id: String(doc.id || ""),
		title:
			String(doc.title || doc.heading || "Untitled Blog").trim() ||
			"Untitled Blog",
		excerpt: String(doc.excerpt || doc.description || "").trim(),
		imageUrl: String(doc.imageUrl || doc.image || "").trim(),
		readMoreUrl: String(doc.readMoreUrl || doc.url || "").trim(),
		readTime: String(doc.readTime || "5 min read").trim() || "5 min read",
		publishDate: doc.publishDate || doc.date || "",
		createdAt: doc.createdAt || null,
		updatedAt: doc.updatedAt || null,
	}
}

function formatAdminBlogDate(value) {
	if (!value) return "N/A"
	const text = String(value).trim()
	if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
		const [year, month, day] = text.split("-").map(Number)
		const date = new Date(year, month - 1, day)
		if (!Number.isNaN(date.getTime())) {
			return date.toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		}
	}

	const ms = toTimestampMs(value)
	if (!ms) return text
	return new Date(ms).toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric",
	})
}

function resetAdminBlogsForm() {
	const form = document.getElementById("adminBlogsForm")
	if (!form) return

	form.reset()
	document.getElementById("blogEditId").value = ""
	document.getElementById("adminBlogsFormTitle").textContent = "Add New Blog"
	document.getElementById("adminBlogsSaveBtn").textContent = "Save Blog"
	document.getElementById("adminBlogsCancelEdit").style.display = "none"
}

function loadBlogItemForEditing(id) {
	const item = adminBlogDocs.find((blog) => blog.id === id)
	if (!item) return

	setActiveAdminSection("blogs")

	document.getElementById("blogEditId").value = item.id
	document.getElementById("blogTitle").value = item.title || ""
	document.getElementById("blogExcerpt").value = item.excerpt || ""
	document.getElementById("blogReadTime").value = item.readTime || ""
	document.getElementById("blogDate").value = String(
		item.publishDate || "",
	).trim()
	document.getElementById("blogReadMoreUrl").value = item.readMoreUrl || ""

	document.getElementById("adminBlogsFormTitle").textContent = "Edit Blog"
	document.getElementById("adminBlogsSaveBtn").textContent = "Update Blog"
	document.getElementById("adminBlogsCancelEdit").style.display = "inline-flex"

	setAdminMessage("", "", "adminBlogsMessage")

	const blogsForm = document.getElementById("adminBlogsForm")
	if (blogsForm) {
		requestAnimationFrame(() => {
			const headerOffset = 96
			const targetTop =
				window.scrollY + blogsForm.getBoundingClientRect().top - headerOffset

			window.scrollTo({
				top: Math.max(0, targetTop),
				behavior: "smooth",
			})

			const firstInput = blogsForm.querySelector("input, textarea")
			if (firstInput && typeof firstInput.focus === "function") {
				setTimeout(() => firstInput.focus({ preventScroll: true }), 320)
			}
		})
	}
}

function renderAdminBlogs(docs) {
	const list = document.getElementById("adminBlogsList")
	if (!list) return

	const items = docs.map(blogDocToViewModel).sort((a, b) => {
		const aUpdated = toTimestampMs(a.updatedAt)
		const bUpdated = toTimestampMs(b.updatedAt)
		if (aUpdated !== bUpdated) return bUpdated - aUpdated

		const aCreated = toTimestampMs(a.createdAt)
		const bCreated = toTimestampMs(b.createdAt)
		if (aCreated !== bCreated) return bCreated - aCreated

		return String(b.publishDate || "").localeCompare(
			String(a.publishDate || ""),
		)
	})

	adminBlogDocs = items

	if (!items.length) {
		list.innerHTML =
			'<div class="admin-empty-state">No blog posts yet. Add your first blog above.</div>'
		updateAdminBlogScrollButtons()
		return
	}

	list.innerHTML = items
		.map(
			(item) => `
      <article class="admin-blog-item">
        <div class="admin-blog-thumb-wrap">
			${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" class="admin-blog-thumb" loading="lazy" decoding="async" fetchpriority="low" />` : '<div class="admin-blog-thumb admin-blog-thumb--empty">No Image</div>'}
        </div>
        <div class="admin-blog-content">
          <h4>${escapeHtml(item.title)}</h4>
          <div class="admin-blog-meta">
            <span>${escapeHtml(formatAdminBlogDate(item.publishDate || item.createdAt))}</span>
            <span>${escapeHtml(item.readTime || "5 min read")}</span>
          </div>
          <p>${escapeHtml(item.excerpt || "")}</p>
          <a href="${escapeHtml(item.readMoreUrl || "#")}" target="_blank" rel="noopener" class="admin-inline-link">Open Article</a>
        </div>
        <div class="admin-gallery-actions">
          <button class="admin-action-btn" data-blog-action="edit" data-id="${item.id}">Edit</button>
          <button class="admin-action-btn danger" data-blog-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `,
		)
		.join("")

	updateAdminBlogScrollButtons()
}

function updateAdminBlogScrollButtons() {
	const list = document.getElementById("adminBlogsList")
	const prevBtn = document.getElementById("adminBlogsPrevBtn")
	const nextBtn = document.getElementById("adminBlogsNextBtn")
	if (!list || !prevBtn || !nextBtn) return

	const canScroll = list.scrollHeight - list.clientHeight > 8
	if (!canScroll) {
		prevBtn.disabled = true
		nextBtn.disabled = true
		return
	}

	prevBtn.disabled = list.scrollTop <= 2
	nextBtn.disabled = list.scrollTop + list.clientHeight >= list.scrollHeight - 2
}

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}

function setAdminButtonLoadingState(button, isLoading, options = {}) {
	if (!button) return

	const {
		loadingText = "Loading...",
		resetText = null,
		skipTextForCheckbox = true,
	} = options

	const isCheckbox = button.type === "checkbox"

	if (isLoading) {
		if (button.dataset.originalLabel === undefined) {
			button.dataset.originalLabel = button.textContent || ""
		}

		button.disabled = true
		button.classList.add("btn-loading")
		button.setAttribute("aria-busy", "true")

		if (
			!(skipTextForCheckbox && isCheckbox) &&
			typeof loadingText === "string"
		) {
			button.textContent = loadingText
		}
		return
	}

	button.disabled = false
	button.classList.remove("btn-loading")
	button.removeAttribute("aria-busy")

	if (!(skipTextForCheckbox && isCheckbox)) {
		const fallbackText = button.dataset.originalLabel || ""
		const nextText = typeof resetText === "string" ? resetText : fallbackText
		if (nextText) {
			button.textContent = nextText
		}
	}

	if (typeof resetText === "string") {
		button.dataset.originalLabel = resetText
	} else if (button.dataset.originalLabel !== undefined) {
		button.dataset.originalLabel = button.textContent || ""
	}
}

function inferAdminGalleryServiceCategory(item = {}) {
	const explicitCategory = normalizeAdminGalleryServiceCategory(
		item.serviceCategory || item.category || "",
	)

	if (
		explicitCategory !== "braids-services" &&
		explicitCategory !== "hair-services"
	) {
		return explicitCategory
	}

	const bag = [
		item.styleName,
		item.styleType,
		item.serviceName,
		item.hairServiceType,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase()

	if (!bag) return explicitCategory

	const hairKeywords = ADMIN_GALLERY_CATEGORY_KEYWORDS["hair-services"] || []
	const braidsKeywords =
		ADMIN_GALLERY_CATEGORY_KEYWORDS["braids-services"] || []
	const hasHairKeyword = hairKeywords.some((keyword) => bag.includes(keyword))
	const hasBraidsKeyword = braidsKeywords.some((keyword) =>
		bag.includes(keyword),
	)

	if (hasHairKeyword && !hasBraidsKeyword) {
		return "hair-services"
	}

	if (hasBraidsKeyword && !hasHairKeyword) {
		return "braids-services"
	}

	return explicitCategory
}

function normalizeAdminGalleryServiceCategory(value = "") {
	const normalized = String(value || "")
		.trim()
		.toLowerCase()
	if (normalized === "hair") return "hair-services"
	if (normalized === "braids") return "braids-services"
	if (
		ADMIN_GALLERY_SERVICE_FILTER_DEFINITIONS.some(
			(item) => item.key === normalized,
		)
	) {
		return normalized
	}
	return "braids-services"
}

function getAdminGalleryServiceLabel(categoryKey = "") {
	const normalized = normalizeAdminGalleryServiceCategory(categoryKey)
	return ADMIN_GALLERY_SERVICE_LABEL_MAP[normalized] || "Braids"
}

function normalizeAdminHairServiceType(value = "") {
	return String(value || "")
		.trim()
		.toLowerCase()
}

function getAdminHairServiceFieldRules(hairServiceType = "") {
	const normalizedType = normalizeAdminHairServiceType(hairServiceType)
	const defaultRules = {
		showTechnique: true,
		requireTechnique: true,
		showLengthDensity: true,
		showProductsUsed: true,
		requireProductsUsed: false,
	}

	if (normalizedType === "hair cutting") {
		return {
			...defaultRules,
			showProductsUsed: false,
		}
	}

	if (
		normalizedType === "hair coloring" ||
		normalizedType === "hair relaxing" ||
		normalizedType === "hair treatment"
	) {
		return {
			...defaultRules,
			requireProductsUsed: true,
		}
	}

	return defaultRules
}

function applyAdminHairServiceTypeToForm(hairServiceType = "") {
	const serviceCategory = normalizeAdminGalleryServiceCategory(
		document.getElementById("galleryServiceCategory")?.value ||
			activeAdminGalleryServiceCategory,
	)
	const isHairCategory = serviceCategory === "hair-services"
	const rules = getAdminHairServiceFieldRules(hairServiceType)

	const toggleHairField = (fieldId, isVisible, isRequired = false) => {
		const control = document.getElementById(fieldId)
		const fieldWrap = control?.closest(".admin-hair-field")
		if (!control || !fieldWrap) return

		const shouldShow = isHairCategory && isVisible
		fieldWrap.style.display = shouldShow ? "" : "none"

		if (shouldShow && isRequired) {
			control.setAttribute("required", "required")
		} else {
			control.removeAttribute("required")
		}

		if (!shouldShow) {
			if (control.type === "checkbox") {
				control.checked = false
			} else if (control.tagName === "SELECT") {
				control.value = ""
			} else if (control.type !== "file") {
				control.value = ""
			}
		}
	}

	toggleHairField(
		"galleryHairTechnique",
		rules.showTechnique,
		rules.requireTechnique,
	)
	toggleHairField("galleryHairLengthDensity", rules.showLengthDensity, false)
	toggleHairField(
		"galleryHairProductsUsed",
		rules.showProductsUsed,
		rules.requireProductsUsed,
	)
}

function updateAdminGalleryFeaturedLabels(categoryKey = "braids-services") {
	const normalizedCategory = normalizeAdminGalleryServiceCategory(categoryKey)
	const label = getAdminGalleryServiceLabel(normalizedCategory)
	const trendingLabel = document.getElementById("galleryFeaturedTrendingLabel")
	const mostBookedLabel = document.getElementById(
		"galleryFeaturedMostBookedLabel",
	)

	if (trendingLabel) {
		trendingLabel.textContent = `Trending ${label}`
	}
	if (mostBookedLabel) {
		mostBookedLabel.textContent = `Most Booked ${label}`
	}
}

function applyAdminGalleryServiceCategoryToForm(
	categoryKey = "braids-services",
) {
	const normalizedCategory = normalizeAdminGalleryServiceCategory(categoryKey)
	activeAdminGalleryServiceCategory = normalizedCategory

	const hiddenCategory = document.getElementById("galleryServiceCategory")
	if (hiddenCategory) {
		hiddenCategory.value = normalizedCategory
	}

	const serviceNameInput = document.getElementById("galleryServiceName")
	if (serviceNameInput) {
		const serviceLabel = getAdminGalleryServiceLabel(normalizedCategory)
		serviceNameInput.placeholder = `e.g. ${serviceLabel} Style`
	}
	updateAdminGalleryFeaturedLabels(normalizedCategory)

	const filterButtons = document.querySelectorAll(
		"#adminGalleryServiceFilters [data-admin-gallery-service]",
	)
	filterButtons.forEach((button) => {
		const buttonKey = normalizeAdminGalleryServiceCategory(
			button.dataset.adminGalleryService,
		)
		button.classList.toggle("active", buttonKey === normalizedCategory)
	})

	const isBraids = normalizedCategory === "braids-services"
	const isHair = normalizedCategory === "hair-services"
	const braidsOnlyFields = document.querySelectorAll(
		"[data-braids-only='true']",
	)
	braidsOnlyFields.forEach((field) => {
		field.style.display = isBraids ? "" : "none"
		const controls = field.querySelectorAll("input, select, textarea")
		controls.forEach((control) => {
			const requiresForBraids = control.hasAttribute("required")
			if (requiresForBraids) {
				control.dataset.requiredWhenBraids = "true"
			}
			if (isBraids) {
				if (control.dataset.requiredWhenBraids === "true") {
					control.setAttribute("required", "required")
				}
			} else {
				control.removeAttribute("required")
				if (control.type === "checkbox") {
					control.checked = false
				} else if (control.tagName === "SELECT") {
					control.value = ""
				} else if (control.type !== "file") {
					control.value = ""
				}
			}
		})
	})

	const hairOnlyFields = document.querySelectorAll("[data-hair-only='true']")
	hairOnlyFields.forEach((field) => {
		field.style.display = isHair ? "" : "none"
		const controls = field.querySelectorAll("input, select, textarea")
		controls.forEach((control) => {
			const requiresForHair = control.hasAttribute("required")
			if (requiresForHair) {
				control.dataset.requiredWhenHair = "true"
			}
			if (isHair) {
				if (control.dataset.requiredWhenHair === "true") {
					control.setAttribute("required", "required")
				}
			} else {
				control.removeAttribute("required")
				if (control.type === "checkbox") {
					control.checked = false
				} else if (control.tagName === "SELECT") {
					control.value = ""
				} else if (control.type !== "file") {
					control.value = ""
				}
			}
		})
	})

	const selectedHairServiceType =
		document.getElementById("galleryHairServiceType")?.value || ""
	applyAdminHairServiceTypeToForm(selectedHairServiceType)

	updateGalleryPreview()
}

function setGalleryPreviewImage(src = "") {
	const previewImage = document.getElementById("adminGalleryPreviewImage")
	const placeholder = document.getElementById("adminGalleryPreviewPlaceholder")
	if (!previewImage || !placeholder) return

	if (src) {
		previewImage.src = src
		previewImage.style.display = "block"
		placeholder.style.display = "none"
		return
	}

	previewImage.removeAttribute("src")
	previewImage.style.display = "none"
	placeholder.style.display = "grid"
}

function setChecklistState(key, done) {
	const item = document.querySelector(
		`.admin-gallery-checklist li[data-check="${key}"]`,
	)
	if (!item) return
	item.classList.toggle("completed", Boolean(done))
}

function updateChecklistProgressMeter() {
	const checklistItems = document.querySelectorAll(
		".admin-gallery-checklist li[data-check]",
	)
	const progressText = document.getElementById(
		"adminGalleryChecklistProgressText",
	)
	const progressFill = document.getElementById(
		"adminGalleryChecklistProgressFill",
	)
	if (!checklistItems.length) return

	let completed = 0
	checklistItems.forEach((item) => {
		if (item.classList.contains("completed")) completed += 1
	})

	const total = checklistItems.length
	const percent = total > 0 ? Math.round((completed / total) * 100) : 0

	if (progressText) {
		progressText.textContent = `${completed}/${total} completed`
	}

	if (progressFill) {
		progressFill.style.width = `${percent}%`
	}
}

function updateGalleryPreview() {
	const styleName =
		document.getElementById("galleryStyleName")?.value?.trim() || ""
	const styleType =
		document.getElementById("galleryStyleType")?.value?.trim() || ""
	const serviceName =
		document.getElementById("galleryServiceName")?.value?.trim() || ""
	const serviceCategory = normalizeAdminGalleryServiceCategory(
		document.getElementById("galleryServiceCategory")?.value ||
			activeAdminGalleryServiceCategory,
	)
	const length = document.getElementById("galleryLength")?.value || ""
	const size = document.getElementById("gallerySize")?.value || ""
	const timeTaken =
		document.getElementById("galleryTimeTaken")?.value?.trim() || ""
	const priceRange =
		document.getElementById("galleryPriceRange")?.value?.trim() || ""
	const hairServiceType =
		document.getElementById("galleryHairServiceType")?.value?.trim() || ""
	const hairTechnique =
		document.getElementById("galleryHairTechnique")?.value?.trim() || ""
	const stylistName =
		document.getElementById("galleryStylistName")?.value?.trim() || ""
	const hasTrending =
		document.getElementById("galleryFeaturedTrending")?.checked === true
	const hasMostBooked =
		document.getElementById("galleryFeaturedMostBooked")?.checked === true
	const beforeImageSelected =
		(document.getElementById("galleryBeforeImage")?.files?.length || 0) > 0

	const previewName = document.getElementById("adminGalleryPreviewName")
	const previewMeta = document.getElementById("adminGalleryPreviewMeta")
	const previewDetails = document.getElementById("adminGalleryPreviewDetails")
	const previewTags = document.getElementById("adminGalleryPreviewTags")
	const beforeAfterBadge = document.getElementById(
		"adminGalleryPreviewBeforeAfterBadge",
	)

	if (previewName) {
		previewName.textContent = styleName || "Style name preview"
	}

	if (previewMeta) {
		const serviceLabel =
			serviceName || getAdminGalleryServiceLabel(serviceCategory)
		if (serviceCategory === "hair-services") {
			previewMeta.textContent = `${serviceLabel} • ${styleType || "Type"} • ${length || "Length"} • ${size || "Size"}`
		} else if (serviceCategory === "hair-services") {
			previewMeta.textContent = `${serviceLabel} • ${hairServiceType || "Service"} • ${hairTechnique || "Technique"}`
		} else {
			previewMeta.textContent = `${serviceLabel} • ${styleType || "Type"}`
		}
	}

	if (previewDetails) {
		previewDetails.textContent = `Stylist: ${stylistName || "N/A"} • Time: ${timeTaken || "N/A"}`
	}

	if (beforeAfterBadge) {
		beforeAfterBadge.style.display = beforeImageSelected
			? "inline-flex"
			: "none"
	}

	if (previewTags) {
		const tags = []
		if (hasTrending) tags.push("Trending")
		if (hasMostBooked) tags.push("Most Booked")
		if (priceRange) tags.push(priceRange)

		if (!tags.length) {
			previewTags.innerHTML =
				'<span class="admin-gallery-preview-tag is-empty">No tags yet</span>'
		} else {
			previewTags.innerHTML = tags
				.map(
					(tag) =>
						`<span class="admin-gallery-preview-tag">${escapeHtml(tag)}</span>`,
				)
				.join("")
		}
	}

	setChecklistState("styleName", Boolean(styleName))
	setChecklistState("styleType", Boolean(styleType))
	setChecklistState("stylistName", Boolean(stylistName))
	setChecklistState("timeTaken", Boolean(timeTaken))
	setChecklistState(
		"mainImage",
		(document.getElementById("galleryMainImage")?.files?.length || 0) > 0,
	)

	updateChecklistProgressMeter()
}

function syncGalleryPreviewImageFromFile() {
	const mainImageInput = document.getElementById("galleryMainImage")
	if (!mainImageInput) return

	const file = mainImageInput.files?.[0]
	if (adminGalleryPreviewObjectUrl) {
		URL.revokeObjectURL(adminGalleryPreviewObjectUrl)
		adminGalleryPreviewObjectUrl = ""
	}

	if (!file) {
		setGalleryPreviewImage("")
		updateGalleryPreview()
		return
	}

	adminGalleryPreviewObjectUrl = URL.createObjectURL(file)
	setGalleryPreviewImage(adminGalleryPreviewObjectUrl)
	updateGalleryPreview()
}

function bindGalleryPreviewEvents() {
	const ids = [
		"galleryStyleName",
		"galleryStyleType",
		"galleryServiceName",
		"galleryServiceCategory",
		"galleryLength",
		"gallerySize",
		"galleryTimeTaken",
		"galleryPriceRange",
		"galleryHairServiceType",
		"galleryHairTechnique",
		"galleryHairLengthDensity",
		"galleryHairProductsUsed",
		"galleryStylistName",
		"galleryFeaturedTrending",
		"galleryFeaturedMostBooked",
		"galleryBeforeImage",
	]

	ids.forEach((id) => {
		const el = document.getElementById(id)
		if (!el) return
		el.addEventListener("input", updateGalleryPreview)
		el.addEventListener("change", updateGalleryPreview)
	})

	const mainImageInput = document.getElementById("galleryMainImage")
	if (mainImageInput) {
		mainImageInput.addEventListener("change", syncGalleryPreviewImageFromFile)
	}

	const hairServiceTypeSelect = document.getElementById(
		"galleryHairServiceType",
	)
	if (hairServiceTypeSelect) {
		hairServiceTypeSelect.addEventListener("change", (event) => {
			applyAdminHairServiceTypeToForm(event.target.value || "")
			updateGalleryPreview()
		})
	}

	updateGalleryPreview()
}

function resetGalleryForm() {
	const form = document.getElementById("adminGalleryForm")
	if (!form) return

	form.reset()
	document.getElementById("galleryEditId").value = ""
	document.getElementById("galleryServiceName").value = ""
	applyAdminGalleryServiceCategoryToForm("braids-services")
	document.getElementById("adminGalleryFormTitle").textContent =
		"Add New Gallery Style"
	document.getElementById("adminGallerySaveBtn").textContent =
		"Save Gallery Style"
	document.getElementById("adminGalleryCancelEdit").style.display = "none"

	if (adminGalleryPreviewObjectUrl) {
		URL.revokeObjectURL(adminGalleryPreviewObjectUrl)
		adminGalleryPreviewObjectUrl = ""
	}
	setGalleryPreviewImage("")
	updateGalleryPreview()
}

function loadGalleryItemForEditing(id) {
	const item = adminGalleryDocs.find((g) => g.id === id)
	if (!item) return

	document.getElementById("galleryEditId").value = item.id
	document.getElementById("galleryStyleName").value = item.styleName || ""
	document.getElementById("galleryStyleType").value = item.styleType || ""
	document.getElementById("galleryServiceName").value =
		item.serviceName || item.styleName || ""
	const serviceCategory = normalizeAdminGalleryServiceCategory(
		item.serviceCategory || "braids-services",
	)
	applyAdminGalleryServiceCategoryToForm(serviceCategory)
	document.getElementById("galleryLength").value = item.length || ""
	document.getElementById("gallerySize").value = item.size || ""
	document.getElementById("galleryTimeTaken").value = item.timeTaken || ""
	document.getElementById("galleryPriceRange").value = item.priceRange || ""
	document.getElementById("galleryHairType").value = item.hairType || ""
	document.getElementById("galleryHairServiceType").value =
		item.hairServiceType || ""
	document.getElementById("galleryHairTechnique").value =
		item.hairTechnique || ""
	document.getElementById("galleryHairLengthDensity").value =
		item.hairLengthDensity || ""
	document.getElementById("galleryHairProductsUsed").value =
		item.hairProductsUsed || ""
	applyAdminHairServiceTypeToForm(item.hairServiceType || "")
	document.getElementById("galleryStylistName").value = item.stylistName || ""
	document.getElementById("galleryFeaturedTrending").checked =
		item.featuredTrending === true
	document.getElementById("galleryFeaturedMostBooked").checked =
		item.featuredMostBooked === true

	document.getElementById("adminGalleryFormTitle").textContent =
		"Edit Gallery Style"
	document.getElementById("adminGallerySaveBtn").textContent =
		"Update Gallery Style"
	document.getElementById("adminGalleryCancelEdit").style.display =
		"inline-flex"

	setAdminMessage("", "", "adminGalleryMessage")

	if (adminGalleryPreviewObjectUrl) {
		URL.revokeObjectURL(adminGalleryPreviewObjectUrl)
		adminGalleryPreviewObjectUrl = ""
	}
	setGalleryPreviewImage(item.imageUrl || "")
	updateGalleryPreview()

	const galleryForm = document.getElementById("adminGalleryForm")
	if (galleryForm) {
		galleryForm.scrollIntoView({ behavior: "smooth", block: "start" })
		galleryForm.classList.remove("admin-gallery-form--focus-flash")
		void galleryForm.offsetWidth
		galleryForm.classList.add("admin-gallery-form--focus-flash")
		setTimeout(() => {
			galleryForm.classList.remove("admin-gallery-form--focus-flash")
		}, 1600)
		const firstInput = galleryForm.querySelector("input, select, textarea")
		if (firstInput && typeof firstInput.focus === "function") {
			setTimeout(() => {
				firstInput.focus({ preventScroll: true })
			}, 250)
		}
	}
}

function renderAdminGallery(docs) {
	const list = document.getElementById("adminGalleryList")
	if (!list) return

	const items = docs.map(galleryDocToViewModel).sort((a, b) => {
		const aUpdated = toTimestampMs(a.updatedAt)
		const bUpdated = toTimestampMs(b.updatedAt)
		if (aUpdated !== bUpdated) return bUpdated - aUpdated
		return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
	})

	adminGalleryDocs = items

	if (!items.length) {
		list.innerHTML =
			'<div class="admin-empty-state">No gallery styles yet. Add your first style above.</div>'
		return
	}

	list.innerHTML = items
		.map(
			(item) => `
      <article class="admin-gallery-item">
        <div class="admin-gallery-thumb-wrap">
			${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.styleName}" class="admin-gallery-thumb" loading="lazy" decoding="async" fetchpriority="low" />` : '<div class="admin-gallery-thumb admin-gallery-thumb--empty">No Image</div>'}
          ${item.hasBeforeAfter ? '<span class="admin-gallery-badge">Before & After</span>' : ""}
        </div>
        <div class="admin-gallery-content">
          <h4>${item.styleName}</h4>
	          <p>${getAdminGalleryServiceLabel(item.serviceCategory)} • ${item.styleType}${item.serviceCategory === "braids-services" ? ` • ${item.length} • ${item.size}` : item.serviceCategory === "hair-services" ? ` • ${item.hairServiceType || "Service"} • ${item.hairTechnique || "Technique"}` : ""}</p>
          <p>Stylist: ${item.stylistName} • Time: ${item.timeTaken}</p>
          <div class="admin-gallery-tags">
            ${item.featuredTrending ? "<span>Trending</span>" : ""}
            ${item.featuredMostBooked ? "<span>Most Booked</span>" : ""}
            ${item.priceRange ? `<span>${item.priceRange}</span>` : ""}
          </div>
        </div>
        <div class="admin-gallery-actions">
          <button class="admin-action-btn" data-gallery-action="edit" data-id="${item.id}">Edit</button>
          <button class="admin-action-btn danger" data-gallery-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `,
		)
		.join("")
}

function normalizeCloudinarySignatureResponse(signResponse = {}) {
	const payload = signResponse?.data || signResponse || {}
	if (payload.uploadUrl) return payload
	if (payload.signature?.uploadUrl) return payload.signature
	if (payload.signedUpload?.uploadUrl) return payload.signedUpload
	return payload
}

function serializeCloudinarySignedParam(key, value) {
	if (value === undefined || value === null || value === "") return ""
	if (key === "tags" && Array.isArray(value)) {
		return value
			.map((tag) => String(tag || "").trim())
			.filter(Boolean)
			.join(",")
	}
	if (
		key === "context" &&
		value &&
		typeof value === "object" &&
		!Array.isArray(value)
	) {
		return Object.entries(value)
			.filter(
				([_contextKey, contextValue]) =>
					contextValue !== undefined &&
					contextValue !== null &&
					contextValue !== "",
			)
			.map(
				([contextKey, contextValue]) => `${contextKey}=${String(contextValue)}`,
			)
			.join("|")
	}
	if (Array.isArray(value)) {
		return value
			.map((item) => String(item || "").trim())
			.filter(Boolean)
			.join(",")
	}
	return String(value)
}

function appendCloudinarySignedParams(body, signatureData = {}) {
	const signedParams =
		signatureData.params && typeof signatureData.params === "object"
			? signatureData.params
			: {
					timestamp: signatureData.timestamp,
					folder: signatureData.folder || clientCloudinaryFolder,
					public_id: signatureData.publicId || signatureData.public_id,
					upload_preset:
						signatureData.uploadPreset || signatureData.upload_preset,
					eager: signatureData.eager,
					tags: signatureData.tags,
					context: signatureData.context,
					api_key: signatureData.apiKey || signatureData.api_key,
					signature: signatureData.signature,
				}

	Object.entries(signedParams).forEach(([key, value]) => {
		const serializedValue = serializeCloudinarySignedParam(key, value)
		if (!serializedValue) return
		body.append(key, serializedValue)
	})

	const apiKey = signatureData.apiKey || signatureData.api_key
	if (!signedParams.api_key && apiKey) {
		body.append("api_key", apiKey)
	}
	if (!signedParams.signature && signatureData.signature) {
		body.append("signature", signatureData.signature)
	}
}

async function uploadImageToCloudinary(file, options = {}) {
	if (!file) return ""
	if (
		!appServicesReady ||
		!adminCallableService ||
		typeof adminCallableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}

	const signUploadCallable = adminCallableService.httpsCallable(
		"createCloudinarySignedUpload",
	)
	const signResponse = await signUploadCallable({
		purpose: options.purpose || "admin-gallery",
		folder: clientCloudinaryFolder,
		tags: options.tags || ["admin_upload", "gallery"],
		context: {
			page: "admin",
			...(options.context || {}),
		},
		fileName: file.name || "",
		contentType: file.type || "image/*",
		sizeBytes: file.size || 0,
	})
	const signatureData = normalizeCloudinarySignatureResponse(signResponse)
	const signedParams =
		signatureData.params && typeof signatureData.params === "object"
			? signatureData.params
			: {}

	if (
		!signatureData.uploadUrl ||
		!(signatureData.apiKey || signatureData.api_key || signedParams.api_key) ||
		!(signatureData.signature || signedParams.signature)
	) {
		throw new Error("Failed to initialize secure Cloudinary upload")
	}

	const body = new FormData()
	body.append("file", file)
	appendCloudinarySignedParams(body, signatureData)

	const response = await fetch(signatureData.uploadUrl, {
		method: "POST",
		body,
	})

	if (!response.ok) {
		let cloudinaryError = ""
		try {
			const errorPayload = await response.json()
			cloudinaryError =
				errorPayload?.error?.message || errorPayload?.message || ""
		} catch (_error) {
			cloudinaryError = await response.text().catch(() => "")
		}
		throw new Error(cloudinaryError || "Failed to upload image to Cloudinary")
	}

	const result = await response.json()
	return result.secure_url || ""
}

async function saveGalleryItem(event) {
	event.preventDefault()
	if (!adminUnlocked || !db || !auth?.currentUser) return

	const saveBtn = document.getElementById("adminGallerySaveBtn")
	const editId = document.getElementById("galleryEditId").value.trim()

	const styleName = document.getElementById("galleryStyleName").value.trim()
	const serviceName = document.getElementById("galleryServiceName").value.trim()
	const serviceCategory = normalizeAdminGalleryServiceCategory(
		document.getElementById("galleryServiceCategory").value,
	)
	const styleType = document.getElementById("galleryStyleType").value.trim()
	const length = document.getElementById("galleryLength").value
	const size = document.getElementById("gallerySize").value
	const timeTaken = document.getElementById("galleryTimeTaken").value.trim()
	const priceRange = document.getElementById("galleryPriceRange").value.trim()
	const hairType = document.getElementById("galleryHairType").value.trim()
	const hairServiceType = document
		.getElementById("galleryHairServiceType")
		.value.trim()
	const hairTechnique = document
		.getElementById("galleryHairTechnique")
		.value.trim()
	const hairLengthDensity = document
		.getElementById("galleryHairLengthDensity")
		.value.trim()
	const hairProductsUsed = document
		.getElementById("galleryHairProductsUsed")
		.value.trim()
	const stylistName = document.getElementById("galleryStylistName").value.trim()
	const featuredTrending = document.getElementById(
		"galleryFeaturedTrending",
	).checked
	const featuredMostBooked = document.getElementById(
		"galleryFeaturedMostBooked",
	).checked

	const mainImageFile = document.getElementById("galleryMainImage").files?.[0]
	const beforeImageFile =
		document.getElementById("galleryBeforeImage").files?.[0]

	const isBraidsCategory = serviceCategory === "braids-services"
	const isHairCategory = serviceCategory === "hair-services"
	const hairServiceRules = getAdminHairServiceFieldRules(hairServiceType)
	if (!styleName || !serviceName || !styleType || !timeTaken || !stylistName) {
		setAdminMessage(
			"error",
			"❌ Please complete all required fields.",
			"adminGalleryMessage",
		)
		return
	}

	if (isBraidsCategory && (!length || !size || !hairType)) {
		setAdminMessage(
			"error",
			"❌ Braids entries require length, size, and hair type.",
			"adminGalleryMessage",
		)
		return
	}

	if (isHairCategory && (!hairServiceType || !hairTechnique)) {
		setAdminMessage(
			"error",
			"❌ Hair entries require hair service type and technique/finish.",
			"adminGalleryMessage",
		)
		return
	}

	if (
		isHairCategory &&
		hairServiceRules.requireProductsUsed &&
		!hairProductsUsed
	) {
		setAdminMessage(
			"error",
			"❌ This hair service type requires products/color mix used.",
			"adminGalleryMessage",
		)
		return
	}

	if (!editId && !mainImageFile) {
		setAdminMessage(
			"error",
			"❌ After/final style image is required for new entries.",
			"adminGalleryMessage",
		)
		return
	}

	const currentItem = adminGalleryDocs.find((g) => g.id === editId)

	try {
		setAdminButtonLoadingState(saveBtn, true, {
			loadingText: editId ? "Updating..." : "Saving...",
		})

		let imageUrl = currentItem?.imageUrl || ""
		let beforeImageUrl = currentItem?.beforeImageUrl || ""

		if (mainImageFile) {
			imageUrl = await uploadImageToCloudinary(mainImageFile, {
				purpose: "admin-gallery",
				tags: ["admin_upload", "gallery", "gallery_after"],
				context: { section: "gallery", image_role: "after" },
			})
		}
		if (beforeImageFile) {
			beforeImageUrl = await uploadImageToCloudinary(beforeImageFile, {
				purpose: "admin-gallery",
				tags: ["admin_upload", "gallery", "gallery_before"],
				context: { section: "gallery", image_role: "before" },
			})
		}

		const payload = {
			styleName,
			serviceName,
			serviceCategory,
			styleType,
			length: isBraidsCategory ? length : "",
			size: isBraidsCategory ? size : "",
			timeTaken,
			priceRange,
			hairType: isBraidsCategory ? hairType : "",
			hairServiceType: isHairCategory ? hairServiceType : "",
			hairTechnique:
				isHairCategory && hairServiceRules.showTechnique ? hairTechnique : "",
			hairLengthDensity:
				isHairCategory && hairServiceRules.showLengthDensity
					? hairLengthDensity
					: "",
			hairProductsUsed:
				isHairCategory && hairServiceRules.showProductsUsed
					? hairProductsUsed
					: "",
			stylistName,
			imageUrl,
			beforeImageUrl,
			hasBeforeAfter: Boolean(beforeImageUrl),
			featuredTrending,
			featuredMostBooked,
			updatedAt: getServerTimestamp(),
		}

		if (editId) {
			await db
				.collection("galleryStyles")
				.doc(editId)
				.set(payload, { merge: true })
			setAdminMessage(
				"success",
				"✅ Gallery style updated successfully.",
				"adminGalleryMessage",
			)
		} else {
			await db.collection("galleryStyles").add({
				...payload,
				createdAt: getServerTimestamp(),
			})
			setAdminMessage(
				"success",
				"✅ Gallery style created successfully.",
				"adminGalleryMessage",
			)
		}

		resetGalleryForm()
	} catch (error) {
		console.error("Saving gallery style failed:", error)
		setAdminMessage(
			"error",
			`❌ Failed to save gallery style: ${error.message || "unknown error"}`,
			"adminGalleryMessage",
		)
	} finally {
		setAdminButtonLoadingState(saveBtn, false, {
			resetText: document.getElementById("galleryEditId").value
				? "Update Gallery Style"
				: "Save Gallery Style",
		})
	}
}

async function deleteGalleryItem(id) {
	if (!id) return
	const confirmed = await showAdminConfirmModal(
		"Delete this gallery style permanently? This action cannot be undone.",
		"Delete Style",
	)
	if (!confirmed) return

	try {
		await db.collection("galleryStyles").doc(id).delete()
		setAdminMessage(
			"success",
			"✅ Gallery style deleted.",
			"adminGalleryMessage",
		)
		if (document.getElementById("galleryEditId").value === id) {
			resetGalleryForm()
		}
	} catch (error) {
		console.error("Delete gallery style failed:", error)
		setAdminMessage(
			"error",
			`❌ Failed to delete style: ${error.message || "unknown error"}`,
			"adminGalleryMessage",
		)
	}
}

async function saveBlogItem(event) {
	event.preventDefault()
	if (!adminUnlocked || !db || !auth?.currentUser) return

	const saveBtn = document.getElementById("adminBlogsSaveBtn")
	const editId = document.getElementById("blogEditId").value.trim()

	const title = document.getElementById("blogTitle").value.trim()
	const excerpt = document.getElementById("blogExcerpt").value.trim()
	const readTime = document.getElementById("blogReadTime").value.trim()
	const publishDate = document.getElementById("blogDate").value
	const readMoreUrl = document.getElementById("blogReadMoreUrl").value.trim()
	const imageFile = document.getElementById("blogImage").files?.[0]

	if (!title || !excerpt || !readTime || !publishDate || !readMoreUrl) {
		setAdminMessage(
			"error",
			"❌ Please complete all required blog fields.",
			"adminBlogsMessage",
		)
		return
	}

	const currentItem = adminBlogDocs.find((blog) => blog.id === editId)
	if (!editId && !imageFile) {
		setAdminMessage(
			"error",
			"❌ Blog image is required for new posts.",
			"adminBlogsMessage",
		)
		return
	}

	try {
		setAdminButtonLoadingState(saveBtn, true, {
			loadingText: editId ? "Updating..." : "Saving...",
		})

		let imageUrl = currentItem?.imageUrl || ""
		if (imageFile) {
			imageUrl = await uploadImageToCloudinary(imageFile, {
				purpose: "admin-blog",
				tags: ["admin_upload", "blog"],
				context: { section: "blog" },
			})
		}

		const payload = {
			title,
			excerpt,
			readTime,
			publishDate,
			readMoreUrl,
			imageUrl,
			updatedAt: getServerTimestamp(),
		}

		if (editId) {
			await db.collection("blogs").doc(editId).set(payload, { merge: true })
			setAdminMessage(
				"success",
				"✅ Blog updated successfully.",
				"adminBlogsMessage",
			)
		} else {
			await db.collection("blogs").add({
				...payload,
				createdAt: getServerTimestamp(),
			})
			setAdminMessage(
				"success",
				"✅ Blog created successfully.",
				"adminBlogsMessage",
			)
		}

		resetAdminBlogsForm()
	} catch (error) {
		console.error("Saving blog failed:", error)
		setAdminMessage(
			"error",
			`❌ Failed to save blog: ${error.message || "unknown error"}`,
			"adminBlogsMessage",
		)
	} finally {
		setAdminButtonLoadingState(saveBtn, false, {
			resetText: document.getElementById("blogEditId").value
				? "Update Blog"
				: "Save Blog",
		})
	}
}

async function deleteBlogItem(id) {
	if (!id) return
	const confirmed = await showAdminConfirmModal(
		"Delete this blog permanently? This action cannot be undone.",
		"Delete Blog",
	)
	if (!confirmed) return

	try {
		await db.collection("blogs").doc(id).delete()
		setAdminMessage("success", "✅ Blog deleted.", "adminBlogsMessage")
		if (document.getElementById("blogEditId").value === id) {
			resetAdminBlogsForm()
		}
	} catch (error) {
		console.error("Delete blog failed:", error)
		setAdminMessage(
			"error",
			`❌ Failed to delete blog: ${error.message || "unknown error"}`,
			"adminBlogsMessage",
		)
	}
}

function scrollAdminBlogs(direction = "next") {
	const list = document.getElementById("adminBlogsList")
	if (!list) return

	const firstCard = list.querySelector(".admin-blog-item")
	if (!firstCard) return

	const gap = Number.parseFloat(getComputedStyle(list).rowGap || "12") || 12
	const step = Math.max(firstCard.offsetHeight, 220) + gap
	const delta = direction === "prev" ? -step : step
	const maxTop = Math.max(0, list.scrollHeight - list.clientHeight)
	const targetTop = Math.min(maxTop, Math.max(0, list.scrollTop + delta))

	if (typeof list.scrollTo === "function") {
		list.scrollTo({ top: targetTop, behavior: "smooth" })
	} else {
		list.scrollTop = targetTop
	}

	window.setTimeout(updateAdminBlogScrollButtons, 240)
}

async function updateBookingStatus(bookingId, status) {
	const ref = db.collection("bookings").doc(bookingId)
	await ref.set(
		{
			status,
			updatedAt: getServerTimestamp(),
		},
		{ merge: true },
	)
}

async function updateBookingStatusAndReleaseSlot(bookingId, status) {
	const safeBookingId = String(bookingId || "").trim()
	const terminalStatus = normalizeStatus(status)
	if (!["cancelled", "completed"].includes(terminalStatus)) {
		throw new Error("Only cancelled or completed bookings can release a slot")
	}
	if (!safeBookingId) throw new Error("Booking ID is required")

	return callAdminUpdateBookingStatusAndReleaseSlotAction({
		bookingId: safeBookingId,
		status: terminalStatus,
	})
}

async function cancelBookingAndReleaseSlot(bookingId) {
	return updateBookingStatusAndReleaseSlot(bookingId, "cancelled")
}

async function completeBookingAndReleaseSlot(bookingId) {
	return updateBookingStatusAndReleaseSlot(bookingId, "completed")
}

function startAdminBookingsListener() {
	if (!canStartAdminRealtimeListener("canManageBookings")) {
		stopAdminBookingsListener()
		return
	}

	stopAdminBookingsListener()

	adminBookingsUnsubscribe = db
		.collection("bookings")
		.limit(100)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminBookings(docs)
			},
			(error) => {
				console.error("Admin bookings listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch bookings in realtime: ${error.message || "unknown error"}`,
				)
			},
		)
}

function startAdminGalleryListener() {
	if (!canStartAdminRealtimeListener("canManageContent")) {
		stopAdminGalleryListener()
		return
	}

	stopAdminGalleryListener()

	adminGalleryUnsubscribe = db
		.collection("galleryStyles")
		.limit(200)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminGallery(docs)
			},
			(error) => {
				console.error("Admin gallery listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch gallery in realtime: ${error.message || "unknown error"}`,
					"adminGalleryMessage",
				)
			},
		)
}

function startAdminBlogsListener() {
	if (!canStartAdminRealtimeListener("canManageContent")) {
		stopAdminBlogsListener()
		return
	}

	stopAdminBlogsListener()

	adminBlogsUnsubscribe = db
		.collection("blogs")
		.limit(300)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminBlogs(docs)
			},
			(error) => {
				console.error("Admin blogs listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch blogs in realtime: ${error.message || "unknown error"}`,
					"adminBlogsMessage",
				)
			},
		)
}

function startAdminReviewsListener() {
	if (!canStartAdminRealtimeListener("canManageContent")) {
		stopAdminReviewsListener()
		return
	}

	stopAdminReviewsListener()

	adminReviewsUnsubscribe = db
		.collection("reviews")
		.limit(300)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminReviews(docs)
			},
			(error) => {
				console.error("Admin reviews listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch reviews in realtime: ${error.message || "unknown error"}`,
					"adminReviewsMessage",
				)
			},
		)
}

function startAdminContactListener() {
	if (!canStartAdminRealtimeListener("canManageContent")) {
		stopAdminContactListener()
		return
	}

	stopAdminContactListener()

	adminContactUnsubscribe = db
		.collection("contactMessages")
		.limit(300)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminContactMessages(docs)
			},
			(error) => {
				console.error("Admin contact messages listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch contact messages in realtime: ${error.message || "unknown error"}`,
					"adminContactMessage",
				)
			},
		)
}

function startAdminWaitlistListener() {
	if (!canStartAdminRealtimeListener("canManageBookings")) {
		stopAdminWaitlistListener()
		return
	}

	stopAdminWaitlistListener()

	adminWaitlistUnsubscribe = db
		.collection("waitlist")
		.limit(300)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminWaitlist(docs)
			},
			(error) => {
				console.error("Admin waitlist listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch waitlist in realtime: ${error.message || "unknown error"}`,
					"adminWaitlistMessage",
				)
			},
		)
}

function startAdminSecurityListener() {
	if (!canStartAdminRealtimeListener("canManageSecurity")) {
		stopAdminSecurityListener()
		return
	}

	stopAdminSecurityListener()

	adminSecurityUnsubscribe = db
		.collection("loginActivities")
		.orderBy("createdAt", "desc")
		.limit(400)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminSecurityActivities(docs)
			},
			(error) => {
				console.error("Admin security activity listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch login activities in realtime: ${error.message || "unknown error"}`,
					"adminSecurityMessage",
				)
			},
		)
}

function startAdminUsersListener() {
	if (!canStartAdminRealtimeListener("canManageAdmins")) {
		stopAdminUsersListener()
		return
	}

	stopAdminUsersListener()

	adminUsersUnsubscribe = db
		.collection("adminUsers")
		.limit(1000)
		.onSnapshot(
			(snapshot) => {
				adminUserDocs = snapshot.docs.map((doc) =>
					normalizeManagedAdminUserDoc({
						uid: doc.id,
						...doc.data(),
					}),
				)
				if (isCurrentSuperAdmin()) {
					adminManagedUsersDocs =
						mergeCurrentAdminIntoManagedUsers(adminUserDocs)
					renderAdminManagedUsers()
				}
				updateAdminSecurityWidgets()
			},
			(error) => {
				console.error("Admin users listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch admin users in realtime: ${error.message || "unknown error"}`,
					"adminSecurityEventsMessage",
				)
			},
		)
}

function startAdminSecurityAlertsListener() {
	if (!canStartAdminRealtimeListener("canManageSecurity")) {
		stopAdminSecurityAlertsListener()
		return
	}

	stopAdminSecurityAlertsListener()

	adminSecurityAlertsUnsubscribe = db
		.collection("securityAlerts")
		.orderBy("createdAt", "desc")
		.limit(400)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminSecurityAlerts(docs)
			},
			(error) => {
				console.error("Admin security alerts listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch security alerts in realtime: ${error.message || "unknown error"}`,
					"adminSecurityEventsMessage",
				)
			},
		)
}

function startAdminAccountHistoryListener() {
	if (!canStartAdminRealtimeListener("canManageSecurity")) {
		stopAdminAccountHistoryListener()
		return
	}

	stopAdminAccountHistoryListener()

	adminAccountHistoryUnsubscribe = db
		.collection("accountChangeHistory")
		.orderBy("createdAt", "desc")
		.limit(400)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminAccountHistory(docs)
			},
			(error) => {
				console.error("Admin account history listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch account history in realtime: ${error.message || "unknown error"}`,
					"adminSecurityEventsMessage",
				)
			},
		)
}

function startAdminSessionsListener() {
	if (!canStartAdminRealtimeListener("canManageSecurity")) {
		stopAdminSessionsListener()
		return
	}

	stopAdminSessionsListener()

	adminSessionsUnsubscribe = db
		.collectionGroup("sessions")
		.limit(800)
		.onSnapshot(
			(snapshot) => {
				setAdminMessage("", "", "adminSecurityEventsMessage")
				const docs = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
					__name__: doc.ref,
				}))
				renderAdminSessions(docs)
			},
			(error) => {
				console.error("Admin session tracking listener failed:", error)

				const code = String(error?.code || "")
					.trim()
					.toLowerCase()
				const isPermissionDenied =
					code === "permission-denied" ||
					String(error?.message || "")
						.toLowerCase()
						.includes("missing or insufficient permissions")

				if (isPermissionDenied) {
					const mount = document.getElementById("adminSessionsList")
					if (mount) {
						mount.innerHTML =
							'<div class="admin-empty-state">Session tracking is temporarily unavailable (permission denied). If rules were just deployed, sign out and sign back in, then refresh this page.</div>'
					}
					setAdminMessage(
						"error",
						"⚠️ Session tracking permission denied. Please sign out/in and refresh after backend policy deployment.",
						"adminSecurityEventsMessage",
					)
					return
				}

				setAdminMessage(
					"error",
					`❌ Failed to watch session tracking in realtime: ${error.message || "unknown error"}`,
					"adminSecurityEventsMessage",
				)
			},
		)
}

function startAdminTimelineListener() {
	if (!canStartAdminRealtimeListener("canManageSecurity")) {
		stopAdminTimelineListener()
		return
	}

	stopAdminTimelineListener()

	adminTimelineUnsubscribe = db
		.collection("activityTimeline")
		.orderBy("createdAt", "desc")
		.limit(500)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				renderAdminTimeline(docs)
			},
			(error) => {
				console.error("Admin timeline listener failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to watch activity timeline in realtime: ${error.message || "unknown error"}`,
					"adminSecurityEventsMessage",
				)
			},
		)
}

function initializeAdminPanel() {
	const loginForm = document.getElementById("adminLoginForm")
	const logoutBtn = document.getElementById("adminLogoutBtn")
	const loginBtn = document.getElementById("adminLoginBtn")
	const passwordToggleBtn = document.getElementById("adminPasswordToggle")
	const bookingList = document.getElementById("adminBookingsList")
	const bookingFilterControls = document.getElementById(
		"adminBookingFilterControls",
	)
	const scheduleGrid = document.getElementById("adminScheduleGrid")
	const scheduleDetails = document.getElementById("adminScheduleDetails")
	const schedulePrevBtn = document.getElementById("adminSchedulePrev")
	const scheduleTodayBtn = document.getElementById("adminScheduleToday")
	const scheduleNextBtn = document.getElementById("adminScheduleNext")
	const scheduleViewButtons = document.querySelectorAll("[data-schedule-view]")
	const blogsForm = document.getElementById("adminBlogsForm")
	const blogsList = document.getElementById("adminBlogsList")
	const blogsCancelEditBtn = document.getElementById("adminBlogsCancelEdit")
	const blogsPrevBtn = document.getElementById("adminBlogsPrevBtn")
	const blogsNextBtn = document.getElementById("adminBlogsNextBtn")
	const galleryForm = document.getElementById("adminGalleryForm")
	const galleryList = document.getElementById("adminGalleryList")
	const reviewsList = document.getElementById("adminReviewsList")
	const reviewStatusFilterControls = document.getElementById(
		"adminReviewStatusFilterControls",
	)
	const contactList = document.getElementById("adminContactList")
	const contactStatusFilterControls = document.getElementById(
		"adminContactStatusFilterControls",
	)
	const waitlistList = document.getElementById("adminWaitlistList")
	const securityList = document.getElementById("adminSecurityActivityList")
	const adminUsersForm = document.getElementById("adminAdminsForm")
	const adminUsersList = document.getElementById("adminAdminsList")
	const adminUsersCancelEditBtn = document.getElementById(
		"adminAdminsCancelEdit",
	)
	const adminUsersSearchInput = document.getElementById(
		"adminAdminsSearchInput",
	)
	const adminUsersRoleFilter = document.getElementById("adminAdminsRoleFilter")
	const adminUsersStatusFilter = document.getElementById(
		"adminAdminsStatusFilter",
	)
	const adminUsersRoleSelect = document.getElementById("adminManageRole")
	const reviewsSortSelect = document.getElementById("adminReviewsSortSelect")
	const messagesSortSelect = document.getElementById("adminMessagesSortSelect")
	const waitlistSortSelect = document.getElementById("adminWaitlistSortSelect")
	const securitySortSelect = document.getElementById("adminSecuritySortSelect")
	const securityRiskFilterSelect = document.getElementById(
		"adminSecurityRiskFilterSelect",
	)
	const securityDateFilterInput = document.getElementById(
		"adminSecurityDateFilter",
	)
	const securityDateFromFilterInput = document.getElementById(
		"adminSecurityDateFromFilter",
	)
	const securityDateToFilterInput = document.getElementById(
		"adminSecurityDateToFilter",
	)
	const securityDeviceFilterSelect = document.getElementById(
		"adminSecurityDeviceFilterSelect",
	)
	const securityProviderFilterSelect = document.getElementById(
		"adminSecurityProviderFilterSelect",
	)
	const securityUserFilterSelect = document.getElementById(
		"adminSecurityUserFilterSelect",
	)
	const securityCountryFilterInput = document.getElementById(
		"adminSecurityCountryFilterInput",
	)
	const securityStatusFilterSelect = document.getElementById(
		"adminSecurityStatusFilterSelect",
	)
	const securitySearchInput = document.getElementById(
		"adminSecuritySearchInput",
	)
	const securityExportCsvBtn = document.getElementById(
		"adminSecurityExportCsvBtn",
	)
	const securityExportExcelBtn = document.getElementById(
		"adminSecurityExportExcelBtn",
	)
	const securityClearFiltersBtn = document.getElementById(
		"adminSecurityClearFiltersBtn",
	)
	const securityAlertsSortSelect = document.getElementById(
		"adminSecurityAlertsSortSelect",
	)
	const sessionsSortSelect = document.getElementById("adminSessionsSortSelect")
	const accountHistorySortSelect = document.getElementById(
		"adminAccountHistorySortSelect",
	)
	const timelineSortSelect = document.getElementById("adminTimelineSortSelect")
	const profanityWordsInput = document.getElementById("adminProfanityWords")
	const saveProfanityBtn = document.getElementById("adminSaveProfanityList")
	const serviceCategoryToggles = document.getElementById(
		"adminServiceCategoryToggles",
	)
	const saveServiceCategoriesBtn = document.getElementById(
		"adminSaveServiceCategoriesBtn",
	)
	const cancelEditBtn = document.getElementById("adminGalleryCancelEdit")
	const confirmModal = document.getElementById("adminConfirmModal")
	const confirmCancelBtn = document.getElementById("adminConfirmCancel")
	const confirmOkBtn = document.getElementById("adminConfirmOk")

	if (!loginForm || !logoutBtn || !bookingList || !securityList) return

	initializeAdminSectionTabs()
	initializeAdminHomepageNavigation()
	initializeAdminBackToTop()
	initializeAdminFloatingTooltips()
	bindGalleryPreviewEvents()
	setAdminPasswordVisibility(false)

	if (passwordToggleBtn) {
		passwordToggleBtn.addEventListener("click", () => {
			const passwordInput = document.getElementById("adminPassword")
			if (!passwordInput) return
			setAdminPasswordVisibility(passwordInput.type === "password")
		})
	}

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault()
		if (!appServicesReady || !auth) {
			setAdminMessage(
				"error",
				"❌ Auth service is not ready yet.",
				"adminAuthMessage",
			)
			return
		}

		const emailInput = document.getElementById("adminEmail")
		const passwordInput = document.getElementById("adminPassword")
		const email = emailInput?.value?.trim().toLowerCase() || ""
		const password = passwordInput?.value || ""

		if (!email || !password) {
			setAdminMessage(
				"error",
				"❌ Email and password are required.",
				"adminAuthMessage",
			)
			return
		}

		setAdminButtonLoadingState(loginBtn, true, {
			loadingText: "Signing In...",
		})

		try {
			await auth.signInWithEmailAndPassword(email, password)
			await logAdminLoginActivity({ email, status: "success" })
			if (passwordInput) {
				passwordInput.value = ""
				setAdminPasswordVisibility(false)
			}
		} catch (error) {
			await logAdminLoginActivity({ email, status: "failure", error })
			console.error("Admin log in failed:", error)
			setAdminMessage(
				"error",
				`❌ Login failed: ${error.message || "unknown error"}`,
				"adminAuthMessage",
			)
		} finally {
			setAdminButtonLoadingState(loginBtn, false, {
				resetText: "Log In",
			})
		}
	})

	logoutBtn.addEventListener("click", async () => {
		if (!auth) return
		try {
			setAdminButtonLoadingState(logoutBtn, true, {
				loadingText: "Logging Out",
			})
			adminPendingLogoutToast = true
			resetAdminLoginCredentials()
			await new Promise((resolve) => setTimeout(resolve, 350))
			await auth.signOut()
		} catch (error) {
			adminPendingLogoutToast = false
			console.error("Admin signout failed:", error)
			resetAdminLoginCredentials()
			setAdminButtonLoadingState(logoutBtn, false, {
				resetText: "Log Out",
			})
			setAdminMessage(
				"error",
				`❌ Logout failed: ${error.message || "unknown error"}`,
				"adminAuthMessage",
			)
		} finally {
			setAdminButtonLoadingState(logoutBtn, false, {
				resetText: "Log Out",
			})
		}
	})

	bookingList.addEventListener("click", async (event) => {
		const waitlistActionBtn = event.target.closest(
			"button[data-waitlist-action]",
		)
		if (waitlistActionBtn) {
			await handleAdminWaitlistActionButton(
				waitlistActionBtn,
				"adminActionMessage",
			)
			return
		}

		const button = event.target.closest("button[data-action]")
		if (!button || !adminUnlocked || !auth?.currentUser) return

		const action = button.dataset.action
		const bookingId = button.dataset.id
		if (!action || !bookingId) return

		setAdminButtonLoadingState(button, true, {
			loadingText: "Applying...",
		})
		try {
			if (action === "cancel-release") {
				const result = await cancelBookingAndReleaseSlot(bookingId)
				setAdminMessage(
					"success",
					getAdminReleasedSlotId(result)
						? "✅ Booking cancelled and slot released successfully."
						: "✅ Booking cancelled. No locked slot was found to release.",
					"adminActionMessage",
				)
			} else if (action === "completed") {
				const result = await completeBookingAndReleaseSlot(bookingId)
				setAdminMessage(
					"success",
					getAdminReleasedSlotId(result)
						? "✅ Booking completed and slot released successfully."
						: "✅ Booking completed. No locked slot was found to release.",
					"adminActionMessage",
				)
			} else if (action === "move-waitlist-confirmed") {
				await callAdminMoveWaitlistBookingToConfirmedAction({
					bookingId,
					waitlistId: String(button.dataset.waitlistId || "").trim(),
				})
				setAdminMessage(
					"success",
					"✅ Waitlisted booking moved to confirmed and slot locked.",
					"adminActionMessage",
				)
			} else {
				await updateBookingStatus(bookingId, action)
				setAdminMessage(
					"success",
					`✅ Booking updated to ${action}.`,
					"adminActionMessage",
				)
			}
		} catch (error) {
			console.error("Admin action failed:", error)
			const actionErrorMessage =
				action === "move-waitlist-confirmed"
					? formatAdminWaitlistActionFailureMessage(error, "move-confirmed")
					: `❌ Action failed: ${error.message || "unknown error"}`
			setAdminMessage("error", actionErrorMessage, "adminActionMessage")
		} finally {
			setAdminButtonLoadingState(button, false)
		}
	})

	if (bookingFilterControls) {
		bookingFilterControls.addEventListener("click", (event) => {
			const button = event.target.closest("[data-booking-status-filter]")
			if (!button) return

			adminBookingStatusFilter = normalizeAdminBookingFilter(
				button.dataset.bookingStatusFilter,
			)
			renderAdminBookings(adminBookingDocs)
		})
	}

	if (reviewStatusFilterControls) {
		reviewStatusFilterControls.addEventListener("click", (event) => {
			const button = event.target.closest("[data-review-status-filter]")
			if (!button) return

			const nextFilter = normalizeAdminReviewStatusFilter(
				button.dataset.reviewStatusFilter,
			)
			adminReviewStatusFilter =
				adminReviewStatusFilter === nextFilter ? "all" : nextFilter
			renderAdminReviews(adminReviewRawDocs)
		})
	}

	if (contactStatusFilterControls) {
		contactStatusFilterControls.addEventListener("click", (event) => {
			const button = event.target.closest("[data-contact-status-filter]")
			if (!button) return

			const nextFilter = normalizeAdminContactStatusFilter(
				button.dataset.contactStatusFilter,
			)
			adminContactStatusFilter =
				adminContactStatusFilter === nextFilter ? "all" : nextFilter
			renderAdminContactMessages(adminContactDocs)
		})
	}

	securityList.addEventListener("click", async (event) => {
		const actionBtn = event.target.closest("button[data-security-action]")
		if (!actionBtn || !adminUnlocked || !auth?.currentUser) return

		const buttonAction = String(actionBtn.dataset.securityAction || "").trim()
		const targetUid = String(actionBtn.dataset.uid || "").trim()
		const targetEmail = String(actionBtn.dataset.email || "")
			.trim()
			.toLowerCase()

		if (!buttonAction || !targetUid) return

		let action = ""
		let blockMinutes = 0
		let confirmMessage = ""
		let successMessage = ""

		if (buttonAction === "temporary-block") {
			action = "temporary_block"
			const input = window.prompt(
				"Enter temporary block duration in minutes (5 - 10080):",
				String(ADMIN_SECURITY_BLOCK_DEFAULT_MINUTES),
			)
			if (input === null) return

			blockMinutes = Number(input)
			if (
				!Number.isFinite(blockMinutes) ||
				blockMinutes < 5 ||
				blockMinutes > 10080
			) {
				setAdminMessage(
					"error",
					"❌ Enter a valid block duration between 5 and 10080 minutes.",
					"adminSecurityEventsMessage",
				)
				return
			}
			confirmMessage = `Temporarily block this account for ${Math.round(blockMinutes)} minutes?`
			successMessage = "✅ Account temporarily blocked."
		} else if (buttonAction === "force-logout") {
			action = "force_logout"
			confirmMessage =
				"Force logout this account from all active sessions immediately?"
			successMessage = "✅ User has been forced to logout."
		} else if (buttonAction === "force-password-reset") {
			action = "force_password_reset"
			confirmMessage =
				"Force this user to reset password on next access and end current sessions?"
			successMessage = "✅ Password reset has been forced for this account."
		} else if (buttonAction === "clear-restrictions") {
			action = "clear_restrictions"
			confirmMessage =
				"Clear all account restrictions (block, force logout, and forced password reset) for this user?"
			successMessage = "✅ All restrictions cleared for this account."
		} else {
			return
		}

		const confirmed = await showAdminConfirmModal(confirmMessage, "Confirm")
		if (!confirmed) return

		setAdminButtonLoadingState(actionBtn, true, {
			loadingText: "Applying...",
		})

		try {
			await callAdminRestrictUserAction({
				action,
				uid: targetUid,
				email: targetEmail,
				blockMinutes: Math.round(blockMinutes || 0),
			})

			setAdminMessage("success", successMessage, "adminSecurityEventsMessage")
		} catch (error) {
			console.error("Security account action failed:", error)
			setAdminMessage(
				"error",
				`❌ Security action failed: ${error.message || "unknown error"}`,
				"adminSecurityEventsMessage",
			)
		} finally {
			setAdminButtonLoadingState(actionBtn, false)
		}
	})

	if (schedulePrevBtn) {
		schedulePrevBtn.addEventListener("click", () => {
			moveAdminScheduleAnchorByDays(
				adminScheduleView === ADMIN_SCHEDULE_VIEWS.day ? -1 : -7,
			)
			renderAdminSchedule()
		})
	}

	if (scheduleTodayBtn) {
		scheduleTodayBtn.addEventListener("click", () => {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			adminScheduleAnchorDate = today
			renderAdminSchedule()
		})
	}

	if (scheduleNextBtn) {
		scheduleNextBtn.addEventListener("click", () => {
			moveAdminScheduleAnchorByDays(
				adminScheduleView === ADMIN_SCHEDULE_VIEWS.day ? 1 : 7,
			)
			renderAdminSchedule()
		})
	}

	if (scheduleViewButtons.length) {
		scheduleViewButtons.forEach((button) => {
			button.addEventListener("click", () => {
				adminScheduleView = normalizeAdminScheduleView(
					button.dataset.scheduleView,
				)
				renderAdminSchedule()
			})
		})
	}

	if (scheduleGrid) {
		scheduleGrid.addEventListener("click", (event) => {
			const eventBtn = event.target.closest("[data-schedule-booking]")
			if (!eventBtn) return

			const bookingId = String(eventBtn.dataset.scheduleBooking || "").trim()
			if (!bookingId) return

			adminScheduleSelectedBookingId = bookingId
			renderAdminSchedule()
		})
	}

	if (scheduleDetails) {
		scheduleDetails.addEventListener("click", async (event) => {
			const navButton = event.target.closest("button[data-schedule-nav]")
			if (navButton) {
				if (navButton.dataset.scheduleNav === "previous") {
					selectPreviousAdminScheduleBooking()
				}
				if (navButton.dataset.scheduleNav === "next") {
					selectNextAdminScheduleBooking()
				}
				return
			}

			const button = event.target.closest("button[data-schedule-action]")
			if (!button || !adminUnlocked || !auth?.currentUser) return

			const action = button.dataset.scheduleAction
			const bookingId = button.dataset.id
			if (!action || !bookingId) return

			const scheduleBooking =
				adminBookingDocs.find(
					(item = {}) => String(item.id || "").trim() === bookingId,
				) || null
			const isWaitlistedScheduleBooking =
				normalizeStatus(extractRawStatus(scheduleBooking || {})) ===
				"waitlisted"

			setAdminButtonLoadingState(button, true, {
				loadingText: "Applying...",
			})
			try {
				if (action === "move-waitlist-confirmed") {
					await callAdminMoveWaitlistBookingToConfirmedAction({
						bookingId,
						waitlistId:
							String(button.dataset.waitlistId || "").trim() ||
							String(scheduleBooking?.waitlistId || "").trim(),
					})
					setAdminMessage(
						"success",
						"✅ Waitlisted booking moved to confirmed and slot locked.",
						"adminScheduleMessage",
					)
				} else if (isWaitlistedScheduleBooking) {
					throw new Error(
						"Waitlisted schedule bookings must be moved to confirmed using the safe slot-locking action first.",
					)
				} else if (action === "cancel-release") {
					const result = await cancelBookingAndReleaseSlot(bookingId)
					setAdminMessage(
						"success",
						getAdminReleasedSlotId(result)
							? "✅ Booking cancelled and slot released successfully."
							: "✅ Booking cancelled. No locked slot was found to release.",
						"adminScheduleMessage",
					)
				} else if (action === "completed") {
					const result = await completeBookingAndReleaseSlot(bookingId)
					setAdminMessage(
						"success",
						getAdminReleasedSlotId(result)
							? "✅ Booking completed and slot released successfully."
							: "✅ Booking completed. No locked slot was found to release.",
						"adminScheduleMessage",
					)
				} else {
					await updateBookingStatus(bookingId, action)
					setAdminMessage(
						"success",
						`✅ Booking updated to ${action}.`,
						"adminScheduleMessage",
					)
				}
			} catch (error) {
				console.error("Schedule quick action failed:", error)
				const scheduleActionErrorMessage =
					action === "move-waitlist-confirmed"
						? formatAdminWaitlistActionFailureMessage(error, "move-confirmed")
						: `❌ Action failed: ${error.message || "unknown error"}`
				setAdminMessage(
					"error",
					scheduleActionErrorMessage,
					"adminScheduleMessage",
				)
			} finally {
				setAdminButtonLoadingState(button, false)
			}
		})
	}

	if (galleryForm) {
		// Defensive: always block native form navigation/reload on gallery save
		galleryForm.setAttribute("action", "javascript:void(0)")
		galleryForm.addEventListener("submit", (event) => {
			event.preventDefault()
			event.stopPropagation()
			void saveGalleryItem(event)
		})
	}

	const adminGalleryServiceFilters = document.getElementById(
		"adminGalleryServiceFilters",
	)
	if (adminGalleryServiceFilters) {
		adminGalleryServiceFilters.addEventListener("click", (event) => {
			const button = event.target.closest("[data-admin-gallery-service]")
			if (!button) return
			const selectedCategory = normalizeAdminGalleryServiceCategory(
				button.dataset.adminGalleryService,
			)
			applyAdminGalleryServiceCategoryToForm(selectedCategory)
		})
	}

	if (cancelEditBtn) {
		cancelEditBtn.addEventListener("click", resetGalleryForm)
	}

	if (galleryList) {
		galleryList.addEventListener("click", (event) => {
			const actionBtn = event.target.closest("button[data-gallery-action]")
			if (!actionBtn || !adminUnlocked || !auth?.currentUser) return

			const action = actionBtn.dataset.galleryAction
			const id = actionBtn.dataset.id
			if (!action || !id) return

			if (action === "edit") {
				loadGalleryItemForEditing(id)
				return
			}
			if (action === "delete") {
				deleteGalleryItem(id)
			}
		})
	}

	if (blogsForm) {
		blogsForm.setAttribute("action", "javascript:void(0)")
		blogsForm.addEventListener("submit", (event) => {
			event.preventDefault()
			event.stopPropagation()
			void saveBlogItem(event)
		})
	}

	if (blogsCancelEditBtn) {
		blogsCancelEditBtn.addEventListener("click", resetAdminBlogsForm)
	}

	if (blogsPrevBtn) {
		blogsPrevBtn.addEventListener("click", () => {
			scrollAdminBlogs("prev")
		})
	}

	if (blogsNextBtn) {
		blogsNextBtn.addEventListener("click", () => {
			scrollAdminBlogs("next")
		})
	}

	if (blogsList) {
		blogsList.addEventListener("scroll", updateAdminBlogScrollButtons, {
			passive: true,
		})
		window.addEventListener("resize", updateAdminBlogScrollButtons)

		blogsList.addEventListener("click", (event) => {
			const actionBtn = event.target.closest("button[data-blog-action]")
			if (!actionBtn || !adminUnlocked || !auth?.currentUser) return

			const action = actionBtn.dataset.blogAction
			const id = actionBtn.dataset.id
			if (!action || !id) return

			if (action === "edit") {
				loadBlogItemForEditing(id)
				return
			}
			if (action === "delete") {
				void deleteBlogItem(id)
			}
		})
	}

	if (reviewsList) {
		reviewsList.addEventListener("click", async (event) => {
			const actionBtn = event.target.closest("button[data-review-action]")
			if (!actionBtn || !adminUnlocked || !auth?.currentUser) return

			const action = actionBtn.dataset.reviewAction
			const reviewId = actionBtn.dataset.id
			if (!action || !reviewId) return

			setAdminButtonLoadingState(actionBtn, true, {
				loadingText: "Applying...",
			})
			try {
				if (action === "save-edit") {
					const textInput = reviewsList.querySelector(
						`[data-review-edit-text="${reviewId}"]`,
					)
					const nextText = textInput?.value?.trim() || ""
					if (nextText.length < 10) {
						throw new Error("Review text must be at least 10 characters.")
					}
					await updateReviewText(reviewId, nextText)
					setAdminMessage(
						"success",
						"✅ Review text updated (status reset to pending).",
						"adminReviewsMessage",
					)
				} else if (action === "save-reply") {
					const replyInput = reviewsList.querySelector(
						`[data-review-reply-text="${reviewId}"]`,
					)
					await updateReviewReply(reviewId, replyInput?.value || "")
					setAdminMessage(
						"success",
						"✅ Admin reply saved.",
						"adminReviewsMessage",
					)
				} else if (action === "toggle-featured") {
					await toggleReviewFeatured(reviewId)
					setAdminMessage(
						"success",
						"✅ Review featured state updated.",
						"adminReviewsMessage",
					)
				} else if (action === "delete") {
					await deleteReview(reviewId)
					setAdminMessage(
						"success",
						"✅ Review deleted successfully.",
						"adminReviewsMessage",
					)
				} else {
					await updateReviewStatus(reviewId, action)
					setAdminMessage(
						"success",
						`✅ Review marked as ${normalizeReviewStatus(action)}.`,
						"adminReviewsMessage",
					)
				}
			} catch (error) {
				console.error("Review moderation action failed:", error)
				setAdminMessage(
					"error",
					`❌ Review action failed: ${error.message || "unknown error"}`,
					"adminReviewsMessage",
				)
			} finally {
				setAdminButtonLoadingState(actionBtn, false)
			}
		})
	}

	if (reviewsSortSelect) {
		reviewsSortSelect.value = adminReviewsSortMode
		reviewsSortSelect.addEventListener("change", (event) => {
			adminReviewsSortMode = event.target.value || "featured"
			renderAdminReviews(adminReviewRawDocs)
		})
	}

	if (messagesSortSelect) {
		messagesSortSelect.value = adminMessagesSortMode
		messagesSortSelect.addEventListener("change", (event) => {
			adminMessagesSortMode = event.target.value || "newest"
			renderAdminContactMessages(adminContactDocs)
		})
	}

	if (waitlistSortSelect) {
		waitlistSortSelect.value = adminWaitlistSortMode
		waitlistSortSelect.addEventListener("change", (event) => {
			adminWaitlistSortMode = event.target.value || "newest"
			renderAdminWaitlist(adminWaitlistDocs)
		})
	}

	if (securitySortSelect) {
		securitySortSelect.value = adminSecuritySortMode
		securitySortSelect.addEventListener("change", (event) => {
			adminSecuritySortMode = event.target.value || "newest"
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityRiskFilterSelect) {
		securityRiskFilterSelect.value = adminSecurityRiskFilter
		securityRiskFilterSelect.addEventListener("change", (event) => {
			adminSecurityRiskFilter = event.target.value || "all"
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityDateFilterInput) {
		securityDateFilterInput.value = adminSecurityDateFilter
		securityDateFilterInput.addEventListener("change", (event) => {
			adminSecurityDateFilter = String(event.target.value || "").trim()
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityDateFromFilterInput) {
		securityDateFromFilterInput.value = adminSecurityDateFromFilter
		securityDateFromFilterInput.addEventListener("change", (event) => {
			adminSecurityDateFromFilter = String(event.target.value || "").trim()
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityDateToFilterInput) {
		securityDateToFilterInput.value = adminSecurityDateToFilter
		securityDateToFilterInput.addEventListener("change", (event) => {
			adminSecurityDateToFilter = String(event.target.value || "").trim()
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityDeviceFilterSelect) {
		securityDeviceFilterSelect.value = adminSecurityDeviceFilter
		securityDeviceFilterSelect.addEventListener("change", (event) => {
			adminSecurityDeviceFilter = event.target.value || "all"
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityProviderFilterSelect) {
		securityProviderFilterSelect.value = adminSecurityProviderFilter
		securityProviderFilterSelect.addEventListener("change", (event) => {
			adminSecurityProviderFilter = event.target.value || "all"
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityUserFilterSelect) {
		securityUserFilterSelect.value = adminSecurityUserFilter
		securityUserFilterSelect.addEventListener("change", (event) => {
			adminSecurityUserFilter = event.target.value || "all"
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityCountryFilterInput) {
		securityCountryFilterInput.value = adminSecurityCountryFilter
		securityCountryFilterInput.addEventListener("input", (event) => {
			adminSecurityCountryFilter = String(event.target.value || "").trim()
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityStatusFilterSelect) {
		securityStatusFilterSelect.value = adminSecurityStatusFilter
		securityStatusFilterSelect.addEventListener("change", (event) => {
			adminSecurityStatusFilter = event.target.value || "all"
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securitySearchInput) {
		securitySearchInput.value = adminSecuritySearchTerm
		securitySearchInput.addEventListener("input", (event) => {
			adminSecuritySearchTerm = String(event.target.value || "").trim()
			renderAdminSecurityActivities(adminSecurityDocs)
		})
	}

	if (securityExportCsvBtn) {
		securityExportCsvBtn.addEventListener("click", () => {
			exportAdminSecurityLogsAsCSV()
		})
	}

	if (securityExportExcelBtn) {
		securityExportExcelBtn.addEventListener("click", () => {
			exportAdminSecurityLogsAsExcel()
		})
	}

	if (securityClearFiltersBtn) {
		securityClearFiltersBtn.addEventListener("click", () => {
			adminSecurityRiskFilter = "all"
			adminSecurityDateFilter = ""
			adminSecurityDateFromFilter = ""
			adminSecurityDateToFilter = ""
			adminSecurityDeviceFilter = "all"
			adminSecurityProviderFilter = "all"
			adminSecurityUserFilter = "all"
			adminSecurityCountryFilter = ""
			adminSecurityStatusFilter = "all"
			adminSecuritySearchTerm = ""

			if (securityRiskFilterSelect) securityRiskFilterSelect.value = "all"
			if (securityDateFilterInput) securityDateFilterInput.value = ""
			if (securityDateFromFilterInput) securityDateFromFilterInput.value = ""
			if (securityDateToFilterInput) securityDateToFilterInput.value = ""
			if (securityDeviceFilterSelect) securityDeviceFilterSelect.value = "all"
			if (securityProviderFilterSelect)
				securityProviderFilterSelect.value = "all"
			if (securityUserFilterSelect) securityUserFilterSelect.value = "all"
			if (securityCountryFilterInput) securityCountryFilterInput.value = ""
			if (securityStatusFilterSelect) securityStatusFilterSelect.value = "all"
			if (securitySearchInput) securitySearchInput.value = ""

			renderAdminSecurityActivities(adminSecurityDocs)
			setAdminMessage(
				"success",
				"✅ Security filters cleared.",
				"adminSecurityEventsMessage",
			)
		})
	}

	if (securityAlertsSortSelect) {
		securityAlertsSortSelect.value = adminSecurityAlertsSortMode
		securityAlertsSortSelect.addEventListener("change", (event) => {
			adminSecurityAlertsSortMode = event.target.value || "newest"
			renderAdminSecurityAlerts(adminSecurityAlertsDocs)
		})
	}

	if (sessionsSortSelect) {
		sessionsSortSelect.value = adminSessionsSortMode
		sessionsSortSelect.addEventListener("change", (event) => {
			adminSessionsSortMode = event.target.value || "online-first"
			renderAdminSessions(adminSessionsDocs)
		})
	}

	if (accountHistorySortSelect) {
		accountHistorySortSelect.value = adminAccountHistorySortMode
		accountHistorySortSelect.addEventListener("change", (event) => {
			adminAccountHistorySortMode = event.target.value || "newest"
			renderAdminAccountHistory(adminAccountHistoryDocs)
		})
	}

	if (timelineSortSelect) {
		timelineSortSelect.value = adminTimelineSortMode
		timelineSortSelect.addEventListener("change", (event) => {
			adminTimelineSortMode = event.target.value || "newest"
			renderAdminTimeline(adminTimelineDocs)
		})
	}

	if (contactList) {
		contactList.addEventListener("click", async (event) => {
			const actionBtn = event.target.closest("button[data-contact-action]")
			if (!actionBtn || !adminUnlocked || !auth?.currentUser) return

			const action = actionBtn.dataset.contactAction
			const messageId = actionBtn.dataset.id
			if (!action || !messageId) return

			setAdminButtonLoadingState(actionBtn, true, {
				loadingText: "Applying...",
			})
			try {
				if (action === "delete") {
					await deleteContactMessage(messageId)
					setAdminMessage(
						"success",
						"✅ Contact message deleted.",
						"adminContactMessage",
					)
				} else {
					await updateContactMessageStatus(messageId, action)
					setAdminMessage(
						"success",
						`✅ Message marked as ${normalizeContactStatus(action)}.`,
						"adminContactMessage",
					)
				}
			} catch (error) {
				console.error("Contact message action failed:", error)
				setAdminMessage(
					"error",
					`❌ Message action failed: ${error.message || "unknown error"}`,
					"adminContactMessage",
				)
			} finally {
				setAdminButtonLoadingState(actionBtn, false)
			}
		})
	}

	if (waitlistList) {
		waitlistList.addEventListener("click", async (event) => {
			const actionBtn = event.target.closest("button[data-waitlist-action]")
			if (!actionBtn) return
			await handleAdminWaitlistActionButton(actionBtn, "adminWaitlistMessage")
		})
	}

	if (adminUsersForm) {
		adminUsersForm.setAttribute("action", "javascript:void(0)")
		adminUsersForm.addEventListener("submit", (event) => {
			event.preventDefault()
			event.stopPropagation()
			void saveManagedAdminUserFromForm(event)
		})
	}

	if (adminUsersCancelEditBtn) {
		adminUsersCancelEditBtn.addEventListener("click", () => {
			resetAdminManagementForm()
			setAdminMessage("", "", "adminAdminsMessage")
		})
	}

	if (adminUsersRoleSelect) {
		adminUsersRoleSelect.addEventListener("change", () => {
			syncAdminManagementPermissionsWithRole()
		})
	}

	if (adminUsersSearchInput) {
		adminUsersSearchInput.addEventListener("input", (event) => {
			adminAdminsSearchTerm = String(event.target?.value || "")
			renderAdminManagedUsers()
		})
	}

	if (adminUsersRoleFilter) {
		adminUsersRoleFilter.addEventListener("change", (event) => {
			adminAdminsRoleFilter = String(event.target?.value || "all")
			renderAdminManagedUsers()
		})
	}

	if (adminUsersStatusFilter) {
		adminUsersStatusFilter.addEventListener("change", (event) => {
			adminAdminsStatusFilter = String(event.target?.value || "all")
			renderAdminManagedUsers()
		})
	}

	if (adminUsersList) {
		const handleAdminUserToggle = async (actionTarget) => {
			const targetUid = String(actionTarget.dataset.uid || "").trim()
			if (!targetUid) return

			const currentlyActive =
				String(actionTarget.dataset.active || "false").trim() === "true"
			const target = adminManagedUsersDocs.find(
				(item) => item.uid === targetUid,
			)
			if (!target) return

			if (!canCurrentAdminToggleManagedAdmin(target)) {
				setAdminMessage(
					"error",
					"❌ Only Super Admins can enable or disable other admin accounts.",
					"adminAdminsMessage",
				)
				if (actionTarget.type === "checkbox") {
					actionTarget.checked = currentlyActive
				}
				return
			}

			const nextActive = !currentlyActive
			const confirmed = await showAdminConfirmModal(
				nextActive
					? `Enable admin access for ${target.email || targetUid}?`
					: `Disable admin access for ${target.email || targetUid}?`,
				nextActive ? "Enable" : "Disable",
			)
			if (!confirmed) {
				if (actionTarget.type === "checkbox") {
					actionTarget.checked = currentlyActive
				}
				return
			}

			setAdminButtonLoadingState(actionTarget, true, {
				loadingText: "Saving...",
				skipTextForCheckbox: true,
			})

			try {
				await callAdminUpdateAdminUserAction({
					adminUserId: target.adminUserId || targetUid,
					uid: targetUid,
					email: target.email,
					active: nextActive,
				})
				setAdminMessage(
					"success",
					`✅ Admin access ${nextActive ? "enabled" : "disabled"} successfully.`,
					"adminAdminsMessage",
				)
				await refreshAdminManagedUsers()
			} catch (error) {
				console.error("Toggle admin access status failed:", error)
				setAdminMessage(
					"error",
					`❌ Failed to update admin status: ${error.message || "unknown error"}`,
					"adminAdminsMessage",
				)
				if (actionTarget.type === "checkbox") {
					actionTarget.checked = currentlyActive
				}
			} finally {
				setAdminButtonLoadingState(actionTarget, false, {
					skipTextForCheckbox: true,
				})
			}
		}

		adminUsersList.addEventListener("click", async (event) => {
			const actionBtn = event.target.closest("button[data-admin-user-action]")
			if (!actionBtn || !adminUnlocked || !isCurrentSuperAdmin()) {
				return
			}

			const action = String(actionBtn.dataset.adminUserAction || "").trim()
			const targetUid = String(actionBtn.dataset.uid || "").trim()
			if (!action || !targetUid) return

			if (action === "edit") {
				loadManagedAdminUserIntoForm(targetUid)
				return
			}

			if (action === "toggle-active") {
				await handleAdminUserToggle(actionBtn)
			}
		})

		adminUsersList.addEventListener("change", async (event) => {
			const toggleInput = event.target.closest(
				'input[type="checkbox"][data-admin-user-action="toggle-active"]',
			)
			if (!toggleInput || !adminUnlocked || !isCurrentSuperAdmin()) {
				return
			}

			await handleAdminUserToggle(toggleInput)
		})
	}

	if (serviceCategoryToggles) {
		serviceCategoryToggles.addEventListener("change", (event) => {
			const toggle = event.target.closest("[data-service-category-toggle]")
			if (!toggle) return

			const key = String(toggle.dataset.serviceCategoryToggle || "").trim()
			if (!key) return

			adminServiceCategoriesDraft = {
				...adminServiceCategoriesDraft,
				[key]: toggle.checked === true,
			}
			renderAdminServiceCategorySettings()
		})
	}

	if (saveServiceCategoriesBtn) {
		saveServiceCategoriesBtn.addEventListener("click", () => {
			void saveAdminServiceCategorySettings()
		})
	}

	if (profanityWordsInput) {
		profanityWordsInput.value = getAdminProfanityWords().join(", ")
	}

	if (saveProfanityBtn) {
		saveProfanityBtn.addEventListener("click", () => {
			const raw = profanityWordsInput?.value || ""
			const words = raw
				.split(",")
				.map((w) => w.trim())
				.filter(Boolean)
			setAdminProfanityWords(words)
			if (profanityWordsInput) {
				profanityWordsInput.value = getAdminProfanityWords().join(", ")
			}
			setAdminMessage(
				"success",
				"✅ Profanity/content filter list saved.",
				"adminReviewsMessage",
			)
		})
	}

	if (confirmCancelBtn) {
		confirmCancelBtn.addEventListener("click", () => {
			closeAdminConfirmModal(false)
		})
	}

	if (confirmOkBtn) {
		confirmOkBtn.addEventListener("click", () => {
			closeAdminConfirmModal(true)
		})
	}

	if (confirmModal) {
		confirmModal.addEventListener("click", (event) => {
			if (event.target === confirmModal) {
				closeAdminConfirmModal(false)
			}
		})
	}

	window.addEventListener("appservices:security-restriction", (event) => {
		adminPendingLogoutToast = false
		setAdminMessage(
			"error",
			`Security notice: ${getAdminSecurityRestrictionMessage(event.detail || {})}`,
			"adminAuthMessage",
		)
	})

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && adminConfirmState.isOpen) {
			closeAdminConfirmModal(false)
		}
	})

	resetAdminManagementForm()
	renderAdminManagedUsers()

	renderAdminSchedule()

	setAdminUnlockedState(false)
}

async function initializeAppServices() {
	const services = getAdminAppServices()
	if (!canInitializeAppServices()) {
		setAdminMessage(
			"error",
			"⚠️ App services are not configured. Check Supabase/Render settings in client-config.js.",
			"adminAuthMessage",
		)
		return
	}

	auth = services.auth
	db = services.db
	adminCallableService = services.functionsService || services.functions || null
	try {
		if (typeof auth.setPersistence === "function") {
			await auth.setPersistence(services.Persistence?.SESSION || "session")
		}
	} catch (persistenceError) {
		console.warn("Admin auth persistence setup failed:", persistenceError)
	}

	appServicesReady = true
	auth.onAuthStateChanged((user) => {
		handleAuthStateChange(user)
	})
}

initializeAdminPanel()
initializeAppServices()
