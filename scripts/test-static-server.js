#!/usr/bin/env node

const fs = require("node:fs")
const http = require("node:http")
const path = require("node:path")
const { URL } = require("node:url")

const HOST = process.env.HOST || "127.0.0.1"
const PORT = Number(process.env.PORT || 4173)
const PUBLIC_DIR = path.resolve(__dirname, "..", "public")

const MIME_TYPES = {
	".css": "text/css; charset=utf-8",
	".gif": "image/gif",
	".html": "text/html; charset=utf-8",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp",
}

function resolvePublicPath(requestUrl = "/") {
	const url = new URL(requestUrl, `http://${HOST}:${PORT}`)
	const pathname = decodeURIComponent(url.pathname)
	const normalizedPath = pathname === "/" ? "/index.html" : pathname
	const resolvedPath = path.resolve(PUBLIC_DIR, `.${normalizedPath}`)

	if (!resolvedPath.startsWith(PUBLIC_DIR)) {
		return null
	}

	return resolvedPath
}

const server = http.createServer((request, response) => {
	const filePath = resolvePublicPath(request.url)

	if (!filePath) {
		response.writeHead(403, { "content-type": "text/plain; charset=utf-8" })
		response.end("Forbidden")
		return
	}

	fs.readFile(filePath, (error, content) => {
		if (error) {
			response.writeHead(404, { "content-type": "text/html; charset=utf-8" })
			response.end("<h1>404 Not Found</h1>")
			return
		}

		const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] ||
			"application/octet-stream"
		response.writeHead(200, { "content-type": contentType })
		response.end(content)
	})
})

server.listen(PORT, HOST, () => {
	console.log(`Test static server running at http://${HOST}:${PORT}`)
})