const { asyncHandler } = require("../../utils/errors")
const { parseRequest } = require("../../utils/validation")
const { createContentService } = require("./content.service")
const {
	adminContactMessageListQuerySchema,
	adminContentListQuerySchema,
	adminReviewListQuerySchema,
	blogPostCreateSchema,
	blogPostParamsSchema,
	blogPostUpdateSchema,
	cloudinarySignSchema,
	contactMessageCreateSchema,
	contactMessageParamsSchema,
	contactMessageStatusSchema,
	galleryItemCreateSchema,
	galleryItemParamsSchema,
	galleryItemUpdateSchema,
	normalizeContentPayload,
	publicBlogListQuerySchema,
	publicBlogParamsSchema,
	publicListQuerySchema,
	publicReviewListQuerySchema,
	reviewCreateSchema,
	reviewModerationSchema,
	reviewParamsSchema,
	serviceCategoryCreateSchema,
	serviceCategoryUpdateSchema,
	serviceCreateSchema,
	serviceUpdateSchema,
	serviceVariantCreateSchema,
	serviceVariantUpdateSchema,
	siteSettingsPayloadSchema,
	stylistCreateSchema,
	stylistUpdateSchema,
	uuidParamsSchema,
} = require("./content.validators")

function ok(res, data, statusCode = 200) {
	res.status(statusCode).json({ ok: true, data })
}

function parseNormalizedBody(schema, body, message) {
	return parseRequest(schema, normalizeContentPayload(body), { message })
}

function createListController(schema, serviceMethodName, dataKey) {
	return asyncHandler(async (req, res) => {
		const filters = parseRequest(schema, normalizeContentPayload(req.query), {
			message: "Invalid content list filters.",
		})
		const rows = await createContentService()[serviceMethodName](filters)
		ok(res, { [dataKey]: rows })
	})
}

const getPublicSiteSettings = asyncHandler(async (req, res) => {
	const filters = parseRequest(publicListQuerySchema, normalizeContentPayload(req.query), {
		message: "Invalid site settings filters.",
	})
	const siteSettings = await createContentService().getPublicSiteSettings(filters)
	ok(res, { siteSettings })
})

const getPublicServices = asyncHandler(async (req, res) => {
	const filters = parseRequest(publicListQuerySchema, normalizeContentPayload(req.query), {
		message: "Invalid service filters.",
	})
	const catalog = await createContentService().listPublicServicesCatalog(filters)
	ok(res, catalog)
})

const listPublicGalleryItems = createListController(
	publicListQuerySchema,
	"listPublicGalleryItems",
	"galleryItems",
)

const listPublicBlogPosts = createListController(
	publicBlogListQuerySchema,
	"listPublicBlogPosts",
	"blogPosts",
)

const getPublicBlogPost = asyncHandler(async (req, res) => {
	const params = parseRequest(publicBlogParamsSchema, req.params, {
		message: "Invalid blog post slug.",
	})
	const filters = parseRequest(publicBlogListQuerySchema, normalizeContentPayload(req.query), {
		message: "Invalid blog post filters.",
	})
	const blogPost = await createContentService().findPublicBlogPostBySlug(
		params.slug,
		filters,
	)
	ok(res, { blogPost })
})

const listPublicReviews = createListController(
	publicReviewListQuerySchema,
	"listPublicReviews",
	"reviews",
)

const submitReview = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		reviewCreateSchema,
		req.body,
		"Invalid review payload.",
	)
	const review = await createContentService().submitReview(req.auth?.user, payload)
	ok(res, { review }, 201)
})

const submitContactMessage = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		contactMessageCreateSchema,
		req.body,
		"Invalid contact message payload.",
	)
	const result = await createContentService().submitContactMessage(
		req.auth?.user,
		payload,
	)
	ok(res, result, 201)
})

const getAdminSiteSettings = asyncHandler(async (req, res) => {
	const filters = parseRequest(publicListQuerySchema, normalizeContentPayload(req.query), {
		message: "Invalid site settings filters.",
	})
	const siteSettings = await createContentService().getAdminSiteSettings(filters)
	ok(res, { siteSettings })
})

const updateAdminSiteSettings = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		siteSettingsPayloadSchema,
		req.body,
		"Invalid site settings payload.",
	)
	const siteSettings = await createContentService().updateSiteSettings(
		req.admin,
		payload,
	)
	ok(res, { siteSettings })
})

const listAdminServiceCategories = createListController(
	adminContentListQuerySchema,
	"listAdminServiceCategories",
	"serviceCategories",
)

