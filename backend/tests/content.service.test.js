process.env.NODE_ENV = "test"

const {
	createContentService,
	slugify,
} = require("../src/modules/content/content.service")

const actorAdmin = {
	id: "admin-row-1",
	tenant_id: null,
	user_id: "00000000-0000-4000-8000-000000000201",
	email: "content-admin@example.com",
	role: "admin",
	permissions: { canManageContent: true },
	active: true,
}

const customerUser = {
	id: "00000000-0000-4000-8000-000000000101",
	email: "customer@example.com",
}

const siteSettings = {
	id: "00000000-0000-4000-8000-000000000901",
	tenant_id: null,
	business_name: "Salon Test",
	contact_notification_email: "owner@example.com",
	public_email: "hello@example.com",
	cloudinary_folder: "salon-test/gallery",
}

function createRepository(overrides = {}) {
	return {
		findSiteSettingsByTenant: vi.fn().mockResolvedValue(siteSettings),
		getPublicSiteSettings: vi.fn().mockResolvedValue(siteSettings),
		createSiteSettings: vi.fn(async (values) => ({
			...siteSettings,
			...values,
			id: siteSettings.id,
		})),
		updateSiteSettings: vi.fn(async (_id, values) => ({
			...siteSettings,
			...values,
		})),
		listPublicServiceCategories: vi.fn().mockResolvedValue([]),
		listPublicServices: vi.fn().mockResolvedValue([]),
		listPublicServiceVariants: vi.fn().mockResolvedValue([]),
		listPublicStylists: vi.fn().mockResolvedValue([]),
		createService: vi.fn(async (values) => ({
			id: "00000000-0000-4000-8000-000000000601",
			...values,
		})),
		createReview: vi.fn(async (values) => ({
			id: "00000000-0000-4000-8000-000000000701",
			...values,
		})),
		updateReview: vi.fn(async (id, values) => ({
			id,
			customer_name: "Ada Lovelace",
			rating: 5,
			status: "pending",
			metadata: {},
			...values,
		})),
		createContactMessage: vi.fn(async (values) => ({
			id: "00000000-0000-4000-8000-000000000801",
			...values,
		})),
		updateContactMessage: vi.fn(async (id, values) => ({
			id,
			first_name: "Grace",
			status: "new",
			metadata: {},
			...values,
		})),
		createFileUpload: vi.fn(async (values) => ({
			id: "00000000-0000-4000-8000-000000000902",
			...values,
		})),
		insertActivity: vi.fn().mockResolvedValue({ id: "activity-1" }),
		insertAuditLog: vi.fn().mockResolvedValue({ id: "audit-1" }),
		...overrides,
	}
}

function createNotificationService(overrides = {}) {
	return {
		queueContactMessageNotification: vi.fn().mockResolvedValue({
			queued: [{ id: "outbox-1" }],
			skipped: false,
		}),
		...overrides,
	}
}

function createCloudinarySigner(overrides = {}) {
	return {
		signUpload: vi.fn((options) => ({
			cloudName: "demo-cloud",
			apiKey: "demo-key",
			signature: "signed",
			timestamp: "1780000000",
			folder: options.folder,
			publicId: options.public_id || null,
			resourceType: options.resource_type || "image",
			uploadUrl: "https://api.cloudinary.com/v1_1/demo-cloud/image/upload",
			params: {
				timestamp: "1780000000",
				folder: options.folder,
				public_id: options.public_id,
				api_key: "demo-key",
				signature: "signed",
			},
		})),
		...overrides,
	}
}

