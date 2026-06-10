async function installAppServicesMock(page, options = {}) {
	await page.addInitScript((mockOptions) => {
		const clone = (value) => JSON.parse(JSON.stringify(value ?? null))
		const state = {
			collections: clone(mockOptions.initialCollections || {}),
			auth: {
				currentUser: null,
				signInCalls: [],
				createUserCalls: [],
				passwordResetCalls: [],
			},
			callables: [],
			generatedIdCounter: 0,
		}

		window.__appServicesMockState = state

		function ensureCollection(collectionName) {
			if (!state.collections[collectionName]) {
				state.collections[collectionName] = {}
			}
			return state.collections[collectionName]
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

		function applyFieldTransforms(previous = {}, incoming = {}) {
			const output = { ...previous }
			Object.entries(clone(incoming) || {}).forEach(([key, value]) => {
				if (value?.__type === "increment") {
					output[key] = Number(output[key] || 0) + Number(value.amount || 0)
					return
				}

				if (value?.__type === "serverTimestamp") {
					output[key] = new Date().toISOString()
					return
				}

				output[key] = value
			})
			return output
		}

		function getFilteredEntries(collectionName, constraints = []) {
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
						const a = toSortableValue(
							getComparableValue(aData, aId, constraint.field),
						)
						const b = toSortableValue(
							getComparableValue(bData, bId, constraint.field),
						)
						if (a < b) return -1 * direction
						if (a > b) return 1 * direction
						return String(aId).localeCompare(String(bId))
					})
				})

			const limitConstraint = constraints.find(
				(constraint) => constraint.type === "limit",
			)
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
			const docs = getFilteredEntries(collectionName, constraints).map(([id]) =>
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

		function setDocData(collectionName, id, data, options = {}) {
			const collection = ensureCollection(collectionName)
			const previous = collection[id] || {}
			collection[id] = options.merge
				? applyFieldTransforms(previous, data)
				: applyFieldTransforms({}, data)
		}

		function makeDocRef(collectionName, id) {
			const safeId = id || `${collectionName}-${++state.generatedIdCounter}`
			return {
				id: safeId,
				path: `${collectionName}/${safeId}`,
				collection(subcollectionName) {
					return makeCollectionRef(
						`${collectionName}/${safeId}/${subcollectionName}`,
					)
				},
				async get() {
					return makeSnapshot(safeId, collectionName)
				},
				async set(data, options = {}) {
					setDocData(collectionName, safeId, data, options)
				},
				async update(data) {
					setDocData(collectionName, safeId, data, { merge: true })
				},
				async delete() {
					delete ensureCollection(collectionName)[safeId]
				},
				onSnapshot(success) {
					window.setTimeout(
						() => success(makeSnapshot(safeId, collectionName)),
						0,
					)
					return () => {}
				},
			}
		}

		function makeCollectionRef(collectionName, constraints = []) {
			return {
				doc(id) {
					return makeDocRef(collectionName, id)
				},
				async add(data) {
					const ref = makeDocRef(
						collectionName,
						`${collectionName}-${++state.generatedIdCounter}`,
					)
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
					return makeQuerySnapshot(collectionName, constraints)
				},
				onSnapshot(success) {
					window.setTimeout(
						() => success(makeQuerySnapshot(collectionName, constraints)),
						0,
					)
					return () => {}
				},
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

		const authListeners = []

		function notifyAuthListeners() {
			authListeners.forEach((callback) => callback(authService.currentUser))
		}

		function makeAuthUser({
			uid,
			email = null,
			displayName = "",
			isAnonymous = false,
			providerId = "password",
		} = {}) {
			const user = {
				uid,
				email,
				displayName,
				isAnonymous,
				phoneNumber: "",
				photoURL: "",
				providerData: isAnonymous ? [] : [{ providerId }],
				async getIdTokenResult() {
					return { claims: clone(mockOptions.claims || {}) }
				},
				async updateProfile(updates = {}) {
					if (typeof updates.displayName === "string") {
						user.displayName = updates.displayName
					}
					if (typeof updates.photoURL === "string")
						user.photoURL = updates.photoURL
					state.auth.currentUser = clone(user)
				},
				async updateEmail(nextEmail) {
					user.email = nextEmail
					state.auth.currentUser = clone(user)
				},
				async updatePassword() {},
				async reauthenticateWithCredential() {},
				async delete() {
					authService.currentUser = null
					state.auth.currentUser = null
					notifyAuthListeners()
				},
				async linkWithCredential(credential) {
					user.email = credential?.email || user.email
					user.isAnonymous = false
					user.providerData = [{ providerId: "password" }]
					authService.currentUser = user
					state.auth.currentUser = clone(user)
					notifyAuthListeners()
					return { user }
				},
				async linkWithPopup() {
					user.isAnonymous = false
					user.providerData = [{ providerId: "google.com" }]
					authService.currentUser = user
					state.auth.currentUser = clone(user)
					notifyAuthListeners()
					return { user }
				},
				async linkWithRedirect() {
					return { user }
				},
			}

			return user
		}

		const authService = {
			currentUser: null,
			async setPersistence() {},
			onAuthStateChanged(callback) {
				authListeners.push(callback)
				window.setTimeout(() => callback(authService.currentUser), 0)
				return () => {}
			},
			async signInAnonymously() {
				const user = makeAuthUser({
					uid: mockOptions.anonymousUid || "mock-anonymous-user",
					displayName: "Guest User",
					isAnonymous: true,
					providerId: "anonymous",
				})
				authService.currentUser = user
				state.auth.currentUser = clone(user)
				notifyAuthListeners()
				return { user }
			},
			async signInWithEmailAndPassword(email, password) {
				state.auth.signInCalls.push({ email, password })
				if (mockOptions.rejectEmailPasswordSignIn) {
					const error = new Error(
						mockOptions.rejectEmailPasswordMessage ||
							"Mock email/password sign-in failed",
					)
					error.code =
						mockOptions.rejectEmailPasswordCode || "auth/invalid-credential"
					throw error
				}

				const user = makeAuthUser({
					uid:
						mockOptions.emailPasswordUid || mockOptions.adminUid || "admin-uid",
					email,
					displayName:
						mockOptions.emailPasswordDisplayName ||
						mockOptions.adminDisplayName ||
						"Admin User",
					isAnonymous: false,
					providerId: "password",
				})
				authService.currentUser = user
				state.auth.currentUser = clone(user)
				notifyAuthListeners()
				return { user }
			},
			async signInWithPopup() {
				const result = await this.signInWithEmailAndPassword(
					mockOptions.googleEmail ||
						mockOptions.adminEmail ||
						"admin@royalbraids.test",
					"popup",
				)
				result.user.providerData = [{ providerId: "google.com" }]
				return result
			},
			async signInWithRedirect() {
				return { user: authService.currentUser }
			},
			async getRedirectResult() {
				return { user: null }
			},
			async createUserWithEmailAndPassword(email, password) {
				state.auth.createUserCalls.push({ email, password })
				return this.signInWithEmailAndPassword(email, password || "created")
			},
			async sendPasswordResetEmail(email) {
				state.auth.passwordResetCalls.push({ email })
			},
			async fetchSignInMethodsForEmail() {
				return mockOptions.signInMethodsForEmail || []
			},
			async signOut() {
				authService.currentUser = null
				state.auth.currentUser = null
				notifyAuthListeners()
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
		authFactory.GoogleAuthProvider = function GoogleAuthProvider() {}
		authFactory.GoogleAuthProvider.prototype.setCustomParameters =
			function () {}

		function documentStoreFactory() {
			return db
		}
		documentStoreFactory.FieldValue = {
			serverTimestamp: () => ({ __type: "serverTimestamp" }),
			increment: (amount) => ({ __type: "increment", amount }),
		}
		documentStoreFactory.Timestamp = {
			fromMillis: (millis) => ({ __type: "timestamp", millis }),
		}
		documentStoreFactory.FieldPath = {
			documentId: () => "__name__",
		}

		function functionsFactory() {
			return {
				httpsCallable(name) {
					return async (payload) => {
						state.callables.push({ name, payload: clone(payload) })
						if (mockOptions.rejectCallables?.[name]) {
							throw new Error(mockOptions.rejectCallables[name])
						}
						return {
							data: {
								ok: true,
								admins: mockOptions.adminCallableUsers || [],
								...(mockOptions.callableResponses?.[name] || {}),
							},
						}
					}
				},
			}
		}

		const mockFunctionsService = functionsFactory()

		window.AppServices = {
			__appServicesMock: true,
			auth: authService,
			db,
			functions: mockFunctionsService,
			functionsService: mockFunctionsService,
			getAccessToken: () => "",
			serverTimestamp: documentStoreFactory.FieldValue.serverTimestamp,
			timestampFromMillis: documentStoreFactory.Timestamp.fromMillis,
			increment: documentStoreFactory.FieldValue.increment,
			documentIdField: documentStoreFactory.FieldPath.documentId,
			emailCredential: authFactory.EmailAuthProvider.credential,
			googleProvider: () => new authFactory.GoogleAuthProvider(),
			Persistence: authFactory.Auth.Persistence,
		}

	}, options)
}

module.exports = { installAppServicesMock }
