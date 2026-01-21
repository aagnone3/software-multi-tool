import { isPreviewEnvironment } from "@repo/utils/lib/api-url";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	buildTargetUrl,
	isStreamingResponse,
	prepareForwardHeaders,
	prepareResponseHeaders,
} from "../lib";

/**
 * API Proxy route for preview environments.
 *
 * In preview environments, the frontend (Vercel) and backend (Render) are deployed
 * to different domains. This proxy makes API requests appear same-origin from
 * the browser's perspective, allowing session cookies to work correctly.
 *
 * Production: Direct browser → api-server communication (same root domain)
 * Preview: Browser → Next.js proxy → api-server (proxy makes it same-origin)
 *
 * Error Handling:
 * - 503: API backend not configured (API_SERVER_URL not set in preview)
 * - 502: Failed to connect to API server (network/connection error)
 * - Other: Forwarded from backend
 */

// Check both server-only and public env vars since the preview-sync workflow sets NEXT_PUBLIC_API_SERVER_URL
const API_SERVER_URL =
	process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_SERVER_URL;
const IS_BACKEND_CONFIGURED = !!API_SERVER_URL;
const TARGET_BASE_URL = API_SERVER_URL || "http://localhost:3501";

/**
 * Main proxy handler
 */
async function handler(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const requestPath = `/${path.join("/")}`;

	// In preview environments, check if the backend is configured
	if (!IS_BACKEND_CONFIGURED && isPreviewEnvironment()) {
		console.warn(
			`[API Proxy] No API_SERVER_URL configured in preview environment. Path: ${requestPath}`,
		);
		return NextResponse.json(
			{
				error: "API backend not configured",
				code: "API_NOT_CONFIGURED",
				message:
					"The preview API is still initializing. Please wait a few minutes after PR creation.",
			},
			{ status: 503 },
		);
	}

	const targetUrl = buildTargetUrl(
		TARGET_BASE_URL,
		path,
		request.nextUrl.searchParams,
	);

	// Log in non-production for debugging
	if (isPreviewEnvironment()) {
		console.log(
			`[API Proxy] ${request.method} ${requestPath} → ${targetUrl.toString()}`,
		);
	}

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
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error(
			`[API Proxy] Error forwarding request to ${targetUrl.toString()}:`,
			errorMessage,
		);

		// Return 502 with error code for frontend to classify
		return NextResponse.json(
			{
				error: "Failed to connect to API server",
				code: "API_UNREACHABLE",
				message: isPreviewEnvironment()
					? "The preview API server is unreachable. It may still be initializing."
					: "Unable to reach the API server.",
			},
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
