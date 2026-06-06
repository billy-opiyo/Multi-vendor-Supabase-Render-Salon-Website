const { ApiError } = require("./errors")

function getSupabaseErrorDetails(error) {
	return {
		supabaseCode: error.code,
		supabaseMessage: error.message,
		supabaseDetails: error.details,
		supabaseHint: error.hint,
	}
}

function throwSupabaseError(error, statusCode, code, message) {
	if (!error) {
		return
	}

	throw new ApiError(statusCode, code, message, getSupabaseErrorDetails(error))
}

module.exports = {
	getSupabaseErrorDetails,
	throwSupabaseError,
}
