class ApiError extends Error {
	constructor(statusCode, code, message, details = undefined) {
		super(message)
		this.name = "ApiError"
		this.statusCode = statusCode
		this.code = code
		this.details = details
	}
}

function asyncHandler(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next)
	}
}

module.exports = {
	ApiError,
	asyncHandler,
}
