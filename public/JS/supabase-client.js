;(function () {
	const root = window
	const clientConfig = root.CLIENT_CONFIG || {}
	const appConfig = root.APP_CONFIG || {}
	const integrations = clientConfig.integrations || {}
	const supabaseConfig = integrations.supabase || appConfig.supabase || {}
	const backendApiUrl = String(
		integrations.renderBackendUrl || appConfig.renderBackendUrl || "",
	).replace(/\/+$/, "")

	function hasUsableSupabaseConfig(config) {
		return Boolean(
			root.supabase &&
			config &&
			typeof config.url === "string" &&
			/^https:\/\/.+\.supabase\.co$/i.test(config.url) &&
			typeof config.anonKey === "string" &&
			config.anonKey.trim() &&
			!/YOUR_SUPABASE/i.test(config.anonKey),
		)
	}

	let client = null
	if (hasUsableSupabaseConfig(supabaseConfig)) {
		client = root.supabase.createClient(
			supabaseConfig.url,
			supabaseConfig.anonKey,
			{
				auth: {
					autoRefreshToken: true,
					detectSessionInUrl: true,
					persistSession: true,
				},
			},
		)
	} else {
		console.info(
			"Supabase client is in scaffold mode. Add public Supabase URL and anon key in public/client-config.js when the Supabase project is ready.",
		)
	}

	async function getAccessToken() {
		if (!client?.auth?.getSession) return ""
		const { data, error } = await client.auth.getSession()
		if (error) return ""
		return data?.session?.access_token || ""
	}

	async function apiFetch(path, options = {}) {
		if (!backendApiUrl) {
			throw new Error(
				"Render backend URL is not configured. Set integrations.renderBackendUrl in public/client-config.js.",
			)
		}

		const requestPath = String(path || "")
		const url = `${backendApiUrl}${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`
		const headers = new Headers(options.headers || {})
		if (options.body && !headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json")
		}

		const accessToken = await getAccessToken()
		if (accessToken && !headers.has("Authorization")) {
			headers.set("Authorization", `Bearer ${accessToken}`)
		}

		const response = await fetch(url, { ...options, headers })
		const contentType = response.headers.get("content-type") || ""
		const payload = contentType.includes("application/json")
			? await response.json()
			: await response.text()

		if (!response.ok) {
			const message =
				typeof payload === "object" && payload?.error
					? payload.error
					: `Request failed with status ${response.status}`
			throw new Error(message)
		}

		return payload
	}

	root.SALON_SUPABASE = {
		client,
		config: supabaseConfig,
		backendApiUrl,
		isConfigured: Boolean(client),
		apiFetch,
	}

	try {
		root.dispatchEvent(
			new CustomEvent("salon:supabase-ready", {
				detail: root.SALON_SUPABASE,
			}),
		)
	} catch (error) {
		// CustomEvent can fail in old embedded browsers; the global bridge above
		// is still available for scripts that need it.
	}
})()
