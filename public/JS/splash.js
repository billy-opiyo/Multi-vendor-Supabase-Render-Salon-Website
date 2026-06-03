// ============ SPLASH SCREEN CONTROLLER ============
;(function () {
	const ACTIVE_CLASS = "splash-active"
	const REVEALING_CLASS = "splash-revealing"
	const COMPLETE_CLASS = "splash-complete"
	const HIDE_CLASS = "splash-hide"
	const ANIMATIONS_READY_CLASS = "splash-animations-ready"
	const DEFAULT_DURATION_MS = 10000
	const REDUCED_MOTION_DURATION_MS = 700
	const REVEAL_FALLBACK_MS = 1100
	let scrollBehaviorRestoreTimer = null
	let savedScrollBehavior = null
	let progressAnimationFrameId = null

	function getConfiguredDuration(splashElement) {
		const overrideDuration = Number(window.ROYAL_BRAIDS_SPLASH_DURATION_MS)
		if (Number.isFinite(overrideDuration) && overrideDuration >= 0) {
			return overrideDuration
		}

		const attributeDuration = Number(splashElement?.dataset?.splashDuration)
		if (Number.isFinite(attributeDuration) && attributeDuration >= 0) {
			return attributeDuration
		}

		const prefersReducedMotion = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		)?.matches
		return prefersReducedMotion
			? REDUCED_MOTION_DURATION_MS
			: DEFAULT_DURATION_MS
	}

	function runWhenDomIsReady(callback) {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", callback, { once: true })
			return
		}

		callback()
	}

	function shouldResetScrollToTop() {
		return !window.location.hash
	}

	function forceInstantScrollBehavior() {
		const root = document.documentElement
		const body = document.body

		if (!savedScrollBehavior) {
			savedScrollBehavior = {
				root: root?.style.scrollBehavior || "",
				body: body?.style.scrollBehavior || "",
			}
		}

		if (root) root.style.scrollBehavior = "auto"
		if (body) body.style.scrollBehavior = "auto"

		if (scrollBehaviorRestoreTimer) {
			window.clearTimeout(scrollBehaviorRestoreTimer)
		}

		scrollBehaviorRestoreTimer = window.setTimeout(() => {
			if (!savedScrollBehavior) return
			if (root) root.style.scrollBehavior = savedScrollBehavior.root
			if (body) body.style.scrollBehavior = savedScrollBehavior.body
			savedScrollBehavior = null
			scrollBehaviorRestoreTimer = null
		}, 450)
	}

	function forceScrollToTopOnce() {
		forceInstantScrollBehavior()

		try {
			window.scrollTo(0, 0)
		} catch (error) {
			window.scrollTo(0, 0)
		}

		if (document.documentElement) {
			document.documentElement.scrollTop = 0
			document.documentElement.scrollLeft = 0
		}

		if (document.body) {
			document.body.scrollTop = 0
			document.body.scrollLeft = 0
		}
	}

	function resetScrollToTop() {
		if (!shouldResetScrollToTop()) return

		forceScrollToTopOnce()
		window.requestAnimationFrame(() => {
			forceScrollToTopOnce()
			window.requestAnimationFrame(forceScrollToTopOnce)
		})
		window.setTimeout(forceScrollToTopOnce, 80)
		window.setTimeout(forceScrollToTopOnce, 220)
	}

	function updateSplashProgress(splashElement, percent) {
		if (!splashElement) return

		const normalizedPercent = Math.min(100, Math.max(1, Math.round(percent)))
		const progress = splashElement.querySelector(".splash-progress")
		const progressFill = splashElement.querySelector("#splashProgressFill")
		const progressPercent = splashElement.querySelector(
			"#splashProgressPercent",
		)
		const progressLabel = `${normalizedPercent}%`

		if (progressFill) {
			progressFill.style.width = progressLabel
		}

		if (progressPercent) {
			progressPercent.textContent = progressLabel
		}

		if (progress) {
			progress.setAttribute("aria-valuenow", String(normalizedPercent))
			progress.setAttribute("aria-valuetext", `${progressLabel} loaded`)
		}
	}

	function startSplashProgress(splashElement, durationMs) {
		if (!splashElement) return

		if (progressAnimationFrameId) {
			window.cancelAnimationFrame(progressAnimationFrameId)
			progressAnimationFrameId = null
		}

		const safeDurationMs = Math.max(
			1,
			Number(durationMs) || DEFAULT_DURATION_MS,
		)
		const startTime = performance.now()
		updateSplashProgress(splashElement, 1)

		const tick = (currentTime) => {
			const elapsedMs = currentTime - startTime
			const progressRatio = Math.min(1, elapsedMs / safeDurationMs)
			const percent = 1 + progressRatio * 99

			updateSplashProgress(splashElement, percent)

			if (progressRatio < 1) {
				progressAnimationFrameId = window.requestAnimationFrame(tick)
				return
			}

			progressAnimationFrameId = null
		}

		progressAnimationFrameId = window.requestAnimationFrame(tick)
	}

	function syncSplashHandwriting(splashElement, durationMs) {
		if (!splashElement) return

		const durationNumber = Number(durationMs)
		const safeDurationMs = Math.max(
			1,
			Number.isFinite(durationNumber) ? durationNumber : DEFAULT_DURATION_MS,
		)
		const letters = Array.from(
			splashElement.querySelectorAll(".splash-handwriting-letter"),
		)

		if (!letters.length) return

		const letterDurationMs = Math.min(1080, Math.max(1, safeDurationMs * 0.108))
		const firstLetterDelayMs = Math.min(
			550,
			Math.max(0, safeDurationMs * 0.055),
		)
		const lastLetterDelayMs = Math.max(0, safeDurationMs - letterDurationMs)
		const startDelayMs = Math.min(firstLetterDelayMs, lastLetterDelayMs)
		const letterStaggerMs =
			letters.length > 1
				? (lastLetterDelayMs - startDelayMs) / (letters.length - 1)
				: 0
		const fillDurationMs = Math.min(1250, Math.max(1, safeDurationMs * 0.125))
		const fillDelayMs = Math.max(0, safeDurationMs - fillDurationMs)

		splashElement.style.setProperty(
			"--splash-write-letter-duration",
			`${letterDurationMs}ms`,
		)
		splashElement.style.setProperty(
			"--splash-handwriting-fill-duration",
			`${fillDurationMs}ms`,
		)
		splashElement.style.setProperty(
			"--splash-handwriting-fill-delay",
			`${fillDelayMs}ms`,
		)

		letters.forEach((letter, index) => {
			const letterDelayMs =
				letters.length > 1
					? startDelayMs + letterStaggerMs * index
					: lastLetterDelayMs

			letter.style.setProperty("--splash-write-delay", `${letterDelayMs}ms`)
		})
	}

	runWhenDomIsReady(() => {
		const body = document.body
		const splash = document.getElementById("siteSplash")
		const siteMain = document.getElementById("siteMain")

		if (!body) return

		if (shouldResetScrollToTop() && "scrollRestoration" in window.history) {
			window.history.scrollRestoration = "manual"
		}

		resetScrollToTop()

		const finishWithoutSplash = () => {
			resetScrollToTop()
			body.classList.remove(ACTIVE_CLASS, REVEALING_CLASS)
			body.classList.add(COMPLETE_CLASS)
			siteMain?.removeAttribute("aria-hidden")
		}

		if (!splash) {
			finishWithoutSplash()
			return
		}

		const splashDurationMs = getConfiguredDuration(splash)
		let didStartReveal = false
		let didCompleteReveal = false
		let fallbackTimerId = null
		syncSplashHandwriting(splash, splashDurationMs)
		splash.classList.add(ANIMATIONS_READY_CLASS)
		startSplashProgress(splash, splashDurationMs)

		const completeReveal = () => {
			if (didCompleteReveal) return
			didCompleteReveal = true

			if (progressAnimationFrameId) {
				window.cancelAnimationFrame(progressAnimationFrameId)
				progressAnimationFrameId = null
			}

			updateSplashProgress(splash, 100)

			if (fallbackTimerId) {
				window.clearTimeout(fallbackTimerId)
				fallbackTimerId = null
			}

			body.classList.remove(ACTIVE_CLASS, REVEALING_CLASS)
			body.classList.add(COMPLETE_CLASS)
			splash.classList.add(HIDE_CLASS)
			splash.hidden = true
			splash.setAttribute("aria-hidden", "true")
			if ("inert" in splash) {
				splash.inert = true
			}
			siteMain?.removeAttribute("aria-hidden")
			resetScrollToTop()
			window.requestAnimationFrame(resetScrollToTop)

			document.dispatchEvent(
				new CustomEvent("royalBraids:splashComplete", {
					detail: { duration: splashDurationMs },
				}),
			)
		}

		const startReveal = () => {
			if (didStartReveal) return
			didStartReveal = true
			updateSplashProgress(splash, 100)
			resetScrollToTop()

			body.classList.add(REVEALING_CLASS)
			splash.classList.add(HIDE_CLASS)
			splash.setAttribute("aria-hidden", "true")

			if ("inert" in splash) {
				splash.inert = true
			}

			const handleTransitionEnd = (event) => {
				if (event.target !== splash) return
				if (
					!["opacity", "transform", "visibility"].includes(event.propertyName)
				) {
					return
				}

				splash.removeEventListener("transitionend", handleTransitionEnd)
				completeReveal()
			}

			splash.addEventListener("transitionend", handleTransitionEnd)
			fallbackTimerId = window.setTimeout(completeReveal, REVEAL_FALLBACK_MS)
		}

		window.royalBraidsSplash = Object.freeze({
			complete: completeReveal,
			reveal: startReveal,
		})

		window.setTimeout(startReveal, splashDurationMs)
	})
})()
