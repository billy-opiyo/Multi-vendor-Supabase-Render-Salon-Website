const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

const SUPPORTED_THEME_PRESETS = new Set([
	"gold",
	"champagne",
	"rose-gold",
	"emerald",
	"plum-gold",
	"terracotta",
	"teal",
	"blush",
	"lavender",
])
const SUPPORTED_COLOR_MODES = new Set(["dark", "light"])

function loadClientConfig() {
	const code = fs.readFileSync(
		path.resolve(__dirname, "..", "..", "public", "client-config.js"),
		"utf8",
	)
	const sandbox = {
		Date,
		console,
		window: {},
	}

	vm.createContext(sandbox)
	vm.runInContext(code, sandbox, { filename: "public/client-config.js" })

	return sandbox.window
}

describe("client-config.js", () => {
	it("exports CLIENT_CONFIG and legacy APP_CONFIG bridge", () => {
		const window = loadClientConfig()

		expect(window.CLIENT_CONFIG).toBeTruthy()
		expect(window.APP_CONFIG).toBe(window.CLIENT_CONFIG.app)
		expect(window.CLIENT_CONFIG.client.name).toMatch(/\S/)
		expect(window.APP_CONFIG.firebase.projectId).toMatch(/\S/)
	})

	it("keeps service catalog data available for public rendering", () => {
		const window = loadClientConfig()
		const serviceCategories = window.CLIENT_CONFIG.catalog.serviceCategories
		const services = window.CLIENT_CONFIG.catalog.services

		expect(Array.isArray(serviceCategories)).toBe(true)
		expect(serviceCategories.length).toBeGreaterThan(0)
		expect(Array.isArray(services)).toBe(true)
		expect(services.length).toBeGreaterThan(0)
	})

	it("keeps service catalog references internally consistent", () => {
		const window = loadClientConfig()
		const { serviceCategories, services, stylists } = window.CLIENT_CONFIG.catalog
		const categoryKeys = new Set(serviceCategories.map((item) => item.key))
		const stylistKeys = new Set(stylists.map((item) => item.key))

		expect(categoryKeys.size).toBe(serviceCategories.length)
		expect(stylistKeys.size).toBe(stylists.length)
		for (const service of services) {
			expect(categoryKeys.has(service.category)).toBe(true)
			expect(service.name.trim()).not.toBe("")
		}
	})

	it("exposes public contact and media configuration safely", () => {
		const window = loadClientConfig()
		const { contact, media, social } = window.CLIENT_CONFIG

		expect(contact.phonePrimaryHref).toMatch(/^tel:\+?\d+/)
		expect(social.whatsapp).toMatch(/^https:\/\/wa\.me\//)
		expect(contact.emailPrimary).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
		expect(media.galleryFolder).toMatch(/^[a-z0-9-]+\/gallery$/)
	})

	it("exposes appearance defaults and theme preset config safely", () => {
		const window = loadClientConfig()
		const { appearance, theme, themePreset } = window.CLIENT_CONFIG

		expect(appearance).toEqual(
			expect.objectContaining({
				mode: expect.any(String),
				preset: expect.any(String),
			}),
		)
		expect(SUPPORTED_COLOR_MODES.has(appearance.mode)).toBe(true)
		expect(SUPPORTED_THEME_PRESETS.has(appearance.preset)).toBe(true)
		expect(themePreset).toBe(appearance.preset)
		expect(theme).toBeTruthy()
		expect(typeof theme).toBe("object")
		expect(Array.isArray(theme)).toBe(false)

		for (const value of Object.values(theme)) {
			expect(typeof value).toBe("string")
			expect(value.trim()).not.toBe("")
		}
	})
})