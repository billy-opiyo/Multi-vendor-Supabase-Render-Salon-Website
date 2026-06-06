const { getSupabaseAdmin } = require("../../db/supabaseAdmin")
const { ApiError } = require("../../utils/errors")
const { hasOwn, pickDefined } = require("../../utils/validation")
const {
	CUSTOMER_ROLE,
	SAFE_PROFILE_UPDATE_FIELDS,
} = require("./profile.constants")
const { createProfileRepository } = require("./profile.repository")

function getAuthDisplayName(authUser) {
	return (
		authUser.user_metadata?.display_name ||
		authUser.user_metadata?.full_name ||
		authUser.user_metadata?.name ||
		null
	)
}

function getAuthAvatarUrl(authUser) {
	return (
		authUser.user_metadata?.avatar_url ||
		authUser.user_metadata?.picture ||
		null
	)
}

function getAuthPhone(authUser) {
	return authUser.phone || authUser.user_metadata?.phone || null
}

function pickWritableProfileFields(payload) {
	const values = {}

	for (const field of SAFE_PROFILE_UPDATE_FIELDS) {
		if (hasOwn(payload, field)) {
			values[field] = payload[field]
		}
	}

	return values
}

function createProfileService({ profileRepository } = {}) {
	const repository =
		profileRepository || createProfileRepository(getSupabaseAdmin())

	return {
		async getOwnProfile(authUser) {
			const profile = await repository.findById(authUser.id)

			if (!profile) {
				throw new ApiError(
					404,
					"profile_not_found",
					"Profile has not been created for this user yet.",
				)
			}

			return profile
		},

		async syncOwnProfile(authUser, payload = {}) {
			if (!authUser?.id) {
				throw new ApiError(
					401,
					"authentication_required",
					"Authenticated user required.",
				)
			}

			const existing = await repository.findById(authUser.id)
			const writableFields = pickWritableProfileFields(payload)

			if (!existing) {
				const createValues = pickDefined({
					id: authUser.id,
					email: authUser.email || null,
					display_name: hasOwn(writableFields, "display_name")
						? writableFields.display_name
						: getAuthDisplayName(authUser),
					phone: hasOwn(writableFields, "phone")
						? writableFields.phone
						: getAuthPhone(authUser),
					avatar_url: hasOwn(writableFields, "avatar_url")
						? writableFields.avatar_url
						: getAuthAvatarUrl(authUser),
					metadata: writableFields.metadata || {},
					role: CUSTOMER_ROLE,
				})

				return repository.create(createValues)
			}

			const updateValues = pickDefined({
				email: authUser.email || existing.email || null,
				...writableFields,
			})

			if (
				!hasOwn(updateValues, "display_name") &&
				!existing.display_name &&
				getAuthDisplayName(authUser)
			) {
				updateValues.display_name = getAuthDisplayName(authUser)
			}

			if (
				!hasOwn(updateValues, "avatar_url") &&
				!existing.avatar_url &&
				getAuthAvatarUrl(authUser)
			) {
				updateValues.avatar_url = getAuthAvatarUrl(authUser)
			}

			return repository.update(authUser.id, updateValues)
		},

		async updateOwnProfile(authUser, payload = {}) {
			const existing = await repository.findById(authUser.id)

			if (!existing) {
				throw new ApiError(
					404,
					"profile_not_found",
					"Profile has not been created for this user yet.",
				)
			}

			const updateValues = pickWritableProfileFields(payload)

			if (Object.keys(updateValues).length === 0) {
				throw new ApiError(
					400,
					"profile_update_empty",
					"At least one profile field must be provided.",
				)
			}

			return repository.update(authUser.id, updateValues)
		},
	}
}

module.exports = {
	createProfileService,
	getAuthAvatarUrl,
	getAuthDisplayName,
	getAuthPhone,
	pickWritableProfileFields,
}
