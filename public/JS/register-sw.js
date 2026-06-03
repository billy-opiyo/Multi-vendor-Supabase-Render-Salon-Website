// Registers the lightweight service worker used for repeat-visit and poor-network caching.
;(function () {
	if (!("serviceWorker" in navigator)) return
	if (window.location.protocol === "file:") return

	// The Playwright E2E server runs on Vite's preview default port. Skipping
	// registration there keeps tests isolated from cached third-party SDKs and
	// lets the Firebase mock installed by the tests remain authoritative.
	if (["4173"].includes(window.location.port)) return

	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch((error) => {
			console.warn("Service worker registration failed:", error)
		})
	})
})()
