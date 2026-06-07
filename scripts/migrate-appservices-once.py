from pathlib import Path
import json
import re


def read(path: str) -> str:
	return Path(path).read_text(encoding="utf-8").replace("\r\n", "\n")


def write(path: str, text: str) -> None:
	Path(path).write_text(text, encoding="utf-8")


def replace(text: str, old: str, new: str, label: str) -> str:
	if old not in text:
		print(f"WARN: not found: {label}")
		return text
	return text.replace(old, new)


def replace_slice(text: str, start_marker: str, end_marker: str, new: str, label: str) -> str:
	try:
		start = text.index(start_marker)
		end = text.index(end_marker, start)
	except ValueError:
		print(f"WARN: slice markers not found: {label}")
		return text
	return text[:start] + new + text[end:]


def update_html(path: str) -> None:
	text = read(path)
	text = re.sub(
		r'\n\s*<link rel="preconnect" href="https://www\.gstatic\.com" crossorigin />',
		"",
		text,
	)
	text = re.sub(
		r'\n\s*<script\s+src="https://www\.gstatic\.com/firebasejs/10\.12\.2/firebase-(?:app|auth|firestore|functions)-compat\.js"\s+defer\s*></script>',
		"",
		text,
	)
	marker = '\t\t<script src="JS/theme-preset-preview.js" defer></script>\n'
	adapters = (
		'\t\t<script src="JS/theme-preset-preview.js" defer></script>\n'
		'\t\t<script src="JS/render-api-adapter.js" defer></script>\n'
		'\t\t<script src="JS/supabase-browser-adapter.js" defer></script>\n'
	)
	if "JS/render-api-adapter.js" not in text:
		text = replace(text, marker, adapters, f"adapter scripts in {path}")
	write(path, text)


def update_client_config() -> None:
	path = "public/client-config.js"
	text = read(path)
	text = replace(
		text,
		"// Safe to expose here: branding, contact details, public social links,\n"
		"// Firebase WEB config, public Cloudinary folder name.\n"
		"// Never put private API secrets here. Resend/WhatsApp/Cloudinary secrets\n"
		"// are set with Firebase Functions secrets; see CLIENT_AUTOMATION_START.md.\n",
		"// Safe to expose here: branding, contact details, public social links,\n"
		"// Supabase public anon config, Render API URL, and public Cloudinary folder.\n"
		"// Never put private API secrets here. Resend/WhatsApp/Cloudinary secrets\n"
		"// are stored server-side in Render environment variables.\n",
		"client-config comments",
	)
	text = re.sub(
		r'\n\tconst firebaseConfig = \{\n\t\tapiKey: "[^"]*",\n\t\tauthDomain: "[^"]*",\n\t\tprojectId: "[^"]*",\n\t\tstorageBucket: "[^"]*",\n\t\tmessagingSenderId: "[^"]*",\n\t\tappId: "[^"]*",\n\t\tmeasurementId: "[^"]*",\n\t\}\n',
		'\n\tconst supabaseConfig = {\n'
		'\t\t// Public Supabase project URL and anon key. These are safe for browser use.\n'
		'\t\turl: "",\n'
		'\t\tanonKey: "",\n'
		'\t}\n\n'
		'\tconst renderApiConfig = {\n'
		'\t\t// Example: "https://salon-render-backend.onrender.com"\n'
		'\t\tapiBaseUrl: "",\n'
		'\t}\n',
		text,
	)
	text = replace(
		text,
		'\t\tintegrations: {\n'
		'\t\t\tfirebase: firebaseConfig,\n'
		'\t\t\tcloudinaryFolder: cloudinaryGalleryFolder,\n'
		'\t\t\twhatsappPublicUrl: whatsappUrl,\n'
		'\t\t\tcontactEmailProvider: "firebase-functions-resend",\n'
		'\t\t\tfirebaseSecretNames: {\n'
		'\t\t\t\tresendApiKey: "RESEND_API_KEY",\n'
		'\t\t\t\tresendFromEmail: "RESEND_FROM_EMAIL",\n'
		'\t\t\t\twhatsappAccessToken: "WHATSAPP_CLOUD_ACCESS_TOKEN",\n'
		'\t\t\t\twhatsappPhoneNumberId: "WHATSAPP_CLOUD_PHONE_NUMBER_ID",\n'
		'\t\t\t\tcloudinaryCloudName: "CLOUDINARY_CLOUD_NAME",\n'
		'\t\t\t\tcloudinaryApiKey: "CLOUDINARY_API_KEY",\n'
		'\t\t\t\tcloudinaryApiSecret: "CLOUDINARY_API_SECRET",\n'
		'\t\t\t},\n'
		'\t\t},\n',
		'\t\tintegrations: {\n'
		'\t\t\tsupabase: supabaseConfig,\n'
		'\t\t\trender: renderApiConfig,\n'
		'\t\t\tcloudinaryFolder: cloudinaryGalleryFolder,\n'
		'\t\t\twhatsappPublicUrl: whatsappUrl,\n'
		'\t\t\tcontactEmailProvider: "render-resend",\n'
		'\t\t},\n',
		"integrations block",
	)
	text = replace(
		text,
		'\t\tapp: {\n\t\t\tfirebase: firebaseConfig,\n\t\t\tcloudinaryFolder: cloudinaryGalleryFolder,\n',
		'\t\tapp: {\n\t\t\tsupabase: supabaseConfig,\n\t\t\trender: renderApiConfig,\n\t\t\tcloudinaryFolder: cloudinaryGalleryFolder,\n',
		"app bridge block",
	)
	write(path, text)


