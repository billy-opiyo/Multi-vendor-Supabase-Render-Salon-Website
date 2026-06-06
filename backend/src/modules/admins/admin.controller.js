const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const { createAdminService } = require("./admin.service")
const {
	adminCreateSchema,
	adminListQuerySchema,
	adminParamsSchema,
	adminUpdateSchema,
	normalizeAdminPayload,
} = require("./admin.validators")

const getCurrentAdmin = asyncHandler(async (req, res) => {
	const adminUser = await createAdminService().getCurrentAdmin(req.admin)

	res.status(200).json({
		ok: true,
		data: {
			adminUser,
		},
	})
})

const listAdminUsers = asyncHandler(async (req, res) => {
	const filters = parseRequest(adminListQuerySchema, req.query, {
		message: "Invalid admin list filters.",
	})
	const adminUsers = await createAdminService().listAdminUsers(filters)

	res.status(200).json({
		ok: true,
		data: {
			adminUsers,
		},
	})
})

const createAdminUser = asyncHandler(async (req, res) => {
	const payload = parseRequest(
		adminCreateSchema,
		normalizeAdminPayload(req.body),
	)
	const adminUser = await createAdminService().createAdminUser(
		req.admin,
		payload,
	)

	res.status(201).json({
		ok: true,
		data: {
			adminUser,
		},
	})
})

const updateAdminUser = asyncHandler(async (req, res) => {
	const params = parseRequest(adminParamsSchema, req.params, {
		message: "Invalid admin user identifier.",
	})
	const payload = parseRequest(
		adminUpdateSchema,
		normalizeAdminPayload(req.body),
	)
	const adminUser = await createAdminService().updateAdminUser(
		req.admin,
		params.adminUserId,
		payload,
	)

	res.status(200).json({
		ok: true,
		data: {
			adminUser,
		},
	})
})

module.exports = {
	createAdminUser,
	getCurrentAdmin,
	listAdminUsers,
	updateAdminUser,
}
