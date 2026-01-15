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
 */

const API_SERVER_URL = process.env.API_SERVER_URL || "http://localhost:3501";

/**
 * Main proxy handler
 */
async function handler(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const targetUrl = buildTargetUrl(
		API_SERVER_URL,
		path,
		request.nextUrl.searchParams,
	);

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
