import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import * as rateLimitModule from "./rate-limit";
import { rateLimitMiddleware } from "./rate-limit-middleware";

// Mock the rate-limit module
vi.mock("./rate-limit", () => ({
	checkRateLimit: vi.fn(),
	incrementRateLimit: vi.fn(),
	parseWindow: vi.fn((window: string) => {
		const match = window.match(/^(\d+)([mhd])$/);
		if (!match) return 0;
		const value = Number.parseInt(match[1], 10);
		const unit = match[2];
		switch (unit) {
			case "m":
				return value * 60 * 1000;
			case "h":
				return value * 60 * 60 * 1000;
			case "d":
				return value * 24 * 60 * 60 * 1000;
			default:
				return 0;
		}
	}),
	getAnonymousIdentifier: vi.fn((sessionId, ip) => `anon:${sessionId}:${ip}`),
	getUserIdentifier: vi.fn((userId) => `user:${userId}`),
	getOrgIdentifier: vi.fn((orgId) => `org:${orgId}`),
	hashIP: vi.fn((ip) => ip), // For test purposes, return IP as-is
}));

describe("rateLimitMiddleware", () => {
	it("should allow request when under rate limit", async () => {
		const app = new Hono();

		// Mock checkRateLimit to return allowed
		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 4,
			resetAt: new Date("2026-01-07T00:00:00Z"),
			limit: 5,
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
		expect(res.headers.get("X-RateLimit-Remaining")).toBe("4");
		expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
		expect(rateLimitModule.checkRateLimit).toHaveBeenCalled();
		expect(rateLimitModule.incrementRateLimit).toHaveBeenCalled();
	});

	it("should return 429 when rate limit exceeded", async () => {
		const app = new Hono();

		// Mock checkRateLimit to return not allowed
		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: false,
			remaining: 0,
			resetAt: new Date("2026-01-07T00:00:00Z"),
			limit: 5,
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(429);
		expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
		expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
		expect(res.headers.get("Retry-After")).toBeTruthy();

		const body = await res.json();
		expect(body).toHaveProperty("error", "Rate limit exceeded");
		expect(body).toHaveProperty("retryAfter");
		expect(body).toHaveProperty("resetAt");
	});

	it("should bypass rate limiting in development mode", async () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		const app = new Hono();

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: true }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		// Should not have called rate limit functions
		expect(rateLimitModule.checkRateLimit).not.toHaveBeenCalled();

		process.env.NODE_ENV = originalEnv;
	});

	it("should use configured rate limits from tool config", async () => {
		const app = new Hono();

		// Mock checkRateLimit to capture the arguments
		const checkMock = vi
			.mocked(rateLimitModule.checkRateLimit)
			.mockResolvedValue({
				allowed: true,
				remaining: 9,
				resetAt: new Date("2026-01-07T00:00:00Z"),
				limit: 10,
			});

		app.get(
			"/test",
			rateLimitMiddleware({
				toolSlug: "news-analyzer",
				bypassInDev: false,
			}),
			(c) => c.json({ success: true }),
		);

		await app.request("/test");

		// Verify the correct rate limits were used (news-analyzer: 10/day for anon)
		expect(checkMock).toHaveBeenCalledWith(
			expect.objectContaining({
				toolSlug: "news-analyzer",
				limit: 10,
			}),
		);
	});

	it("should add standard rate limit headers to response", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 2,
			resetAt: new Date("2026-01-07T00:00:00Z"),
			limit: 5,
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
		expect(res.headers.get("X-RateLimit-Remaining")).toBe("2");
		expect(res.headers.get("X-RateLimit-Reset")).toMatch(/^\d+$/);
	});

	it("should handle missing tool configuration with defaults", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 9,
			resetAt: new Date(),
			limit: 10,
		});

		// Use a tool slug that doesn't exist
		app.get(
			"/test",
			rateLimitMiddleware({
				toolSlug: "nonexistent-tool",
				bypassInDev: false,
			}),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		// Should use default rate limits for anonymous (10/day)
		expect(rateLimitModule.checkRateLimit).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 10,
			}),
		);
	});

	it("should handle x-forwarded-for header for IP detection", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 4,
			resetAt: new Date(),
			limit: 5,
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		await app.request("/test", {
			headers: { "x-forwarded-for": "203.0.113.195, 198.51.100.178" },
		});

		// Verify getAnonymousIdentifier was called with the first IP from x-forwarded-for
		expect(rateLimitModule.getAnonymousIdentifier).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining("203.0.113.195"),
		);
	});

	it("should handle x-real-ip header for IP detection", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 4,
			resetAt: new Date(),
			limit: 5,
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		await app.request("/test", {
			headers: { "x-real-ip": "198.51.100.42" },
		});

		// Verify getAnonymousIdentifier was called with the real IP
		expect(rateLimitModule.getAnonymousIdentifier).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining("198.51.100.42"),
		);
	});

	it("should handle cf-connecting-ip header for Cloudflare", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 4,
			resetAt: new Date(),
			limit: 5,
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		await app.request("/test", {
			headers: { "cf-connecting-ip": "203.0.113.50" },
		});

		// Verify getAnonymousIdentifier was called with CF IP
		expect(rateLimitModule.getAnonymousIdentifier).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining("203.0.113.50"),
		);
	});

	it("should use authenticated user identifier when user is logged in", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 59,
			resetAt: new Date(),
			limit: 60,
		});

		app.use("*", async (c, next) => {
			// Simulate auth middleware setting user context
			c.set("user", { id: "user_123", email: "test@example.com" });
			await next();
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		await app.request("/test");

		// Verify getUserIdentifier was called with user ID
		expect(rateLimitModule.getUserIdentifier).toHaveBeenCalledWith(
			"user_123",
		);
		// Should use authenticated rate limits (60/hour)
		expect(rateLimitModule.checkRateLimit).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 60,
			}),
		);
	});

	it("should use organization identifier when active org is set", async () => {
		const app = new Hono();

		vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 59,
			resetAt: new Date(),
			limit: 60,
		});

		app.use("*", async (c, next) => {
			// Simulate auth middleware with organization context
			c.set("session", { activeOrganizationId: "org_456" });
			await next();
		});

		app.get(
			"/test",
			rateLimitMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		await app.request("/test");

		// Verify getOrgIdentifier was called with org ID
		expect(rateLimitModule.getOrgIdentifier).toHaveBeenCalledWith(
			"org_456",
		);
	});
});
