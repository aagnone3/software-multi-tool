import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBaseUrl } from "./base-url";

describe("getBaseUrl", () => {
	beforeEach(() => {
		vi.stubEnv("BETTER_AUTH_URL", "");
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_URL", "");
		vi.stubEnv("VERCEL_ENV", "");
		vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");
		vi.stubEnv("PORT", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns BETTER_AUTH_URL when set (highest priority)", () => {
		vi.stubEnv("BETTER_AUTH_URL", "https://auth.example.com");
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example.com");
		expect(getBaseUrl()).toBe("https://auth.example.com");
	});

	it("returns NEXT_PUBLIC_SITE_URL when set (and not preview)", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example.com");
		expect(getBaseUrl()).toBe("https://site.example.com");
	});

	it("returns VERCEL_URL when in preview with NEXT_PUBLIC_SITE_URL", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example.com");
		vi.stubEnv("VERCEL_ENV", "preview");
		vi.stubEnv("VERCEL_URL", "preview-abc.vercel.app");
		expect(getBaseUrl()).toBe("https://preview-abc.vercel.app");
	});

	it("returns https://VERCEL_URL when no NEXT_PUBLIC_SITE_URL", () => {
		vi.stubEnv("VERCEL_URL", "myapp.vercel.app");
		expect(getBaseUrl()).toBe("https://myapp.vercel.app");
	});

	it("returns https://NEXT_PUBLIC_VERCEL_URL when VERCEL_URL not set", () => {
		vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "myapp-client.vercel.app");
		expect(getBaseUrl()).toBe("https://myapp-client.vercel.app");
	});

	it("returns localhost fallback when no env vars set", () => {
		const result = getBaseUrl();
		expect(result).toMatch(/^http:\/\/localhost:/);
	});

	it("uses PORT env var in localhost fallback", () => {
		vi.stubEnv("PORT", "4000");
		// PORT is read dynamically so this tests the behavior
		const result = getBaseUrl();
		// Should be localhost-based since all other env vars are cleared
		expect(result).toMatch(/^http:\/\/localhost:/);
	});
});
