process.env.NODE_ENV = "test"

const { createAdminService } = require("../src/modules/admins/admin.service")

const actorSuperAdmin = {
	id: "admin-row-1",
	user_id: "00000000-0000-4000-8000-000000000010",
	email: "owner@example.com",
	role: "super_admin",
	permissions: {},
	active: true,
}

const actorAdminManager = {
	id: "admin-row-2",
	user_id: "00000000-0000-4000-8000-000000000011",
	email: "manager@example.com",
	role: "admin",
	permissions: { canManageAdmins: true },
	active: true,
}

const targetAdmin = {
	id: "00000000-0000-4000-8000-000000000020",
	tenant_id: null,
	user_id: "00000000-0000-4000-8000-000000000021",
	email: "target@example.com",
	display_name: "Target Admin",
	role: "admin",
	permissions: {
		canManageAdmins: false,
		canManageBookings: true,
		canManageContent: true,
		canManageSecurity: false,
	},
	active: true,
	created_at: "2026-06-06T00:00:00.000Z",
	updated_at: "2026-06-06T00:00:00.000Z",
}

function createRepository(overrides = {}) {
	return {
		getAuthUserById: vi.fn().mockResolvedValue({
			id: targetAdmin.user_id,
			email: targetAdmin.email,
		}),
		findByUserId: vi.fn().mockResolvedValue(null),
		findByEmail: vi.fn().mockResolvedValue(null),
		findById: vi.fn().mockResolvedValue(targetAdmin),
		list: vi.fn().mockResolvedValue([targetAdmin]),
		create: vi.fn(async (values) => ({
			...targetAdmin,
			...values,
			id: targetAdmin.id,
		})),
		update: vi.fn(async (_id, values) => ({
			...targetAdmin,
			...values,
		})),
		upsertProfileRole: vi.fn().mockResolvedValue(undefined),
		insertAuditLog: vi.fn().mockResolvedValue({
			id: "audit-1",
			created_at: "2026-06-06T00:00:00.000Z",
		}),
		...overrides,
	}
}

describe("admin service", () => {
	it("allows a super admin to create an admin and writes an audit log", async () => {
		const adminRepository = createRepository()
		const service = createAdminService({ adminRepository })

		const created = await service.createAdminUser(actorSuperAdmin, {
			user_id: targetAdmin.user_id,
			email: targetAdmin.email,
			display_name: "Target Admin",
			role: "admin",
			permissions: { canManageBookings: true },
			active: true,
		})

		expect(created).toMatchObject({
			id: targetAdmin.id,
			user_id: targetAdmin.user_id,
			role: "admin",
		})
		expect(adminRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				created_by: actorSuperAdmin.user_id,
				updated_by: actorSuperAdmin.user_id,
			}),
		)
		expect(adminRepository.upsertProfileRole).toHaveBeenCalledWith(
			targetAdmin.user_id,
			expect.objectContaining({ role: "admin" }),
		)
		expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({ action: "admin_user.created" }),
		)
	})

	it("prevents normal admin managers from assigning super admin", async () => {
		const adminRepository = createRepository()
		const service = createAdminService({ adminRepository })

		await expect(
			service.createAdminUser(actorAdminManager, {
				user_id: targetAdmin.user_id,
				email: targetAdmin.email,
				role: "super_admin",
				active: true,
			}),
		).rejects.toMatchObject({
			code: "super_admin_required",
			statusCode: 403,
		})
	})

	it("prevents admins from changing their own privilege fields", async () => {
		const selfAdmin = {
			...targetAdmin,
			user_id: actorSuperAdmin.user_id,
			role: "super_admin",
		}
		const adminRepository = createRepository({
			findById: vi.fn().mockResolvedValue(selfAdmin),
		})
		const service = createAdminService({ adminRepository })

		await expect(
			service.updateAdminUser(actorSuperAdmin, selfAdmin.id, { active: false }),
		).rejects.toMatchObject({
			code: "self_admin_privilege_update_forbidden",
			statusCode: 400,
		})
	})

	it("updates admin permissions and records a diff audit log", async () => {
		const adminRepository = createRepository()
		const service = createAdminService({ adminRepository })

		const updated = await service.updateAdminUser(
			actorSuperAdmin,
			targetAdmin.id,
			{
				permissions: { canManageAdmins: true },
			},
		)

		expect(updated.permissions).toMatchObject({
			canManageAdmins: true,
		})
		expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "admin_user.updated",
				changes: expect.objectContaining({
					permissions: expect.any(Object),
				}),
			}),
		)
	})
})
