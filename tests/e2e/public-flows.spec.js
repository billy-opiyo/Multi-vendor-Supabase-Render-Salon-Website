const { expect, test } = require("@playwright/test")
const { installFirebaseMock } = require("./helpers/firebase-mock")
const { blockExternalNetwork } = require("./helpers/network")
const { watchForUnexpectedPageErrors } = require("./helpers/page-errors")

function futureDate(daysFromNow = 7) {
	const date = new Date()
	date.setDate(date.getDate() + daysFromNow)
	return date.toISOString().split("T")[0]
}

async function openPublicPageWithFirebaseMock(page, mockOptions = {}) {
	await installFirebaseMock(page, mockOptions)
	await blockExternalNetwork(page)
	const pageErrors = watchForUnexpectedPageErrors(page)
	await page.goto("/", { waitUntil: "domcontentloaded" })
	return pageErrors
}

async function selectFirstAvailableTime(page) {
	await expect
		.poll(async () =>
			page
				.locator("#bookingTimeDropdown .time-picker-option:not(.is-booked)")
				.count(),
		)
		.toBeGreaterThan(0)

	await page.locator("#timePickerTrigger").click()
	const firstOption = page
		.locator("#bookingTimeDropdown .time-picker-option:not(.is-booked)")
		.first()
	await expect(firstOption).toBeVisible()
	const firstTime = await firstOption.getAttribute("data-time")
	expect(firstTime).toBeTruthy()
	await firstOption.click()
	await expect(page.locator("#timeSelect")).toHaveValue(firstTime)
	return firstTime
}

function bookingSlotId(date, stylistKey, time) {
	return `${date}__${stylistKey}__${time.replace(/\s+/g, "").replace(/[:]/g, "")}`
}