def update_public_script() -> None:
	path = "public/JS/script.js"
	text = read(path)
	for old, new in [
		("// ============ FIREBASE + CLOUDINARY CONFIG ============", "// ============ APP SERVICES + CLOUDINARY CONFIG ============"),
		("const firebaseConfig = appConfig.firebase || {}\n", ""),
		("firebaseReady", "appServicesReady"),
		("functionsService", "callableService"),
		("canInitializeFirebase", "canInitializeAppServices"),
		("initializeFirebaseServices", "initializeAppServices"),
		("firebase.firestore.FieldValue.serverTimestamp()", "getServerTimestamp()"),
		("firebase.firestore.FieldPath.documentId()", "getDocumentIdField()"),
		("firebase.auth.EmailAuthProvider.credential", "createEmailCredential"),
		("new firebase.auth.GoogleAuthProvider()", "createGoogleProvider()"),
		(
			"This website domain is not authorized in Firebase Authentication. Add it under Authentication → Settings → Authorized domains.",
			"This website domain is not authorized for browser authentication. Check the Supabase redirect URL settings.",
		),
		(
			"Anonymous sign-in is disabled. In Firebase Console, go to Authentication → Sign-in method and enable Anonymous provider.",
			"Guest sign-in is unavailable. Check the browser auth configuration.",
		),
		(
			"This sign-in method is not enabled. Enable Anonymous provider in Firebase Authentication settings.",
			"This sign-in method is not enabled in the browser auth configuration.",
		),
		(
			"⚠️ Waitlist service is not configured yet. Add Firebase keys in APP_CONFIG.",
			"⚠️ Waitlist service is not configured yet. Check Supabase/Render settings in client-config.js.",
		),
	]:
		text = text.replace(old, new)

	public_helpers = '''function getAppServices() {
	return window.AppServices || {}
}

function getServerTimestamp() {
	const services = getAppServices()
	return typeof services.serverTimestamp === "function"
		? services.serverTimestamp()
		: new Date().toISOString()
}

function getDocumentIdField() {
	const services = getAppServices()
	return typeof services.documentIdField === "function"
		? services.documentIdField()
		: "__name__"
}

function createEmailCredential(email, password) {
	const services = getAppServices()
	return typeof services.emailCredential === "function"
		? services.emailCredential(email, password)
		: { email, password }
}

function createGoogleProvider() {
	const services = getAppServices()
	const provider =
		typeof services.googleProvider === "function"
			? services.googleProvider()
			: { providerId: "google" }
	if (provider && typeof provider.setCustomParameters !== "function") {
		provider.setCustomParameters = function () {}
	}
	return provider
}

function canInitializeAppServices() {
	const services = getAppServices()
	return Boolean(services.auth && services.db)
}
'''
	text = replace_slice(
		text,
		"function canInitializeAppServices() {",
		"\nfunction getDefaultEnabledServiceCategoriesState()",
		public_helpers,
		"public AppServices helpers",
	)

	public_init = '''async function initializeAppServices() {
	const services = getAppServices()
	if (!canInitializeAppServices()) {
		console.warn(
			"App services are not configured. Load JS/supabase-browser-adapter.js before JS/script.js.",
		)
		return
	}

	auth = services.auth
	db = services.db
	callableService = services.functionsService || services.functions || null
	attachAuthStateObserver()
	try {
		if (typeof auth.setPersistence === "function") {
			await auth.setPersistence(services.Persistence?.LOCAL || "local")
		}
	} catch (persistenceError) {
		console.warn("Auth persistence setup failed:", persistenceError)
	}

	appServicesReady = true
	startServiceCategorySettingsListener()

	const persistedUser = auth.currentUser
	if (persistedUser && !persistedUser.isAnonymous) {
		setDashboardSignedInState(persistedUser)
		await Promise.allSettled([
			upsertUserProfile(persistedUser),
			loadUserDashboardData(persistedUser),
		])
	}
}
'''
	text = replace_slice(
		text,
		"async function initializeAppServices() {",
		"\nfunction initAuthUiRefs()",
		public_init,
		"public initializeAppServices",
	)
	write(path, text)


