import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAppConfig = vi.hoisted(() => ({
	ui: {
		saas: { enabled: true },
		marketing: { enabled: true },
	},
	tools: {
		registry: [
			{
				slug: "news-analyzer",
				enabled: true,
				public: true,
				name: "News Analyzer",
			},
			{
				slug: "invoice-processor",
				enabled: true,
				public: false,
				name: "Invoice Processor",
			},
			{
				slug: "disabled-tool",
				enabled: false,
				public: true,
				name: "Disabled Tool",
			},
		],
	},
}));

const mockGetSessionCookie = vi.hoisted(() => vi.fn());

vi.mock("@repo/config", () => ({ config: mockAppConfig }));
vi.mock("better-auth/cookies", () => ({
	getSessionCookie: mockGetSessionCookie,
}));

function makeRequest(url: string, cookie?: string) {
	const req = new NextRequest(new URL(url, "http://localhost:3000"));
	if (cookie) {
		req.headers.set("cookie", cookie);
	}
	return req;
}

describe("middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAppConfig.ui.saas.enabled = true;
		mockAppConfig.ui.marketing.enabled = true;
		mockGetSessionCookie.mockReturnValue(null);
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe("/app routes", () => {
		it("redirects to / when saas is disabled", async () => {
			mockAppConfig.ui.saas.enabled = false;
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/app/dashboard");
			const res = await middleware(req);
			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain("/");
		});

		it("allows public tool route without session", async () => {
			const { default: middleware } = await import("./middleware");
			const req = makeRequest(
				"http://localhost:3000/app/tools/news-analyzer",
			);
			const res = await middleware(req);
			expect(res.status).toBe(200);
		});

		it("allows /app/tools listing page without session", async () => {
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/app/tools");
			const res = await middleware(req);
			expect(res.status).toBe(200);
		});

		it("redirects to login when no session for protected route", async () => {
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/app/dashboard");
			const res = await middleware(req);
			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain("/auth/login");
			expect(res.headers.get("location")).toContain("redirectTo");
		});

		it("allows private tool route with session", async () => {
			mockGetSessionCookie.mockReturnValue("session-token");
			const { default: middleware } = await import("./middleware");
			const req = makeRequest(
				"http://localhost:3000/app/tools/invoice-processor",
				"better-auth.session_token=abc",
			);
			const res = await middleware(req);
			expect(res.status).toBe(200);
		});

		it("treats disabled tool as non-public (requires auth)", async () => {
			const { default: middleware } = await import("./middleware");
			const req = makeRequest(
				"http://localhost:3000/app/tools/disabled-tool",
			);
			const res = await middleware(req);
			// disabled tool is not public, no session → redirect to login
			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain("/auth/login");
		});
	});

	describe("/auth routes", () => {
		it("redirects to / when saas is disabled", async () => {
			mockAppConfig.ui.saas.enabled = false;
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/auth/login");
			const res = await middleware(req);
			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain("/");
		});

		it("allows auth routes when saas enabled", async () => {
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/auth/login");
			const res = await middleware(req);
			expect(res.status).toBe(200);
		});
	});

	describe("marketing routes", () => {
		it("redirects to /app when marketing is disabled", async () => {
			mockAppConfig.ui.marketing.enabled = false;
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/");
			const res = await middleware(req);
			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain("/app");
		});

		it("allows marketing routes when enabled", async () => {
			const { default: middleware } = await import("./middleware");
			const req = makeRequest("http://localhost:3000/");
			const res = await middleware(req);
			expect(res.status).toBe(200);
		});
	});
});
