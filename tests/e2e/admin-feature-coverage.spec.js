const { expect, test } = require("@playwright/test")
const { installAppServicesMock } = require("./helpers/app-services-mock")
const { blockExternalNetwork } = require("./helpers/network")
const { watchForUnexpectedPageErrors } = require("./helpers/page-errors")

const FULL_ADMIN = {
	active: true,
	role: "admin",
	email: "admin@royalbraids.test",
	permissions: {
		canManageBookings: true,
		canManageContent: true,
		canManageSecurity: true,
	},
}

async function openAdminPageAndLogin(page, mockOptions = {}) {
	await installAppServicesMock(page, {
		adminUid: mockOptions.adminUid || "admin-uid",
		adminDisplayName: mockOptions.adminDisplayName || "Admin User",
		...mockOptions,
	})
	await blockExternalNetwork(page)
	const pageErrors = watchForUnexpectedPageErrors(page)

	await page.goto("/admin.html", { waitUntil: "domcontentloaded" })
	await page
		.locator("#adminEmail")
		.fill(mockOptions.adminEmail || "admin@royalbraids.test")
	await page.locator("#adminPassword").fill("correct-password")
	await page.locator("#adminLoginBtn").click()
	await expect(page.locator("#adminPanel")).toBeVisible()

	return pageErrors
}

