module.exports = {
	test: {
		environment: "node",
		globals: true,
		include: ["tests/rules/**/*.test.js"],
		hookTimeout: 30 * 1000,
		testTimeout: 30 * 1000,
	},
}