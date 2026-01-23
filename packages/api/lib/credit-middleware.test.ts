import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as creditsModule from "./credits";
import * as rateLimitMiddlewareModule from "./rate-limit-middleware";

// Mock the credits module
vi.mock("./credits", () => ({
	hasCredits: vi.fn(),
	deductCredits: vi.fn(),
	InsufficientCreditsError: class InsufficientCreditsError extends Error {
		constructor(
			public readonly organizationId: string,
			public readonly required: number,
			public readonly available: number,
		) {
			super(
				`Insufficient credits: required ${required}, available ${available}`,
			);
			this.name = "InsufficientCreditsError";
		}
	},
}));

// Mock config
vi.mock("config", () => ({
	getToolCreditCost: vi.fn((slug: string) => {
		const costs: Record<string, number> = {
			"bg-remover": 1,
			"speaker-separation": 2,
			"invoice-processor": 3,
			"contract-analyzer": 5,
		};
		return costs[slug];
	}),
}));

// Mock rate-limit-middleware for toolMiddleware tests
vi.mock("./rate-limit-middleware", () => ({
	rateLimitMiddleware: vi.fn(
		() => async (_c: unknown, next: () => Promise<void>) => {
			await next();
		},
	),
}));

// Import after mocks are set up
import { creditMiddleware, toolMiddleware } from "./credit-middleware";

describe("creditMiddleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should skip credit check for anonymous users", async () => {
		const app = new Hono();

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		// Should not have called credit functions for anonymous users
		expect(creditsModule.hasCredits).not.toHaveBeenCalled();
		expect(creditsModule.deductCredits).not.toHaveBeenCalled();
	});

	it("should bypass credit check in development mode", async () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		const app = new Hono();

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: true }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		expect(creditsModule.hasCredits).not.toHaveBeenCalled();

		process.env.NODE_ENV = originalEnv;
	});

	it("should allow request when user has sufficient credits", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockResolvedValue({
			id: "txn_123",
			amount: -1,
			type: "usage",
		} as never);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		expect(creditsModule.hasCredits).toHaveBeenCalledWith("org_123", 1);
		expect(creditsModule.deductCredits).toHaveBeenCalledWith({
			organizationId: "org_123",
			amount: 1,
			toolSlug: "bg-remover",
			jobId: undefined,
			description: "Tool usage: bg-remover",
		});
	});

	it("should return 402 when user has insufficient credits", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: false,
			balance: 0,
			isOverage: false,
		});

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({
				toolSlug: "invoice-processor",
				bypassInDev: false,
			}),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(402);

		const body = await res.json();
		expect(body).toHaveProperty("error", "Insufficient credits");
		expect(body).toHaveProperty("code", "INSUFFICIENT_CREDITS");
		expect(body).toHaveProperty("balance", 0);
		expect(body).toHaveProperty("required", 3); // invoice-processor costs 3 credits
	});

	it("should add credit info headers to response", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 50,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockResolvedValue({
			id: "txn_123",
			amount: -1,
			type: "usage",
		} as never);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		expect(res.headers.get("X-Credits-Balance")).toBe("50");
		expect(res.headers.get("X-Credits-Required")).toBe("1");
		expect(res.headers.get("X-Credits-Remaining")).toBe("49");
		expect(res.headers.get("X-Credits-Used")).toBe("1");
	});

	it("should support variable cost calculation via getCost function", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockResolvedValue({
			id: "txn_123",
			amount: -10,
			type: "usage",
		} as never);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			// Simulate parsed body with duration
			c.set("parsedBody", { durationSeconds: 300 }); // 5 minutes
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({
				toolSlug: "speaker-separation",
				bypassInDev: false,
				getCost: (c) => {
					const body = c.get("parsedBody") as {
						durationSeconds: number;
					};
					const minutes = Math.ceil(body.durationSeconds / 60);
					return minutes * 2; // 2 credits per minute
				},
			}),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		// 5 minutes * 2 credits per minute = 10 credits
		expect(creditsModule.hasCredits).toHaveBeenCalledWith("org_123", 10);
		expect(creditsModule.deductCredits).toHaveBeenCalledWith({
			organizationId: "org_123",
			amount: 10,
			toolSlug: "speaker-separation",
			jobId: undefined,
			description: "Tool usage: speaker-separation",
		});
	});

	it("should not deduct credits on failed request (4xx/5xx)", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ error: "Bad request" }, 400),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(400);
		expect(creditsModule.hasCredits).toHaveBeenCalled();
		// Should not deduct credits for failed requests
		expect(creditsModule.deductCredits).not.toHaveBeenCalled();
	});

	it("should use default cost of 1 when tool not found in config", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockResolvedValue({
			id: "txn_123",
			amount: -1,
			type: "usage",
		} as never);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "unknown-tool", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		// Should use default cost of 1
		expect(creditsModule.hasCredits).toHaveBeenCalledWith("org_123", 1);
	});

	it("should include jobId in deduction when set by handler", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockResolvedValue({
			id: "txn_123",
			amount: -1,
			type: "usage",
		} as never);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => {
				c.set("jobId", "job_abc123");
				return c.json({ success: true });
			},
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		expect(creditsModule.deductCredits).toHaveBeenCalledWith({
			organizationId: "org_123",
			amount: 1,
			toolSlug: "bg-remover",
			jobId: "job_abc123",
			description: "Tool usage: bg-remover",
		});
	});

	it("should handle credit deduction errors gracefully", async () => {
		const app = new Hono();
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockRejectedValue(
			new Error("Database error"),
		);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			creditMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		// Request should still succeed - user already got their result
		expect(res.status).toBe(200);
		expect(consoleSpy).toHaveBeenCalledWith(
			"Failed to deduct credits:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});
});

describe("toolMiddleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should apply both rate limit and credit check middlewares", async () => {
		const app = new Hono();

		vi.mocked(creditsModule.hasCredits).mockResolvedValue({
			allowed: true,
			balance: 100,
			isOverage: false,
		});
		vi.mocked(creditsModule.deductCredits).mockResolvedValue({
			id: "txn_123",
			amount: -1,
			type: "usage",
		} as never);

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			toolMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		const res = await app.request("/test");

		expect(res.status).toBe(200);
		// Rate limit should be called
		expect(
			rateLimitMiddlewareModule.rateLimitMiddleware,
		).toHaveBeenCalledWith({
			toolSlug: "bg-remover",
			bypassInDev: false,
		});
		// Credit check should be performed
		expect(creditsModule.hasCredits).toHaveBeenCalledWith("org_123", 1);
	});

	it("should stop at rate limit if exceeded", async () => {
		const app = new Hono();

		// Mock rate limit to reject - don't call next(), which blocks the request
		vi.mocked(
			rateLimitMiddlewareModule.rateLimitMiddleware,
		).mockReturnValue(async (_c, _next) => {
			// Don't call next() to simulate rate limit blocking
			// The toolMiddleware checks if rateLimitPassed is false
		});

		app.use("*", async (c, next) => {
			c.set("session", { activeOrganizationId: "org_123" });
			await next();
		});

		app.get(
			"/test",
			toolMiddleware({ toolSlug: "bg-remover", bypassInDev: false }),
			(c) => c.json({ success: true }),
		);

		await app.request("/test");

		// When rate limit blocks, toolMiddleware returns early without response
		// This causes Hono to return 404 (no matching route completed)
		// The key assertion is that credit check should not have been called
		expect(creditsModule.hasCredits).not.toHaveBeenCalled();
	});
});
