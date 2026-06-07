const express = require("express")

const { requireAdmin } = require("../../middleware/requireAdmin")
const { requireAuth } = require("../../middleware/requireAuth")
const { CONTENT_ADMIN_PERMISSION } = require("./content.constants")
const contentController = require("./content.controller")

const router = express.Router()
const requireContentAdmin = [requireAuth, requireAdmin(CONTENT_ADMIN_PERMISSION)]

router.get("/api/v1/site-settings/public", contentController.getPublicSiteSettings)
router.get("/api/v1/services", contentController.getPublicServices)
router.get("/api/v1/gallery", contentController.listPublicGalleryItems)
router.get("/api/v1/blog-posts", contentController.listPublicBlogPosts)
router.get("/api/v1/blog-posts/:slug", contentController.getPublicBlogPost)
router.get("/api/v1/reviews", contentController.listPublicReviews)
router.post("/api/v1/reviews", contentController.submitReview)
router.post("/api/v1/contact-messages", contentController.submitContactMessage)

router.get(
	"/api/v1/admin/site-settings",
	...requireContentAdmin,
	contentController.getAdminSiteSettings,
)
router.put(
	"/api/v1/admin/site-settings",
	...requireContentAdmin,
	contentController.updateAdminSiteSettings,
)

router.get(
	"/api/v1/admin/service-categories",
	...requireContentAdmin,
	contentController.listAdminServiceCategories,
)
router.post(
	"/api/v1/admin/service-categories",
	...requireContentAdmin,
	contentController.createAdminServiceCategory,
)
router.patch(
	"/api/v1/admin/service-categories/:id",
	...requireContentAdmin,
	contentController.updateAdminServiceCategory,
)
router.delete(
	"/api/v1/admin/service-categories/:id",
	...requireContentAdmin,
	contentController.deleteAdminServiceCategory,
)

router.get(
	"/api/v1/admin/services",
	...requireContentAdmin,
	contentController.listAdminServices,
)
router.post(
	"/api/v1/admin/services",
	...requireContentAdmin,
	contentController.createAdminService,
)
router.patch(
	"/api/v1/admin/services/:id",
	...requireContentAdmin,
	contentController.updateAdminService,
)
router.delete(
	"/api/v1/admin/services/:id",
	...requireContentAdmin,
	contentController.deleteAdminService,
)

router.get(
	"/api/v1/admin/service-variants",
	...requireContentAdmin,
	contentController.listAdminServiceVariants,
)
router.post(
	"/api/v1/admin/service-variants",
	...requireContentAdmin,
	contentController.createAdminServiceVariant,
)
router.patch(
	"/api/v1/admin/service-variants/:id",
	...requireContentAdmin,
	contentController.updateAdminServiceVariant,
)
router.delete(
	"/api/v1/admin/service-variants/:id",
	...requireContentAdmin,
	contentController.deleteAdminServiceVariant,
)

router.get(
	"/api/v1/admin/stylists",
	...requireContentAdmin,
	contentController.listAdminStylists,
)
router.post(
	"/api/v1/admin/stylists",
	...requireContentAdmin,
	contentController.createAdminStylist,
)
router.patch(
	"/api/v1/admin/stylists/:id",
	...requireContentAdmin,
	contentController.updateAdminStylist,
)
router.delete(
	"/api/v1/admin/stylists/:id",
	...requireContentAdmin,
	contentController.deleteAdminStylist,
)

router.get(
	"/api/v1/admin/gallery",
	...requireContentAdmin,
	contentController.listAdminGalleryItems,
)
router.post(
	"/api/v1/admin/gallery",
	...requireContentAdmin,
	contentController.createAdminGalleryItem,
)
router.patch(
	"/api/v1/admin/gallery/:itemId",
	...requireContentAdmin,
	contentController.updateAdminGalleryItem,
)
router.delete(
	"/api/v1/admin/gallery/:itemId",
	...requireContentAdmin,
	contentController.deleteAdminGalleryItem,
)

router.get(
	"/api/v1/admin/blog-posts",
	...requireContentAdmin,
	contentController.listAdminBlogPosts,
)
router.post(
	"/api/v1/admin/blog-posts",
	...requireContentAdmin,
	contentController.createAdminBlogPost,
)
router.patch(
	"/api/v1/admin/blog-posts/:postId",
	...requireContentAdmin,
	contentController.updateAdminBlogPost,
)
router.delete(
	"/api/v1/admin/blog-posts/:postId",
	...requireContentAdmin,
	contentController.deleteAdminBlogPost,
)

router.get(
	"/api/v1/admin/reviews",
	...requireContentAdmin,
	contentController.listAdminReviews,
)
router.post(
	"/api/v1/admin/reviews/:reviewId/moderate",
	...requireContentAdmin,
	contentController.moderateAdminReview,
)

router.get(
	"/api/v1/admin/contact-messages",
	...requireContentAdmin,
	contentController.listAdminContactMessages,
)
router.post(
	"/api/v1/admin/contact-messages/:messageId/status",
	...requireContentAdmin,
	contentController.updateAdminContactMessageStatus,
)
router.delete(
	"/api/v1/admin/contact-messages/:messageId",
	...requireContentAdmin,
	contentController.deleteAdminContactMessage,
)

router.post(
	"/api/v1/uploads/cloudinary/sign",
	...requireContentAdmin,
	contentController.signCloudinaryUpload,
)

module.exports = router