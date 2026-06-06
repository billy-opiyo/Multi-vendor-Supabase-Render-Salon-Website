const { asyncHandler } = require("../../utils/errors")
const { createAuthService } = require("./auth.service")

const getMe = asyncHandler(async (req, res) => {
	const context = await createAuthService().getCurrentUserContext(req.auth.user)

	res.status(200).json({
		ok: true,
		data: context,
	})
})

module.exports = {
	getMe,
}
