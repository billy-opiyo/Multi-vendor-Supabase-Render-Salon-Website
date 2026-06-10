const { z } = require("zod")

const {
	BLOG_STATUS_VALUES,
	CLOUDINARY_RESOURCE_TYPES,
	CLOUDINARY_UPLOAD_PURPOSES,
	CONTACT_MESSAGE_STATUS_VALUES,
	DEFAULT_CONTENT_LIMIT,
	GALLERY_STATUS_VALUES,
	GALLERY_VISIBILITY_VALUES,
	MAX_CONTENT_LIMIT,
	REVIEW_STATUS_VALUES,
} = require("./content.constants")

const slugSchema = z
	.string()
	.trim()
	.toLowerCase()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
		message: "Slug must use lowercase letters, numbers, and hyphens.",
	})
	.max(160)

const nullableUuid = z.preprocess((value) => {
	if (typeof value === "string") {
		const trimmed = value.trim()
		return trimmed === "" || trimmed === "null" ? null : trimmed
	}

	return value
}, z.string().uuid().nullable().optional())

const optionalUuid = z.string().uuid().optional()

const nullableTrimmedString = (maxLength) =>
	z.preprocess((value) => {
		if (typeof value !== "string") {
			return value
		}

		const trimmed = value.trim()
		return trimmed.length === 0 ? null : trimmed
	}, z.string().min(1).max(maxLength).nullable().optional())

const optionalTrimmedString = (maxLength) =>
	z.preprocess((value) => {
		if (typeof value !== "string") {
			return value
		}

		const trimmed = value.trim()
		return trimmed.length === 0 ? undefined : trimmed
	}, z.string().min(1).max(maxLength).optional())

const trimmedString = (maxLength) => z.string().trim().min(1).max(maxLength)

const metadataSchema = z.record(z.string(), z.unknown()).default({})
const optionalMetadataSchema = z.record(z.string(), z.unknown()).optional()

const paginationSchema = {
	tenant_id: nullableUuid,
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_CONTENT_LIMIT)
		.default(DEFAULT_CONTENT_LIMIT),
	offset: z.coerce.number().int().min(0).default(0),
}

const publicListQuerySchema = z.object(paginationSchema).strict()

const publicBlogListQuerySchema = z
	.object({
		...paginationSchema,
	})
	.strict()

const publicBlogParamsSchema = z.object({
	slug: slugSchema,
})

const publicReviewListQuerySchema = z
	.object({
		...paginationSchema,
		rating: z.coerce.number().int().min(1).max(5).optional(),
	})
	.strict()

const adminReviewListQuerySchema = z
	.object({
		...paginationSchema,
		status: z.enum(REVIEW_STATUS_VALUES).optional(),
		rating: z.coerce.number().int().min(1).max(5).optional(),
	})
	.strict()

const adminContactMessageListQuerySchema = z
	.object({
		...paginationSchema,
		status: z.enum(CONTACT_MESSAGE_STATUS_VALUES).optional(),
	})
	.strict()

const adminContentListQuerySchema = z
	.object({
		...paginationSchema,
		status: z.string().trim().min(1).max(80).optional(),
		is_active: z
			.enum(["true", "false"])
			.optional()
			.transform((value) =>
				value === undefined ? undefined : value === "true",
			),
	})
	.strict()

const siteSettingsPayloadSchema = z
	.object({
		tenant_id: nullableUuid,
		business_name: optionalTrimmedString(180),
		team_name: nullableTrimmedString(180),
		contact_notification_email: z.string().trim().email().nullable().optional(),
		public_email: z.string().trim().email().nullable().optional(),
		public_phone: nullableTrimmedString(60),
		address: nullableTrimmedString(500),
		timezone: optionalTrimmedString(80),
		utc_offset_hours: z.coerce
			.number()
			.int()
			.min(-12)
			.max(14)
			.nullable()
			.optional(),
		cloudinary_folder: nullableTrimmedString(200),
		social_links: optionalMetadataSchema,
		theme: optionalMetadataSchema,
		is_public: z.boolean().optional(),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one site settings field must be provided.",
	})

const serviceCategoryCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		name: trimmedString(160),
		slug: slugSchema.optional(),
		description: nullableTrimmedString(1000),
		sort_order: z.coerce.number().int().default(0),
		is_active: z.boolean().default(true),
		metadata: metadataSchema,
	})
	.strict()

const serviceCategoryUpdateSchema = serviceCategoryCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one service category field must be provided.",
	})

const serviceCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		category_id: nullableUuid,
		name: trimmedString(180),
		slug: slugSchema.optional(),
		description: nullableTrimmedString(2000),
		base_price: z.coerce.number().min(0).nullable().optional(),
		duration_minutes: z.coerce.number().int().positive().nullable().optional(),
		is_active: z.boolean().default(true),
		sort_order: z.coerce.number().int().default(0),
		metadata: metadataSchema,
	})
	.strict()

const serviceUpdateSchema = serviceCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one service field must be provided.",
	})

const serviceVariantCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		service_id: z.string().uuid(),
		name: trimmedString(180),
		description: nullableTrimmedString(1000),
		price_delta: z.coerce.number().default(0),
		duration_delta_minutes: z.coerce.number().int().default(0),
		is_active: z.boolean().default(true),
		sort_order: z.coerce.number().int().default(0),
		metadata: metadataSchema,
	})
	.strict()

const serviceVariantUpdateSchema = serviceVariantCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one service variant field must be provided.",
	})

const stylistCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		display_name: trimmedString(180),
		stylist_key: slugSchema.optional(),
		bio: nullableTrimmedString(2000),
		specialties: z.array(trimmedString(120)).default([]),
		avatar_url: nullableTrimmedString(2048),
		is_active: z.boolean().default(true),
		sort_order: z.coerce.number().int().default(0),
		metadata: metadataSchema,
	})
	.strict()

const stylistUpdateSchema = stylistCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one stylist field must be provided.",
	})

const galleryItemCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		title: trimmedString(180),
		description: nullableTrimmedString(1000),
		image_url: trimmedString(2048),
		thumbnail_url: nullableTrimmedString(2048),
		cloudinary_public_id: nullableTrimmedString(500),
		status: z.enum(GALLERY_STATUS_VALUES).default("draft"),
		visibility: z.enum(GALLERY_VISIBILITY_VALUES).default("public"),
		sort_order: z.coerce.number().int().default(0),
		metadata: metadataSchema,
	})
	.strict()

const galleryItemUpdateSchema = galleryItemCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one gallery item field must be provided.",
	})

const blogPostCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		slug: slugSchema.optional(),
		title: trimmedString(220),
		excerpt: nullableTrimmedString(1000),
		body: nullableTrimmedString(50000),
		cover_image_url: nullableTrimmedString(2048),
		status: z.enum(BLOG_STATUS_VALUES).default("draft"),
		published_at: nullableTrimmedString(80),
		metadata: metadataSchema,
	})
	.strict()

const blogPostUpdateSchema = blogPostCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one blog post field must be provided.",
	})

const reviewCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		booking_id: nullableUuid,
		customer_name: trimmedString(180),
		rating: z.coerce.number().int().min(1).max(5),
		service: nullableTrimmedString(180),
		service_id: nullableUuid,
		review_text: trimmedString(4000),
		metadata: metadataSchema,
	})
	.strict()

const reviewModerationSchema = z
	.object({
		status: z.enum(REVIEW_STATUS_VALUES),
		moderation_notes: nullableTrimmedString(1000),
		metadata: optionalMetadataSchema,
	})
	.strict()

const reviewAdminUpdateSchema = z
	.object({
		status: z.enum(REVIEW_STATUS_VALUES).optional(),
		moderation_notes: nullableTrimmedString(1000),
		review_text: optionalTrimmedString(4000),
		rating: z.coerce.number().int().min(1).max(5).optional(),
		service: nullableTrimmedString(180),
		service_id: nullableUuid,
		metadata: optionalMetadataSchema,
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one review field must be provided.",
	})

