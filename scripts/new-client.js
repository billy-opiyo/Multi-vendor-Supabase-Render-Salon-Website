#!/usr/bin/env node
/*
 * Quick client bootstrap generator for this Salon Shop template.
 *
 * Usage:
 *   node scripts/new-client.js
 *
 * Or with flags:
 *   node scripts/new-client.js --name "Glam House Spa" --slug glam-house-spa \
 *     --phone "+254700000000" --email "info@glamhouse.co.ke"
 *
 * This updates:
 *   - public/client-config.js
 *   - functions/client-config.js
 */

const fs = require("fs")
const path = require("path")
const readline = require("readline/promises")
const { stdin: input, stdout: output } = require("process")

const CLIENT_FLAGS = ["--name", "-n", "--slug", "-s", "--phone", "--email"]

function hasArg(flag) {
	return process.argv.includes(flag)
}

function hasAnyClientArg() {
	return CLIENT_FLAGS.some((flag) => hasArg(flag))
}

function getArgValue(flag, fallback = "") {
	const idx = process.argv.indexOf(flag)
	if (idx === -1) return fallback
	return String(process.argv[idx + 1] || "").trim() || fallback
}

function slugify(value = "") {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function toDisplayKey(value = "") {
	return String(value || "")
		.trim()
		.replace(/\s+/g, " ")
		.replace(/(^|\s)\S/g, (m) => m.toUpperCase())
}

function toShortNameHtml(value = "") {
	const words = String(value || "")
		.trim()
		.toUpperCase()
		.split(/\s+/)
		.filter(Boolean)
	if (!words.length) return "NEW<br />SALON"
	if (words.length === 1) return words[0]
	return `${words[0]}<br />${words.slice(1).join(" ")}`
}

function jsString(value = "") {
	return JSON.stringify(String(value ?? ""))
}

function replaceSimple(text, find, nextValue) {
	return text.replace(find, nextValue)
}

function replaceConstString(text, constName, nextValue) {
	const pattern = new RegExp(`const\\s+${constName}\\s*=\\s*([^\\n]+)`)
	return text.replace(pattern, `const ${constName} = ${jsString(nextValue)}`)
}

async function askQuestion(rl, label, fallback = "") {
	const suffix = fallback ? ` (${fallback})` : ""
	const answer = await rl.question(`${label}${suffix}: `)
	return String(answer || "").trim() || fallback
}

async function collectClientOptions() {
	const cliName = getArgValue("--name") || getArgValue("-n")
	const shouldPrompt = process.stdin.isTTY && !hasAnyClientArg()
	let clientNameRaw = cliName || "New Salon"

	if (shouldPrompt) {
		console.log("\n🧾 New client setup")
		console.log("Press Enter to accept the value in brackets.\n")

		const rl = readline.createInterface({ input, output })
		try {
			clientNameRaw = await askQuestion(rl, "Business name", clientNameRaw)
			const clientName = toDisplayKey(clientNameRaw)
			const defaultSlug = slugify(clientName)
			const slug = slugify(await askQuestion(rl, "Client slug", defaultSlug))
			const phoneRaw = await askQuestion(
				rl,
				"Primary phone number",
				"+254700000000",
			)
			const defaultEmail = `info@${slug.replace(/-/g, "") || "newsalon"}.com`
			const emailRaw = await askQuestion(rl, "Primary email", defaultEmail)

			return { clientNameRaw, slug, phoneRaw, emailRaw }
		} finally {
			rl.close()
		}
	}

	const clientName = toDisplayKey(clientNameRaw)
	const slug =
		slugify(getArgValue("--slug") || getArgValue("-s")) || slugify(clientName)
	const phoneRaw = getArgValue("--phone") || "+254700000000"
	const emailRaw =
		getArgValue("--email") || `info@${slug.replace(/-/g, "") || "newsalon"}.com`

	return { clientNameRaw, slug, phoneRaw, emailRaw }
}

async function main() {
	const projectRoot = process.cwd()
	const publicConfigPath = path.join(projectRoot, "public", "client-config.js")
	const functionsConfigPath = path.join(
		projectRoot,
		"functions",
		"client-config.js",
	)

	if (!fs.existsSync(publicConfigPath)) {
		throw new Error(`Missing file: ${publicConfigPath}`)
	}
	if (!fs.existsSync(functionsConfigPath)) {
		throw new Error(`Missing file: ${functionsConfigPath}`)
	}

	const { clientNameRaw, slug, phoneRaw, emailRaw } =
		await collectClientOptions()
	const clientName = toDisplayKey(clientNameRaw)

	const phoneDigits = phoneRaw.replace(/\D/g, "")
	const phoneHref = phoneDigits ? `tel:+${phoneDigits}` : "tel:+254700000000"
	const whatsappHref = phoneDigits
		? `https://wa.me/${phoneDigits}`
		: "https://wa.me/254700000000"
	const emailDomain = emailRaw.split("@")[1] || "example.com"
	const bookingsEmail = `bookings@${emailDomain}`

	let publicConfig = fs.readFileSync(publicConfigPath, "utf8")
	let functionsConfig = fs.readFileSync(functionsConfigPath, "utf8")

	publicConfig = replaceConstString(publicConfig, "businessName", clientName)
	publicConfig = replaceConstString(publicConfig, "businessSlug", slug)
	publicConfig = replaceConstString(
		publicConfig,
		"businessShortNameHtml",
		toShortNameHtml(clientName),
	)
	publicConfig = replaceConstString(
		publicConfig,
		"businessLogoTextHtml",
		`✨ ${clientName.toUpperCase()}`,
	)
	publicConfig = replaceConstString(publicConfig, "phonePrimary", phoneRaw)
	publicConfig = replaceConstString(publicConfig, "phonePrimaryHref", phoneHref)
	publicConfig = replaceConstString(publicConfig, "whatsappUrl", whatsappHref)
	publicConfig = replaceConstString(publicConfig, "emailPrimary", emailRaw)
	publicConfig = replaceConstString(
		publicConfig,
		"emailBookings",
		bookingsEmail,
	)
	publicConfig = replaceConstString(
		publicConfig,
		"contactNotificationEmail",
		emailRaw,
	)

	functionsConfig = replaceSimple(
		functionsConfig,
		/businessName:\s*"[^"]*"/,
		`businessName: "${clientName}"`,
	)
	functionsConfig = replaceSimple(
		functionsConfig,
		/teamName:\s*"[^"]*"/,
		`teamName: "${clientName} Team"`,
	)
	functionsConfig = replaceSimple(
		functionsConfig,
		/contactNotificationEmail:\s*"[^"]*"/,
		`contactNotificationEmail: "${emailRaw}"`,
	)
	functionsConfig = replaceSimple(
		functionsConfig,
		/cloudinaryFolder:\s*"[^"]*"/,
		`cloudinaryFolder: "${slug}/uploads"`,
	)

	fs.writeFileSync(publicConfigPath, publicConfig, "utf8")
	fs.writeFileSync(functionsConfigPath, functionsConfig, "utf8")

	console.log("✅ Client bootstrap applied")
	console.log(`   Name: ${clientName}`)
	console.log(`   Slug: ${slug}`)
	console.log("   Updated files:")
	console.log("    - public/client-config.js")
	console.log("    - functions/client-config.js")
	console.log("")
	console.log("Next:")
	console.log("1) Update Firebase web config in public/client-config.js")
	console.log(
		"2) Set Firebase Function secrets (Resend/WhatsApp/Cloudinary) for this Firebase project",
	)
	console.log("3) Deploy: firebase deploy --only functions,hosting:main-site")
}

try {
	main().catch((error) => {
		console.error("❌ new-client failed:", error.message)
		process.exit(1)
	})
} catch (error) {
	console.error("❌ new-client failed:", error.message)
	process.exit(1)
}
