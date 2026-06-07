const { expect, test } = require("@playwright/test")
const { installAppServicesMock } = require("./helpers/app-services-mock")
const { blockExternalNetwork } = require("./helpers/network")
const { watchForUnexpectedPageErrors } = require("./helpers/page-errors")

async function openPublicPageWithAppServicesMock(page, mockOptions = {}) {
	const { pagePath = "/", splashDurationMs = 0, ...appServicesMockOptions } =
		mockOptions
	await installAppServicesMock(page, appServicesMockOptions)
	await page.addInitScript((durationMs) => {
		window.ROYAL_BRAIDS_SPLASH_DURATION_MS = durationMs
	}, splashDurationMs)
	await blockExternalNetwork(page)
	const pageErrors = watchForUnexpectedPageErrors(page)
	await page.goto(pagePath, { waitUntil: "domcontentloaded" })
	return pageErrors
}

async function signUpPublicUser(
	page,
	{
		name = "E2E Customer",
		email = "public.user@example.com",
		password = "StrongPass123",
	} = {},
) {
	await page.locator("#openAuthModalBtn").click()
	await expect(page.locator("#authModal")).toHaveClass(/active/)
	await page.locator("#switchToSignupBtn").click()
	await expect(page.locator("#authNameGroup")).toBeVisible()
	await page.locator("#authName").fill(name)
	await page.locator("#authEmail").fill(email)
	await page.locator("#authPassword").fill(password)
	await page.locator("#emailAuthSubmit").click()

	await expect(page.locator("#clientDashboard")).not.toHaveClass(/hidden/)
	await expect(page.locator("#dashboardProfileEmail")).toHaveText(email)
}

