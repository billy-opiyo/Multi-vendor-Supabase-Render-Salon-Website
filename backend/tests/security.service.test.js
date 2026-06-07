process.env.NODE_ENV = "test"

const {
	buildLoginRiskAssessment,
	createSecurityService,
} = require("../src/modules/security/security.service")

const fixedNow = new Date("2026-06-07T07:00:00.000Z")

function createRepository(overrides = {}) {
	return {
		findProfileByUserId: vi.fn().mockResolvedValue({
			id: "00000000-0000-4000-8000-000000000001",
			tenant_id: null,
			email: "customer@example.com",
			role: "customer",
			security_restrictions: {},
		}),
		getAuthUserById: vi.fn().mockResolvedValue({
			id: "00000000-0000-4000-8000-000000000001",
			email: "customer@example.com",
			app_metadata: {},
		}),
		insertAccountChange: vi.fn(async (values) => ({ id: "change-1", ...values })),
		insertActivity: vi.fn(async (values) => ({ id: "activity-1", ...values })),
		insertAuditLog: vi.fn(async (values) => ({ id: "audit-1", ...values })),
		insertLoginActivity: vi.fn(async (values) => ({ id: "login-1", ...values })),
		insertSecurityAction: vi.fn(async (values) => ({ id: "security-action-1", ...values })),
		insertSecurityAlert: vi.fn(async (values) => ({ id: "alert-1", ...values })),
		listRecentLoginActivities: vi.fn().mockResolvedValue([]),
		listLoginActivities: vi.fn().mockResolvedValue([]),
		listSecurityAlerts: vi.fn().mockResolvedValue([]),
		listAccountChanges: vi.fn().mockResolvedValue([]),
		listSecurityActions: vi.fn().mockResolvedValue([]),
		updateAuthUserSecurityRestrictions: vi.fn().mockResolvedValue({}),
		updateSecurityAlert: vi.fn(async (_id, values) => ({ id: "alert-1", ...values })),
		upsertProfileSecurityRestrictions: vi.fn(async (_userId, values) => ({
			id: "00000000-0000-4000-8000-000000000001",
			...values,
		})),
		...overrides,
	}
}

describe("security service", () => {
	it("scores repeated failed login activity and creates alerts", async () => {
		const recent = Array.from({ length: 4 }, (_value, index) => ({
			id: `recent-${index}`,
			status: "failure",
			created_at: new Date(fixedNow.getTime() - (index + 1) * 30_000).toISOString(),
		}))
		const securityRepository = createRepository({
			listRecentLoginActivities: vi.fn().mockResolvedValue(recent),
		})
		const service = createSecurityService({
			securityRepository,
			now: () => fixedNow,
		})

		const result = await service.recordLoginActivity(
			null,
			{
				attempted_email: "customer@example.com",
				device_type: "desktop",
				login_method: "email/password",
				metadata: {},
				status: "failure",
			},
			{ headers: { "x-forwarded-for": "203.0.113.10" } },
		)

		expect(result.riskAssessment).toMatchObject({
			riskLevel: "high",
			suspicious: true,
		})
		expect(securityRepository.insertLoginActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "customer@example.com",
				risk_level: "high",
				status: "failure",
			}),
		)
		expect(securityRepository.insertSecurityAlert).toHaveBeenCalled()
	})

	it("applies force password reset restrictions through profile and auth metadata", async () => {
		const securityRepository = createRepository()
		const service = createSecurityService({
			securityRepository,
			now: () => fixedNow,
		})
		const actorAdmin = {
			user_id: "00000000-0000-4000-8000-000000000010",
			email: "security@example.com",
			tenant_id: null,
		}
		const targetUserId = "00000000-0000-4000-8000-000000000001"

		const result = await service.applyAdminSecurityRestriction(
			actorAdmin,
			targetUserId,
			{
				action: "force_password_reset",
				block_minutes: 60,
				metadata: {},
				reason: "credential review",
			},
		)

		expect(result.securityRestrictions).toMatchObject({
			passwordResetRequired: true,
			passwordResetRequestedAtMs: fixedNow.getTime(),
		})
		expect(securityRepository.updateAuthUserSecurityRestrictions).toHaveBeenCalled()
		expect(securityRepository.insertSecurityAction).toHaveBeenCalledWith(
			expect.objectContaining({ action: "force_password_reset" }),
		)
		expect(securityRepository.insertAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({ action: "security.force_password_reset" }),
		)
	})

	it("clears password reset requirement after password change is recorded", async () => {
		const securityRepository = createRepository({
			findProfileByUserId: vi.fn().mockResolvedValue({
				id: "00000000-0000-4000-8000-000000000001",
				email: "customer@example.com",
				role: "customer",
				security_restrictions: {
					passwordResetRequired: true,
					passwordResetRequestedAtMs: fixedNow.getTime() - 60_000,
				},
			}),
		})
		const service = createSecurityService({
			securityRepository,
			now: () => fixedNow,
		})

		await service.recordAccountSecurityChange(
			{
				id: "00000000-0000-4000-8000-000000000001",
				email: "customer@example.com",
				app_metadata: {},
			},
			{
				change_type: "password_changed",
				metadata: {},
			},
		)

		expect(securityRepository.upsertProfileSecurityRestrictions).toHaveBeenCalledWith(
			"00000000-0000-4000-8000-000000000001",
			expect.objectContaining({
				security_restrictions: expect.objectContaining({
					passwordResetRequired: false,
					passwordResetRequestedAtMs: 0,
				}),
			}),
		)
		expect(securityRepository.insertSecurityAlert).toHaveBeenCalledWith(
			expect.objectContaining({ alert_type: "password_changed" }),
		)
	})
})

describe("buildLoginRiskAssessment", () => {
	it("keeps normal first successful logins low risk", () => {
		const assessment = buildLoginRiskAssessment({
			payload: {
				browser: "Chrome",
				country: "KE",
				device_type: "desktop",
				status: "success",
			},
			recent: [],
			nowMs: fixedNow.getTime(),
		})

		expect(assessment).toMatchObject({
			riskLevel: "low",
			riskScore: 0,
			suspicious: false,
		})
	})
})