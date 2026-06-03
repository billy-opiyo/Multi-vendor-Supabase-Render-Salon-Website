const IGNORED_CONSOLE_ERROR_PATTERNS = [
	/Failed to load resource/i,
	/net::ERR_/i,
	/fonts\.googleapis\.com/i,
	/cdnjs\.cloudflare\.com/i,
	/gstatic\.com\/firebasejs/i,
]

function watchForUnexpectedPageErrors(page) {
	const errors = []

	page.on("pageerror", (error) => {
		errors.push(`pageerror: ${error.message}`)
	})

	page.on("console", (message) => {
		if (message.type() !== "error") return

		const text = message.text()
		if (IGNORED_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(text))) {
			return
		}

		errors.push(`console error: ${text}`)
	})

	return errors
}

module.exports = { watchForUnexpectedPageErrors }