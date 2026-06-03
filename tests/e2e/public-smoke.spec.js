const { expect, test } = require("@playwright/test")
const { blockExternalNetwork } = require("./helpers/network")
const { watchForUnexpectedPageErrors } = require("./helpers/page-errors")

test.describe("public website smoke tests", () => {
	test("homepage loads core public sections without runtime crashes", async ({
		page,
	}) => {
		await blockExternalNetwork(page)
		const pageErrors = watchForUnexpectedPageErrors(page)

		await page.goto("/", { waitUntil: "domcontentloaded" })

		await expect(page).toHaveTitle(/Royal Braids|Salon/i)
		await expect(page.locator("#home")).toBeVisible()
		await expect(page.locator("#services")).toBeVisible()
		await expect(page.locator("#gallery")).toBeVisible()
		await expect(page.locator("#bookingForm")).toBeVisible()
		await expect(page.locator("#testimonials")).toBeVisible()
		await expect(page.locator("#blog")).toBeVisible()
		await expect(page.locator("#contactForm")).toBeVisible()

		expect(pageErrors).toEqual([])
	})

	test("mobile homepage does not create horizontal document overflow", async ({
		page,
	}) => {
		await blockExternalNetwork(page)
		const pageErrors = watchForUnexpectedPageErrors(page)

		await page.setViewportSize({ width: 390, height: 900 })
		await page.goto("/", { waitUntil: "domcontentloaded" })

		const overflow = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
		}))

		expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
		expect(pageErrors).toEqual([])
	})
})
