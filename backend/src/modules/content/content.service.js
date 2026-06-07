const { env } = require("../../config/env")
const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const {
	createCloudinarySigner,
} = require("../../integrations/cloudinary/cloudinarySigner")
const { createNotificationService } = require("../notifications/notification.service")
const { ApiError } = require("../../utils/errors")
const { pickDefined } = require("../../utils/validation")
const { createContentRepository } = require("./content.repository")

function slugify(value, fallback = "item") {
	const slug = String(value || "")
		.trim()
		.toLowerCase()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")

	return slug || fallback
}

function requireExisting(row, code, message) {
	if (!row) {
		throw new ApiError(404, code, message)
	}

	return row
}

function isResolvedContactStatus(status) {
	return ["resolved", "archived", "spam"].includes(status)
}

function metadataWithSource(metadata = {}, source = "render_content_service") {
	return {
		source,
		...(metadata || {}),
	}
}

function buildAuditLog(actorAdmin, action, resourceType, resource, changes = {}) {
	return {
		tenant_id: resource?.tenant_id || actorAdmin?.tenant_id || null,
		actor_user_id: actorAdmin?.user_id || null,
		action,
		resource_type: resourceType,
		resource_id: resource?.id || null,
		resource_key: resource?.slug || resource?.stylist_key || null,
		changes,
		metadata: metadataWithSource(),
	}
}

async function safeInsertActivity(repository, values) {
	if (!repository.insertActivity) {
		return null
	}

	return repository.insertActivity(values)
}

async function safeInsertAuditLog(repository, values) {
	if (!repository.insertAuditLog) {
		return null
	}

	return repository.insertAuditLog(values)
}

