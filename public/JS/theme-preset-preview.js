// Developer-only visual preview tool for client theme presets.
// Open a page with `?themePreview=1` to enable it for the current tab.
;(function () {
	const PREVIEW_PARAM = "themePreview"
	const PREVIEW_ENABLED_KEY = "themePresetPreviewEnabled"
	const PREVIEW_SELECTED_KEY = "themePresetPreviewPreset"
	const PREVIEW_MINIMIZED_KEY = "themePresetPreviewMinimized"

	const PRESETS = [
		{ key: "gold", label: "Gold", color: "#C8963E" },
		{ key: "champagne", label: "Champagne", color: "#D6B16A" },
		{ key: "rose-gold", label: "Rose Gold", color: "#B76E79" },
		{ key: "emerald", label: "Emerald", color: "#2F9B7E" },
		{ key: "plum-gold", label: "Plum Gold", color: "#D4A94F" },
		{ key: "terracotta", label: "Terracotta", color: "#C76B45" },
		{ key: "teal", label: "Teal", color: "#2BB3A3" },
		{ key: "blush", label: "Blush", color: "#E8A7B6" },
		{ key: "lavender", label: "Lavender", color: "#A78BFA" },
	]

	const presetKeys = PRESETS.map((preset) => preset.key)
	let panel = null
	let restoreButton = null

	function normalizeToken(value, fallback = "") {
		const token = String(value || "")
			.trim()
			.toLowerCase()

		return presetKeys.includes(token) ? token : fallback
	}

	function getPreviewQueryValue() {
		try {
			return new URLSearchParams(window.location.search).get(PREVIEW_PARAM)
		} catch (error) {
			return null
		}
	}

	function readSession(key) {
		try {
			return sessionStorage.getItem(key)
		} catch (error) {
			return null
		}
	}

	function writeSession(key, value) {
		try {
			sessionStorage.setItem(key, value)
		} catch (error) {
			// Ignore storage errors; preview still works for the current page load.
		}
	}

	function removeSession(key) {
		try {
			sessionStorage.removeItem(key)
		} catch (error) {
			// Ignore storage errors.
		}
	}

	function readLocal(key) {
		try {
			return localStorage.getItem(key)
		} catch (error) {
			return null
		}
	}

	function writeLocal(key, value) {
		try {
			localStorage.setItem(key, value)
		} catch (error) {
			// Ignore storage errors; the selected preset just won't persist.
		}
	}

	function removeLocal(key) {
		try {
			localStorage.removeItem(key)
		} catch (error) {
			// Ignore storage errors.
		}
	}

	function clearSavedPreviewPreset() {
		removeLocal(PREVIEW_SELECTED_KEY)
		removeSession(PREVIEW_SELECTED_KEY)
	}

	function previewIsMinimized() {
		return readSession(PREVIEW_MINIMIZED_KEY) === "1"
	}

	function setPreviewMinimized(isMinimized) {
		if (!panel || !restoreButton) return

		panel.classList.toggle("is-minimized", isMinimized)
		panel.setAttribute("aria-hidden", String(isMinimized))
		restoreButton.hidden = !isMinimized
		restoreButton.setAttribute("aria-expanded", String(!isMinimized))

		const minimizeButton = panel.querySelector("[data-preview-minimize]")
		if (minimizeButton) {
			minimizeButton.setAttribute("aria-expanded", String(!isMinimized))
		}

		if (isMinimized) {
			writeSession(PREVIEW_MINIMIZED_KEY, "1")
		} else {
			removeSession(PREVIEW_MINIMIZED_KEY)
		}
	}

	function previewIsEnabled() {
		const value = String(getPreviewQueryValue() || "").toLowerCase()

		if (["1", "true", "yes", "on"].includes(value)) {
			writeSession(PREVIEW_ENABLED_KEY, "1")
			return true
		}

		if (["0", "false", "no", "off"].includes(value)) {
			removeSession(PREVIEW_ENABLED_KEY)
			clearSavedPreviewPreset()
			return false
		}

		return readSession(PREVIEW_ENABLED_KEY) === "1"
	}

	function getConfigPreset() {
		const config = window.CLIENT_CONFIG || {}
		const appearance = config.appearance || {}

		return normalizeToken(appearance.preset || config.themePreset, "gold")
	}

	function getPresetLabel(presetKey) {
		return (
			PRESETS.find((preset) => preset.key === presetKey)?.label || presetKey
		)
	}

	function applyPreset(presetKey, shouldPersist) {
		const preset = normalizeToken(presetKey, getConfigPreset())
		const root = document.documentElement

		root.dataset.themePreset = preset
		if (document.body) document.body.dataset.themePreset = preset

		if (shouldPersist) writeLocal(PREVIEW_SELECTED_KEY, preset)
		updatePanelState(preset)
	}

	function resetToConfigPreset() {
		clearSavedPreviewPreset()
		applyPreset(getConfigPreset(), false)
	}

	function removePreviewQueryFromUrl() {
		try {
			const url = new URL(window.location.href)
			url.searchParams.delete(PREVIEW_PARAM)
			window.history.replaceState(window.history.state, "", url.toString())
		} catch (error) {
			// Ignore URL cleanup errors.
		}
	}

	function disablePreview() {
		removeSession(PREVIEW_ENABLED_KEY)
		removeSession(PREVIEW_MINIMIZED_KEY)
		clearSavedPreviewPreset()
		resetToConfigPreset()
		removePreviewQueryFromUrl()
		if (panel) panel.remove()
		if (restoreButton) restoreButton.remove()
		panel = null
		restoreButton = null
	}

	function injectStyles() {
		if (document.getElementById("themePresetPreviewStyles")) return

		const style = document.createElement("style")
		style.id = "themePresetPreviewStyles"
		style.textContent = `
			.theme-preset-preview {
				position: fixed;
				right: max(16px, env(safe-area-inset-right, 0px));
				bottom: max(16px, env(safe-area-inset-bottom, 0px));
				z-index: 2147483647;
				width: min(360px, calc(100vw - 32px));
				max-height: min(640px, calc(100dvh - 32px));
				padding: 16px;
				border: 1px solid var(--primary-border-strong, rgba(200, 150, 62, 0.55));
				border-radius: 18px;
				background: color-mix(in srgb, var(--bg-card, #1A1A1A) 94%, transparent);
				box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
				color: var(--text-primary, #F5F0EB);
				display: flex;
				flex-direction: column;
				font-family: var(--font-body, Inter, system-ui, sans-serif);
				overflow: hidden;
				backdrop-filter: blur(16px);
				transform: translateX(0);
				opacity: 1;
				transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease, box-shadow 0.24s ease;
				will-change: transform;
			}

			.theme-preset-preview.is-minimized {
				transform: translateX(calc(100% + max(24px, env(safe-area-inset-right, 0px))));
				opacity: 0;
				pointer-events: none;
			}

			.theme-preset-preview__header {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: 12px;
				flex: 0 0 auto;
				margin-bottom: 12px;
			}

			.theme-preset-preview__controls {
				display: inline-flex;
				align-items: center;
				gap: 6px;
				flex: 0 0 auto;
			}

			.theme-preset-preview__eyebrow {
				margin: 0 0 4px;
				color: var(--primary-light, #E8C27A);
				font-size: 0.72rem;
				font-weight: 800;
				letter-spacing: 0.12em;
				text-transform: uppercase;
			}

			.theme-preset-preview__title {
				margin: 0;
				font-size: 1rem;
				font-weight: 800;
				line-height: 1.2;
			}

			.theme-preset-preview__close,
			.theme-preset-preview__minimize,
			.theme-preset-preview__restore {
				width: 34px;
				height: 34px;
				border: 1px solid var(--primary-border, rgba(200, 150, 62, 0.32));
				border-radius: 999px;
				background: var(--primary-soft, rgba(200, 150, 62, 0.12));
				color: var(--text-primary, #F5F0EB);
				cursor: pointer;
				font-size: 1.2rem;
				line-height: 1;
				transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
			}

			.theme-preset-preview__close:hover,
			.theme-preset-preview__close:focus-visible,
			.theme-preset-preview__minimize:hover,
			.theme-preset-preview__minimize:focus-visible,
			.theme-preset-preview__restore:hover,
			.theme-preset-preview__restore:focus-visible {
				border-color: var(--primary-border-strong, rgba(200, 150, 62, 0.55));
				background: var(--primary-soft-strong, rgba(200, 150, 62, 0.22));
				transform: translateY(-1px);
				outline: none;
			}

			.theme-preset-preview__minimize {
				font-size: 1rem;
				font-weight: 900;
				padding-bottom: 4px;
			}

			.theme-preset-preview__restore {
				position: fixed;
				right: calc(max(16px, env(safe-area-inset-right, 0px)) + 72px);
				bottom: max(6px, env(safe-area-inset-bottom, 0px));
				z-index: 2147483647;
				width: auto;
				min-width: 44px;
				padding: 0 12px;
				box-shadow: 0 14px 34px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
				font-family: var(--font-body, Inter, system-ui, sans-serif);
				font-size: 0.78rem;
				font-weight: 900;
				letter-spacing: 0.03em;
				text-transform: uppercase;
				backdrop-filter: blur(16px);
			}

			.theme-preset-preview__restore[hidden] {
				display: none;
			}

			.theme-preset-preview__current {
				margin: 0 0 12px;
				color: var(--text-secondary, #A09888);
				flex: 0 0 auto;
				font-size: 0.86rem;
			}

			.theme-preset-preview__current strong {
				color: var(--primary-light, #E8C27A);
			}

			.theme-preset-preview__grid {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 8px;
				flex: 1 1 auto;
				min-height: 0;
				max-height: clamp(180px, calc(100dvh - 220px), 390px);
				overflow-y: auto;
				overscroll-behavior: contain;
				padding-right: 4px;
				scrollbar-color: var(--primary, #C8963E) color-mix(in srgb, var(--bg-secondary, #111111) 78%, transparent);
				scrollbar-width: thin;
			}

			.theme-preset-preview__grid::-webkit-scrollbar {
				width: 8px;
			}

			.theme-preset-preview__grid::-webkit-scrollbar-track {
				background: color-mix(in srgb, var(--bg-secondary, #111111) 78%, transparent);
				border-radius: 999px;
			}

			.theme-preset-preview__grid::-webkit-scrollbar-thumb {
				background: linear-gradient(180deg, var(--primary-light, #E8C27A), var(--primary, #C8963E));
				border: 2px solid color-mix(in srgb, var(--bg-secondary, #111111) 78%, transparent);
				border-radius: 999px;
			}

			.theme-preset-preview__grid::-webkit-scrollbar-thumb:hover {
				background: var(--primary, #C8963E);
			}

			.theme-preset-preview__option {
				display: flex;
				align-items: center;
				gap: 8px;
				min-height: 42px;
				padding: 9px 10px;
				border: 1px solid var(--border, #2A2520);
				border-radius: 12px;
				background: color-mix(in srgb, var(--bg-secondary, #111111) 82%, transparent);
				color: var(--text-primary, #F5F0EB);
				cursor: pointer;
				font: inherit;
				font-size: 0.86rem;
				font-weight: 700;
				text-align: left;
				transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
			}

			.theme-preset-preview__option:hover,
			.theme-preset-preview__option:focus-visible {
				border-color: var(--primary-border-strong, rgba(200, 150, 62, 0.55));
				background: var(--primary-soft, rgba(200, 150, 62, 0.12));
				transform: translateY(-1px);
				outline: none;
			}

			.theme-preset-preview__option.is-active {
				border-color: var(--primary, #C8963E);
				background: var(--primary-soft-strong, rgba(200, 150, 62, 0.22));
				box-shadow: 0 0 0 2px var(--primary-soft, rgba(200, 150, 62, 0.12));
			}

			.theme-preset-preview__swatch {
				width: 18px;
				height: 18px;
				flex: 0 0 auto;
				border: 2px solid rgba(255, 255, 255, 0.55);
				border-radius: 999px;
				box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
			}

			.theme-preset-preview__actions {
				display: flex;
				gap: 8px;
				flex: 0 0 auto;
				margin-top: 12px;
			}

			.theme-preset-preview__action {
				flex: 1;
				min-height: 38px;
				padding: 8px 10px;
				border: 1px solid var(--primary-border, rgba(200, 150, 62, 0.32));
				border-radius: 999px;
				background: transparent;
				color: var(--text-primary, #F5F0EB);
				cursor: pointer;
				font: inherit;
				font-size: 0.82rem;
				font-weight: 800;
			}

			.theme-preset-preview__action:hover,
			.theme-preset-preview__action:focus-visible {
				background: var(--primary-soft, rgba(200, 150, 62, 0.12));
				outline: none;
			}

			.theme-preset-preview__note {
				margin: 10px 0 0;
				color: var(--text-muted, #6B6560);
				flex: 0 0 auto;
				font-size: 0.74rem;
				line-height: 1.45;
			}

			@media (max-width: 420px) {
				.theme-preset-preview {
					left: 12px;
					right: 12px;
					bottom: 12px;
					width: auto;
					max-height: min(520px, calc(100dvh - 24px));
					padding: 14px;
				}

				.theme-preset-preview.is-minimized {
					transform: translateX(calc(100% + 24px));
				}

				.theme-preset-preview__grid {
					grid-template-columns: 1fr;
					max-height: clamp(120px, calc(100dvh - 230px), 310px);
				}

				.theme-preset-preview__restore {
					right: calc(12px + 72px);
					bottom: max(6px, env(safe-area-inset-bottom, 0px));
				}
			}

			@media (prefers-reduced-motion: reduce) {
				.theme-preset-preview,
				.theme-preset-preview__close,
				.theme-preset-preview__minimize,
				.theme-preset-preview__restore,
				.theme-preset-preview__option {
					transition: none;
				}
			}
		`

		document.head.appendChild(style)
	}

	function createPanel() {
		panel = document.createElement("aside")
		panel.className = "theme-preset-preview"
		panel.setAttribute("aria-label", "Theme preset preview")
		restoreButton = document.createElement("button")
		restoreButton.className = "theme-preset-preview__restore"
		restoreButton.type = "button"
		restoreButton.hidden = true
		restoreButton.setAttribute("aria-label", "Show theme preset preview")
		restoreButton.setAttribute("aria-expanded", "true")
		restoreButton.textContent = "Themes"

		const buttons = PRESETS.map(
			(preset) => `
				<button class="theme-preset-preview__option" type="button" data-preview-preset="${preset.key}">
					<span class="theme-preset-preview__swatch" style="background: ${preset.color}"></span>
					<span>${preset.label}</span>
				</button>
			`,
		).join("")

		panel.innerHTML = `
			<div class="theme-preset-preview__header">
				<div>
					<p class="theme-preset-preview__eyebrow">Preview Only</p>
					<h2 class="theme-preset-preview__title">Theme presets</h2>
				</div>
				<div class="theme-preset-preview__controls" aria-label="Theme preview controls">
					<button class="theme-preset-preview__minimize" type="button" data-preview-minimize aria-label="Minimize theme preset preview" aria-expanded="true">−</button>
					<button class="theme-preset-preview__close" type="button" data-preview-disable aria-label="Disable preset preview">×</button>
				</div>
			</div>
			<p class="theme-preset-preview__current">Current: <strong data-preview-current>Config default</strong></p>
			<div class="theme-preset-preview__grid">${buttons}</div>
			<div class="theme-preset-preview__actions">
				<button class="theme-preset-preview__action" type="button" data-preview-reset>Reset to config</button>
				<button class="theme-preset-preview__action" type="button" data-preview-disable>Disable</button>
			</div>
			<p class="theme-preset-preview__note">Only visible when you open the page with <strong>?themePreview=1</strong>. Light/dark mode stays separate.</p>
		`

		panel.querySelectorAll("[data-preview-preset]").forEach((button) => {
			button.addEventListener("click", () => {
				applyPreset(button.dataset.previewPreset, true)
			})
		})

		panel
			.querySelector("[data-preview-reset]")
			?.addEventListener("click", () => {
				resetToConfigPreset()
			})

		panel.querySelectorAll("[data-preview-disable]").forEach((button) => {
			button.addEventListener("click", () => disablePreview())
		})

		panel
			.querySelector("[data-preview-minimize]")
			?.addEventListener("click", () => {
				setPreviewMinimized(true)
			})

		restoreButton.addEventListener("click", () => {
			setPreviewMinimized(false)
		})

		document.body.appendChild(panel)
		document.body.appendChild(restoreButton)
		setPreviewMinimized(previewIsMinimized())
	}

	function updatePanelState(presetKey) {
		if (!panel) return

		const current = panel.querySelector("[data-preview-current]")
		if (current) current.textContent = getPresetLabel(presetKey)

		panel.querySelectorAll("[data-preview-preset]").forEach((button) => {
			const isActive = button.dataset.previewPreset === presetKey
			button.classList.toggle("is-active", isActive)
			button.setAttribute("aria-pressed", String(isActive))
		})
	}

	function initPreviewPanel() {
		if (!previewIsEnabled()) return

		injectStyles()
		createPanel()

		const savedPreset = normalizeToken(readLocal(PREVIEW_SELECTED_KEY), "")
		applyPreset(savedPreset || getConfigPreset(), false)
	}

	if (document.body) {
		initPreviewPanel()
	} else {
		document.addEventListener("DOMContentLoaded", initPreviewPanel, {
			once: true,
		})
	}
})()