const createAdminServiceCategory = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		serviceCategoryCreateSchema,
		req.body,
		"Invalid service category payload.",
	)
	const serviceCategory = await createContentService().createServiceCategory(
		req.admin,
		payload,
	)
	ok(res, { serviceCategory }, 201)
})

const updateAdminServiceCategory = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid service category identifier.",
	})
	const payload = parseNormalizedBody(
		serviceCategoryUpdateSchema,
		req.body,
		"Invalid service category payload.",
	)
	const serviceCategory = await createContentService().updateServiceCategory(
		req.admin,
		params.id,
		payload,
	)
	ok(res, { serviceCategory })
})

const deleteAdminServiceCategory = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid service category identifier.",
	})
	const serviceCategory = await createContentService().deleteServiceCategory(
		req.admin,
		params.id,
	)
	ok(res, { serviceCategory })
})

const listAdminServices = createListController(
	adminContentListQuerySchema,
	"listAdminServices",
	"services",
)

const createAdminService = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		serviceCreateSchema,
		req.body,
		"Invalid service payload.",
	)
	const service = await createContentService().createService(req.admin, payload)
	ok(res, { service }, 201)
})

const updateAdminService = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid service identifier.",
	})
	const payload = parseNormalizedBody(
		serviceUpdateSchema,
		req.body,
		"Invalid service payload.",
	)
	const service = await createContentService().updateService(
		req.admin,
		params.id,
		payload,
	)
	ok(res, { service })
})

const deleteAdminService = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid service identifier.",
	})
	const service = await createContentService().deleteService(req.admin, params.id)
	ok(res, { service })
})

const listAdminServiceVariants = createListController(
	adminContentListQuerySchema,
	"listAdminServiceVariants",
	"serviceVariants",
)

const createAdminServiceVariant = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		serviceVariantCreateSchema,
		req.body,
		"Invalid service variant payload.",
	)
	const serviceVariant = await createContentService().createServiceVariant(
		req.admin,
		payload,
	)
	ok(res, { serviceVariant }, 201)
})

const updateAdminServiceVariant = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid service variant identifier.",
	})
	const payload = parseNormalizedBody(
		serviceVariantUpdateSchema,
		req.body,
		"Invalid service variant payload.",
	)
	const serviceVariant = await createContentService().updateServiceVariant(
		req.admin,
		params.id,
		payload,
	)
	ok(res, { serviceVariant })
})

const deleteAdminServiceVariant = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid service variant identifier.",
	})
	const serviceVariant = await createContentService().deleteServiceVariant(
		req.admin,
		params.id,
	)
	ok(res, { serviceVariant })
})

const listAdminStylists = createListController(
	adminContentListQuerySchema,
	"listAdminStylists",
	"stylists",
)

const createAdminStylist = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		stylistCreateSchema,
		req.body,
		"Invalid stylist payload.",
	)
	const stylist = await createContentService().createStylist(req.admin, payload)
	ok(res, { stylist }, 201)
})

const updateAdminStylist = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid stylist identifier.",
	})
	const payload = parseNormalizedBody(
		stylistUpdateSchema,
		req.body,
		"Invalid stylist payload.",
	)
	const stylist = await createContentService().updateStylist(
		req.admin,
		params.id,
		payload,
	)
	ok(res, { stylist })
})

const deleteAdminStylist = asyncHandler(async (req, res) => {
	const params = parseRequest(uuidParamsSchema, req.params, {
		message: "Invalid stylist identifier.",
	})
	const stylist = await createContentService().deleteStylist(req.admin, params.id)
	ok(res, { stylist })
})

const listAdminGalleryItems = createListController(
	adminContentListQuerySchema,
	"listAdminGalleryItems",
	"galleryItems",
)

const createAdminGalleryItem = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		galleryItemCreateSchema,
		req.body,
		"Invalid gallery item payload.",
	)
	const galleryItem = await createContentService().createGalleryItem(
		req.admin,
		payload,
	)
	ok(res, { galleryItem }, 201)
})

const updateAdminGalleryItem = asyncHandler(async (req, res) => {
	const params = parseRequest(galleryItemParamsSchema, req.params, {
		message: "Invalid gallery item identifier.",
	})
	const payload = parseNormalizedBody(
		galleryItemUpdateSchema,
		req.body,
		"Invalid gallery item payload.",
	)
	const galleryItem = await createContentService().updateGalleryItem(
		req.admin,
		params.itemId,
		payload,
	)
	ok(res, { galleryItem })
})

