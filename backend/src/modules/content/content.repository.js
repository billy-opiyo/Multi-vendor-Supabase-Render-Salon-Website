const { ApiError } = require("../../utils/errors")
const { getSupabaseErrorDetails } = require("../../utils/supabaseErrors")

const SITE_SETTINGS_SELECT =
	"id, tenant_id, business_name, team_name, contact_notification_email, public_email, public_phone, address, timezone, utc_offset_hours, cloudinary_folder, social_links, theme, is_public, created_at, updated_at"

const SERVICE_CATEGORY_SELECT =
	"id, tenant_id, name, slug, description, sort_order, is_active, metadata, created_at, updated_at"

const SERVICE_SELECT =
	"id, tenant_id, category_id, name, slug, description, base_price, duration_minutes, is_active, sort_order, metadata, created_at, updated_at"

const SERVICE_VARIANT_SELECT =
	"id, tenant_id, service_id, name, description, price_delta, duration_delta_minutes, is_active, sort_order, metadata, created_at, updated_at"

const STYLIST_SELECT =
	"id, tenant_id, display_name, stylist_key, bio, specialties, avatar_url, is_active, sort_order, metadata, created_at, updated_at"

const GALLERY_ITEM_SELECT =
	"id, tenant_id, title, description, image_url, thumbnail_url, cloudinary_public_id, status, visibility, sort_order, metadata, created_at, updated_at"

const BLOG_POST_SELECT =
	"id, tenant_id, author_user_id, slug, title, excerpt, body, cover_image_url, status, published_at, metadata, created_at, updated_at"

const REVIEW_SELECT =
	"id, tenant_id, user_id, booking_id, customer_name, rating, service, service_id, review_text, status, moderation_notes, moderated_by, moderated_at, metadata, created_at, updated_at"

const CONTACT_MESSAGE_SELECT =
	"id, tenant_id, user_id, first_name, last_name, email, phone, subject, message, status, assigned_to, resolved_at, metadata, created_at, updated_at"

const FILE_UPLOAD_SELECT =
	"id, tenant_id, user_id, provider, bucket, object_path, public_url, content_type, size_bytes, status, metadata, created_at, updated_at"

function throwRepositoryError(error, statusCode, code, message) {
	if (!error) {
		return
	}

	throw new ApiError(statusCode, code, message, getSupabaseErrorDetails(error))
}

function applyTenantFilter(query, tenantId) {
	return tenantId
		? query.eq("tenant_id", tenantId)
		: query.is("tenant_id", null)
}

function applyRange(query, filters = {}) {
	const offset = filters.offset || 0
	const limit = filters.limit || 50
	return query.range(offset, offset + limit - 1)
}

function isUniqueViolation(error) {
	return (
		error?.code === "23505" ||
		/duplicate key/i.test(error?.message || "") ||
		/unique constraint/i.test(error?.message || "")
	)
}

