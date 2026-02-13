import { isPreviewEnvironment } from "@repo/utils/lib/api-url";

/**
 * API error classification utility for handling different error types
 * in a user-friendly way, especially in preview environments.
 */

export type ApiErrorCode =
	| "API_NOT_CONFIGURED" // 503 - Backend URL not set in preview
	| "API_UNREACHABLE" // 502 - Network/connection error
	| "NOT_FOUND" // 404 - Route doesn't exist
	| "AUTH_ERROR" // 401/403 - Authentication issues
	| "VALIDATION_ERROR" // 400 - Bad request
	| "SERVER_ERROR" // 500 - Internal server error
	| "NETWORK_ERROR" // Fetch failed (no response)
	| "UNKNOWN"; // Unclassified error

interface ApiErrorResponse {
	error?: string;
	code?: string;
	message?: string;
}

/**
 * Classifies an error from an API call into a standardized error code.
 *
 * @param error - The error to classify (can be an Error, Response, or unknown)
 * @returns The classified error code
 */
export function classifyError(error: unknown): ApiErrorCode {
	// Check for oRPC error structure
	if (isORPCError(error)) {
		const status = error.status;
		const code = error.data?.code || error.code;

		// Check for explicit error codes from our proxy
		if (code === "API_NOT_CONFIGURED") {
			return "API_NOT_CONFIGURED";
		}
		if (code === "API_UNREACHABLE") {
			return "API_UNREACHABLE";
		}

		// Classify by status code
		if (status === 503) {
			return "API_NOT_CONFIGURED";
		}
		if (status === 502) {
			return "API_UNREACHABLE";
		}
		if (status === 404) {
			return "NOT_FOUND";
		}
		if (status === 401 || status === 403) {
			return "AUTH_ERROR";
		}
		if (status === 400) {
			return "VALIDATION_ERROR";
		}
		if (typeof status === "number" && status >= 500) {
			return "SERVER_ERROR";
		}
	}

	// Check for fetch/network errors
	if (error instanceof TypeError && error.message.includes("fetch")) {
		return "NETWORK_ERROR";
	}

	// Check for Error with message patterns
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		if (message.includes("network") || message.includes("fetch")) {
			return "NETWORK_ERROR";
		}
		if (message.includes("not found") || message.includes("404")) {
			return "NOT_FOUND";
		}
		if (message.includes("unauthorized") || message.includes("401")) {
			return "AUTH_ERROR";
		}
	}

	return "UNKNOWN";
}

interface ORPCError {
	status?: number;
	code?: string;
	data?: ApiErrorResponse;
	message?: string;
}

function isORPCError(error: unknown): error is ORPCError {
	return (
		typeof error === "object" &&
		error !== null &&
		("status" in error || "code" in error)
	);
}

/**
 * Determines if the error indicates the API is still initializing in preview.
 *
 * @param error - The error to check
 * @returns true if the API appears to be initializing
 */
export function isApiInitializing(error: unknown): boolean {
	if (!isPreviewEnvironment()) {
		return false;
	}

	const code = classifyError(error);
	return code === "API_NOT_CONFIGURED" || code === "API_UNREACHABLE";
}

/**
 * Gets a user-friendly error message based on the error code.
 *
 * @param code - The classified error code
 * @returns A user-friendly message appropriate for display
 */
export function getErrorMessage(code: ApiErrorCode): string {
	const isPreview = isPreviewEnvironment();

	switch (code) {
		case "API_NOT_CONFIGURED":
			return isPreview
				? "The preview API is still initializing. Please wait a few minutes."
				: "API service is not configured.";

		case "API_UNREACHABLE":
			return isPreview
				? "The preview API server is unreachable. It may still be deploying."
				: "Unable to reach the API server. Please try again later.";

		case "NOT_FOUND":
			return "The requested resource was not found.";

		case "AUTH_ERROR":
			return "Authentication required. Please sign in.";

		case "VALIDATION_ERROR":
			return "Invalid request. Please check your input.";

		case "SERVER_ERROR":
			return "A server error occurred. Please try again later.";

		case "NETWORK_ERROR":
			return "Network error. Please check your connection.";

		default:
			return "An unexpected error occurred. Please try again.";
	}
}

/**
 * Helper to check if an error should show a retry option.
 */
export function shouldShowRetry(code: ApiErrorCode): boolean {
	return ["API_UNREACHABLE", "NETWORK_ERROR", "SERVER_ERROR"].includes(code);
}

/**
 * Helper to check if an error is transient (might resolve on retry).
 */
export function isTransientError(code: ApiErrorCode): boolean {
	return [
		"API_NOT_CONFIGURED",
		"API_UNREACHABLE",
		"NETWORK_ERROR",
		"SERVER_ERROR",
	].includes(code);
}
