import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * API Proxy route for preview environments.
 *
 * In preview environments, the frontend (Vercel) and backend (Render) are deployed
 * to different domains. This proxy makes API requests appear same-origin from
 * the browser's perspective, allowing session cookies to work correctly.
 *
 * Production: Direct browser → api-server communication (same root domain)
 * Preview: Browser → Next.js proxy → api-server (proxy makes it same-origin)
 */

const API_SERVER_URL = process.env.API_SERVER_URL || "http://localhost:3501";

// Headers that should not be forwarded (hop-by-hop headers)
const HOP_BY_HOP_HEADERS = new Set([
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
	path: string[],
	searchParams: URLSearchParams,
): URL {
	// Construct the full path
	const fullPath = `/api/${path.join("/")}`;
	const url = new URL(fullPath, API_SERVER_URL);

	// Forward query parameters
	searchParams.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	return url;
}

/**
 * Filter and prepare headers for forwarding
 */
function prepareForwardHeaders(requestHeaders: Headers): HeadersInit {
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
function prepareResponseHeaders(responseHeaders: Headers): Headers {
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
function isStreamingResponse(headers: Headers): boolean {
	const contentType = headers.get("content-type");
	return contentType?.includes("text/event-stream") ?? false;
}

/**
 * Main proxy handler
 */
async function handler(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const targetUrl = buildTargetUrl(path, request.nextUrl.searchParams);

	try {
		// Prepare headers for forwarding
		const forwardHeaders = prepareForwardHeaders(request.headers);

		// Prepare fetch options
		const fetchOptions: RequestInit = {
			method: request.method,
			headers: forwardHeaders,
			// @ts-expect-error - duplex required for streaming request bodies in Node.js
			duplex: "half",
		};

		// Forward body for methods that support it
		if (
			request.method !== "GET" &&
			request.method !== "HEAD" &&
			request.body
		) {
			fetchOptions.body = request.body;
		}

		// Make the proxied request
		const response = await fetch(targetUrl.toString(), fetchOptions);

		// Prepare response headers
		const responseHeaders = prepareResponseHeaders(response.headers);

		// Handle streaming responses (SSE)
		if (isStreamingResponse(response.headers)) {
			// Set appropriate headers for SSE
			responseHeaders.set("content-type", "text/event-stream");
			responseHeaders.set("cache-control", "no-cache");
			responseHeaders.set("connection", "keep-alive");

			return new NextResponse(response.body, {
				status: response.status,
				headers: responseHeaders,
			});
		}

		// Return regular response
		return new NextResponse(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error("[API Proxy] Error forwarding request:", error);

		// Return a generic error without exposing internal details
		return NextResponse.json(
			{ error: "Failed to connect to API server" },
			{ status: 502 },
		);
	}
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
