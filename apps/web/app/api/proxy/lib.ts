/**
 * API Proxy utilities for preview environment authentication.
 *
 * In preview environments, the frontend (Vercel) and backend (Render) are deployed
 * to different domains. These utilities help the proxy make API requests appear
 * same-origin from the browser's perspective, allowing session cookies to work.
 */

// Headers that should not be forwarded (hop-by-hop headers)
export const HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailers",
	"transfer-encoding",
	"upgrade",
	// Also exclude host as it should reflect the target
	"host",
]);

/**
 * Build target URL from the proxy path and query parameters
 */
export function buildTargetUrl(
	apiServerUrl: string,
	path: string[],
	searchParams: URLSearchParams,
): URL {
	// Construct the full path
	const fullPath = `/api/${path.join("/")}`;
	const url = new URL(fullPath, apiServerUrl);

	// Forward query parameters
	searchParams.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	return url;
}

/**
 * Filter and prepare headers for forwarding
 */
export function prepareForwardHeaders(requestHeaders: Headers): HeadersInit {
	const forwardHeaders: Record<string, string> = {};

	requestHeaders.forEach((value, key) => {
		const lowerKey = key.toLowerCase();
		if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
			forwardHeaders[key] = value;
		}
	});

	// Add X-Forwarded headers for proper client identification
	forwardHeaders["x-forwarded-host"] = requestHeaders.get("host") || "";
	forwardHeaders["x-forwarded-proto"] = "https";

	return forwardHeaders;
}

/**
 * Forward response headers, filtering hop-by-hop headers
 */
export function prepareResponseHeaders(responseHeaders: Headers): Headers {
	const headers = new Headers();

	responseHeaders.forEach((value, key) => {
		const lowerKey = key.toLowerCase();
		if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
			headers.set(key, value);
		}
	});

	return headers;
}

/**
 * Check if the response is a streaming response (SSE)
 */
export function isStreamingResponse(headers: Headers): boolean {
	const contentType = headers.get("content-type");
	return contentType?.includes("text/event-stream") ?? false;
}
