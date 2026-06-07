// Applies public/client-config.js values to the current HTML page.
// This lets each client launch from the same codebase by changing one config file.
;(function () {
	function getValue(source, path, fallback = "") {
		return (
			String(path || "")
				.split(".")
				.reduce((value, key) => {
					if (value && Object.prototype.hasOwnProperty.call(value, key)) {
						return value[key]
					}
					return undefined
				}, source) ?? fallback
		)
	}

	function setMetaByName(name, content) {
		if (!content) return
		let meta = document.querySelector(`meta[name="${name}"]`)
		if (!meta) {
			meta = document.createElement("meta")
			meta.setAttribute("name", name)
			document.head.appendChild(meta)
		}
		meta.setAttribute("content", content)
	}

	function setMetaByProperty(property, content) {
		if (!content) return
		let meta = document.querySelector(`meta[property="${property}"]`)
		if (!meta) {
			meta = document.createElement("meta")
			meta.setAttribute("property", property)
			document.head.appendChild(meta)
		}
		meta.setAttribute("content", content)
	}

	function applyTextBindings(config) {
		document.querySelectorAll("[data-client-text]").forEach((element) => {
			const value = getValue(config, element.dataset.clientText, null)
			if (value !== null && value !== undefined) {
				element.textContent = value
			}
		})

		document.querySelectorAll("[data-client-html]").forEach((element) => {
			const value = getValue(config, element.dataset.clientHtml, null)
			if (value !== null && value !== undefined) {
				element.innerHTML = value
			}
		})
	}

	function applyAttributeBindings(config) {
		document.querySelectorAll("[data-client-attr]").forEach((element) => {
			const bindings = String(element.dataset.clientAttr || "")
				.split(";")
				.map((item) => item.trim())
				.filter(Boolean)

			bindings.forEach((binding) => {
				const [attr, path] = binding.split(":").map((item) => item.trim())
				if (!attr || !path) return

				const value = getValue(config, path, null)
				if (value !== null && value !== undefined && value !== "") {
					element.setAttribute(attr, value)
				}
			})
		})
	}

	function normalizeThemeToken(value, fallback) {
		const token = String(value || "")
			.trim()
			.toLowerCase()

		return /^[a-z0-9-]+$/.test(token) ? token : fallback
	}

	function getSavedColorMode() {
		try {
			return localStorage.getItem("theme")
		} catch (error) {
			return null
		}
	}

	function applyColorMode(config, root) {
		const appearance = config.appearance || {}
		const configuredMode = normalizeThemeToken(appearance.mode, "dark")
		const savedMode = normalizeThemeToken(getSavedColorMode(), "")
		const mode = savedMode || configuredMode
		const isLight = mode === "light"

		root.classList.toggle("light-mode", isLight)
		root.dataset.colorMode = isLight ? "light" : "dark"
		root.style.colorScheme = isLight ? "light" : "dark"

		if (document.body) {
			document.body.classList.toggle("light-mode", isLight)
			document.body.dataset.colorMode = isLight ? "light" : "dark"
		}
	}

	function applyTheme(config) {
		const root = document.documentElement
		const appearance = config.appearance || {}
		const preset = normalizeThemeToken(
			appearance.preset || config.themePreset,
			"gold",
		)
		const theme = config.theme || {}

		root.dataset.themePreset = preset
		if (document.body) document.body.dataset.themePreset = preset
		applyColorMode(config, root)

		const themeMap = {
			"--primary": theme.primary,
			"--primary-dark": theme.primaryDark,
			"--primary-light": theme.primaryLight,
			"--focus-gold": theme.primary,
			"--focus-gold-soft": theme.focusGoldSoft || theme.primarySoft,
			"--accent-purple": theme.accentPurple,
			"--accent-pink": theme.accentPink,
			"--bg-primary": theme.bgPrimary,
			"--bg-secondary": theme.bgSecondary,
			"--bg-card": theme.bgCard,
			"--bg-card-hover": theme.bgCardHover,
			"--text-primary": theme.textPrimary,
			"--text-secondary": theme.textSecondary,
			"--text-muted": theme.textMuted,
			"--border": theme.border,
			"--shadow": theme.shadow,
			"--overlay": theme.overlay,
			"--accent-brown": theme.accentBrown,
			"--primary-contrast": theme.primaryContrast,
			"--primary-soft": theme.primarySoft,
			"--primary-soft-strong": theme.primarySoftStrong,
			"--primary-border": theme.primaryBorder,
			"--primary-border-strong": theme.primaryBorderStrong,
			"--scrollbar-thumb": theme.scrollbarThumb,
			"--scrollbar-track": theme.scrollbarTrack,
		}

		Object.entries(themeMap).forEach(([cssVariable, value]) => {
			if (value) root.style.setProperty(cssVariable, value)
		})

		if (theme.gradientGold) {
			root.style.setProperty("--gradient-gold", theme.gradientGold)
		}

		if (theme.gradientDark) {
			root.style.setProperty("--gradient-dark", theme.gradientDark)
		}

		if (!theme.gradientGold && theme.primary && theme.primaryLight) {
			root.style.setProperty(
				"--gradient-gold",
				`linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight}, ${theme.primary})`,
			)
		}
	}

	function applyHead(config) {
		const isAdminPage = /admin\.html$/i.test(window.location.pathname)
		document.title = isAdminPage
			? getValue(config, "brand.adminTitle", document.title)
			: getValue(config, "seo.title", document.title)

		setMetaByName("description", getValue(config, "seo.description"))
		setMetaByName("keywords", getValue(config, "seo.keywords"))
		setMetaByProperty("og:title", getValue(config, "seo.ogTitle"))
		setMetaByProperty("og:image", getValue(config, "seo.ogImage"))

		const favicon = document.querySelector('link[rel="icon"]')
		const faviconPath = getValue(config, "brand.favicon")
		if (favicon && faviconPath) favicon.setAttribute("href", faviconPath)
	}

	function applyContactForm(config) {
		const form = document.getElementById("contactForm")
		if (!form) return

		form.removeAttribute("action")
		form.setAttribute("method", "POST")
		form.dataset.emailProvider = "render-resend"

		const subjectInput = form.querySelector('input[name="_subject"]')
		const subject = getValue(config, "contact.formSubject")
		if (subjectInput && subject) subjectInput.value = subject
	}

	function applyDynamicFallbacks() {
		const footerYearFallback = document.getElementById("footerYearFallback")
		if (footerYearFallback) {
			footerYearFallback.textContent = String(new Date().getFullYear())
		}
	}

	function applyClientConfig() {
		applyDynamicFallbacks()

		const config = window.CLIENT_CONFIG || {}
		if (!Object.keys(config).length) return

		applyHead(config)
		applyTheme(config)
		applyTextBindings(config)
		applyAttributeBindings(config)
		applyContactForm(config)
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", applyClientConfig)
	} else {
		applyClientConfig()
	}
})()
