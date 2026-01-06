import { config } from "@repo/config";
import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { nanoid } from "nanoid";
import {
	checkRateLimit,
	getAnonymousIdentifier,
	getOrgIdentifier,
	getUserIdentifier,
	incrementRateLimit,
	parseWindow,
} from "./rate-limit";

/**
 * Get client IP from request, handling various proxy headers
 */
function getClientIP(c: Context): string {
	// Check common proxy headers in order of preference
	const forwardedFor = c.req.header("x-forwarded-for");
	if (forwardedFor) {
		// x-forwarded-for can contain multiple IPs, take the first one
		return forwardedFor.split(",")[0].trim();
	}

	const realIP = c.req.header("x-real-ip");
	if (realIP) {
		return realIP;
	}

	const cfConnectingIP = c.req.header("cf-connecting-ip");
	if (cfConnectingIP) {
		return cfConnectingIP;
	}

	// Fallback to a default if no IP is found
	return "127.0.0.1";
}

/**
 * Get or create an anonymous session ID
 */
function getOrCreateSessionId(c: Context): string {
	const cookieName = "tool_session";
	let sessionId = getCookie(c, cookieName);

	if (!sessionId) {
		sessionId = nanoid();
		// Set cookie to expire in 30 days
		setCookie(c, cookieName, sessionId, {
			maxAge: 30 * 24 * 60 * 60,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
		});
	}

	return sessionId;
}

/**
 * Get the identifier for rate limiting based on authentication status
 */
function getIdentifier(c: Context): string {
	// Check for authenticated user from context
	// This assumes the auth context is set by better-auth or similar middleware
	const user = c.get("user");
	const session = c.get("session");

	if (user?.id) {
		return getUserIdentifier(user.id);
	}

	if (session?.activeOrganizationId) {
		return getOrgIdentifier(session.activeOrganizationId);
	}

	// Anonymous user - use session + IP
	const sessionId = getOrCreateSessionId(c);
	const ip = getClientIP(c);
	return getAnonymousIdentifier(sessionId, ip);
}

/**
 * Check if the request is from an authenticated user
 */
function isAuthenticated(c: Context): boolean {
	const user = c.get("user");
	return !!user?.id;
}

/**
 * Get rate limit configuration for a tool
 */
function getToolRateLimits(toolSlug: string, authenticated: boolean) {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);

	if (!tool?.rateLimits) {
		// Default rate limits if not configured
		return authenticated
			? { requests: 60, window: "1h" }
			: { requests: 10, window: "1d" };
	}

	return authenticated
		? tool.rateLimits.authenticated || { requests: 60, window: "1h" }
		: tool.rateLimits.anonymous || { requests: 10, window: "1d" };
}

export interface RateLimitMiddlewareOptions {
	toolSlug: string;
	/** Allow bypassing rate limits in development */
	bypassInDev?: boolean;
}

/**
 * Rate limit middleware for Hono
 * Checks rate limits and adds appropriate headers to responses
 */
export function rateLimitMiddleware(options: RateLimitMiddlewareOptions) {
	const { toolSlug, bypassInDev = true } = options;

	return async (c: Context, next: Next) => {
		// Bypass in development if configured
		if (bypassInDev && process.env.NODE_ENV === "development") {
			await next();
			return;
		}

		// Get identifier and rate limits
		const identifier = getIdentifier(c);
		const authenticated = isAuthenticated(c);
		const limits = getToolRateLimits(toolSlug, authenticated);
		const windowMs = parseWindow(limits.window);

		// Check rate limit
		const result = await checkRateLimit({
			identifier,
			toolSlug,
			limit: limits.requests,
			windowMs,
		});

		// Add rate limit headers
		c.header("X-RateLimit-Limit", limits.requests.toString());
		c.header("X-RateLimit-Remaining", result.remaining.toString());
		c.header(
			"X-RateLimit-Reset",
			Math.floor(result.resetAt.getTime() / 1000).toString(),
		);

		// If rate limit exceeded, return 429
		if (!result.allowed) {
			const retryAfter = Math.ceil(
				(result.resetAt.getTime() - Date.now()) / 1000,
			);
			c.header("Retry-After", retryAfter.toString());

			return c.json(
				{
					error: "Rate limit exceeded",
					message: authenticated
						? "You have exceeded your rate limit. Please try again later."
						: "You have exceeded your rate limit. Please sign in for higher limits or try again later.",
					retryAfter,
					resetAt: result.resetAt.toISOString(),
				},
				429,
			);
		}

		// Process the request
		await next();

		// Increment rate limit after successful request
		await incrementRateLimit({
			identifier,
			toolSlug,
			windowMs,
		});
	};
}