test.describe("admin feature coverage", () => {
	test("content admin workflows render reviews, messages, and waitlist actions", async ({
		page,
	}) => {
		const pageErrors = await openAdminPageAndLogin(page, {
			initialCollections: {
				adminUsers: {
					"admin-uid": FULL_ADMIN,
				},
				reviews: {
					"review-pending": {
						name: "Pending Reviewer",
						text: "Helpful feedback waiting for admin approval.",
						rating: 5,
						source: "Website",
						service: "Knotless Braids",
						status: "pending",
						featured: false,
						adminReply: "",
						reportsCount: 0,
						verifiedBooking: true,
						uid: "client-review",
						createdAt: "2099-03-01T09:00:00.000Z",
						updatedAt: "2099-03-01T09:00:00.000Z",
					},
					"review-approved": {
						name: "Approved Reviewer",
						text: "Already approved feedback.",
						rating: 4,
						source: "Google",
						status: "approved",
						featured: true,
						adminReply: "",
						reportsCount: 0,
						uid: "client-approved",
						createdAt: "2099-03-02T09:00:00.000Z",
						updatedAt: "2099-03-02T09:00:00.000Z",
					},
				},
				contactMessages: {
					"message-1": {
						name: "Contact One",
						email: "contact.one@example.com",
						subject: "Booking Help",
						message: "Can I move my appointment?",
						status: "new",
						uid: "contact-uid",
						createdAt: "2099-03-03T09:00:00.000Z",
						updatedAt: "2099-03-03T09:00:00.000Z",
					},
				},
				waitlist: {
					"wait-1": {
						firstName: "Waitlist",
						lastName: "Client",
						email: "waitlist.client@example.com",
						phone: "+254700000300",
						service: "Knotless Braids",
						stylist: "Fatima Hassan",
						stylistKey: "fatima",
						preferredDate: "2099-03-10",
						preferredTime: "10:00 AM",
						preferredSlotId: "2099-03-10__fatima__1000AM",
						status: "waiting",
						queuePosition: 1,
						queuePositionLabel: "1st",
						queueSize: 2,
						uid: "waitlist-client",
						createdAt: "2099-03-04T09:00:00.000Z",
						updatedAt: "2099-03-04T09:00:00.000Z",
					},
				},
				bookings: {
					"waitlisted-booking": {
						firstName: "Waitlist",
						lastName: "Client",
						service: "Knotless Braids",
						date: "2099-03-10",
						time: "10:00 AM",
						status: "waitlisted",
						waitlistId: "wait-1",
						waitlistStatus: "waiting",
						isWaitlisted: true,
						bookingType: "waitlist",
						uid: "waitlist-client",
					},
				},
			},
		})

		await page.getByRole("tab", { name: "Reviews" }).click()
		await expect(page.locator("#adminReviewsTotalCount")).toHaveText("2")
		await expect(page.locator("#adminReviewsPendingCount")).toHaveText("1")
		await expect(page.locator("#adminReviewsList")).toContainText(
			"Pending Reviewer",
		)
		await page
			.locator('[data-review-action="approved"][data-id="review-pending"]')
			.click()

		await page.getByRole("tab", { name: "Messages" }).click()
		await expect(page.locator("#adminContactList")).toContainText("Contact One")
		await page
			.locator('[data-contact-action="read"][data-id="message-1"]')
			.click()

		await page.getByRole("tab", { name: "Waitlist" }).click()
		await expect(page.locator("#adminWaitlistList")).toContainText(
			"Waitlist Client",
		)
		await expect(page.locator("#adminWaitlistList")).toContainText("1st")

		const state = await page.evaluate(() => window.__appServicesMockState.collections)
		expect(state.reviews["review-pending"]).toMatchObject({
			status: "approved",
			approvedBy: "admin@royalbraids.test",
		})
		expect(state.contactMessages["message-1"]).toMatchObject({
			status: "read",
		})
		expect(pageErrors).toEqual([])
	})

	test("message status filters show matching contact messages and toggle back to all", async ({
		page,
	}) => {
		const pageErrors = await openAdminPageAndLogin(page, {
			initialCollections: {
				adminUsers: {
					"admin-uid": FULL_ADMIN,
				},
				contactMessages: {
					"message-new": {
						name: "New Filter Client",
						email: "new.filter@example.com",
						subject: "New request",
						message: "Please help me book a new braid appointment.",
						status: "new",
						createdAt: "2099-05-01T09:00:00.000Z",
						updatedAt: "2099-05-01T09:00:00.000Z",
					},
					"message-read": {
						name: "Read Filter Client",
						email: "read.filter@example.com",
						subject: "Read request",
						message: "This message has already been reviewed by staff.",
						status: "read",
						createdAt: "2099-05-02T09:00:00.000Z",
						updatedAt: "2099-05-02T09:00:00.000Z",
					},
					"message-resolved": {
						name: "Resolved Filter Client",
						email: "resolved.filter@example.com",
						subject: "Resolved request",
						message: "This client issue has already been handled.",
						status: "resolved",
						createdAt: "2099-05-03T09:00:00.000Z",
						updatedAt: "2099-05-03T09:00:00.000Z",
					},
				},
			},
		})

		await page.getByRole("tab", { name: "Messages" }).click()

		const list = page.locator("#adminContactList")
		const controls = page.locator("#adminContactStatusFilterControls")
		const newFilter = page.locator('[data-contact-status-filter="new"]')
		const readFilter = page.locator('[data-contact-status-filter="read"]')
		const resolvedFilter = page.locator(
			'[data-contact-status-filter="resolved"]',
		)

		await expect(page.locator("#adminMessagesTotalCount")).toHaveText("3")
		await expect(page.locator("#adminMessagesNewCount")).toHaveText("1")
		await expect(page.locator("#adminMessagesReadCount")).toHaveText("1")
		await expect(page.locator("#adminMessagesResolvedCount")).toHaveText("1")
		await expect(controls).toHaveAttribute("data-active-status-filter", "all")
		await expect(list).toContainText("New Filter Client")
		await expect(list).toContainText("Read Filter Client")
		await expect(list).toContainText("Resolved Filter Client")

		await newFilter.click()
		await expect(controls).toHaveAttribute("data-active-status-filter", "new")
		await expect(newFilter).toHaveAttribute("aria-pressed", "true")
		await expect(readFilter).toHaveAttribute("aria-pressed", "false")
		await expect(list).toContainText("New Filter Client")
		await expect(list).not.toContainText("Read Filter Client")
		await expect(list).not.toContainText("Resolved Filter Client")

		await readFilter.click()
		await expect(controls).toHaveAttribute("data-active-status-filter", "read")
		await expect(newFilter).toHaveAttribute("aria-pressed", "false")
		await expect(readFilter).toHaveAttribute("aria-pressed", "true")
		await expect(list).not.toContainText("New Filter Client")
		await expect(list).toContainText("Read Filter Client")
		await expect(list).not.toContainText("Resolved Filter Client")

		await resolvedFilter.click()
		await expect(controls).toHaveAttribute(
			"data-active-status-filter",
			"resolved",
		)
		await expect(resolvedFilter).toHaveAttribute("aria-pressed", "true")
		await expect(list).not.toContainText("New Filter Client")
		await expect(list).not.toContainText("Read Filter Client")
		await expect(list).toContainText("Resolved Filter Client")

		await resolvedFilter.click()
		await expect(controls).toHaveAttribute("data-active-status-filter", "all")
		await expect(resolvedFilter).toHaveAttribute("aria-pressed", "false")
		await expect(list).toContainText("New Filter Client")
		await expect(list).toContainText("Read Filter Client")
		await expect(list).toContainText("Resolved Filter Client")
		expect(pageErrors).toEqual([])
	})

	test("security-only admins see security telemetry while restricted tabs stay hidden", async ({
		page,
	}) => {
		const pageErrors = await openAdminPageAndLogin(page, {
			adminUid: "security-admin",
			adminEmail: "security@royalbraids.test",
			initialCollections: {
				adminUsers: {
					"security-admin": {
						active: true,
						role: "admin",
						email: "security@royalbraids.test",
						permissions: {
							canManageBookings: false,
							canManageContent: false,
							canManageSecurity: true,
						},
					},
				},
				loginActivities: {
					"login-success": {
						uid: "client-a",
						email: "client.a@example.com",
						displayName: "Client A",
						method: "google",
						status: "success",
						deviceType: "desktop",
						browser: "Chrome",
						locationCountry: "Kenya",
						riskScore: 10,
						createdAt: "2099-04-01T09:00:00.000Z",
					},
					"login-failure": {
						uid: "client-b",
						email: "blocked@example.com",
						displayName: "Blocked User",
						method: "email/password",
						status: "failure",
						deviceType: "mobile",
						browser: "Safari",
						locationCountry: "Nigeria",
						riskScore: 95,
						createdAt: "2099-04-01T10:00:00.000Z",
					},
				},
				securityAlerts: {
					"alert-1": {
						severity: "high",
						status: "open",
						type: "multiple_failed_login_attempts",
						message: "Multiple failed sign-ins detected",
						email: "blocked@example.com",
						uid: "client-b",
						createdAt: "2099-04-01T10:05:00.000Z",
					},
				},
			},
		})

		await expect(page.getByRole("tab", { name: "Bookings" })).toBeHidden()
		await expect(page.getByRole("tab", { name: "Reviews" })).toBeHidden()
		await expect(page.getByRole("tab", { name: "Security" })).toBeVisible()
		await page.getByRole("tab", { name: "Security" }).click()

		await expect(page.locator("#adminSecurityTotalCount")).toHaveText("2")
		await expect(page.locator("#adminSecurityFailedCount")).toHaveText("1")
		await expect(page.locator("#adminSecurityHighRiskCount")).toHaveText("1")
		await expect(page.locator("#adminSecurityActivityList")).toContainText(
			"blocked@example.com",
		)
		await expect(page.locator("#adminSecurityAlertsList")).toContainText(
			/failed sign-ins/i,
		)

		await page.locator("#adminSecurityStatusFilterSelect").selectOption("failure")
		await expect(page.locator("#adminSecurityActivityList")).toContainText(
			"blocked@example.com",
		)
		await expect(page.locator("#adminSecurityActivityList")).not.toContainText(
			"client.a@example.com",
		)

		await page.locator("#adminSecurityClearFiltersBtn").click()
		await expect(page.locator("#adminSecurityStatusFilterSelect")).toHaveValue(
			"all",
		)
		expect(pageErrors).toEqual([])
	})
})