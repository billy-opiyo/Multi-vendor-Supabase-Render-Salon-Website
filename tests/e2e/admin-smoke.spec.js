const { expect, test } = require("@playwright/test")
const { installFirebaseMock } = require("./helpers/firebase-mock")
const { blockExternalNetwork } = require("./helpers/network")
const { watchForUnexpectedPageErrors } = require("./helpers/page-errors")

test.describe("admin page smoke tests", () => {
	test("admin login page loads the management shell safely", async ({
		page,
	}) => {
		await blockExternalNetwork(page)
		const pageErrors = watchForUnexpectedPageErrors(page)

		await page.goto("/admin.html", { waitUntil: "domcontentloaded" })

		await expect(page).toHaveTitle(/Admin/i)
		await expect(page.locator("#admin")).toBeVisible()
		await expect(page.getByText("Admin Console")).toBeVisible()
		await expect(page.locator("#adminLoginForm")).toBeVisible()
		await expect(page.locator("#adminEmail")).toBeVisible()
		await expect(page.locator("#adminPassword")).toBeVisible()

		expect(pageErrors).toEqual([])
	})

	test("admin login unlocks dashboard and renders booking stats", async ({
		page,
	}) => {
		await installFirebaseMock(page, {
			adminUid: "admin-uid",
			initialCollections: {
				adminUsers: {
					"admin-uid": {
						active: true,
						role: "admin",
						email: "admin@royalbraids.test",
						permissions: {
							canManageBookings: true,
							canManageContent: true,
							canManageSecurity: true,
						},
					},
				},
				bookings: {
					"booking-1": {
						firstName: "E2E",
						lastName: "Customer",
						email: "customer@example.com",
						phone: "+254700000002",
						service: "Knotless Braids",
						stylist: "Fatima Hassan",
						date: "2099-01-15",
						time: "10:00 AM",
						status: "confirmed",
						uid: "customer-uid",
					},
				},
			},
		})
		await blockExternalNetwork(page)
		const pageErrors = watchForUnexpectedPageErrors(page)

		await page.goto("/admin.html", { waitUntil: "domcontentloaded" })
		await page.locator("#adminEmail").fill("admin@royalbraids.test")
		await page.locator("#adminPassword").fill("correct-password")
		await page.locator("#adminLoginBtn").click()

		await expect(page.locator("#adminPanel")).toBeVisible()
		await expect(page.locator("#adminLoginForm")).toBeHidden()
		await expect(page.locator("#adminUserState")).toContainText(
			"admin@royalbraids.test",
		)
		await expect(page.locator("#adminTotalCount")).toHaveText("1")
		await expect(page.locator("#adminConfirmedCount")).toHaveText("1")
		await expect(page.locator("#adminBookingsList")).toContainText(
			"E2E Customer",
		)
		await expect(page.locator("#adminBookingsList")).toContainText(
			"Knotless Braids",
		)

		await page.getByRole("tab", { name: "Schedule" }).click()
		await expect(page.locator('[data-admin-section="schedule"]')).toBeVisible()
		await expect(page.locator("#adminScheduleGrid")).toBeVisible()

		expect(pageErrors).toEqual([])
	})

	test("admin booking status filters show matching bookings", async ({
		page,
	}) => {
		await installFirebaseMock(page, {
			adminUid: "admin-uid",
			initialCollections: {
				adminUsers: {
					"admin-uid": {
						active: true,
						role: "admin",
						email: "admin@royalbraids.test",
						permissions: {
							canManageBookings: true,
							canManageContent: true,
							canManageSecurity: true,
						},
					},
				},
				bookings: {
					"booking-pending": {
						firstName: "Pending",
						lastName: "Client",
						service: "Box Braids",
						date: "2099-02-01",
						time: "9:00 AM",
						status: "pending",
					},
					"booking-confirmed": {
						firstName: "Confirmed",
						lastName: "Client",
						service: "Knotless Braids",
						date: "2099-02-02",
						time: "10:00 AM",
						status: "confirmed",
					},
					"booking-completed": {
						firstName: "Completed",
						lastName: "Client",
						service: "Cornrows",
						date: "2099-02-03",
						time: "11:00 AM",
						status: "completed",
					},
					"booking-cancelled": {
						firstName: "Cancelled",
						lastName: "Client",
						service: "Twists",
						date: "2099-02-04",
						time: "12:00 PM",
						status: "cancelled",
					},
				},
			},
		})
		await blockExternalNetwork(page)
		const pageErrors = watchForUnexpectedPageErrors(page)

		await page.goto("/admin.html", { waitUntil: "domcontentloaded" })
		await page.locator("#adminEmail").fill("admin@royalbraids.test")
		await page.locator("#adminPassword").fill("correct-password")
		await page.locator("#adminLoginBtn").click()

		const bookingsList = page.locator("#adminBookingsList")
		await expect(page.locator("#adminPanel")).toBeVisible()
		await expect(page.locator("#adminTotalCount")).toHaveText("4")
		await expect(page.locator("#adminPendingCount")).toHaveText("1")
		await expect(page.locator("#adminConfirmedCount")).toHaveText("1")
		await expect(page.locator("#adminCompletedCount")).toHaveText("1")
		await expect(page.locator("#adminCancelledCount")).toHaveText("1")

		const filters = [
			{ label: "Pending", status: "pending", visible: "Pending Client" },
			{
				label: "Confirmed",
				status: "confirmed",
				visible: "Confirmed Client",
			},
			{
				label: "Completed",
				status: "completed",
				visible: "Completed Client",
			},
			{
				label: "Cancelled",
				status: "cancelled",
				visible: "Cancelled Client",
			},
		]

		for (const filter of filters) {
			const button = page.getByRole("button", { name: filter.label })
			await button.click()
			await expect(button).toHaveAttribute("aria-pressed", "true")
			await expect(bookingsList).toHaveAttribute(
				"data-booking-status-filter",
				filter.status,
			)
			await expect(bookingsList).toContainText(filter.visible)

			for (const other of filters.filter((item) => item !== filter)) {
				await expect(bookingsList).not.toContainText(other.visible)
			}
		}

		await page.getByRole("button", { name: "All Bookings" }).click()
		await expect(bookingsList).toHaveAttribute(
			"data-booking-status-filter",
			"all",
		)
		for (const filter of filters) {
			await expect(bookingsList).toContainText(filter.visible)
		}

		expect(pageErrors).toEqual([])
	})

	test("admin page stays responsive on mobile", async ({ page }) => {
		await installFirebaseMock(page)
		await blockExternalNetwork(page)
		const pageErrors = watchForUnexpectedPageErrors(page)

		await page.setViewportSize({ width: 390, height: 900 })
		await page.goto("/admin.html", { waitUntil: "domcontentloaded" })

		const overflow = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
		}))

		expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
		await expect(page.locator("#adminLoginForm")).toBeVisible()
		expect(pageErrors).toEqual([])
	})
})
