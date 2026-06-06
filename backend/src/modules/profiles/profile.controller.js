const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const { createProfileService } = require("./profile.service")
const {
	normalizeProfilePayload,
	profilePayloadSchema,
} = require("./profile.validators")

const getOwnProfile = asyncHandler(async (req, res) => {
	const profile = await createProfileService().getOwnProfile(req.auth.user)

	res.status(200).json({
		ok: true,
		data: {
			profile,
		},
	})
})

const syncOwnProfile = asyncHandler(async (req, res) => {
	const payload = parseRequest(
		profilePayloadSchema,
		normalizeProfilePayload(req.body),
	)
	const profile = await createProfileService().syncOwnProfile(
		req.auth.user,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: {
			profile,
		},
	})
})

const updateOwnProfile = asyncHandler(async (req, res) => {
	const payload = parseRequest(
		profilePayloadSchema,
		normalizeProfilePayload(req.body),
	)
	const profile = await createProfileService().updateOwnProfile(
		req.auth.user,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: {
			profile,
		},
	})
})

module.exports = {
	getOwnProfile,
	syncOwnProfile,
	updateOwnProfile,
}