const deleteAdminGalleryItem = asyncHandler(async (req, res) => {
	const params = parseRequest(galleryItemParamsSchema, req.params, {
		message: "Invalid gallery item identifier.",
	})
	const galleryItem = await createContentService().deleteGalleryItem(
		req.admin,
		params.itemId,
	)
	ok(res, { galleryItem })
})

const listAdminBlogPosts = createListController(
	adminContentListQuerySchema,
	"listAdminBlogPosts",
	"blogPosts",
)

const createAdminBlogPost = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		blogPostCreateSchema,
		req.body,
		"Invalid blog post payload.",
	)
	const blogPost = await createContentService().createBlogPost(req.admin, payload)
	ok(res, { blogPost }, 201)
})

const updateAdminBlogPost = asyncHandler(async (req, res) => {
	const params = parseRequest(blogPostParamsSchema, req.params, {
		message: "Invalid blog post identifier.",
	})
	const payload = parseNormalizedBody(
		blogPostUpdateSchema,
		req.body,
		"Invalid blog post payload.",
	)
	const blogPost = await createContentService().updateBlogPost(
		req.admin,
		params.postId,
		payload,
	)
	ok(res, { blogPost })
})

const deleteAdminBlogPost = asyncHandler(async (req, res) => {
	const params = parseRequest(blogPostParamsSchema, req.params, {
		message: "Invalid blog post identifier.",
	})
	const blogPost = await createContentService().deleteBlogPost(
		req.admin,
		params.postId,
	)
	ok(res, { blogPost })
})

const listAdminReviews = createListController(
	adminReviewListQuerySchema,
	"listAdminReviews",
	"reviews",
)

const moderateAdminReview = asyncHandler(async (req, res) => {
	const params = parseRequest(reviewParamsSchema, req.params, {
		message: "Invalid review identifier.",
	})
	const payload = parseNormalizedBody(
		reviewModerationSchema,
		req.body,
		"Invalid review moderation payload.",
	)
	const review = await createContentService().moderateReview(
		req.admin,
		params.reviewId,
		payload,
	)
	ok(res, { review })
})

const listAdminContactMessages = createListController(
	adminContactMessageListQuerySchema,
	"listAdminContactMessages",
	"contactMessages",
)

const updateAdminContactMessageStatus = asyncHandler(async (req, res) => {
	const params = parseRequest(contactMessageParamsSchema, req.params, {
		message: "Invalid contact message identifier.",
	})
	const payload = parseNormalizedBody(
		contactMessageStatusSchema,
		req.body,
		"Invalid contact message status payload.",
	)
	const contactMessage = await createContentService().updateContactMessageStatus(
		req.admin,
		params.messageId,
		payload,
	)
	ok(res, { contactMessage })
})

const deleteAdminContactMessage = asyncHandler(async (req, res) => {
	const params = parseRequest(contactMessageParamsSchema, req.params, {
		message: "Invalid contact message identifier.",
	})
	const contactMessage = await createContentService().deleteContactMessage(
		req.admin,
		params.messageId,
	)
	ok(res, { contactMessage })
})

const signCloudinaryUpload = asyncHandler(async (req, res) => {
	const payload = parseNormalizedBody(
		cloudinarySignSchema,
		req.body,
		"Invalid Cloudinary signing payload.",
	)
	const result = await createContentService().signCloudinaryUpload(
		req.admin,
		payload,
	)
	ok(res, result, 201)
})

module.exports = {
	createAdminBlogPost,
	createAdminGalleryItem,
	createAdminService,
	createAdminServiceCategory,
	createAdminServiceVariant,
	createAdminStylist,
	deleteAdminBlogPost,
	deleteAdminContactMessage,
	deleteAdminGalleryItem,
	deleteAdminService,
	deleteAdminServiceCategory,
	deleteAdminServiceVariant,
	deleteAdminStylist,
	getAdminSiteSettings,
	getPublicBlogPost,
	getPublicServices,
	getPublicSiteSettings,
	listAdminBlogPosts,
	listAdminContactMessages,
	listAdminGalleryItems,
	listAdminReviews,
	listAdminServiceCategories,
	listAdminServiceVariants,
	listAdminServices,
	listAdminStylists,
	listPublicBlogPosts,
	listPublicGalleryItems,
	listPublicReviews,
	moderateAdminReview,
	signCloudinaryUpload,
	submitContactMessage,
	submitReview,
	updateAdminBlogPost,
	updateAdminContactMessageStatus,
	updateAdminGalleryItem,
	updateAdminService,
	updateAdminServiceCategory,
	updateAdminServiceVariant,
	updateAdminSiteSettings,
	updateAdminStylist,
}