def update_admin_script() -> None:
	path = "public/JS/admin.js"
	text = read(path)
	for old, new in [
		("const firebaseConfig = appConfig.firebase || {}\n", ""),
		("let adminFirebaseApp = null\n", ""),
		("firebaseReady", "appServicesReady"),
		("adminFunctionsService", "adminCallableService"),
		("canInitializeFirebase", "canInitializeAppServices"),
		("initializeFirebaseServices", "initializeAppServices"),
		("firebase.firestore.FieldValue.serverTimestamp()", "getServerTimestamp()"),
		("❌ Firebase Auth is not ready yet.", "❌ Auth service is not ready yet."),
		(
			"⚠️ Firebase is not configured. Add APP_CONFIG keys on this page.",
			"⚠️ App services are not configured. Check Supabase/Render settings in client-config.js.",
		),
		(
			"Session tracking permission denied. Please sign out/in and refresh after Firestore rules deployment.",
			"Session tracking permission denied. Please sign out/in and refresh after backend policy deployment.",
		),
	]:
		text = text.replace(old, new)

	admin_helpers = '''function getAdminAppServices() {
	return window.AppServices || {}
}

function getServerTimestamp() {
	const services = getAdminAppServices()
	return typeof services.serverTimestamp === "function"
		? services.serverTimestamp()
		: new Date().toISOString()
}

function canInitializeAppServices() {
	const services = getAdminAppServices()
	return Boolean(services.auth && services.db)
}
'''
	text = replace_slice(
		text,
		"function canInitializeAppServices() {",
		"\nfunction normalizeAdminRoleValue",
		admin_helpers,
		"admin AppServices helpers",
	)

	admin_init = '''async function initializeAppServices() {
	const services = getAdminAppServices()
	if (!canInitializeAppServices()) {
		setAdminMessage(
			"error",
			"⚠️ App services are not configured. Check Supabase/Render settings in client-config.js.",
			"adminAuthMessage",
		)
		return
	}

	auth = services.auth
	db = services.db
	adminCallableService = services.functionsService || services.functions || null
	try {
		if (typeof auth.setPersistence === "function") {
			await auth.setPersistence(services.Persistence?.SESSION || "session")
		}
	} catch (persistenceError) {
		console.warn("Admin auth persistence setup failed:", persistenceError)
	}

	appServicesReady = true
	auth.onAuthStateChanged((user) => {
		handleAuthStateChange(user)
	})
}
'''
	text = replace_slice(
		text,
		"async function initializeAppServices() {",
		"\ninitializeAdminPanel()",
		admin_init,
		"admin initializeAppServices",
	)
	write(path, text)


