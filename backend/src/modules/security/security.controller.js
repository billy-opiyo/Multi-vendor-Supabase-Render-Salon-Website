const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const { createSecurityService } = require("./security.service")
const {
	accountChangeListQuerySchema,
	accountSecurityChangeSchema,
	adminSecurityRestrictionSchema,
	loginActivitySchema,
	normalizeSecurityPayload,
	securityActionListQuerySchema,
	securityAlertListQuerySchema,
	securityAlertParamsSchema,
	securityAlertStatusSchema,
	securityListQuerySchema,
	securityTargetUserParamsSchema,
} = require("./security.validators")

function ok(res, data, statusCode = 200) {
	res.status(statusCode).json({ ok: true, data })
}

function parseNormalizedBody(schema, body, message) {
	return parseRequest(schema, normalizeSecurityPayload(body), { message })
}

function parseNormalizedQuery(schema, query, message) {
	return parseRequest(schema, normalizeSecurityPayload(query), { message })
}

const recordLoginActivity = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		loginActivitySchema,
		req.body,
		"Invalid login activity payload.",
	)
	const result = await createSecurityService().recordLoginActivity(
		req.auth?.user,
		payload,
		req,
	)

	ok(res, result, 201)
})

const recordAccountSecurityChange = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		accountSecurityChangeSchema,
		req.body,
		"Invalid account security change payload.",
	)
	const result = await createSecurityService().recordAccountSecurityChange(
		req.auth?.user,
		payload,
	)

	ok(res, result, 201)
})

const listAdminLoginActivities = asyncHandler(async (req, res) => {
	const filters = parseNormalizedQuery(
		securityListQuerySchema,
		req.query,
		"Invalid login activity filters.",
	)
	const loginActivities = await createSecurityService().listLoginActivities(filters)

	ok(res, { loginActivities })
})

const listAdminSecurityAlerts = asyncHandler(async (req, res) => {
	const filters = parseNormalizedQuery(
		securityAlertListQuerySchema,
		req.query,
		"Invalid security alert filters.",
	)
	const securityAlerts = await createSecurityService().listSecurityAlerts(filters)

	ok(res, { securityAlerts })
})

const updateAdminSecurityAlert = asyncHandler(async (req, res) => {
	const params = parseRequest(securityAlertParamsSchema, req.params, {
		message: "Invalid security alert identifier.",
	})
	const payload = parseNormalizedBody(
		securityAlertStatusSchema,
		req.body,
		"Invalid security alert status payload.",
	)
	const securityAlert = await createSecurityService().updateSecurityAlertStatus(
		req.admin,
		params.alertId,
		payload,
	)

	ok(res, { securityAlert })
})

const listAdminAccountChangeHistory = asyncHandler(async (req, res) => {
	const filters = parseNormalizedQuery(
		accountChangeListQuerySchema,
		req.query,
		"Invalid account change filters.",
	)
	const accountChanges = await createSecurityService().listAccountChanges(filters)

	ok(res, { accountChanges })
})

const listAdminSecurityActions = asyncHandler(async (req, res) => {
	const filters = parseNormalizedQuery(
		securityActionListQuerySchema,
		req.query,
		"Invalid security action filters.",
	)
	const securityActions = await createSecurityService().listSecurityActions(filters)

	ok(res, { securityActions })
})

const restrictAdminUserAccount = asyncHandler(async (req, res) => {
	const params = parseRequest(securityTargetUserParamsSchema, req.params, {
		message: "Invalid target user identifier.",
	})
	const payload = parseNormalizedBody(
		adminSecurityRestrictionSchema,
		req.body,
		"Invalid security restriction payload.",
	)
	const result = await createSecurityService().applyAdminSecurityRestriction(
		req.admin,
		params.userId,
		payload,
	)

	ok(res, result, 200)
})

const getAdminSecurityDashboard = asyncHandler(async (req, res) => {
	const filters = parseNormalizedQuery(
		securityListQuerySchema,
		req.query,
		"Invalid security dashboard filters.",
	)
	const dashboard = await createSecurityService().getSecurityDashboard(filters)

	ok(res, { dashboard })
})

module.exports = {
	getAdminSecurityDashboard,
	listAdminAccountChangeHistory,
	listAdminLoginActivities,
	listAdminSecurityActions,
	listAdminSecurityAlerts,
	recordAccountSecurityChange,
	recordLoginActivity,
	restrictAdminUserAccount,
	updateAdminSecurityAlert,
}