test.describe("public feature coverage", () => {
	test("splash screen exposes progress semantics and completes cleanly", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page, {
			splashDurationMs: 100000,
		})

		const splash = page.locator("#siteSplash")
		const progress = page.locator(".splash-progress")

		await expect(splash).toBeVisible()
		await expect(splash).toHaveAttribute("role", "status")
		await expect(splash).toHaveAttribute(
			"aria-label",
			"Royal Braids website loading",
		)
		await expect(progress).toHaveAttribute("role", "progressbar")
		await expect(progress).toHaveAttribute("aria-valuemin", "1")
		await expect(progress).toHaveAttribute("aria-valuemax", "100")
		await expect(page.locator("body")).toHaveClass(/splash-active/)

		await expect
			.poll(() =>
				page.evaluate(() => typeof window.royalBraidsSplash?.complete),
			)
			.toBe("function")

		const completionDetail = await page.evaluate(
			() =>
				new Promise((resolve) => {
					document.addEventListener(
						"royalBraids:splashComplete",
						(event) => resolve(event.detail),
						{ once: true },
					)
					window.royalBraidsSplash.complete()
				}),
		)

		expect(completionDetail).toMatchObject({ duration: 100000 })
		await expect(page.locator("#splashProgressPercent")).toHaveText("100%")
		await expect(progress).toHaveAttribute("aria-valuenow", "100")
		await expect(splash).toBeHidden()
		await expect(splash).toHaveAttribute("aria-hidden", "true")
		await expect(page.locator("body")).toHaveClass(/splash-complete/)
		await expect(page.locator("body")).not.toHaveClass(/splash-active/)
		expect(pageErrors).toEqual([])
	})

	test("dark mode toggle persists selection across reload", async ({ page }) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page)

		await expect(page.locator("body")).not.toHaveClass(/light-mode/)
		await page.locator("#darkModeToggle").click()
		await expect(page.locator("body")).toHaveClass(/light-mode/)

		await page.reload({ waitUntil: "domcontentloaded" })
		await expect(page.locator("body")).toHaveClass(/light-mode/)

		expect(pageErrors).toEqual([])
	})

	test("theme preset preview is opt-in and controls the page preset", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page)

		await expect(page.locator(".theme-preset-preview")).toHaveCount(0)

		await page.goto("/?themePreview=1", { waitUntil: "domcontentloaded" })

		const preview = page.locator(".theme-preset-preview")
		await expect(preview).toBeVisible()
		await expect(page.locator("html")).toHaveAttribute(
			"data-theme-preset",
			"gold",
		)

		await preview.getByRole("button", { name: /^Rose Gold$/ }).click()
		await expect(page.locator("html")).toHaveAttribute(
			"data-theme-preset",
			"rose-gold",
		)
		await expect(preview.locator("[data-preview-current]")).toHaveText(
			"Rose Gold",
		)

		await preview.getByRole("button", { name: /^Reset to config$/ }).click()
		await expect(page.locator("html")).toHaveAttribute(
			"data-theme-preset",
			"gold",
		)

		await preview.getByRole("button", { name: /^Disable$/ }).click()
		await expect(page.locator(".theme-preset-preview")).toHaveCount(0)
		await expect(page.locator("html")).toHaveAttribute(
			"data-theme-preset",
			"gold",
		)
		expect(pageErrors).toEqual([])
	})

	test("review submit section enforces login gate for guests", async ({ page }) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page)

		await page.locator('a[href="#testimonials"]').first().click()
		await expect(page.locator("#reviewAuthHint")).toBeVisible()
		await expect(page.locator("#reviewSubmitAuthGate")).toBeVisible()
		await expect(page.locator("#reviewSubmitWrap")).toHaveClass(/hidden/)

		await page.locator("#reviewSubmitAuthGateBtn").click()
		await expect(page.locator("#authModal")).toHaveClass(/active/)

		expect(pageErrors).toEqual([])
	})

	test("review sorting controls can switch between available strategies", async ({ page }) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page)

		await page.locator('a[href="#testimonials"]').first().click()
		await expect(page.locator("#reviewsSortSelect")).toBeVisible()

		await page.locator("#reviewsSortSelect").selectOption("highest-rated")
		await expect(page.locator("#reviewsSortSelect")).toHaveValue("highest-rated")

		await page.locator("#reviewsSortSelect").selectOption("newest")
		await expect(page.locator("#reviewsSortSelect")).toHaveValue("newest")

		expect(pageErrors).toEqual([])
	})

	test("blog section exposes carousel and expand/collapse controls", async ({ page }) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page)

		await page.locator('a[href="#blog"]').first().click()
		await expect(page.locator("#blogGrid")).toBeVisible()
		await expect(page.locator("#blogPrevBtn")).toBeVisible()
		await expect(page.locator("#blogNextBtn")).toBeVisible()

		await page.locator("#viewAllBlogsBtn").click()
		await expect(page.locator("#viewLessBlogsBtn")).not.toHaveClass(/hidden/)

		await page.locator("#viewLessBlogsBtn").click()
		await expect(page.locator("#viewLessBlogsBtn")).toHaveClass(/hidden/)

		expect(pageErrors).toEqual([])
	})

	test("email signup unlocks dashboard and authenticated review submission", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page, {
			emailPasswordUid: "review-client-uid",
			emailPasswordDisplayName: "Review Client",
		})

		await signUpPublicUser(page, {
			name: "Review Client",
			email: "review.client@example.com",
		})

		await expect(page.locator("#reviewSubmitAuthGate")).toHaveClass(/hidden/)
		await expect(page.locator("#reviewSubmitWrap")).not.toHaveClass(/hidden/)

		await page.locator('a[href="#testimonials"]').first().click()
		await page.locator("#reviewName").fill("Review Client")
		await page.locator("#reviewRating").selectOption("5")
		await page.locator("#reviewService").selectOption("Knotless Braids")
		await page
			.locator("#reviewText")
			.fill("This public E2E review verifies authenticated submissions.")
		await page.locator("#submitReviewBtn").click()

		await expect(page.locator("#reviewMessage")).toContainText(
			/pending approval/i,
		)

		const state = await page.evaluate(() => window.__appServicesMockState)
		const reviews = Object.values(state.collections.reviews || {})
		const users = Object.values(state.collections.users || {})

		expect(state.auth.createUserCalls).toHaveLength(1)
		expect(users).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Review Client",
					email: "review.client@example.com",
				}),
			]),
		)
		expect(reviews).toHaveLength(1)
		expect(reviews[0]).toMatchObject({
			name: "Review Client",
			rating: 5,
			service: "Knotless Braids",
			status: "pending",
			featured: false,
			uid: "review-client-uid",
		})
		expect(pageErrors).toEqual([])
	})

	test("gallery favorites require login and save to the signed-in dashboard", async ({
		page,
	}) => {
		const pageErrors = await openPublicPageWithAppServicesMock(page, {
			emailPasswordUid: "favorite-client-uid",
			emailPasswordDisplayName: "Favorite Client",
		})

		await expect
			.poll(async () => page.locator("#galleryGrid .gallery-save-favorite-btn").count())
			.toBeGreaterThan(0)

		await page.locator("#galleryGrid .gallery-save-favorite-btn").first().click()
		await expect(page.locator("#authModal")).toHaveClass(/active/)
		await expect(page.locator("#authMessage")).toContainText(
			/Log in to save/i,
		)

		await page.locator("#switchToSignupBtn").click()
		await page.locator("#authName").fill("Favorite Client")
		await page.locator("#authEmail").fill("favorite.client@example.com")
		await page.locator("#authPassword").fill("StrongPass123")
		await page.locator("#emailAuthSubmit").click()
		await expect(page.locator("#clientDashboard")).not.toHaveClass(/hidden/)
		if (await page.locator("#lightbox").evaluate((el) => el.classList.contains("active"))) {
			await page.locator("#lightboxClose").click()
			await expect(page.locator("#lightbox")).not.toHaveClass(/active/)
		}

		const favoriteButton = page
			.locator("#galleryGrid .gallery-save-favorite-btn")
			.first()
		await favoriteButton.click()
		await expect(page.locator("#favoritesToast")).toContainText(/Saved/i)

		const favorites = await page.evaluate(() =>
			Object.values(
				window.__appServicesMockState.collections[
					"users/favorite-client-uid/favorites"
				] || {},
			),
		)

		expect(favorites).toHaveLength(1)
		expect(favorites[0]).toMatchObject({
			styleName: expect.any(String),
			styleType: expect.any(String),
			imageUrl: expect.any(String),
		})
		expect(pageErrors).toEqual([])
	})
})