const contactMessageCreateSchema = z
	.object({
		tenant_id: nullableUuid,
		first_name: trimmedString(120),
		last_name: nullableTrimmedString(120),
		email: z.string().trim().email(),
		phone: nullableTrimmedString(60),
		subject: nullableTrimmedString(180),
		message: trimmedString(5000),
		metadata: metadataSchema,
	})
	.strict()

const contactMessageStatusSchema = z
	.object({
		status: z.enum(CONTACT_MESSAGE_STATUS_VALUES),
		assigned_to: nullableUuid,
		metadata: optionalMetadataSchema,
	})
	.strict()

const cloudinarySignSchema = z
	.object({
		tenant_id: nullableUuid,
		purpose: z.enum(CLOUDINARY_UPLOAD_PURPOSES).default("admin-gallery"),
		folder: optionalTrimmedString(200).refine(
			(value) => !value || /^[A-Za-z0-9_.\/-]+$/.test(value),
			{
				message:
					"Folder may only contain letters, numbers, underscores, dots, hyphens, and slashes.",
			},
		),
		public_id: optionalTrimmedString(200).refine(
			(value) => !value || /^[A-Za-z0-9_.\/-]+$/.test(value),
			{
				message:
					"Public id may only contain letters, numbers, underscores, dots, hyphens, and slashes.",
			},
		),
		resource_type: z.enum(CLOUDINARY_RESOURCE_TYPES).default("image"),
		upload_preset: optionalTrimmedString(120),
		eager: optionalTrimmedString(1000),
		tags: z.array(trimmedString(80)).default([]),
		file_name: optionalTrimmedString(240),
		content_type: optionalTrimmedString(120),
		size_bytes: z.coerce.number().int().nonnegative().optional(),
		context: z
			.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
			.default({}),
		metadata: metadataSchema,
	})
	.strict()

const uuidParamsSchema = z.object({
	id: z.string().uuid(),
})

const reviewParamsSchema = z.object({
	reviewId: z.string().uuid(),
})

const contactMessageParamsSchema = z.object({
	messageId: z.string().uuid(),
})

const galleryItemParamsSchema = z.object({
	itemId: z.string().uuid(),
})

const blogPostParamsSchema = z.object({
	postId: z.string().uuid(),
})

const FIELD_ALIASES = Object.freeze({
	tenantId: "tenant_id",
	teamName: "team_name",
	contactNotificationEmail: "contact_notification_email",
	publicEmail: "public_email",
	publicPhone: "public_phone",
	utcOffsetHours: "utc_offset_hours",
	cloudinaryFolder: "cloudinary_folder",
	socialLinks: "social_links",
	isPublic: "is_public",
	categoryId: "category_id",
	basePrice: "base_price",
	durationMinutes: "duration_minutes",
	isActive: "is_active",
	sortOrder: "sort_order",
	serviceId: "service_id",
	priceDelta: "price_delta",
	durationDeltaMinutes: "duration_delta_minutes",
	displayName: "display_name",
	stylistKey: "stylist_key",
	avatarUrl: "avatar_url",
	imageUrl: "image_url",
	thumbnailUrl: "thumbnail_url",
	cloudinaryPublicId: "cloudinary_public_id",
	coverImageUrl: "cover_image_url",
	publishedAt: "published_at",
	bookingId: "booking_id",
	customerName: "customer_name",
	reviewText: "review_text",
	moderationNotes: "moderation_notes",
	firstName: "first_name",
	lastName: "last_name",
	assignedTo: "assigned_to",
	publicId: "public_id",
	resourceType: "resource_type",
	uploadPreset: "upload_preset",
	fileName: "file_name",
	contentType: "content_type",
	sizeBytes: "size_bytes",
})

function normalizeContentPayload(payload = {}) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return payload
	}

	const normalized = { ...payload }

	for (const [camelKey, snakeKey] of Object.entries(FIELD_ALIASES)) {
		if (
			normalized[camelKey] !== undefined &&
			normalized[snakeKey] === undefined
		) {
			normalized[snakeKey] = normalized[camelKey]
		}

		delete normalized[camelKey]
	}

	return normalized
}

module.exports = {
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
	reviewAdminUpdateSchema,
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
}
