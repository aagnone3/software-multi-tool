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
		expect(url).not.toContain("/api/rpc");
	});

	it("returns full absolute URL on server-side", () => {
		const url = getApiBaseUrl();
		expect(url).toBe("https://example.com/api");
	});
});

describe("getApiBaseUrl (client-side)", () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, "window", {
			value: { location: { origin: "https://client.example.com" } },
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(globalThis, "window", {
			value: undefined,
			writable: true,
			configurable: true,
		});
	});

	it("returns /api path using window.location.origin", () => {
		const url = getApiBaseUrl();
		expect(url).toBe("https://client.example.com/api");
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

	it("returns full absolute URL on server-side", () => {
		const url = getOrpcUrl();
		expect(url).toBe("https://example.com/api/rpc");
	});
});

describe("getOrpcUrl (client-side)", () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, "window", {
			value: { location: { origin: "https://client.example.com" } },
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(globalThis, "window", {
			value: undefined,
			writable: true,
			configurable: true,
		});
	});

	it("returns /api/rpc path using window.location.origin", () => {
		const url = getOrpcUrl();
		expect(url).toBe("https://client.example.com/api/rpc");
	});
});