describe("content service", () => {
	it("slugifies content names for stable slugs", () => {
		expect(slugify(" Silk Press & Style! ")).toBe("silk-press-style")
		expect(slugify("", "fallback")).toBe("fallback")
	})

	it("creates services with generated slugs and audit logs", async () => {
		const contentRepository = createRepository()
		const service = createContentService({ contentRepository })

		const result = await service.createService(actorAdmin, {
			name: "Silk Press & Style",
			tenant_id: null,
			metadata: {},
		})

		expect(result.slug).toBe("silk-press-style")
		expect(contentRepository.createService).toHaveBeenCalledWith(
			expect.objectContaining({ slug: "silk-press-style" }),
		)
		expect(contentRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "service.created",
				resource_type: "service",
			}),
		)
	})

	it("submits reviews as pending and records an activity", async () => {
		const contentRepository = createRepository()
		const service = createContentService({ contentRepository })

		const review = await service.submitReview(customerUser, {
			customer_name: "Ada Lovelace",
			rating: 5,
			review_text: "Excellent salon service.",
			metadata: {},
		})

		expect(review).toMatchObject({
			user_id: customerUser.id,
			status: "pending",
		})
		expect(contentRepository.insertActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				activity_type: "review_posted",
				entity_type: "review",
			}),
		)
	})

	it("queues contact message notifications using site settings", async () => {
		const contentRepository = createRepository()
		const notificationService = createNotificationService()
		const service = createContentService({
			contentRepository,
			notificationService,
		})

		const result = await service.submitContactMessage(null, {
			first_name: "Grace",
			last_name: "Hopper",
			email: "grace@example.com",
			message: "Do you have weekend slots?",
			metadata: {},
		})

		expect(result.message.status).toBe("new")
		expect(
			notificationService.queueContactMessageNotification,
		).toHaveBeenCalledWith(
			result.message,
			expect.objectContaining({
				recipientEmail: siteSettings.contact_notification_email,
				site: siteSettings,
			}),
		)
	})

	it("moderates reviews with admin metadata", async () => {
		const contentRepository = createRepository()
		const service = createContentService({
			contentRepository,
			now: () => new Date("2026-07-01T10:00:00.000Z"),
		})

		const review = await service.moderateReview(
			actorAdmin,
			"00000000-0000-4000-8000-000000000701",
			{ status: "approved", moderation_notes: "Looks good." },
		)

		expect(review).toMatchObject({
			status: "approved",
			moderated_by: actorAdmin.user_id,
			moderated_at: "2026-07-01T10:00:00.000Z",
		})
		expect(contentRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({ action: "review.moderated" }),
		)
	})

	it("signs Cloudinary uploads and records file upload rows", async () => {
		const contentRepository = createRepository()
		const cloudinarySigner = createCloudinarySigner()
		const service = createContentService({
			contentRepository,
			cloudinarySigner,
		})

		const result = await service.signCloudinaryUpload(actorAdmin, {
			public_id: "gallery/before-after",
			resource_type: "image",
			tags: ["gallery"],
			context: {},
			metadata: {},
		})

		expect(cloudinarySigner.signUpload).toHaveBeenCalledWith(
			expect.objectContaining({
				folder: siteSettings.cloudinary_folder,
				public_id: "gallery/before-after",
			}),
		)
		expect(result.upload).toMatchObject({
			provider: "cloudinary",
			bucket: "demo-cloud",
			object_path: "gallery/before-after",
			status: "signed",
		})
	})

	it("signs public Cloudinary uploads without admin and scopes params by purpose", async () => {
		const contentRepository = createRepository()
		const cloudinarySigner = createCloudinarySigner()
		const service = createContentService({
			contentRepository,
			cloudinarySigner,
		})

		const result = await service.signCloudinaryUpload(
			{ user: customerUser },
			{
				purpose: "booking-inspiration",
				folder: "ignored-public-request-folder",
				public_id: "should/not/be/signed",
				resource_type: "image",
				content_type: "image/png",
				size_bytes: 1024,
				tags: ["booking"],
				context: { flow: "booking" },
				metadata: {},
			},
		)

		expect(cloudinarySigner.signUpload).toHaveBeenCalledWith(
			expect.objectContaining({
				folder: `${siteSettings.cloudinary_folder}/booking-inspiration`,
				public_id: undefined,
				resource_type: "image",
				tags: expect.arrayContaining([
					"booking",
					"public_upload",
					"booking-inspiration",
				]),
				context: expect.objectContaining({
					flow: "booking",
					purpose: "booking-inspiration",
					actor_type: "authenticated",
					user_id: customerUser.id,
				}),
			}),
		)
		expect(result.params).toMatchObject({
			api_key: "demo-key",
			signature: "signed",
			folder: `${siteSettings.cloudinary_folder}/booking-inspiration`,
		})
		expect(result.upload).toMatchObject({
			provider: "cloudinary",
			user_id: customerUser.id,
			content_type: "image/png",
			size_bytes: 1024,
			metadata: expect.objectContaining({
				purpose: "booking-inspiration",
				actor_type: "authenticated",
			}),
		})
		expect(contentRepository.insertAuditLog).not.toHaveBeenCalled()
	})

	it("rejects admin Cloudinary upload purposes without an admin actor", async () => {
		const contentRepository = createRepository()
		const cloudinarySigner = createCloudinarySigner()
		const service = createContentService({
			contentRepository,
			cloudinarySigner,
		})

		await expect(
			service.signCloudinaryUpload(
				{ user: customerUser },
				{
					purpose: "admin-blog",
					resource_type: "image",
					metadata: {},
				},
			),
		).rejects.toMatchObject({
			statusCode: 403,
			code: "admin_upload_purpose_required",
		})

		expect(cloudinarySigner.signUpload).not.toHaveBeenCalled()
		expect(contentRepository.createFileUpload).not.toHaveBeenCalled()
	})

	it("rejects non-image public Cloudinary upload signing requests", async () => {
		const contentRepository = createRepository()
		const cloudinarySigner = createCloudinarySigner()
		const service = createContentService({
			contentRepository,
			cloudinarySigner,
		})

		await expect(
			service.signCloudinaryUpload(null, {
				purpose: "review-photo",
				resource_type: "video",
				content_type: "video/mp4",
				metadata: {},
			}),
		).rejects.toMatchObject({
			statusCode: 400,
			code: "public_upload_resource_type_invalid",
		})

		expect(cloudinarySigner.signUpload).not.toHaveBeenCalled()
		expect(contentRepository.createFileUpload).not.toHaveBeenCalled()
	})

	it("rejects oversized public Cloudinary image signing requests", async () => {
		const contentRepository = createRepository()
		const cloudinarySigner = createCloudinarySigner()
		const service = createContentService({
			contentRepository,
			cloudinarySigner,
		})

		await expect(
			service.signCloudinaryUpload(null, {
				purpose: "profile-avatar",
				resource_type: "image",
				content_type: "image/jpeg",
				size_bytes: 5 * 1024 * 1024 + 1,
				metadata: {},
			}),
		).rejects.toMatchObject({
			statusCode: 413,
			code: "public_upload_file_too_large",
		})

		expect(cloudinarySigner.signUpload).not.toHaveBeenCalled()
		expect(contentRepository.createFileUpload).not.toHaveBeenCalled()
	})
})
