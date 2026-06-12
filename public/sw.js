/* Royal Braids static asset service worker. */
const CACHE_VERSION = "royal-braids-static-v20260612-favicon"
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

const APP_SHELL_ASSETS = [
	"/",
	"/index.html",
	"/CSS/style.css",
	"/client-config.js",
	"/JS/apply-client-config.js",
	"/JS/script.js",
	"/JS/register-sw.js",
	"/IMG/logo.png",
	"/IMG/logo 1.png",
	"/IMG/logo 2.jpg",
	"/IMG/logo 3.png",
	"/IMG/logo 4.png",
	"/IMG/logo 5.png",
	"/IMG/logo 6.jpg",
	"/IMG/Royal braid logo favicon.png?v=20260612",
	"/IMG/1000_F_595420115_RZi6MAsq90qVRMfFz37ZKBianocAltUu.jpg",
	"/IMG/4-african-knotless-braids-with-beads.webp",
]

const STATIC_FILE_PATTERN = /\.(?:css|js|png|jpe?g|webp|gif|svg|ico|woff2?)$/i
const CACHEABLE_CROSS_ORIGINS = new Set([
	"https://fonts.googleapis.com",
	"https://fonts.gstatic.com",
	"https://cdnjs.cloudflare.com",
	"https://www.gstatic.com",
])

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_VERSION)
			.then((cache) =>
				Promise.allSettled(
					APP_SHELL_ASSETS.map((asset) => cache.add(new Request(asset))),
				),
			),
	)
	self.skipWaiting()
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter(
							(key) =>
								key.startsWith("royal-braids-") &&
								key !== CACHE_VERSION &&
								key !== RUNTIME_CACHE,
						)
						.map((key) => caches.delete(key)),
				),
			),
	)
	self.clients.claim()
})

self.addEventListener("fetch", (event) => {
	const { request } = event
	if (request.method !== "GET") return

	const url = new URL(request.url)
	const acceptsHtml = request.headers.get("accept")?.includes("text/html")

	if (request.mode === "navigate" || acceptsHtml) {
		event.respondWith(networkFirst(request, "/index.html"))
		return
	}

	if (url.origin === self.location.origin) {
		if (url.pathname === "/client-config.js" || url.pathname === "/sw.js") {
			event.respondWith(networkFirst(request))
			return
		}

		if (STATIC_FILE_PATTERN.test(url.pathname)) {
			event.respondWith(staleWhileRevalidate(request))
		}
		return
	}

	if (CACHEABLE_CROSS_ORIGINS.has(url.origin)) {
		event.respondWith(staleWhileRevalidate(request))
	}
})

async function networkFirst(request, fallbackUrl = null) {
	const cache = await caches.open(RUNTIME_CACHE)
	try {
		const response = await fetch(request)
		if (isCacheableResponse(response)) {
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		const cached = await cache.match(request)
		if (cached) return cached
		if (fallbackUrl) return caches.match(fallbackUrl)
		throw error
	}
}

async function staleWhileRevalidate(request) {
	const cache = await caches.open(RUNTIME_CACHE)
	const cached = await cache.match(request)

	const fetchPromise = fetch(request)
		.then((response) => {
			if (isCacheableResponse(response)) {
				cache.put(request, response.clone())
			}
			return response
		})
		.catch(() => cached)

	return cached || fetchPromise
}

function isCacheableResponse(response) {
	return response && (response.ok || response.type === "opaque")
}
