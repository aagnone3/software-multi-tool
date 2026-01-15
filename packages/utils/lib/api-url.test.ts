import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We need to dynamically import the module to test with mocked window
describe("api-url", () => {
	const originalEnv = process.env;
	const originalWindow = globalThis.window;

	beforeEach(() => {
		// Reset process.env before each test
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		// Restore original environment and window
		process.env = originalEnv;
		if (originalWindow === undefined) {
			// @ts-expect-error - we're intentionally deleting window
			delete globalThis.window;
		} else {
			globalThis.window = originalWindow;
		}
	});

	// Import the module fresh for each test to pick up window changes
	async function importModule() {
		const module = await import("./api-url");
		return module;
	}

	describe("isPreviewEnvironment", () => {
		it("returns true when NEXT_PUBLIC_VERCEL_ENV is 'preview'", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			const { isPreviewEnvironment } = await importModule();
			expect(isPreviewEnvironment()).toBe(true);
		});

		it("returns false when NEXT_PUBLIC_VERCEL_ENV is 'production'", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			const { isPreviewEnvironment } = await importModule();
			expect(isPreviewEnvironment()).toBe(false);
		});

		it("returns false when NEXT_PUBLIC_VERCEL_ENV is 'development'", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "development";
			const { isPreviewEnvironment } = await importModule();
			expect(isPreviewEnvironment()).toBe(false);
		});

		it("returns false when NEXT_PUBLIC_VERCEL_ENV is undefined", async () => {
			delete process.env.NEXT_PUBLIC_VERCEL_ENV;
			const { isPreviewEnvironment } = await importModule();
			expect(isPreviewEnvironment()).toBe(false);
		});
	});

	describe("shouldUseProxy", () => {
		it("returns true for client-side in preview environment", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			const { shouldUseProxy } = await importModule();
			expect(shouldUseProxy(true)).toBe(true);
		});

		it("returns false for server-side in preview environment", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			const { shouldUseProxy } = await importModule();
			expect(shouldUseProxy(false)).toBe(false);
		});

		it("returns false for client-side in production", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			const { shouldUseProxy } = await importModule();
			expect(shouldUseProxy(true)).toBe(false);
		});

		it("returns false for server-side in production", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			const { shouldUseProxy } = await importModule();
			expect(shouldUseProxy(false)).toBe(false);
		});
	});

	describe("getApiBaseUrl", () => {
		describe("in non-preview environment", () => {
			it("uses NEXT_PUBLIC_SITE_URL if available", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
				process.env.NEXT_PUBLIC_SITE_URL = "https://myapp.com";
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe("https://myapp.com/api");
			});

			it("uses NEXT_PUBLIC_VERCEL_URL if NEXT_PUBLIC_SITE_URL is not set", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
				delete process.env.NEXT_PUBLIC_SITE_URL;
				process.env.NEXT_PUBLIC_VERCEL_URL = "myapp.vercel.app";
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe("https://myapp.vercel.app/api");
			});

			it("falls back to localhost if no URL env vars are set", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
				delete process.env.NEXT_PUBLIC_SITE_URL;
				delete process.env.NEXT_PUBLIC_VERCEL_URL;
				process.env.PORT = "3500";
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe("http://localhost:3500/api");
			});
		});

		describe("in preview environment (server-side)", () => {
			// Note: These tests run in Node.js (server-side) by default
			it("uses NEXT_PUBLIC_API_SERVER_URL for server-side requests", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				process.env.NEXT_PUBLIC_API_SERVER_URL =
					"https://api-preview.onrender.com";
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe(
					"https://api-preview.onrender.com/api",
				);
			});

			it("uses API_SERVER_URL as fallback for server-side requests", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				delete process.env.NEXT_PUBLIC_API_SERVER_URL;
				process.env.API_SERVER_URL =
					"https://api-internal.onrender.com";
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe(
					"https://api-internal.onrender.com/api",
				);
			});

			it("falls back to base URL if no API server URL is set", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				delete process.env.NEXT_PUBLIC_API_SERVER_URL;
				delete process.env.API_SERVER_URL;
				process.env.NEXT_PUBLIC_SITE_URL = "https://preview.vercel.app";
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe("https://preview.vercel.app/api");
			});
		});

		describe("in preview environment (client-side)", () => {
			it("uses window.location.origin for proxy route", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				// Mock window to simulate client-side
				// @ts-expect-error - mocking window
				globalThis.window = {
					location: {
						origin: "https://my-preview.vercel.app",
					},
				};
				const { getApiBaseUrl } = await importModule();
				expect(getApiBaseUrl()).toBe(
					"https://my-preview.vercel.app/api/proxy",
				);
			});
		});
	});

	describe("getOrpcUrl", () => {
		describe("in non-preview environment", () => {
			it("uses NEXT_PUBLIC_SITE_URL if available", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
				process.env.NEXT_PUBLIC_SITE_URL = "https://myapp.com";
				const { getOrpcUrl } = await importModule();
				expect(getOrpcUrl()).toBe("https://myapp.com/api/rpc");
			});

			it("uses NEXT_PUBLIC_VERCEL_URL if NEXT_PUBLIC_SITE_URL is not set", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
				delete process.env.NEXT_PUBLIC_SITE_URL;
				process.env.NEXT_PUBLIC_VERCEL_URL = "myapp.vercel.app";
				const { getOrpcUrl } = await importModule();
				expect(getOrpcUrl()).toBe("https://myapp.vercel.app/api/rpc");
			});

			it("falls back to localhost if no URL env vars are set", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
				delete process.env.NEXT_PUBLIC_SITE_URL;
				delete process.env.NEXT_PUBLIC_VERCEL_URL;
				process.env.PORT = "3500";
				const { getOrpcUrl } = await importModule();
				expect(getOrpcUrl()).toBe("http://localhost:3500/api/rpc");
			});
		});

		describe("in preview environment (server-side)", () => {
			it("uses NEXT_PUBLIC_API_SERVER_URL for server-side requests", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				process.env.NEXT_PUBLIC_API_SERVER_URL =
					"https://api-preview.onrender.com";
				const { getOrpcUrl } = await importModule();
				expect(getOrpcUrl()).toBe(
					"https://api-preview.onrender.com/api/rpc",
				);
			});

			it("uses API_SERVER_URL as fallback for server-side requests", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				delete process.env.NEXT_PUBLIC_API_SERVER_URL;
				process.env.API_SERVER_URL =
					"https://api-internal.onrender.com";
				const { getOrpcUrl } = await importModule();
				expect(getOrpcUrl()).toBe(
					"https://api-internal.onrender.com/api/rpc",
				);
			});
		});

		describe("in preview environment (client-side)", () => {
			it("uses window.location.origin for proxy route", async () => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
				// Mock window to simulate client-side
				// @ts-expect-error - mocking window
				globalThis.window = {
					location: {
						origin: "https://my-preview.vercel.app",
					},
				};
				const { getOrpcUrl } = await importModule();
				expect(getOrpcUrl()).toBe(
					"https://my-preview.vercel.app/api/proxy/rpc",
				);
			});
		});
	});
});