test.describe("public website user flows", () => {
	test("booking form confirms an appointment and records booking + slot writes", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithFirebaseMock(page)

		await expect(page.locator("#bookingForm")).toBeVisible()
		await expect
			.poll(async () =>
				page.locator('#serviceSelect option[value="Knotless Braids"]').count(),
			)
			.toBe(1)

		const bookingForm = page.locator("#bookingForm")
		await bookingForm.locator('input[name="firstName"]').fill("Test")
		await bookingForm.locator('input[name="lastName"]').fill("Customer")
		await bookingForm
			.locator('input[name="email"]')
			.fill("test.customer@example.com")
		await bookingForm.locator('input[name="phone"]').fill("+254700000001")
		await page.locator("#serviceSelect").selectOption("Knotless Braids")
		await page.locator("#stylistSelect").selectOption("fatima")
		await page.locator("#datePicker").fill(futureDate())
		await page.locator("#datePicker").dispatchEvent("change")
		const selectedTime = await selectFirstAvailableTime(page)
		await bookingForm
			.locator('textarea[name="notes"]')
			.fill("Automated E2E booking coverage")

		await page.locator("#submitBtn").click()

		await expect(page.locator("#bookingSuccess")).toBeVisible()
		await expect(page.locator("#bookingSuccess h3")).toContainText(
			/Booking Confirmed/i,
		)

		const writes = await page.evaluate(
			() => window.__firebaseMockState.collections,
		)
		const bookings = Object.values(writes.bookings || {})
		const bookingSlots = Object.values(writes.bookingSlots || {})

		expect(bookings).toHaveLength(1)
		expect(bookingSlots).toHaveLength(1)
		expect(bookings[0]).toMatchObject({
			firstName: "Test",
			lastName: "Customer",
			email: "test.customer@example.com",
			service: "Knotless Braids",
			status: "confirmed",
			time: selectedTime,
		})
		expect(bookingSlots[0]).toMatchObject({
			taken: true,
			time: selectedTime,
			stylistKey: "fatima",
		})
		expect(pageErrors).toEqual([])
	})

	test("booked times remain visible but disabled in time picker and selectable only in waitlist control", async ({
		page,
	}) => {
		const bookedDate = futureDate(8)
		const bookedTime = "9:00 AM"
		const stylistKey = "fatima"
		const slotId = bookingSlotId(bookedDate, stylistKey, bookedTime)
		const pageErrors = await openPublicPageWithFirebaseMock(page, {
			initialCollections: {
				bookingSlots: {
					[slotId]: {
						taken: true,
						date: bookedDate,
						time: bookedTime,
						stylistKey,
						bookingId: "existing-booking-1",
					},
				},
			},
		})

		await page.locator("#stylistSelect").selectOption(stylistKey)
		await page.locator("#datePicker").fill(bookedDate)
		await page.locator("#datePicker").dispatchEvent("change")
		await page.locator("#timePickerTrigger").click()

		const bookedTimeOption = page.locator(
			`#bookingTimeDropdown .time-picker-option[data-time="${bookedTime}"]`,
		)
		await expect(bookedTimeOption).toBeVisible()
		await expect(bookedTimeOption).toContainText(/Booked/i)
		await expect(bookedTimeOption).toHaveClass(/is-booked/)
		await expect(bookedTimeOption).toBeDisabled()
		await expect(bookedTimeOption).toHaveAttribute("aria-disabled", "true")

		await bookedTimeOption.evaluate((node) => node.click())
		await expect(page.locator("#timeSelect")).not.toHaveValue(bookedTime)

		await expect(page.locator("#waitlistPanel")).toBeVisible()
		const waitlistOption = page.locator(
			`#waitlistTimeSelect option[value="${slotId}"]`,
		)
		await expect(waitlistOption).toHaveCount(1)
		await expect(waitlistOption).toContainText(bookedTime)

		expect(pageErrors).toEqual([])
	})

	test("service categories render and service booking buttons prefill the booking form", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithFirebaseMock(page)

		await expect(
			page.locator("#servicesGrid .service-card").first(),
		).toBeVisible()
		await expect(
			page.getByRole("button", { name: "Braids Services" }),
		).toBeVisible()
		await expect(
			page.getByRole("button", { name: "Hair Services" }),
		).toBeVisible()
		await expect(
			page.getByRole("button", { name: "Beauty Spa Services" }),
		).toBeVisible()
		await expect(
			page.getByRole("button", { name: "Nail Services" }),
		).toBeVisible()
		await expect(
			page.getByRole("button", { name: "Makeup Services" }),
		).toBeVisible()

		await page.getByRole("button", { name: "Hair Services" }).click()
		await expect(page.locator("#servicesGrid")).toContainText("Hair Styling")
		await expect(page.locator("#servicesGrid")).toContainText("Hair Cutting")

		await page
			.locator(".service-card", { hasText: "Hair Styling" })
			.getByRole("button", { name: "Book This Service" })
			.click()

		await expect(page.locator("#bookingForm")).toBeVisible()
		await expect(page.locator("#serviceSelect")).toHaveValue("Hair Styling")
		expect(pageErrors).toEqual([])
	})

	test("contact form and contact links are wired for customers", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithFirebaseMock(page)

		await expect(page.locator('a[href^="tel:"]').first()).toHaveAttribute(
			"href",
			/tel:\+254/,
		)
		await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute(
			"href",
			/mailto:/,
		)
		await expect(page.getByLabel("WhatsApp")).toHaveAttribute("href", /wa\.me/)

		await page.locator("#contactName").fill("Contact Tester")
		await page.locator("#contactEmail").fill("contact.tester@example.com")
		await page.locator("#contactSubject").fill("E2E contact check")
		await page
			.locator("#contactMessage")
			.fill("This message verifies the customer contact form flow.")
		await page.locator('#contactForm button[type="submit"]').click()

		const contactSuccessPopup = page.locator("#contactSuccessPopup")
		await expect(contactSuccessPopup).toBeVisible()
		await expect(contactSuccessPopup).toContainText(
			/Message sent successfully/i,
		)
		await expect(contactSuccessPopup).toContainText(/get back to you soon/i)
		await expect(contactSuccessPopup).toBeHidden({ timeout: 7000 })
		await expect(page.locator("#contactFormMessage")).toBeHidden()

		const contactMessages = await page.evaluate(() =>
			Object.values(
				window.__firebaseMockState.collections.contactMessages || {},
			),
		)
		expect(contactMessages).toHaveLength(1)
		expect(contactMessages[0]).toMatchObject({
			name: "Contact Tester",
			email: "contact.tester@example.com",
			subject: "E2E contact check",
			status: "new",
		})
		expect(pageErrors).toEqual([])
	})

	test("public page stays responsive on mobile and tablet widths", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithFirebaseMock(page)

		for (const viewport of [
			{ width: 390, height: 900 },
			{ width: 768, height: 1024 },
		]) {
			await page.setViewportSize(viewport)
			await page.goto("/", { waitUntil: "domcontentloaded" })

			const overflow = await page.evaluate(() => ({
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: document.documentElement.scrollWidth,
			}))

			expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
			await expect(page.locator("#bookingForm")).toBeVisible()
			await expect(page.locator("#contactForm")).toBeVisible()
		}

		expect(pageErrors).toEqual([])
	})
})