def update_tests_and_package() -> None:
	path = "tests/e2e/helpers/firebase-mock.js"
	text = read(path)
	if "window.AppServices = {" not in text:
		text = replace(
			text,
			"\t\twindow.firebase = {\n",
			"\t\tconst mockFunctionsService = functionsFactory()\n\n"
			"\t\twindow.AppServices = {\n"
			"\t\t\tauth: authService,\n"
			"\t\t\tdb,\n"
			"\t\t\tfunctions: mockFunctionsService,\n"
			"\t\t\tfunctionsService: mockFunctionsService,\n"
			"\t\t\tgetAccessToken: () => \"\",\n"
			"\t\t\tserverTimestamp: firestoreFactory.FieldValue.serverTimestamp,\n"
			"\t\t\tdocumentIdField: firestoreFactory.FieldPath.documentId,\n"
			"\t\t\temailCredential: authFactory.EmailAuthProvider.credential,\n"
			"\t\t\tgoogleProvider: () => new authFactory.GoogleAuthProvider(),\n"
			"\t\t\tPersistence: authFactory.Auth.Persistence,\n"
			"\t\t}\n\n"
			"\t\twindow.firebase = {\n",
			"e2e AppServices mock",
		)
		text = text.replace("\t\t\tfunctions: functionsFactory,\n", "\t\t\tfunctions: () => mockFunctionsService,\n")
	write(path, text)

	path = "tests/unit/client-config.test.js"
	text = read(path)
	text = replace(
		text,
		"\t\texpect(window.APP_CONFIG.firebase.projectId).toMatch(/\\S/)\n",
		"\t\texpect(window.APP_CONFIG.firebase).toBeUndefined()\n"
		"\t\texpect(window.APP_CONFIG.supabase).toEqual(\n"
		"\t\t\texpect.objectContaining({ url: expect.any(String), anonKey: expect.any(String) }),\n"
		"\t\t)\n"
		"\t\texpect(window.APP_CONFIG.render).toEqual(\n"
		"\t\t\texpect.objectContaining({ apiBaseUrl: expect.any(String) }),\n"
		"\t\t)\n",
		"client-config unit expectations",
	)
	write(path, text)

	path = "package.json"
	data = json.loads(read(path))
	data["scripts"]["check:js"] = data["scripts"]["check:js"].replace(
		"node --check public/JS/theme-preset-preview.js && node --check public/JS/script.js",
		"node --check public/JS/theme-preset-preview.js && node --check public/JS/render-api-adapter.js && node --check public/JS/supabase-browser-adapter.js && node --check public/JS/script.js",
	)
	write(path, json.dumps(data, indent="\t") + "\n")


def main() -> None:
	update_html("public/index.html")
	update_html("public/admin.html")
	update_client_config()
	for path in ["public/JS/apply-client-config.js", "public/JS/register-sw.js"]:
		text = read(path)
		text = text.replace("firebase-functions-resend", "render-resend")
		text = text.replace(
			"lets the Firebase mock installed by the tests remain authoritative.",
			"lets the browser test mock installed by the tests remain authoritative.",
		)
		write(path, text)
	update_public_script()
	update_admin_script()
	update_tests_and_package()
	print("AppServices migration edits applied.")


if __name__ == "__main__":
	main()