import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the environment before importing the module
const mockApiServerUrl = "https://api-preview.onrender.com";

describe("API Proxy Route", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			API_SERVER_URL: mockApiServerUrl,
		};
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("buildTargetUrl", () => {
		it("constructs URL with simple path", async () => {
			const { buildTargetUrl } = await import("./route");
			const path = ["health"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(path, searchParams);

			expect(result.toString()).toBe(`${mockApiServerUrl}/api/health`);
		});

		it("constructs URL with nested path", async () => {
			const { buildTargetUrl } = await import("./route");
			const path = ["rpc", "users", "getProfile"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(path, searchParams);

			expect(result.toString()).toBe(
				`${mockApiServerUrl}/api/rpc/users/getProfile`,
			);
		});

		it("forwards query parameters", async () => {
			const { buildTargetUrl } = await import("./route");
			const path = ["search"];
			const searchParams = new URLSearchParams();
			searchParams.set("q", "test query");
			searchParams.set("page", "1");

			const result = buildTargetUrl(path, searchParams);

			expect(result.searchParams.get("q")).toBe("test query");
			expect(result.searchParams.get("page")).toBe("1");
		});

		it("handles empty path array", async () => {
			const { buildTargetUrl } = await import("./route");
			const path: string[] = [];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(path, searchParams);

			expect(result.toString()).toBe(`${mockApiServerUrl}/api/`);
		});

		it("handles special characters in path", async () => {
			const { buildTargetUrl } = await import("./route");
			const path = ["users", "user@example.com"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(path, searchParams);

			// URL encodes special characters
			expect(result.pathname).toBe("/api/users/user@example.com");
		});

		it("handles special characters in query params", async () => {
			const { buildTargetUrl } = await import("./route");
			const path = ["search"];
			const searchParams = new URLSearchParams();
			searchParams.set("filter", "name=John&age>30");

			const result = buildTargetUrl(path, searchParams);

			expect(result.searchParams.get("filter")).toBe("name=John&age>30");
		});
	});

	describe("Default API_SERVER_URL", () => {
		it("falls back to localhost:3501 when API_SERVER_URL is not set", async () => {
			vi.resetModules();
			process.env = { ...originalEnv };
			delete process.env.API_SERVER_URL;

			const { buildTargetUrl } = await import("./route");
			const path = ["health"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(path, searchParams);

			expect(result.toString()).toBe("http://localhost:3501/api/health");
		});
	});
});
