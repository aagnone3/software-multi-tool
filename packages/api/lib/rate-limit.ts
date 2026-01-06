import { createHash } from "node:crypto";
import { db } from "@repo/database";

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: Date;
	limit: number;
}

export interface CheckRateLimitOptions {
	identifier: string;
	toolSlug: string;
	limit: number;
	windowMs: number;
}

export interface IncrementRateLimitOptions {
	identifier: string;
	toolSlug: string;
	windowMs: number;
}

/**
 * Parses a time window string (e.g., '1h', '1d', '1m') into milliseconds
 */
export function parseWindow(window: string): number {
	const match = window.match(/^(\d+)([mhd])$/);
	if (!match) {
		throw new Error(`Invalid window format: ${window}`);
	}

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	switch (unit) {
		case "m":
			return value * 60 * 1000; // minutes
		case "h":
			return value * 60 * 60 * 1000; // hours
		case "d":
			return value * 24 * 60 * 60 * 1000; // days
	}

	// This should never be reached due to the regex, but TypeScript needs it
	throw new Error(`Invalid window format: ${window}`);
}

/**
 * Hashes an IP address for privacy
 */
export function hashIP(ip: string): string {
	return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Creates an anonymous identifier from session ID and IP address
 */
export function getAnonymousIdentifier(sessionId: string, ip: string): string {
	return `anon:${sessionId}:${hashIP(ip)}`;
}

/**
 * Creates a user identifier
 */
export function getUserIdentifier(userId: string): string {
	return `user:${userId}`;
}

/**
 * Creates an organization identifier
 */
export function getOrgIdentifier(orgId: string): string {
	return `org:${orgId}`;
}

/**
 * Check if a rate limit allows the request
 * Returns information about whether the request is allowed and remaining quota
 */
export async function checkRateLimit(
	options: CheckRateLimitOptions,
): Promise<RateLimitResult> {
	const { identifier, toolSlug, limit, windowMs } = options;

	const now = new Date();
	const windowEnd = new Date(now.getTime());

	// Get the current rate limit entry for this window
	const entry = await db.rateLimitEntry.findFirst({
		where: {
			identifier,
			toolSlug,
			windowStart: {
				lte: now,
			},
			windowEnd: {
				gte: now,
			},
		},
	});

	if (!entry) {
		// No entry exists, so this is the first request in the window
		return {
			allowed: true,
			remaining: limit - 1,
			resetAt: windowEnd,
			limit,
		};
	}

	const allowed = entry.count < limit;
	const remaining = Math.max(0, limit - entry.count - 1);

	return {
		allowed,
		remaining,
		resetAt: entry.windowEnd,
		limit,
	};
}

/**
 * Increment the rate limit counter for an identifier
 * This should be called after a request is allowed
 */
export async function incrementRateLimit(
	options: IncrementRateLimitOptions,
): Promise<void> {
	const { identifier, toolSlug, windowMs } = options;

	const now = new Date();
	const windowStart = new Date(now.getTime() - windowMs);
	const windowEnd = new Date(now.getTime());

	// Use upsert with proper window alignment
	await db.rateLimitEntry.upsert({
		where: {
			identifier_toolSlug_windowStart: {
				identifier,
				toolSlug,
				windowStart,
			},
		},
		create: {
			identifier,
			toolSlug,
			windowStart,
			windowEnd,
			count: 1,
		},
		update: {
			count: {
				increment: 1,
			},
		},
	});
}

/**
 * Clean up expired rate limit entries
 * This should be run periodically (e.g., daily via cron job)
 */
export async function cleanupExpiredEntries(): Promise<number> {
	const result = await db.rateLimitEntry.deleteMany({
		where: {
			windowEnd: {
				lt: new Date(),
			},
		},
	});

	return result.count;
}