function createContentRepository(supabase) {
	async function insertRow(table, select, values, errorCode, errorMessage) {
		const { data, error } = await supabase
			.from(table)
			.insert(values)
			.select(select)
			.single()

		const statusCode = isUniqueViolation(error) ? 409 : 500
		throwRepositoryError(error, statusCode, errorCode, errorMessage)

		return data
	}

	async function updateRow(table, select, id, values, errorCode, errorMessage) {
		const { data, error } = await supabase
			.from(table)
			.update(values)
			.eq("id", id)
			.select(select)
			.maybeSingle()

		throwRepositoryError(error, 500, errorCode, errorMessage)

		return data
	}

	async function deleteRow(table, select, id, errorCode, errorMessage) {
		const { data, error } = await supabase
			.from(table)
			.delete()
			.eq("id", id)
			.select(select)
			.maybeSingle()

		throwRepositoryError(error, 500, errorCode, errorMessage)

		return data
	}

	return {
		async findSiteSettingsByTenant(tenantId) {
			let query = supabase.from("site_settings").select(SITE_SETTINGS_SELECT)
			query = applyTenantFilter(query, tenantId)

			const { data, error } = await query.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"site_settings_lookup_failed",
				"Unable to load site settings.",
			)

			return data
		},

		async getPublicSiteSettings(tenantId) {
			let query = supabase
				.from("site_settings")
				.select(SITE_SETTINGS_SELECT)
				.eq("is_public", true)
			query = applyTenantFilter(query, tenantId)

			const { data, error } = await query.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"public_site_settings_lookup_failed",
				"Unable to load public site settings.",
			)

			return data
		},

		async createSiteSettings(values) {
			return insertRow(
				"site_settings",
				SITE_SETTINGS_SELECT,
				values,
				"site_settings_create_failed",
				"Unable to create site settings.",
			)
		},

		async updateSiteSettings(id, values) {
			return updateRow(
				"site_settings",
				SITE_SETTINGS_SELECT,
				id,
				values,
				"site_settings_update_failed",
				"Unable to update site settings.",
			)
		},

		async listPublicServiceCategories(filters = {}) {
			let query = supabase
				.from("service_categories")
				.select(SERVICE_CATEGORY_SELECT)
				.eq("is_active", true)
				.order("sort_order", { ascending: true })
				.order("name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"service_categories_list_failed",
				"Unable to list service categories.",
			)
			return data || []
		},

		async listAdminServiceCategories(filters = {}) {
			let query = supabase
				.from("service_categories")
				.select(SERVICE_CATEGORY_SELECT)
				.order("sort_order", { ascending: true })
				.order("name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.is_active !== undefined)
				query = query.eq("is_active", filters.is_active)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_service_categories_list_failed",
				"Unable to list admin service categories.",
			)
			return data || []
		},

		async createServiceCategory(values) {
			return insertRow(
				"service_categories",
				SERVICE_CATEGORY_SELECT,
				values,
				"service_category_create_failed",
				"Unable to create service category.",
			)
		},

		async updateServiceCategory(id, values) {
			return updateRow(
				"service_categories",
				SERVICE_CATEGORY_SELECT,
				id,
				values,
				"service_category_update_failed",
				"Unable to update service category.",
			)
		},

		async deleteServiceCategory(id) {
			return deleteRow(
				"service_categories",
				SERVICE_CATEGORY_SELECT,
				id,
				"service_category_delete_failed",
				"Unable to delete service category.",
			)
		},

		async listPublicServices(filters = {}) {
			let query = supabase
				.from("services")
				.select(SERVICE_SELECT)
				.eq("is_active", true)
				.order("sort_order", { ascending: true })
				.order("name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"services_list_failed",
				"Unable to list services.",
			)
			return data || []
		},

		async listAdminServices(filters = {}) {
			let query = supabase
				.from("services")
				.select(SERVICE_SELECT)
				.order("sort_order", { ascending: true })
				.order("name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.is_active !== undefined)
				query = query.eq("is_active", filters.is_active)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_services_list_failed",
				"Unable to list admin services.",
			)
			return data || []
		},

		async createService(values) {
			return insertRow(
				"services",
				SERVICE_SELECT,
				values,
				"service_create_failed",
				"Unable to create service.",
			)
		},

		async updateService(id, values) {
			return updateRow(
				"services",
				SERVICE_SELECT,
				id,
				values,
				"service_update_failed",
				"Unable to update service.",
			)
		},

		async deleteService(id) {
			return deleteRow(
				"services",
				SERVICE_SELECT,
				id,
				"service_delete_failed",
				"Unable to delete service.",
			)
		},

		async listPublicServiceVariants(filters = {}) {
			let query = supabase
				.from("service_variants")
				.select(SERVICE_VARIANT_SELECT)
				.eq("is_active", true)
				.order("sort_order", { ascending: true })
				.order("name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"service_variants_list_failed",
				"Unable to list service variants.",
			)
			return data || []
		},

		async listAdminServiceVariants(filters = {}) {
			let query = supabase
				.from("service_variants")
				.select(SERVICE_VARIANT_SELECT)
				.order("sort_order", { ascending: true })
				.order("name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.is_active !== undefined)
				query = query.eq("is_active", filters.is_active)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_service_variants_list_failed",
				"Unable to list admin service variants.",
			)
			return data || []
		},

		async createServiceVariant(values) {
			return insertRow(
				"service_variants",
				SERVICE_VARIANT_SELECT,
				values,
				"service_variant_create_failed",
				"Unable to create service variant.",
			)
		},

		async updateServiceVariant(id, values) {
			return updateRow(
				"service_variants",
				SERVICE_VARIANT_SELECT,
				id,
				values,
				"service_variant_update_failed",
				"Unable to update service variant.",
			)
		},

		async deleteServiceVariant(id) {
			return deleteRow(
				"service_variants",
				SERVICE_VARIANT_SELECT,
				id,
				"service_variant_delete_failed",
				"Unable to delete service variant.",
			)
		},

		async listPublicStylists(filters = {}) {
			let query = supabase
				.from("stylists")
				.select(STYLIST_SELECT)
				.eq("is_active", true)
				.order("sort_order", { ascending: true })
				.order("display_name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"stylists_list_failed",
				"Unable to list stylists.",
			)
			return data || []
		},

		async listAdminStylists(filters = {}) {
			let query = supabase
				.from("stylists")
				.select(STYLIST_SELECT)
				.order("sort_order", { ascending: true })
				.order("display_name", { ascending: true })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.is_active !== undefined)
				query = query.eq("is_active", filters.is_active)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_stylists_list_failed",
				"Unable to list admin stylists.",
			)
			return data || []
		},

		async createStylist(values) {
			return insertRow(
				"stylists",
				STYLIST_SELECT,
				values,
				"stylist_create_failed",
				"Unable to create stylist.",
			)
		},

		async updateStylist(id, values) {
			return updateRow(
				"stylists",
				STYLIST_SELECT,
				id,
				values,
				"stylist_update_failed",
				"Unable to update stylist.",
			)
		},

		async deleteStylist(id) {
			return deleteRow(
				"stylists",
				STYLIST_SELECT,
				id,
				"stylist_delete_failed",
				"Unable to delete stylist.",
			)
		},

		async listPublicGalleryItems(filters = {}) {
			let query = supabase
				.from("gallery_items")
				.select(GALLERY_ITEM_SELECT)
				.eq("status", "published")
				.eq("visibility", "public")
				.order("sort_order", { ascending: true })
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"gallery_list_failed",
				"Unable to list gallery items.",
			)
			return data || []
		},

		async listAdminGalleryItems(filters = {}) {
			let query = supabase
				.from("gallery_items")
				.select(GALLERY_ITEM_SELECT)
				.order("sort_order", { ascending: true })
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.status) query = query.eq("status", filters.status)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_gallery_list_failed",
				"Unable to list admin gallery items.",
			)
			return data || []
		},

		async createGalleryItem(values) {
			return insertRow(
				"gallery_items",
				GALLERY_ITEM_SELECT,
				values,
				"gallery_item_create_failed",
				"Unable to create gallery item.",
			)
		},

		async updateGalleryItem(id, values) {
			return updateRow(
				"gallery_items",
				GALLERY_ITEM_SELECT,
				id,
				values,
				"gallery_item_update_failed",
				"Unable to update gallery item.",
			)
		},

		async deleteGalleryItem(id) {
			return deleteRow(
				"gallery_items",
				GALLERY_ITEM_SELECT,
				id,
				"gallery_item_delete_failed",
				"Unable to delete gallery item.",
			)
		},

		async listPublicBlogPosts(filters = {}) {
			let query = supabase
				.from("blog_posts")
				.select(BLOG_POST_SELECT)
				.eq("status", "published")
				.order("published_at", { ascending: false })
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"blog_posts_list_failed",
				"Unable to list blog posts.",
			)
			return data || []
		},

		async findPublicBlogPostBySlug(slug, tenantId) {
			let query = supabase
				.from("blog_posts")
				.select(BLOG_POST_SELECT)
				.eq("status", "published")
				.ilike("slug", slug)
			query = applyTenantFilter(query, tenantId)

			const { data, error } = await query.maybeSingle()
			throwRepositoryError(
				error,
				500,
				"blog_post_lookup_failed",
				"Unable to load blog post.",
			)
			return data
		},

		async listAdminBlogPosts(filters = {}) {
			let query = supabase
				.from("blog_posts")
				.select(BLOG_POST_SELECT)
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.status) query = query.eq("status", filters.status)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_blog_posts_list_failed",
				"Unable to list admin blog posts.",
			)
			return data || []
		},

		async createBlogPost(values) {
			return insertRow(
				"blog_posts",
				BLOG_POST_SELECT,
				values,
				"blog_post_create_failed",
				"Unable to create blog post.",
			)
		},

		async updateBlogPost(id, values) {
			return updateRow(
				"blog_posts",
				BLOG_POST_SELECT,
				id,
				values,
				"blog_post_update_failed",
				"Unable to update blog post.",
			)
		},

		async deleteBlogPost(id) {
			return deleteRow(
				"blog_posts",
				BLOG_POST_SELECT,
				id,
				"blog_post_delete_failed",
				"Unable to delete blog post.",
			)
		},

		async listPublicReviews(filters = {}) {
			let query = supabase
				.from("reviews")
				.select(REVIEW_SELECT)
				.eq("status", "approved")
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.rating) query = query.eq("rating", filters.rating)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"reviews_list_failed",
				"Unable to list reviews.",
			)
			return data || []
		},

		async listAdminReviews(filters = {}) {
			let query = supabase
				.from("reviews")
				.select(REVIEW_SELECT)
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.status) query = query.eq("status", filters.status)
			if (filters.rating) query = query.eq("rating", filters.rating)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"admin_reviews_list_failed",
				"Unable to list admin reviews.",
			)
			return data || []
		},

		async createReview(values) {
			return insertRow(
				"reviews",
				REVIEW_SELECT,
				values,
				"review_create_failed",
				"Unable to create review.",
			)
		},

		async findReviewById(id) {
			const { data, error } = await supabase
				.from("reviews")
				.select(REVIEW_SELECT)
				.eq("id", id)
				.maybeSingle()

			throwRepositoryError(
				error,
				500,
				"review_lookup_failed",
				"Unable to load review.",
			)

			return data
		},

		async updateReview(id, values) {
			return updateRow(
				"reviews",
				REVIEW_SELECT,
				id,
				values,
				"review_update_failed",
				"Unable to update review.",
			)
		},

		async deleteReview(id) {
			return deleteRow(
				"reviews",
				REVIEW_SELECT,
				id,
				"review_delete_failed",
				"Unable to delete review.",
			)
		},

		async listContactMessages(filters = {}) {
			let query = supabase
				.from("contact_messages")
				.select(CONTACT_MESSAGE_SELECT)
				.order("created_at", { ascending: false })
			query = applyTenantFilter(query, filters.tenant_id)
			if (filters.status) query = query.eq("status", filters.status)
			query = applyRange(query, filters)

			const { data, error } = await query
			throwRepositoryError(
				error,
				500,
				"contact_messages_list_failed",
				"Unable to list contact messages.",
			)
			return data || []
		},

		async createContactMessage(values) {
			return insertRow(
				"contact_messages",
				CONTACT_MESSAGE_SELECT,
				values,
				"contact_message_create_failed",
				"Unable to create contact message.",
			)
		},

		async updateContactMessage(id, values) {
			return updateRow(
				"contact_messages",
				CONTACT_MESSAGE_SELECT,
				id,
				values,
				"contact_message_update_failed",
				"Unable to update contact message.",
			)
		},

		async deleteContactMessage(id) {
			return deleteRow(
				"contact_messages",
				CONTACT_MESSAGE_SELECT,
				id,
				"contact_message_delete_failed",
				"Unable to delete contact message.",
			)
		},

		async createFileUpload(values) {
			return insertRow(
				"file_uploads",
				FILE_UPLOAD_SELECT,
				values,
				"file_upload_create_failed",
				"Unable to record file upload signing request.",
			)
		},

		async insertActivity(values) {
			const { data, error } = await supabase
				.from("activity_timeline")
				.insert(values)
				.select("id, created_at")
				.single()

			throwRepositoryError(
				error,
				500,
				"activity_write_failed",
				"Unable to write activity timeline event.",
			)

			return data
		},

		async insertAuditLog(values) {
			const { data, error } = await supabase
				.from("admin_audit_logs")
				.insert(values)
				.select("id, created_at")
				.single()

			throwRepositoryError(
				error,
				500,
				"content_audit_log_failed",
				"Unable to write content audit log.",
			)

			return data
		},
	}
}

module.exports = {
	BLOG_POST_SELECT,
	CONTACT_MESSAGE_SELECT,
	FILE_UPLOAD_SELECT,
	GALLERY_ITEM_SELECT,
	REVIEW_SELECT,
	SERVICE_CATEGORY_SELECT,
	SERVICE_SELECT,
	SERVICE_VARIANT_SELECT,
	SITE_SETTINGS_SELECT,
	STYLIST_SELECT,
	applyTenantFilter,
	createContentRepository,
}
