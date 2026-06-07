const { spawnSync } = require("node:child_process")

const filesToCheck = [
	"public/client-config.js",
	"public/JS/splash.js",
	"public/JS/apply-client-config.js",
	"public/JS/theme-preset-preview.js",
	"public/JS/render-api-adapter.js",
	"public/JS/supabase-browser-adapter.js",
	"public/JS/script.js",
	"public/JS/admin.js",
	"public/JS/register-sw.js",
	"scripts/check-js.js",
	"scripts/new-client.js",
	"scripts/optimize-images.js",
	"scripts/test-static-server.js",
]

for (const file of filesToCheck) {
	console.log(`Checking ${file}`)
	const result = spawnSync(process.execPath, ["--check", file], {
		stdio: "inherit",
		shell: false,
	})

	if (result.status !== 0) {
		process.exit(result.status || 1)
	}
}
