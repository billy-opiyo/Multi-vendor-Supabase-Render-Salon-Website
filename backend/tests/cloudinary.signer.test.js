process.env.NODE_ENV = "test"

const {
	buildSignature,
	createCloudinarySigner,
} = require("../src/integrations/cloudinary/cloudinarySigner")

describe("Cloudinary signer", () => {
	it("builds deterministic SHA1 signatures from sorted params", () => {
		const signature = buildSignature(
			{
				public_id: "sample",
				timestamp: "1315060510",
				folder: "salon/gallery",
			},
			"abcd",
		)

		expect(signature).toBe(
			buildSignature(
				{
					timestamp: "1315060510",
					folder: "salon/gallery",
					public_id: "sample",
				},
				"abcd",
			),
		)
	})

	it("returns signed upload params without exposing the API secret", () => {
		const signer = createCloudinarySigner({
			cloudName: "demo",
			apiKey: "key123",
			apiSecret: "secret123",
			defaultFolder: "salon/default",
			now: () => new Date("2026-07-01T00:00:00.000Z"),
		})

		const result = signer.signUpload({
			public_id: "gallery/test",
			tags: ["gallery", "before-after"],
			context: { tenant_id: "global" },
		})

		expect(result).toMatchObject({
			cloudName: "demo",
			apiKey: "key123",
			folder: "salon/default",
			publicId: "gallery/test",
			resourceType: "image",
			uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
		})
		expect(result.params).toMatchObject({
			api_key: "key123",
			folder: "salon/default",
			public_id: "gallery/test",
			tags: "gallery,before-after",
			context: "tenant_id=global",
		})
		expect(JSON.stringify(result)).not.toContain("secret123")
	})

	it("throws a service error when Cloudinary credentials are missing", () => {
		const signer = createCloudinarySigner({
			cloudName: "",
			apiKey: "",
			apiSecret: "",
		})

		expect(() => signer.signUpload({})).toThrow(/Cloudinary signing is not configured/)
	})
})