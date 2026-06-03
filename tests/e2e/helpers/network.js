async function blockExternalNetwork(page) {
	await page.route("**/*", async (route) => {
		const url = new URL(route.request().url())
		const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname)

		if (isLocalhost) {
			await route.continue()
			return
		}

		await route.abort("blockedbyclient")
	})
}

module.exports = { blockExternalNetwork }