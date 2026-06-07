const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..", "..")

function readText(relativePath) {
	return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

function readJson(relativePath) {
	return JSON.parse(readText(relativePath))
}

function listPublicTablesFromCoreMigration() {
	const coreMigration = readText(
		"supabase/migrations/20260606000100_phase_1_core_schema.sql",
	)
	return [...coreMigration.matchAll(/create\s+table\s+public\.([a-z0-9_]+)/gi)].map(
		(match) => match[1],
	)
}

describe("Phase 9 Supabase/Render/Vercel architecture validation", () => {
	it("keeps root npm validation focused on active Supabase/Render/Vercel workflows", () => {
		const packageJson = readJson("package.json")
		const scripts = packageJson.scripts || {}
		const scriptText = Object.values(scripts).join("\n")

		expect(scripts.test).toContain("test:backend")
		expect(scripts.test).toContain("test:e2e")
		expect(scripts["test:phase9"]).toContain("test:backend")
		expect(scripts["test:rules"]).toBeUndefined()
		expect(scripts.emulators).toBeUndefined()
		expect(scripts["emulators:functions"]).toBeUndefined()
		expect(scriptText).not.toMatch(/firebase\s+emulators|firebase\s+deploy|npm\s+--prefix\s+functions/i)
	})

	it("does not keep Firebase packages as active root development dependencies", () => {
		const packageJson = readJson("package.json")
		const devDependencies = packageJson.devDependencies || {}

		expect(devDependencies.firebase).toBeUndefined()
		expect(devDependencies["firebase-tools"]).toBeUndefined()
		expect(devDependencies["@firebase/rules-unit-testing"]).toBeUndefined()
	})

	it("serves the public/admin frontend through Supabase and Render adapters only", () => {
		const publicHtml = readText("public/index.html")
		const adminHtml = readText("public/admin.html")
		const activeBrowserShell = `${publicHtml}\n${adminHtml}`

		expect(activeBrowserShell).toContain("JS/render-api-adapter.js")
		expect(activeBrowserShell).toContain("JS/supabase-browser-adapter.js")
		expect(activeBrowserShell).not.toMatch(/firebase(?:-app|-auth|-firestore|-functions)?\.js/i)
		expect(activeBrowserShell).not.toMatch(/www\.gstatic\.com\/firebasejs/i)
	})

	it("keeps browser configuration public and free of private platform secrets", () => {
		const clientConfig = readText("public/client-config.js")
		const forbiddenSecretNames = [
			"SUPABASE_SERVICE_ROLE_KEY",
			"RESEND_API_KEY",
			"WHATSAPP_ACCESS_TOKEN",
			"CLOUDINARY_API_SECRET",
			"JOB_SECRET",
		]

		expect(clientConfig).toMatch(/supabaseConfig/) 
		expect(clientConfig).toMatch(/renderApiConfig/)
		expect(clientConfig).not.toMatch(/firebaseConfig|apiKey:\s*["'][^"']+firebase/i)
		for (const secretName of forbiddenSecretNames) {
			expect(clientConfig).not.toContain(secretName)
		}
	})

	it("defines Render web and cron services instead of Firebase deployment targets", () => {
		const renderBlueprint = readText("render.yaml")

		expect(renderBlueprint).toMatch(/type:\s*web/)
		expect(renderBlueprint).toMatch(/rootDir:\s*backend/)
		expect(renderBlueprint).toMatch(/healthCheckPath:\s*\/health/)
		expect(renderBlueprint).toMatch(/type:\s*cron/)
		expect(renderBlueprint).toContain("SUPABASE_SERVICE_ROLE_KEY")
		expect(renderBlueprint).not.toMatch(/FIREBASE|firestore|firebase/i)
	})

	it("enables RLS for every table created by the Supabase foundation migration", () => {
		const tables = listPublicTablesFromCoreMigration()
		const rlsMigration = readText(
			"supabase/migrations/20260606000200_phase_1_rls_policies.sql",
		)

		expect(tables.length).toBeGreaterThan(0)
		for (const table of tables) {
			expect(rlsMigration).toMatch(
				new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i"),
			)
		}
	})
})