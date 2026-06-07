process.env.NODE_ENV = "test"

const {
	assertSecurityRestrictionsAllowed,
} = require("../src/middleware/securityRestrictions")

function makeJwt(payload) {
	const encode = (value) =>
		Buffer.from(JSON.stringify(value))
			.toString("base64url")
			.replace(/=/g, "")

	return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`
}

describe("security restriction enforcement", () => {
	it("blocks temporarily restricted accounts", () => {
		expect(() =>
			assertSecurityRestrictionsAllowed({
				authUser: { id: "user-1" },
				profile: {
					security_restrictions: {
						blockedUntilMs: Date.now() + 60_000,
						blockReason: "review required",
					},
				},
				token: makeJwt({ iat: Math.floor(Date.now() / 1000) }),
			}),
		).toThrow(expect.objectContaining({ code: "account_temporarily_blocked" }))
	})

	it("requires a new session after force logout", () => {
		const forceLogoutAtMs = Date.now()
		const oldToken = makeJwt({ iat: Math.floor((forceLogoutAtMs - 10_000) / 1000) })

		expect(() =>
			assertSecurityRestrictionsAllowed({
				authUser: { id: "user-1" },
				profile: {
					security_restrictions: { forceLogoutAtMs },
				},
				token: oldToken,
			}),
		).toThrow(expect.objectContaining({ code: "force_logout_required" }))
	})

	it("allows password reset recording when explicitly permitted", () => {
		expect(() =>
			assertSecurityRestrictionsAllowed({
				authUser: { id: "user-1" },
				profile: {
					security_restrictions: { passwordResetRequired: true },
				},
				token: makeJwt({ iat: Math.floor(Date.now() / 1000) }),
				allowPasswordResetRequired: true,
			}),
		).not.toThrow()
	})
})