const CONTENT_ADMIN_PERMISSION = "canManageContent"

const GALLERY_STATUS_VALUES = ["draft", "published", "archived"]
const GALLERY_VISIBILITY_VALUES = ["public", "private"]
const BLOG_STATUS_VALUES = ["draft", "published", "archived"]
const REVIEW_STATUS_VALUES = ["pending", "approved", "rejected", "archived"]
const CONTACT_MESSAGE_STATUS_VALUES = [
	"new",
	"in_progress",
	"resolved",
	"archived",
	"spam",
]
const FILE_UPLOAD_STATUS_VALUES = [
	"signed",
	"uploaded",
	"attached",
	"deleted",
	"failed",
]
const CLOUDINARY_RESOURCE_TYPES = ["image", "video", "raw", "auto"]

const DEFAULT_CONTENT_LIMIT = 50
const MAX_CONTENT_LIMIT = 200
const REVIEW_RATE_LIMIT_COOLDOWN_MS = 2 * 60 * 1000
const CONTACT_RATE_LIMIT_COOLDOWN_MS = 60 * 1000

module.exports = {
	BLOG_STATUS_VALUES,
	CLOUDINARY_RESOURCE_TYPES,
	CONTACT_MESSAGE_STATUS_VALUES,
	CONTACT_RATE_LIMIT_COOLDOWN_MS,
	CONTENT_ADMIN_PERMISSION,
	DEFAULT_CONTENT_LIMIT,
	FILE_UPLOAD_STATUS_VALUES,
	GALLERY_STATUS_VALUES,
	GALLERY_VISIBILITY_VALUES,
	MAX_CONTENT_LIMIT,
	REVIEW_RATE_LIMIT_COOLDOWN_MS,
	REVIEW_STATUS_VALUES,
}
