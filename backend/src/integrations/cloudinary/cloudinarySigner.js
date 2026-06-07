const crypto = require("node:crypto")

const { env } = require("../../config/env")
const { ApiError } = require("../../utils/errors")
const { pickDefined } = require("../../utils/validation")

function normalizeCloudinaryContext(context = {}) {
	return Object.entries(context)
		.filter(([_key, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${key}=${String(value)}`)
		.join("|")
}

function normalizeTags(tags = []) {
	return tags
		.map((tag) => String(tag).trim())
		.filter(Boolean)
		.join(",")
}

function buildSignature(params, apiSecret) {
	const payload = Object.entries(params)
		.filter(
			([_key, value]) => value !== undefined && value !== null && value !== "",
		)
		.sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
		.map(([key, value]) => `${key}=${value}`)
		.join("&")

	return crypto
		.createHash("sha1")
		.update(`${payload}${apiSecret}`)
		.digest("hex")
}

function createCloudinarySigner({
	cloudName = env.CLOUDINARY_CLOUD_NAME,
	apiKey = env.CLOUDINARY_API_KEY,
	apiSecret = env.CLOUDINARY_API_SECRET,
	defaultFolder = env.CLOUDINARY_UPLOAD_FOLDER,
	now = () => new Date(),
} = {}) {
	function assertConfigured() {
		if (!cloudName || !apiKey || !apiSecret) {
			throw new ApiError(
				503,
				"cloudinary_not_configured",
				"Cloudinary signing is not configured on the Render backend.",
			)
		}
	}

	return {
		isConfigured() {
			return Boolean(cloudName && apiKey && apiSecret)
		},

		signUpload(options = {}) {
			assertConfigured()

			const timestamp =
				options.timestamp || Math.floor(now().getTime() / 1000).toString()
			const folder = options.folder || defaultFolder
			const resourceType =
				options.resourceType || options.resource_type || "image"
			const context = normalizeCloudinaryContext(options.context || {})
			const tags = normalizeTags(options.tags || [])

			const paramsToSign = pickDefined({
				timestamp,
				folder,
				public_id: options.publicId || options.public_id,
				upload_preset: options.uploadPreset || options.upload_preset,
				eager: options.eager,
				tags: tags || undefined,
				context: context || undefined,
			})

			const signature = buildSignature(paramsToSign, apiSecret)
			const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

			return {
				cloudName,
				apiKey,
				signature,
				timestamp,
				folder: folder || null,
				publicId: paramsToSign.public_id || null,
				resourceType,
				uploadUrl,
				params: {
					...paramsToSign,
					api_key: apiKey,
					signature,
				},
			}
		},
	}
}

module.exports = {
	buildSignature,
	createCloudinarySigner,
}
