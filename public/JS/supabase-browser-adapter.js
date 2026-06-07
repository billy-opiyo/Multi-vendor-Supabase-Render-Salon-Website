// Supabase + Render browser adapter with app-service facades.
// ------------------------------------------------------------
// The static frontend uses the AppServices surface for auth, data, callable
// actions, and realtime-style listeners. During migration this adapter backs
// those calls with Supabase Auth and Render REST endpoints where available.
// If tests install their own AppServices mock before this file runs, the mock
// remains authoritative while still being exposed through AppServices.
;(function () {
	if (window.AppServices?.__appServicesMock === true) {
		return
	}

	const clientConfig = window.CLIENT_CONFIG || {}
	const appConfig = window.APP_CONFIG || {}
	const integrations = clientConfig.integrations || {}
	const supabaseConfig = appConfig.supabase || integrations.supabase || {}
	const storageKey = `rb_app_services_${clientConfig.client?.slug || appConfig.businessSlug || "default"}`

	const clone = (value) => JSON.parse(JSON.stringify(value ?? null))
	const nowIso = () => new Date().toISOString()
	const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value))
	const isUuid = (value = "") =>
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			String(value || "").trim(),
		)

	function loadPersistedState() {
		try {
			return JSON.parse(localStorage.getItem(storageKey) || "{}")
		} catch (_error) {
			return {}
		}
	}

	function persistState() {
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					session: state.session,
					collections: state.collections,
				}),
			)
		} catch (_error) {
			// Storage can fail in private/restricted contexts; in-memory state still works.
		}
	}

	const persisted = loadPersistedState()
	const state = {
		collections: isObject(persisted.collections) ? persisted.collections : {},
		session: isObject(persisted.session) ? persisted.session : null,
		auth: {
			currentUser: null,
		},
		listeners: new Map(),
		generatedIdCounter: 0,
	}

	function ensureCollection(collectionName) {
		if (!state.collections[collectionName]) state.collections[collectionName] = {}
		return state.collections[collectionName]
	}

	function listenerKey(collectionName) {
		return String(collectionName || "")
	}

	function notifyCollectionListeners(collectionName) {
		const callbacks = state.listeners.get(listenerKey(collectionName)) || []
		callbacks.forEach((callback) => {
			try {
				callback()
			} catch (error) {
				console.warn("AppServices collection listener callback failed:", error)
			}
		})
	}

	function applyFieldTransforms(previous = {}, incoming = {}) {
		const output = { ...previous }
		Object.entries(clone(incoming) || {}).forEach(([key, value]) => {
			if (value?.__type === "increment") {
				output[key] = Number(output[key] || 0) + Number(value.amount || 0)
				return
			}

			if (value?.__type === "serverTimestamp") {
				output[key] = nowIso()
				return
			}

			if (value?.__type === "timestamp") {
				output[key] = new Date(Number(value.millis || Date.now())).toISOString()
				return
			}

			output[key] = value
		})
		return output
	}

	function getComparableValue(data, id, field) {
		if (field === "__name__") return id
		return String(field || "")
			.split(".")
			.reduce((source, key) => source?.[key], data)
	}

	function toSortableValue(value) {
		if (!value) return 0
		if (typeof value === "number") return value
		if (typeof value === "string") return Date.parse(value) || value
		if (typeof value.seconds === "number") return value.seconds * 1000
		if (typeof value.millis === "number") return value.millis
		return value
	}

	function valueMatchesWhere(actual, op, expected) {
		switch (op) {
			case "==":
				return actual === expected
			case "!=":
				return actual !== expected
			case ">=":
				return actual >= expected
			case ">":
				return actual > expected
			case "<=":
				return actual <= expected
			case "<":
				return actual < expected
			case "in":
				return Array.isArray(expected) && expected.includes(actual)
			case "array-contains":
				return Array.isArray(actual) && actual.includes(expected)
			default:
				return true
		}
	}

	function applyConstraints(collectionName, constraints = []) {
		let entries = Object.entries(ensureCollection(collectionName))

		constraints
			.filter((constraint) => constraint.type === "where")
			.forEach((constraint) => {
				entries = entries.filter(([id, data]) =>
					valueMatchesWhere(
						getComparableValue(data, id, constraint.field),
						constraint.op,
						constraint.value,
					),
				)
			})

		constraints
			.filter((constraint) => constraint.type === "orderBy")
			.reverse()
			.forEach((constraint) => {
				const direction = constraint.direction === "desc" ? -1 : 1
				entries = [...entries].sort(([aId, aData], [bId, bData]) => {
					const a = toSortableValue(getComparableValue(aData, aId, constraint.field))
					const b = toSortableValue(getComparableValue(bData, bId, constraint.field))
					if (a < b) return -1 * direction
					if (a > b) return 1 * direction
					return String(aId).localeCompare(String(bId))
				})
			})

		const limitConstraint = constraints.find((constraint) => constraint.type === "limit")
		if (limitConstraint) entries = entries.slice(0, limitConstraint.count)

		return entries
	}

	function makeSnapshot(id, collectionName) {
		const collection = ensureCollection(collectionName)
		const exists = Object.prototype.hasOwnProperty.call(collection, id)
		return {
			id,
			exists,
			ref: makeDocRef(collectionName, id),
			data: () => (exists ? clone(collection[id]) : undefined),
		}
	}

	function makeQuerySnapshot(collectionName, constraints = []) {
		const docs = applyConstraints(collectionName, constraints).map(([id]) =>
			makeSnapshot(id, collectionName),
		)
		return {
			docs,
			empty: docs.length === 0,
			size: docs.length,
			forEach(callback) {
				docs.forEach(callback)
			},
		}
	}

	function getAccessToken() {
		return state.session?.access_token || ""
	}

	async function supabaseAuthRequest(path, body = {}, options = {}) {
		const supabaseUrl = String(supabaseConfig.url || supabaseConfig.supabaseUrl || "").replace(/\/+$/, "")
		const anonKey = String(
			supabaseConfig.anonKey || supabaseConfig.supabaseAnonKey || "",
		).trim()
		if (!supabaseUrl || !anonKey) {
			throw new Error("Supabase public URL and anon key are not configured.")
		}

		const token = options.token || getAccessToken() || anonKey
		const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
			method: options.method || "POST",
			headers: {
				apikey: anonKey,
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				...(options.headers || {}),
			},
			body: options.method === "GET" ? undefined : JSON.stringify(body || {}),
		})

		const text = await response.text()
		const payload = text
			? (() => {
					try {
						return JSON.parse(text)
					} catch (_error) {
						return { message: text }
					}
				})()
			: null

		if (!response.ok) {
			const error = new Error(
				payload?.msg || payload?.message || payload?.error_description || "Supabase Auth request failed.",
			)
			error.code = payload?.error || payload?.code || "auth/request-failed"
			throw error
		}

		return payload || {}
	}

	function makeLocalSessionUser({ uid, email = null, displayName = "", isAnonymous = false, providerId = "password" } = {}) {
		return {
			id: uid,
			uid,
			email,
			displayName,
			isAnonymous,
			phoneNumber: "",
			photoURL: "",
			providerData: isAnonymous ? [] : [{ providerId }],
			async getIdToken() {
				return getAccessToken()
			},
			async getIdTokenResult() {
				return { token: getAccessToken(), claims: state.session?.user?.app_metadata || {} }
			},
			async updateProfile(updates = {}) {
				if (typeof updates.displayName === "string") this.displayName = updates.displayName
				if (typeof updates.photoURL === "string") this.photoURL = updates.photoURL
				if (getAccessToken()) {
					await supabaseAuthRequest(
						"/user",
						{ data: { display_name: this.displayName, avatar_url: this.photoURL } },
						{ method: "PUT" },
					).catch((error) => console.warn("Supabase profile update failed:", error))
				}
				notifyAuthListeners()
			},
			async updateEmail(nextEmail) {
				if (getAccessToken()) await supabaseAuthRequest("/user", { email: nextEmail }, { method: "PUT" })
				this.email = nextEmail
				notifyAuthListeners()
			},
			async updatePassword(nextPassword) {
				if (getAccessToken()) await supabaseAuthRequest("/user", { password: nextPassword }, { method: "PUT" })
			},
			async reauthenticateWithCredential() {},
			async delete() {
				authService.currentUser = null
				state.session = null
				persistState()
				notifyAuthListeners()
			},
			async linkWithCredential(credential) {
				const result = await authService.createUserWithEmailAndPassword(
					credential?.email || this.email,
					credential?.password || "",
				)
				return result
			},
			async linkWithPopup(provider) {
				return authService.signInWithPopup(provider)
			},
			async linkWithRedirect(provider) {
				return authService.signInWithRedirect(provider)
			},
		}
	}

	function userFromSupabasePayload(payload = {}, fallback = {}) {
		const user = payload.user || payload
		const metadata = user.user_metadata || {}
		const appMetadata = user.app_metadata || {}
		const providerId =
			appMetadata.provider ||
			(user.is_anonymous ? "anonymous" : fallback.providerId || "password")
		return makeLocalSessionUser({
			uid: user.id || fallback.uid || `local-${Date.now()}`,
			email: user.email || fallback.email || null,
			displayName:
				metadata.display_name ||
				metadata.full_name ||
				fallback.displayName ||
				(user.email ? user.email.split("@")[0] : "Guest User"),
			isAnonymous: user.is_anonymous === true || providerId === "anonymous",
			providerId,
		})
	}

	const authListeners = []

	function notifyAuthListeners() {
		state.auth.currentUser = authService.currentUser ? clone(authService.currentUser) : null
		authListeners.forEach((callback) => callback(authService.currentUser))
		persistState()
	}

	if (state.session?.user) {
		state.auth.currentUser = userFromSupabasePayload(state.session.user)
	}

	const authService = {
		currentUser: state.auth.currentUser,
		async setPersistence() {},
		onAuthStateChanged(callback) {
			authListeners.push(callback)
			window.setTimeout(() => callback(authService.currentUser), 0)
			return () => {
				const index = authListeners.indexOf(callback)
				if (index >= 0) authListeners.splice(index, 1)
			}
		},
		async signInAnonymously() {
			let sessionPayload = null
			try {
				sessionPayload = await supabaseAuthRequest("/signup", {
					data: { provider: "anonymous" },
				})
			} catch (error) {
				console.warn("Supabase anonymous sign-in unavailable; using local guest session:", error)
			}

			const user = sessionPayload?.user
				? userFromSupabasePayload(sessionPayload, { providerId: "anonymous" })
				: makeLocalSessionUser({
						uid: `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
						displayName: "Guest User",
						isAnonymous: true,
						providerId: "anonymous",
					})

			state.session = sessionPayload?.access_token
				? sessionPayload
				: { access_token: "", user: { id: user.uid, is_anonymous: true } }
			authService.currentUser = user
			notifyAuthListeners()
			return { user }
		},
		async signInWithEmailAndPassword(email, password) {
			const payload = await supabaseAuthRequest("/token?grant_type=password", {
				email,
				password,
			})
			state.session = payload
			const user = userFromSupabasePayload(payload, { email, providerId: "password" })
			authService.currentUser = user
			notifyAuthListeners()
			return { user }
		},
		async createUserWithEmailAndPassword(email, password) {
			const payload = await supabaseAuthRequest("/signup", { email, password })
			state.session = payload.access_token ? payload : state.session
			const user = userFromSupabasePayload(payload, { email, providerId: "password" })
			authService.currentUser = user
			notifyAuthListeners()
			return { user }
		},
		async sendPasswordResetEmail(email) {
			await supabaseAuthRequest("/recover", { email })
		},
		async fetchSignInMethodsForEmail() {
			return ["password"]
		},
		async signOut() {
			if (getAccessToken()) {
				await supabaseAuthRequest("/logout", {}, { method: "POST" }).catch(() => {})
			}
			authService.currentUser = null
			state.session = null
			notifyAuthListeners()
		},
		async getRedirectResult() {
			return { user: authService.currentUser }
		},
		async signInWithPopup(provider) {
			return this.signInWithRedirect(provider)
		},
		async signInWithRedirect(provider) {
			const supabaseUrl = String(supabaseConfig.url || supabaseConfig.supabaseUrl || "").replace(/\/+$/, "")
			const anonKey = String(supabaseConfig.anonKey || supabaseConfig.supabaseAnonKey || "").trim()
			if (!supabaseUrl || !anonKey) {
				throw new Error("Supabase OAuth is not configured.")
			}
			const providerId = provider?.providerId || "google"
			const redirectTo = encodeURIComponent(window.location.href)
			window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=${encodeURIComponent(providerId)}&redirect_to=${redirectTo}`
			return { user: null }
		},
	}

	function normalizeQueryString(params = {}) {
		const query = new URLSearchParams()
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null || value === "") return
			query.set(key, String(value))
		})
		const text = query.toString()
		return text ? `?${text}` : ""
	}

	function camelizeRow(row = {}) {
		const output = { ...row }
		Object.entries(row || {}).forEach(([key, value]) => {
			const camel = key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase())
			if (output[camel] === undefined) output[camel] = value
		})
		return output
	}

	function mapBooking(row = {}) {
		const data = camelizeRow(row)
		return {
			...data,
			id: data.id,
			uid: data.userId || data.user_id,
			firstName: data.firstName || data.first_name || "",
			lastName: data.lastName || data.last_name || "",
			date: data.appointmentDate || data.appointment_date || data.date || "",
			time: data.appointmentTime || data.appointment_time || data.time || "",
			slotId: data.slotId || data.slot_id || "",
			waitlistId: data.waitlistId || data.waitlist_id || "",
			inspirationImageUrl:
				data.inspirationImageUrl || data.inspiration_image_url || "",
			createdAt: data.createdAt || data.created_at,
			updatedAt: data.updatedAt || data.updated_at,
		}
	}

	function mapWaitlist(row = {}) {
		const data = camelizeRow(row)
		const metadata = data.metadata || {}
		return {
			...data,
			uid: data.userId || data.user_id,
			firstName: data.firstName || metadata.firstName || "",
			lastName: data.lastName || metadata.lastName || "",
			email: data.email || metadata.email || "",
			phone: data.phone || metadata.phone || "",
			preferredDate: data.preferredDate || data.preferred_date,
			preferredTime: data.preferredTime || data.preferred_time,
			preferredSlotId: data.preferredSlotId || data.preferred_slot_id,
			queuePosition: data.queuePosition || data.queue_position,
			queueSize: data.queueSize || data.queue_size,
			createdAt: data.createdAt || data.created_at,
			updatedAt: data.updatedAt || data.updated_at,
		}
	}

	function mapGallery(row = {}) {
		const data = camelizeRow(row)
		const metadata = data.metadata || {}
		return {
			...data,
			styleName: data.styleName || data.title,
			styleType: data.styleType || metadata.styleType || metadata.category || "Gallery",
			imageUrl: data.imageUrl || data.image_url,
			beforeImageUrl: data.beforeImageUrl || metadata.beforeImageUrl || "",
			hasBeforeAfter: data.hasBeforeAfter || metadata.hasBeforeAfter === true,
			timeTaken: data.timeTaken || metadata.timeTaken || "",
			priceRange: data.priceRange || metadata.priceRange || "",
			length: data.length || metadata.length || "",
			size: data.size || metadata.size || "",
			hairType: data.hairType || metadata.hairType || "",
			stylistName: data.stylistName || metadata.stylistName || "",
			serviceCategory: data.serviceCategory || metadata.serviceCategory || "",
			serviceLabel: data.serviceLabel || metadata.serviceLabel || "",
			featuredMostBooked: data.featuredMostBooked || metadata.featuredMostBooked === true,
			createdAt: data.createdAt || data.created_at,
			updatedAt: data.updatedAt || data.updated_at,
		}
	}

	function mapBlog(row = {}) {
		const data = camelizeRow(row)
		return {
			...data,
			imageUrl: data.imageUrl || data.coverImageUrl || data.cover_image_url,
			readMoreUrl: data.readMoreUrl || data.url || "#blog",
			publishDate: data.publishDate || data.publishedAt || data.published_at,
			createdAt: data.createdAt || data.created_at,
			updatedAt: data.updatedAt || data.updated_at,
		}
	}

	function mapReview(row = {}) {
		const data = camelizeRow(row)
		const metadata = data.metadata || {}
		return {
			...data,
			uid: data.userId || data.user_id,
			name: data.name || data.customerName || data.customer_name,
			text: data.text || data.reviewText || data.review_text,
			photoUrl: data.photoUrl || metadata.photoUrl || "",
			adminReply: data.adminReply || metadata.adminReply || "",
			reportsCount: data.reportsCount || metadata.reportsCount || 0,
			featured: data.featured === true || metadata.featured === true,
			verifiedBooking: data.verifiedBooking === true || metadata.verifiedBooking === true,
			createdAt: data.createdAt || data.created_at,
			updatedAt: data.updatedAt || data.updated_at,
		}
	}

	function mapContact(row = {}) {
		const data = camelizeRow(row)
		return {
			...data,
			name:
				data.name ||
				`${data.firstName || data.first_name || ""} ${data.lastName || data.last_name || ""}`.trim(),
			createdAt: data.createdAt || data.created_at,
			updatedAt: data.updatedAt || data.updated_at,
		}
	}

	const remoteCollections = {
		galleryStyles: {
			path: () => (isAdminPage() ? "/api/v1/admin/gallery" : "/api/v1/gallery"),
			key: "galleryItems",
			map: mapGallery,
			auth: () => isAdminPage(),
		},
		blogs: {
			path: () => (isAdminPage() ? "/api/v1/admin/blog-posts" : "/api/v1/blog-posts"),
			key: "blogPosts",
			map: mapBlog,
			auth: () => isAdminPage(),
		},
		reviews: {
			path: () => (isAdminPage() ? "/api/v1/admin/reviews" : "/api/v1/reviews"),
			key: "reviews",
			map: mapReview,
			auth: () => isAdminPage(),
		},
		bookings: {
			path: () => (isAdminPage() ? "/api/v1/admin/bookings" : "/api/v1/bookings/me"),
			key: "bookings",
			map: mapBooking,
			auth: () => true,
		},
		waitlist: {
			path: () => "/api/v1/admin/waitlist",
			key: "waitlistEntries",
			map: mapWaitlist,
			auth: () => true,
		},
		contactMessages: {
			path: () => "/api/v1/admin/contact-messages",
			key: "contactMessages",
			map: mapContact,
			auth: () => true,
		},
		loginActivities: {
			path: () => "/api/v1/admin/security/login-activities",
			key: "loginActivities",
			map: camelizeRow,
			auth: () => true,
		},
		securityAlerts: {
			path: () => "/api/v1/admin/security/alerts",
			key: "securityAlerts",
			map: camelizeRow,
			auth: () => true,
		},
		accountChangeHistory: {
			path: () => "/api/v1/admin/security/account-change-history",
			key: "accountChanges",
			map: camelizeRow,
			auth: () => true,
		},
		activityTimeline: {
			path: () => "/api/v1/admin/activity-timeline",
			key: "activityTimeline",
			map: camelizeRow,
			auth: () => true,
		},
		adminUsers: {
			path: () => "/api/v1/admin/users",
			key: "adminUsers",
			map: (row) => ({ ...camelizeRow(row), uid: row.user_id || row.userId }),
			auth: () => true,
		},
	}

	function isAdminPage() {
		return /admin\.html(?:$|[?#])/i.test(window.location.href)
	}

	async function refreshRemoteCollection(collectionName, constraints = []) {
		const config = remoteCollections[collectionName]
		if (!config || !window.RenderApi?.isConfigured?.()) return false
		try {
			const limit = constraints.find((item) => item.type === "limit")?.count || 200
			const payload = window.RenderApi.dataOrPayload(
				await window.RenderApi.request(
					`${config.path()}${normalizeQueryString({ limit })}`,
					{ auth: config.auth() },
				),
			)
			const rows = payload?.[config.key] || payload?.items || []
			if (!Array.isArray(rows)) return false
			const collection = ensureCollection(collectionName)
			Object.keys(collection).forEach((id) => delete collection[id])
			rows.map(config.map).forEach((row, index) => {
				const id = String(row.id || `${collectionName}-${index + 1}`)
				collection[id] = { ...row, id }
			})
			persistState()
			return true
		} catch (error) {
			console.warn(`Render collection fetch failed for ${collectionName}:`, error)
			return false
		}
	}

	function makeDocRef(collectionName, id) {
		const safeId = id || `${collectionName}-${++state.generatedIdCounter}`
		return {
			id: safeId,
			path: `${collectionName}/${safeId}`,
			collection(subcollectionName) {
				return makeCollectionRef(`${collectionName}/${safeId}/${subcollectionName}`)
			},
			async get() {
				await refreshRemoteCollection(collectionName)
				return makeSnapshot(safeId, collectionName)
			},
			async set(data, options = {}) {
				setDocData(collectionName, safeId, data, options)
				await syncRemoteMutation(collectionName, safeId, ensureCollection(collectionName)[safeId], "set")
			},
			async update(data) {
				setDocData(collectionName, safeId, data, { merge: true })
				await syncRemoteMutation(collectionName, safeId, ensureCollection(collectionName)[safeId], "update")
			},
			async delete() {
				delete ensureCollection(collectionName)[safeId]
				persistState()
				notifyCollectionListeners(collectionName)
				await syncRemoteMutation(collectionName, safeId, null, "delete")
			},
			onSnapshot(success, error) {
				const tick = async () => {
					try {
						await refreshRemoteCollection(collectionName)
						success(makeSnapshot(safeId, collectionName))
					} catch (snapshotError) {
						if (typeof error === "function") error(snapshotError)
					}
				}
				window.setTimeout(tick, 0)
				return subscribeCollection(collectionName, tick)
			},
		}
	}

	function setDocData(collectionName, id, data, options = {}) {
		const collection = ensureCollection(collectionName)
		const previous = collection[id] || {}
		collection[id] = options.merge
			? applyFieldTransforms(previous, data)
			: applyFieldTransforms({}, data)
		persistState()
		notifyCollectionListeners(collectionName)
	}

	function subscribeCollection(collectionName, callback) {
		const key = listenerKey(collectionName)
		const callbacks = state.listeners.get(key) || []
		callbacks.push(callback)
		state.listeners.set(key, callbacks)
		return () => {
			const nextCallbacks = (state.listeners.get(key) || []).filter(
				(item) => item !== callback,
			)
			state.listeners.set(key, nextCallbacks)
		}
	}

	function makeCollectionRef(collectionName, constraints = []) {
		return {
			doc(id) {
				return makeDocRef(collectionName, id)
			},
			async add(data) {
				const ref = makeDocRef(collectionName)
				await ref.set(data)
				return ref
			},
			where(field, op, value) {
				return makeCollectionRef(collectionName, [
					...constraints,
					{ type: "where", field, op, value },
				])
			},
			orderBy(field, direction = "asc") {
				return makeCollectionRef(collectionName, [
					...constraints,
					{ type: "orderBy", field, direction },
				])
			},
			limit(count) {
				return makeCollectionRef(collectionName, [
					...constraints,
					{ type: "limit", count: Number(count || 0) },
				])
			},
			async get() {
				await refreshRemoteCollection(collectionName, constraints)
				return makeQuerySnapshot(collectionName, constraints)
			},
			onSnapshot(success, error) {
				const tick = async () => {
					try {
						await refreshRemoteCollection(collectionName, constraints)
						success(makeQuerySnapshot(collectionName, constraints))
					} catch (snapshotError) {
						if (typeof error === "function") error(snapshotError)
					}
				}
				window.setTimeout(tick, 0)
				return subscribeCollection(collectionName, tick)
			},
		}
	}

	function mapBookingPayload(data = {}) {
		return {
			first_name: data.firstName || data.first_name || "Guest",
			last_name: data.lastName || data.last_name || null,
			email: data.email || authService.currentUser?.email || "",
			phone: data.phone || null,
			service: data.service || "Service",
			stylist: data.stylist || null,
			stylist_key: data.stylistKey || data.stylist_key || "any",
			appointment_date: data.date || data.appointment_date,
			appointment_time: data.time || data.appointment_time,
			notes: data.notes || null,
			inspiration_image_url: data.inspirationImageUrl || data.inspiration_image_url || null,
			metadata: data.metadata || {},
		}
	}

	function mapContactPayload(data = {}) {
		const nameParts = String(data.name || "").trim().split(/\s+/)
		return {
			first_name: data.firstName || data.first_name || nameParts.shift() || "Website",
			last_name: data.lastName || data.last_name || nameParts.join(" ") || null,
			email: data.email,
			phone: data.phone || null,
			subject: data.subject || null,
			message: data.message,
			metadata: data.metadata || {},
		}
	}

	function mapReviewPayload(data = {}) {
		return {
			customer_name: data.name || data.customerName || data.customer_name,
			rating: data.rating,
			service: data.service || null,
			review_text: data.text || data.reviewText || data.review_text,
			metadata: {
				...(data.metadata || {}),
				photoUrl: data.photoUrl || "",
				featured: data.featured === true,
				verifiedBooking: data.verifiedBooking === true,
			},
		}
	}

	function mapGalleryPayload(data = {}) {
		return {
			title: data.styleName || data.title || "Gallery item",
			description: data.description || data.styleType || null,
			image_url: data.imageUrl || data.image_url,
			status: data.status || "published",
			visibility: data.visibility || "public",
			metadata: data.metadata || data,
		}
	}

	function mapBlogPayload(data = {}) {
		return {
			title: data.title || "Blog post",
			excerpt: data.excerpt || null,
			body: data.body || data.content || null,
			cover_image_url: data.imageUrl || data.coverImageUrl || null,
			status: data.status || "published",
			published_at: data.publishDate || data.publishedAt || null,
			metadata: data.metadata || {},
		}
	}

	async function syncRemoteMutation(collectionName, id, data, operation) {
		if (!window.RenderApi?.isConfigured?.()) return
		try {
			if (collectionName === "bookings" && operation !== "delete" && data?.service) {
				if (isUuid(id)) return
				const result = window.RenderApi.dataOrPayload(
					await window.RenderApi.request("/api/v1/bookings", {
						method: "POST",
						body: mapBookingPayload(data),
					}),
				)
				const booking = result?.booking || result?.data?.booking || result
				if (booking?.id) {
					ensureCollection(collectionName)[id] = mapBooking(booking)
					persistState()
					notifyCollectionListeners(collectionName)
				}
				return
			}

			if (collectionName === "contactMessages") {
				if (operation === "delete" && isUuid(id)) {
					await window.RenderApi.request(`/api/v1/admin/contact-messages/${id}`, {
						method: "DELETE",
					})
				} else if (operation !== "delete" && data?.message && !isUuid(id)) {
					await window.RenderApi.request("/api/v1/contact-messages", {
						method: "POST",
						body: mapContactPayload(data),
						auth: Boolean(getAccessToken()),
					})
				} else if (isUuid(id) && data?.status) {
					await window.RenderApi.request(`/api/v1/admin/contact-messages/${id}/status`, {
						method: "POST",
						body: { status: data.status === "read" ? "in_progress" : data.status },
					})
				}
				return
			}

			if (collectionName === "reviews") {
				if (operation !== "delete" && data?.rating && !isUuid(id)) {
					await window.RenderApi.request("/api/v1/reviews", {
						method: "POST",
						body: mapReviewPayload(data),
						auth: Boolean(getAccessToken()),
					})
				} else if (isUuid(id) && data?.status && isAdminPage()) {
					await window.RenderApi.request(`/api/v1/admin/reviews/${id}/moderate`, {
						method: "POST",
						body: { status: data.status, metadata: data.metadata || {} },
					})
				}
				return
			}

			if (collectionName === "galleryStyles" && isAdminPage()) {
				if (operation === "delete" && isUuid(id)) {
					await window.RenderApi.request(`/api/v1/admin/gallery/${id}`, { method: "DELETE" })
				} else if (operation !== "delete") {
					await window.RenderApi.request(
						isUuid(id) ? `/api/v1/admin/gallery/${id}` : "/api/v1/admin/gallery",
						{
							method: isUuid(id) ? "PATCH" : "POST",
							body: mapGalleryPayload(data),
						},
					)
				}
				return
			}

			if (collectionName === "blogs" && isAdminPage()) {
				if (operation === "delete" && isUuid(id)) {
					await window.RenderApi.request(`/api/v1/admin/blog-posts/${id}`, {
						method: "DELETE",
					})
				} else if (operation !== "delete") {
					await window.RenderApi.request(
						isUuid(id) ? `/api/v1/admin/blog-posts/${id}` : "/api/v1/admin/blog-posts",
						{
							method: isUuid(id) ? "PATCH" : "POST",
							body: mapBlogPayload(data),
						},
					)
				}
				return
			}

			if (collectionName === "bookings" && isAdminPage() && isUuid(id) && data?.status) {
				await window.RenderApi.request(`/api/v1/admin/bookings/${id}/status`, {
					method: "POST",
					body: { status: data.status },
				})
			}
		} catch (error) {
			console.warn(`Render mutation sync skipped/failed for ${collectionName}:`, error)
		}
	}

	const db = {
		collection(collectionName) {
			return makeCollectionRef(collectionName)
		},
		collectionGroup(collectionName) {
			return makeCollectionRef(`__collectionGroup:${collectionName}`)
		},
		async runTransaction(callback) {
			const transaction = {
				get: (ref) => ref.get(),
				set: (ref, data, options = {}) => ref.set(data, options),
				update: (ref, data) => ref.update(data),
				delete: (ref) => ref.delete(),
			}
			return callback(transaction)
		},
	}

	function authFactory() {
		return authService
	}
	authFactory.Auth = {
		Persistence: {
			LOCAL: "local",
			SESSION: "session",
		},
	}
	authFactory.EmailAuthProvider = {
		credential: (email, password) => ({ email, password }),
	}
	authFactory.GoogleAuthProvider = function GoogleAuthProvider() {
		this.providerId = "google"
	}
	authFactory.GoogleAuthProvider.prototype.setCustomParameters = function () {}

	function firestoreFactory() {
		return db
	}
	firestoreFactory.FieldValue = {
		serverTimestamp: () => ({ __type: "serverTimestamp" }),
		increment: (amount) => ({ __type: "increment", amount }),
	}
	firestoreFactory.Timestamp = {
		fromMillis: (millis) => ({ __type: "timestamp", millis }),
	}
	firestoreFactory.FieldPath = {
		documentId: () => "__name__",
	}

	function functionsFactory() {
		return {
			httpsCallable(name) {
				return async (payload) => {
					if (!window.RenderApi?.isConfigured?.()) {
						return { data: { ok: true, skipped: true, name } }
					}
					return { data: await window.RenderApi.callCallable(name, payload) }
				}
			},
		}
	}

	const callableService = functionsFactory()

	window.AppServices = {
		auth: authService,
		db,
		functions: callableService,
		functionsService: callableService,
		getAccessToken,
		serverTimestamp: firestoreFactory.FieldValue.serverTimestamp,
		timestampFromMillis: firestoreFactory.Timestamp.fromMillis,
		increment: firestoreFactory.FieldValue.increment,
		documentIdField: firestoreFactory.FieldPath.documentId,
		emailCredential: authFactory.EmailAuthProvider.credential,
		googleProvider: () => new authFactory.GoogleAuthProvider(),
		Persistence: authFactory.Auth.Persistence,
		state,
	}
})()