function createContentService({
	contentRepository,
	notificationService,
	cloudinarySigner,
	now = () => new Date(),
} = {}) {
	const repository =
		contentRepository || createContentRepository(getSupabaseAdmin())
	const notifications = notificationService
	const signer = cloudinarySigner || createCloudinarySigner()

	async function audit(actorAdmin, action, resourceType, resource, changes = {}) {
		return safeInsertAuditLog(
			repository,
			buildAuditLog(actorAdmin, action, resourceType, resource, changes),
		)
	}

	async function upsertSiteSettings(actorAdmin, payload) {
		const existing = await repository.findSiteSettingsByTenant(payload.tenant_id)

		if (!existing && !payload.business_name) {
			throw new ApiError(
				400,
				"site_settings_business_name_required",
				"business_name is required when creating site settings.",
			)
		}

		const values = pickDefined({
			tenant_id: payload.tenant_id,
			business_name: payload.business_name,
			team_name: payload.team_name,
			contact_notification_email: payload.contact_notification_email,
			public_email: payload.public_email,
			public_phone: payload.public_phone,
			address: payload.address,
			timezone: payload.timezone,
			utc_offset_hours: payload.utc_offset_hours,
			cloudinary_folder: payload.cloudinary_folder,
			social_links: payload.social_links,
			theme: payload.theme,
			is_public: payload.is_public,
		})

		const saved = existing
			? await repository.updateSiteSettings(existing.id, values)
			: await repository.createSiteSettings({
					...values,
					business_name: payload.business_name,
				})

		await audit(
			actorAdmin,
			existing ? "site_settings.updated" : "site_settings.created",
			"site_settings",
			saved,
			{ before: existing || null, after: saved },
		)

		return saved
	}

	async function createServiceCategory(actorAdmin, payload) {
		const created = await repository.createServiceCategory({
			...payload,
			slug: payload.slug || slugify(payload.name, "category"),
		})
		await audit(actorAdmin, "service_category.created", "service_category", created, {
			before: null,
			after: created,
		})
		return created
	}

	async function updateServiceCategory(actorAdmin, id, payload) {
		const updated = requireExisting(
			await repository.updateServiceCategory(id, {
				...payload,
				slug: payload.slug || (payload.name ? slugify(payload.name, "category") : undefined),
			}),
			"service_category_not_found",
			"Service category was not found.",
		)
		await audit(actorAdmin, "service_category.updated", "service_category", updated, {
			after: updated,
		})
		return updated
	}

	async function deleteServiceCategory(actorAdmin, id) {
		const deleted = requireExisting(
			await repository.deleteServiceCategory(id),
			"service_category_not_found",
			"Service category was not found.",
		)
		await audit(actorAdmin, "service_category.deleted", "service_category", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function createService(actorAdmin, payload) {
		const created = await repository.createService({
			...payload,
			slug: payload.slug || slugify(payload.name, "service"),
		})
		await audit(actorAdmin, "service.created", "service", created, {
			before: null,
			after: created,
		})
		return created
	}

	async function updateService(actorAdmin, id, payload) {
		const updated = requireExisting(
			await repository.updateService(id, {
				...payload,
				slug: payload.slug || (payload.name ? slugify(payload.name, "service") : undefined),
			}),
			"service_not_found",
			"Service was not found.",
		)
		await audit(actorAdmin, "service.updated", "service", updated, { after: updated })
		return updated
	}

	async function deleteService(actorAdmin, id) {
		const deleted = requireExisting(
			await repository.deleteService(id),
			"service_not_found",
			"Service was not found.",
		)
		await audit(actorAdmin, "service.deleted", "service", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function createServiceVariant(actorAdmin, payload) {
		const created = await repository.createServiceVariant(payload)
		await audit(actorAdmin, "service_variant.created", "service_variant", created, {
			before: null,
			after: created,
		})
		return created
	}

	async function updateServiceVariant(actorAdmin, id, payload) {
		const updated = requireExisting(
			await repository.updateServiceVariant(id, payload),
			"service_variant_not_found",
			"Service variant was not found.",
		)
		await audit(actorAdmin, "service_variant.updated", "service_variant", updated, {
			after: updated,
		})
		return updated
	}

	async function deleteServiceVariant(actorAdmin, id) {
		const deleted = requireExisting(
			await repository.deleteServiceVariant(id),
			"service_variant_not_found",
			"Service variant was not found.",
		)
		await audit(actorAdmin, "service_variant.deleted", "service_variant", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function createStylist(actorAdmin, payload) {
		const created = await repository.createStylist({
			...payload,
			stylist_key:
				payload.stylist_key || slugify(payload.display_name, "stylist"),
		})
		await audit(actorAdmin, "stylist.created", "stylist", created, {
			before: null,
			after: created,
		})
		return created
	}

	async function updateStylist(actorAdmin, id, payload) {
		const updated = requireExisting(
			await repository.updateStylist(id, {
				...payload,
				stylist_key:
					payload.stylist_key ||
					(payload.display_name ? slugify(payload.display_name, "stylist") : undefined),
			}),
			"stylist_not_found",
			"Stylist was not found.",
		)
		await audit(actorAdmin, "stylist.updated", "stylist", updated, {
			after: updated,
		})
		return updated
	}

	async function deleteStylist(actorAdmin, id) {
		const deleted = requireExisting(
			await repository.deleteStylist(id),
			"stylist_not_found",
			"Stylist was not found.",
		)
		await audit(actorAdmin, "stylist.deleted", "stylist", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function createGalleryItem(actorAdmin, payload) {
		const created = await repository.createGalleryItem(payload)
		await audit(actorAdmin, "gallery_item.created", "gallery_item", created, {
			before: null,
			after: created,
		})
		return created
	}

	async function updateGalleryItem(actorAdmin, id, payload) {
		const updated = requireExisting(
			await repository.updateGalleryItem(id, payload),
			"gallery_item_not_found",
			"Gallery item was not found.",
		)
		await audit(actorAdmin, "gallery_item.updated", "gallery_item", updated, {
			after: updated,
		})
		return updated
	}

	async function deleteGalleryItem(actorAdmin, id) {
		const deleted = requireExisting(
			await repository.deleteGalleryItem(id),
			"gallery_item_not_found",
			"Gallery item was not found.",
		)
		await audit(actorAdmin, "gallery_item.deleted", "gallery_item", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function createBlogPost(actorAdmin, payload) {
		const created = await repository.createBlogPost({
			...payload,
			slug: payload.slug || slugify(payload.title, "post"),
			author_user_id: actorAdmin.user_id,
			published_at:
				payload.status === "published" && !payload.published_at
					? now().toISOString()
					: payload.published_at,
		})
		await audit(actorAdmin, "blog_post.created", "blog_post", created, {
			before: null,
			after: created,
		})
		return created
	}

	async function updateBlogPost(actorAdmin, id, payload) {
		const updated = requireExisting(
			await repository.updateBlogPost(id, {
				...payload,
				slug: payload.slug || (payload.title ? slugify(payload.title, "post") : undefined),
				published_at:
					payload.status === "published" && !payload.published_at
						? now().toISOString()
						: payload.published_at,
			}),
			"blog_post_not_found",
			"Blog post was not found.",
		)
		await audit(actorAdmin, "blog_post.updated", "blog_post", updated, {
			after: updated,
		})
		return updated
	}

	async function deleteBlogPost(actorAdmin, id) {
		const deleted = requireExisting(
			await repository.deleteBlogPost(id),
			"blog_post_not_found",
			"Blog post was not found.",
		)
		await audit(actorAdmin, "blog_post.deleted", "blog_post", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function submitReview(user, payload) {
		const created = await repository.createReview({
			...payload,
			user_id: user?.id || null,
			status: "pending",
		})

		await safeInsertActivity(repository, {
			tenant_id: created.tenant_id,
			user_id: created.user_id,
			activity_type: "review_posted",
			title: "Review submitted",
			description: `${created.customer_name} submitted a ${created.rating}-star review.`,
			entity_type: "review",
			entity_id: created.id,
			metadata: metadataWithSource(),
		})

		return created
	}

	async function moderateReview(actorAdmin, reviewId, payload) {
		const updated = requireExisting(
			await repository.updateReview(
				reviewId,
				pickDefined({
					status: payload.status,
					moderation_notes: payload.moderation_notes,
					moderated_by: actorAdmin.user_id,
					moderated_at: now().toISOString(),
					metadata: payload.metadata,
				}),
			),
			"review_not_found",
			"Review was not found.",
		)

		await audit(actorAdmin, "review.moderated", "review", updated, {
			after: updated,
		})

		return updated
	}

	async function submitContactMessage(user, payload) {
		const created = await repository.createContactMessage({
			...payload,
			user_id: user?.id || null,
			status: "new",
		})

		const siteSettings = await repository.findSiteSettingsByTenant(created.tenant_id)
		const notificationClient = notifications || createNotificationService()
		const notificationResult = await notificationClient.queueContactMessageNotification(
			created,
			{
				recipientEmail:
					siteSettings?.contact_notification_email ||
					siteSettings?.public_email ||
					env.RESEND_FROM_EMAIL,
				site: siteSettings || {},
				source: "render_contact_message_api",
			},
		)

		await safeInsertActivity(repository, {
			tenant_id: created.tenant_id,
			user_id: created.user_id,
			activity_type: "contact_submitted",
			title: "Contact message submitted",
			description: `${created.first_name} submitted a contact message.`,
			entity_type: "contact_message",
			entity_id: created.id,
			metadata: metadataWithSource({ notificationResult }),
		})

		return {
			message: created,
			notification: notificationResult,
		}
	}

	async function updateContactMessageStatus(actorAdmin, messageId, payload) {
		const updated = requireExisting(
			await repository.updateContactMessage(
				messageId,
				pickDefined({
					status: payload.status,
					assigned_to: payload.assigned_to,
					resolved_at: isResolvedContactStatus(payload.status)
						? now().toISOString()
						: null,
					metadata: payload.metadata,
				}),
			),
			"contact_message_not_found",
			"Contact message was not found.",
		)

		await audit(actorAdmin, "contact_message.status_updated", "contact_message", updated, {
			after: updated,
		})

		return updated
	}

	async function deleteContactMessage(actorAdmin, messageId) {
		const deleted = requireExisting(
			await repository.deleteContactMessage(messageId),
			"contact_message_not_found",
			"Contact message was not found.",
		)
		await audit(actorAdmin, "contact_message.deleted", "contact_message", deleted, {
			before: deleted,
			after: null,
		})
		return deleted
	}

	async function signCloudinaryUpload(actorAdmin, payload) {
		const siteSettings = await repository.findSiteSettingsByTenant(payload.tenant_id)
		const folder =
			payload.folder || siteSettings?.cloudinary_folder || env.CLOUDINARY_UPLOAD_FOLDER

		const signature = signer.signUpload({
			...payload,
			folder,
			context: {
				...(payload.context || {}),
				tenant_id: payload.tenant_id || "global",
				user_id: actorAdmin.user_id,
			},
		})

		const uploadRecord = await repository.createFileUpload({
			tenant_id: payload.tenant_id || null,
			user_id: actorAdmin.user_id,
			provider: "cloudinary",
			bucket: signature.cloudName,
			object_path: signature.publicId,
			status: "signed",
			metadata: {
				...metadataWithSource(payload.metadata),
				folder: signature.folder,
				resource_type: signature.resourceType,
				tags: payload.tags || [],
			},
		})

		await audit(actorAdmin, "upload.cloudinary_signed", "file_upload", uploadRecord, {
			before: null,
			after: uploadRecord,
		})

		return {
			signature,
			upload: uploadRecord,
		}
	}

	return {
		createBlogPost,
		createGalleryItem,
		createService,
		createServiceCategory,
		createServiceVariant,
		createStylist,
		deleteBlogPost,
		deleteContactMessage,
		deleteGalleryItem,
		deleteService,
		deleteServiceCategory,
		deleteServiceVariant,
		deleteStylist,
		getPublicSiteSettings: (filters = {}) =>
			repository.getPublicSiteSettings(filters.tenant_id),
		listAdminBlogPosts: (filters) => repository.listAdminBlogPosts(filters),
		listAdminContactMessages: (filters) =>
			repository.listContactMessages(filters),
		listAdminGalleryItems: (filters) =>
			repository.listAdminGalleryItems(filters),
		listAdminReviews: (filters) => repository.listAdminReviews(filters),
		listAdminServiceCategories: (filters) =>
			repository.listAdminServiceCategories(filters),
		listAdminServiceVariants: (filters) =>
			repository.listAdminServiceVariants(filters),
		listAdminServices: (filters) => repository.listAdminServices(filters),
		listAdminStylists: (filters) => repository.listAdminStylists(filters),
		listPublicBlogPosts: (filters) => repository.listPublicBlogPosts(filters),
		listPublicGalleryItems: (filters) =>
			repository.listPublicGalleryItems(filters),
		listPublicReviews: (filters) => repository.listPublicReviews(filters),
		listPublicServicesCatalog: async (filters = {}) => {
			const [categories, services, serviceVariants, stylists] =
				await Promise.all([
					repository.listPublicServiceCategories(filters),
					repository.listPublicServices(filters),
					repository.listPublicServiceVariants(filters),
					repository.listPublicStylists(filters),
				])

			return {
				categories,
				services,
				serviceVariants,
				stylists,
			}
		},
		moderateReview,
		signCloudinaryUpload,
		submitContactMessage,
		submitReview,
		updateBlogPost,
		updateContactMessageStatus,
		updateGalleryItem,
		updateService,
		updateServiceCategory,
		updateServiceVariant,
		updateSiteSettings: upsertSiteSettings,
		updateStylist,
		findPublicBlogPostBySlug: (slug, filters = {}) =>
			repository.findPublicBlogPostBySlug(slug, filters.tenant_id),
		getAdminSiteSettings: (filters = {}) =>
			repository.findSiteSettingsByTenant(filters.tenant_id),
	}
}

module.exports = {
	createContentService,
	metadataWithSource,
	slugify,
}