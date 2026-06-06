process.env.NODE_ENV = "test"

const { ApiError } = require("../src/utils/errors")
const {
	createProfileService,
} = require("../src/modules/profiles/profile.service")

function createAuthUser(overrides = {}) {
	return {
		id: "00000000-0000-4000-8000-000000000001",
		email: "customer@example.com",
		phone: "+254700000000",
		user_metadata: {
			full_name: "Customer One",
			picture: "https://example.com/avatar.png",
		},
		...overrides,
	}
}

describe("profile service", () => {
	it("creates a customer profile from Supabase Auth metadata", async () => {
		const calls = []
		const profileRepository = {
			findById: vi.fn().mockResolvedValue(null),
			create: vi.fn(async (values) => {
				calls.push(["create", values])
				return values
			}),
		}
		const service = createProfileService({ profileRepository })

		const profile = await service.syncOwnProfile(createAuthUser(), {})

		expect(profile).toMatchObject({
			id: "00000000-0000-4000-8000-000000000001",
			email: "customer@example.com",
			display_name: "Customer One",
			phone: "+254700000000",
			avatar_url: "https://example.com/avatar.png",
			role: "customer",
		})
		expect(calls[0][0]).toBe("create")
	})

	it("updates existing profiles without overwriting role", async () => {
		const profileRepository = {
			findById: vi.fn().mockResolvedValue({
				id: "00000000-0000-4000-8000-000000000001",
				email: "old@example.com",
				display_name: "Old Name",
				role: "super_admin",
			}),
			update: vi.fn(async (_userId, values) => ({
				id: "00000000-0000-4000-8000-000000000001",
				role: "super_admin",
				...values,
			})),
		}
		const service = createProfileService({ profileRepository })

		const profile = await service.syncOwnProfile(createAuthUser(), {
			display_name: "New Name",
		})

		expect(profileRepository.update).toHaveBeenCalledWith(
			"00000000-0000-4000-8000-000000000001",
			expect.not.objectContaining({ role: expect.anything() }),
		)
		expect(profile).toMatchObject({
			display_name: "New Name",
			role: "super_admin",
		})
	})

	it("rejects profile updates before sync creates a profile", async () => {
		const profileRepository = {
			findById: vi.fn().mockResolvedValue(null),
		}
		const service = createProfileService({ profileRepository })

		await expect(
			service.updateOwnProfile(createAuthUser(), { display_name: "Name" }),
		).rejects.toMatchObject({
			code: "profile_not_found",
			statusCode: 404,
		})
	})

	it("requires at least one writable profile field on update", async () => {
		const profileRepository = {
			findById: vi.fn().mockResolvedValue({
				id: "00000000-0000-4000-8000-000000000001",
			}),
		}
		const service = createProfileService({ profileRepository })

		await expect(
			service.updateOwnProfile(createAuthUser(), {}),
		).rejects.toBeInstanceOf(ApiError)
	})
})
