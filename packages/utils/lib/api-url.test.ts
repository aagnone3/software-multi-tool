import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getApiBaseUrl,
	getOrpcUrl,
	isPreviewEnvironment,
	shouldUseProxy,
} from "./api-url";

describe("api-url", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset process.env before each test
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe("isPreviewEnvironment", () => {
		it("returns true when NEXT_PUBLIC_VERCEL_ENV is 'preview'", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			expect(isPreviewEnvironment()).toBe(true);
		});

		it("returns false when NEXT_PUBLIC_VERCEL_ENV is 'production'", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			expect(isPreviewEnvironment()).toBe(false);
		});

		it("returns false when NEXT_PUBLIC_VERCEL_ENV is 'development'", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "development";
			expect(isPreviewEnvironment()).toBe(false);
		});

		it("returns false when NEXT_PUBLIC_VERCEL_ENV is undefined", () => {
			delete process.env.NEXT_PUBLIC_VERCEL_ENV;
			expect(isPreviewEnvironment()).toBe(false);
		});
	});

	describe("shouldUseProxy", () => {
		it("returns true for client-side in preview environment", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			expect(shouldUseProxy(true)).toBe(true);
		});

		it("returns false for server-side in preview environment", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			expect(shouldUseProxy(false)).toBe(false);
		});

		it("returns false for client-side in production", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			expect(shouldUseProxy(true)).toBe(false);
		});

		it("returns false for server-side in production", () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			expect(shouldUseProxy(false)).toBe(false);
		});
	});

	describe("getApiBaseUrl", () => {
		describe("in non-preview environment", () => {
			beforeEach(() => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			});

			it("uses NEXT_PUBLIC_SITE_URL if available", () => {
				process.env.NEXT_PUBLIC_SITE_URL = "https://myapp.com";
				expect(getApiBaseUrl()).toBe("https://myapp.com/api");
			});

			it("uses NEXT_PUBLIC_VERCEL_URL if NEXT_PUBLIC_SITE_URL is not set", () => {
				delete process.env.NEXT_PUBLIC_SITE_URL;
				process.env.NEXT_PUBLIC_VERCEL_URL = "myapp.vercel.app";
				expect(getApiBaseUrl()).toBe("https://myapp.vercel.app/api");
			});

			it("falls back to localhost if no URL env vars are set", () => {
				delete process.env.NEXT_PUBLIC_SITE_URL;
				delete process.env.NEXT_PUBLIC_VERCEL_URL;
				process.env.PORT = "3500";
				expect(getApiBaseUrl()).toBe("http://localhost:3500/api");
			});
		});

		describe("in preview environment (server-side)", () => {
			beforeEach(() => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			});

			// Note: These tests run in Node.js (server-side) by default
			it("uses NEXT_PUBLIC_API_SERVER_URL for server-side requests", () => {
				process.env.NEXT_PUBLIC_API_SERVER_URL =
					"https://api-preview.onrender.com";
				expect(getApiBaseUrl()).toBe(
					"https://api-preview.onrender.com/api",
				);
			});

			it("uses API_SERVER_URL as fallback for server-side requests", () => {
				delete process.env.NEXT_PUBLIC_API_SERVER_URL;
				process.env.API_SERVER_URL =
					"https://api-internal.onrender.com";
				expect(getApiBaseUrl()).toBe(
					"https://api-internal.onrender.com/api",
				);
			});

			it("falls back to base URL if no API server URL is set", () => {
				delete process.env.NEXT_PUBLIC_API_SERVER_URL;
				delete process.env.API_SERVER_URL;
				process.env.NEXT_PUBLIC_SITE_URL = "https://preview.vercel.app";
				expect(getApiBaseUrl()).toBe("https://preview.vercel.app/api");
			});
		});
	});

	describe("getOrpcUrl", () => {
		describe("in non-preview environment", () => {
			beforeEach(() => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			});

			it("uses NEXT_PUBLIC_SITE_URL if available", () => {
				process.env.NEXT_PUBLIC_SITE_URL = "https://myapp.com";
				expect(getOrpcUrl()).toBe("https://myapp.com/api/rpc");
			});

			it("uses NEXT_PUBLIC_VERCEL_URL if NEXT_PUBLIC_SITE_URL is not set", () => {
				delete process.env.NEXT_PUBLIC_SITE_URL;
				process.env.NEXT_PUBLIC_VERCEL_URL = "myapp.vercel.app";
				expect(getOrpcUrl()).toBe("https://myapp.vercel.app/api/rpc");
			});

			it("falls back to localhost if no URL env vars are set", () => {
				delete process.env.NEXT_PUBLIC_SITE_URL;
				delete process.env.NEXT_PUBLIC_VERCEL_URL;
				process.env.PORT = "3500";
				expect(getOrpcUrl()).toBe("http://localhost:3500/api/rpc");
			});
		});

		describe("in preview environment (server-side)", () => {
			beforeEach(() => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			});

			it("uses NEXT_PUBLIC_API_SERVER_URL for server-side requests", () => {
				process.env.NEXT_PUBLIC_API_SERVER_URL =
					"https://api-preview.onrender.com";
				expect(getOrpcUrl()).toBe(
					"https://api-preview.onrender.com/api/rpc",
				);
			});

			it("uses API_SERVER_URL as fallback for server-side requests", () => {
				delete process.env.NEXT_PUBLIC_API_SERVER_URL;
				process.env.API_SERVER_URL =
					"https://api-internal.onrender.com";
				expect(getOrpcUrl()).toBe(
					"https://api-internal.onrender.com/api/rpc",
				);
			});
		});
	});
});
