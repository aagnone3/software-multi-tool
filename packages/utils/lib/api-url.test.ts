import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getApiBaseUrl,
	getOrpcUrl,
	isPreviewEnvironment,
	shouldUseProxy,
} from "./api-url";

describe("isPreviewEnvironment", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns true when NEXT_PUBLIC_VERCEL_ENV is preview", () => {
		vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
		expect(isPreviewEnvironment()).toBe(true);
	});

	it("returns false when NEXT_PUBLIC_VERCEL_ENV is production", () => {
		vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
		expect(isPreviewEnvironment()).toBe(false);
	});

	it("returns false when NEXT_PUBLIC_VERCEL_ENV is not set", () => {
		vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
		expect(isPreviewEnvironment()).toBe(false);
	});
});

describe("shouldUseProxy", () => {
	it("always returns false (deprecated)", () => {
		expect(shouldUseProxy(true)).toBe(false);
		expect(shouldUseProxy(false)).toBe(false);
	});
});

describe("getApiBaseUrl (server-side)", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
		vi.stubEnv("BETTER_AUTH_URL", "");
		vi.stubEnv("VERCEL_URL", "");
		vi.stubEnv("VERCEL_ENV", "");
		vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns /api path from base URL", () => {
		const url = getApiBaseUrl();
		expect(url).toContain("/api");
	});
});

describe("getOrpcUrl (server-side)", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
		vi.stubEnv("BETTER_AUTH_URL", "");
		vi.stubEnv("VERCEL_URL", "");
		vi.stubEnv("VERCEL_ENV", "");
		vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns /api/rpc path from base URL", () => {
		const url = getOrpcUrl();
		expect(url).toContain("/api/rpc");
	});
});
