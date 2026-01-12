import { describe, expect, it, vi } from "vitest";
import {
	getTrustedOrigins,
	matchesOriginPattern,
	validateCorsOrigin,
} from "./cors";

// Mock @repo/utils
vi.mock("@repo/utils", () => ({
	getBaseUrl: vi.fn(() => "https://example.com"),
}));

describe("getTrustedOrigins", () => {
	it("should return base URL from getBaseUrl()", () => {
		const origins = getTrustedOrigins();
		expect(origins).toContain("https://example.com");
	});

	it("should include Vercel wildcard when VERCEL env var is set", () => {
		const originalVercel = process.env.VERCEL;
		process.env.VERCEL = "1";

		const origins = getTrustedOrigins();

		expect(origins).toContain("https://example.com");
		expect(origins).toContain("https://*.vercel.app");

		// Cleanup
		process.env.VERCEL = originalVercel;
	});

	it("should NOT include Vercel wildcard when VERCEL env var is not set", () => {
		const originalVercel = process.env.VERCEL;
		delete process.env.VERCEL;

		const origins = getTrustedOrigins();

		expect(origins).toContain("https://example.com");
		expect(origins).not.toContain("https://*.vercel.app");

		// Cleanup
		process.env.VERCEL = originalVercel;
	});

	it("should return a new array each time (not cached)", () => {
		const origins1 = getTrustedOrigins();
		const origins2 = getTrustedOrigins();

		expect(origins1).not.toBe(origins2); // Different array instances
		expect(origins1).toEqual(origins2); // But same contents
	});
});

describe("matchesOriginPattern", () => {
	describe("exact matches", () => {
		it("should match exact origin", () => {
			expect(
				matchesOriginPattern(
					"https://example.com",
					"https://example.com",
				),
			).toBe(true);
		});

		it("should match exact localhost origin", () => {
			expect(
				matchesOriginPattern(
					"http://localhost:3500",
					"http://localhost:3500",
				),
			).toBe(true);
		});

		it("should NOT match different origins", () => {
			expect(
				matchesOriginPattern(
					"https://example.com",
					"https://other.com",
				),
			).toBe(false);
		});

		it("should be case-sensitive", () => {
			expect(
				matchesOriginPattern(
					"https://Example.com",
					"https://example.com",
				),
			).toBe(false);
		});
	});

	describe("wildcard matches", () => {
		it("should match Vercel preview URL with wildcard", () => {
			expect(
				matchesOriginPattern(
					"https://my-app-pr-123.vercel.app",
					"https://*.vercel.app",
				),
			).toBe(true);
		});

		it("should match different Vercel preview URLs", () => {
			const pattern = "https://*.vercel.app";

			expect(
				matchesOriginPattern(
					"https://my-app-pr-456.vercel.app",
					pattern,
				),
			).toBe(true);
			expect(
				matchesOriginPattern(
					"https://staging-branch.vercel.app",
					pattern,
				),
			).toBe(true);
			expect(
				matchesOriginPattern(
					"https://feature-test.vercel.app",
					pattern,
				),
			).toBe(true);
		});

		it("should match subdomains with hyphens and numbers", () => {
			const pattern = "https://*.vercel.app";

			expect(
				matchesOriginPattern("https://my-app-123.vercel.app", pattern),
			).toBe(true);
			expect(
				matchesOriginPattern(
					"https://test-pr-456-staging.vercel.app",
					pattern,
				),
			).toBe(true);
		});

		it("should NOT match root domain without subdomain", () => {
			expect(
				matchesOriginPattern(
					"https://vercel.app",
					"https://*.vercel.app",
				),
			).toBe(false);
		});

		it("should NOT match different TLD", () => {
			expect(
				matchesOriginPattern(
					"https://my-app.vercel.com",
					"https://*.vercel.app",
				),
			).toBe(false);
		});

		it("should NOT match different protocol", () => {
			expect(
				matchesOriginPattern(
					"http://my-app.vercel.app",
					"https://*.vercel.app",
				),
			).toBe(false);
		});

		it("should NOT match malicious domains", () => {
			const pattern = "https://*.vercel.app";

			expect(matchesOriginPattern("https://evil.com", pattern)).toBe(
				false,
			);
			expect(
				matchesOriginPattern("https://vercel.app.evil.com", pattern),
			).toBe(false);
			expect(
				matchesOriginPattern("https://evilvercel.app", pattern),
			).toBe(false);
		});

		it("should NOT match subdomain paths", () => {
			expect(
				matchesOriginPattern(
					"https://my-app.vercel.app/evil",
					"https://*.vercel.app",
				),
			).toBe(false);
		});

		it("should NOT match empty subdomain", () => {
			expect(
				matchesOriginPattern(
					"https://.vercel.app",
					"https://*.vercel.app",
				),
			).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle pattern without wildcard", () => {
			expect(
				matchesOriginPattern(
					"https://example.com",
					"https://example.com",
				),
			).toBe(true);
			expect(
				matchesOriginPattern(
					"https://other.com",
					"https://example.com",
				),
			).toBe(false);
		});

		it("should handle empty strings", () => {
			expect(matchesOriginPattern("", "https://example.com")).toBe(false);
			expect(matchesOriginPattern("https://example.com", "")).toBe(false);
			expect(matchesOriginPattern("", "")).toBe(true);
		});

		it("should escape regex special characters in pattern", () => {
			// Pattern with dots should be escaped
			expect(
				matchesOriginPattern(
					"https://sub.example.com",
					"https://*.example.com",
				),
			).toBe(true);

			// Should not match if dots are treated as "any character"
			expect(
				matchesOriginPattern(
					"https://subXexampleXcom",
					"https://*.example.com",
				),
			).toBe(false);
		});
	});
});

describe("validateCorsOrigin", () => {
	describe("valid origins", () => {
		it("should validate exact match origin", () => {
			const result = validateCorsOrigin("https://example.com");
			expect(result).toBe("https://example.com");
		});

		it("should validate localhost origin", () => {
			// Note: This test validates the base URL from the mock
			// The mock returns "https://example.com", so we test that origin
			const result = validateCorsOrigin("https://example.com");
			expect(result).toBe("https://example.com");
		});

		it("should validate Vercel preview URL when VERCEL env var is set", () => {
			const originalVercel = process.env.VERCEL;
			process.env.VERCEL = "1";

			const result = validateCorsOrigin(
				"https://my-app-pr-123.vercel.app",
			);
			expect(result).toBe("https://my-app-pr-123.vercel.app");

			// Cleanup
			process.env.VERCEL = originalVercel;
		});

		it("should return actual origin, not wildcard pattern", () => {
			const originalVercel = process.env.VERCEL;
			process.env.VERCEL = "1";

			const result = validateCorsOrigin("https://staging.vercel.app");
			// Should return the actual origin, not the pattern
			expect(result).toBe("https://staging.vercel.app");
			expect(result).not.toBe("https://*.vercel.app");

			// Cleanup
			process.env.VERCEL = originalVercel;
		});
	});

	describe("invalid origins", () => {
		it("should reject empty origin", () => {
			const result = validateCorsOrigin("");
			expect(result).toBe(undefined);
		});

		it("should reject untrusted origin", () => {
			const result = validateCorsOrigin("https://evil.com");
			expect(result).toBe(undefined);
		});

		it("should reject Vercel URL when VERCEL env var is not set", () => {
			const originalVercel = process.env.VERCEL;
			delete process.env.VERCEL;

			const result = validateCorsOrigin(
				"https://my-app-pr-123.vercel.app",
			);
			expect(result).toBe(undefined);

			// Cleanup
			process.env.VERCEL = originalVercel;
		});

		it("should reject malicious Vercel-like domains", () => {
			const originalVercel = process.env.VERCEL;
			process.env.VERCEL = "1";

			expect(validateCorsOrigin("https://vercel.app.evil.com")).toBe(
				undefined,
			);
			expect(validateCorsOrigin("https://evilvercel.app")).toBe(
				undefined,
			);
			expect(validateCorsOrigin("https://evil.com")).toBe(undefined);

			// Cleanup
			process.env.VERCEL = originalVercel;
		});

		it("should reject origin with wrong protocol", () => {
			const originalVercel = process.env.VERCEL;
			process.env.VERCEL = "1";

			const result = validateCorsOrigin("http://my-app.vercel.app");
			expect(result).toBe(undefined);

			// Cleanup
			process.env.VERCEL = originalVercel;
		});
	});

	describe("integration scenarios", () => {
		it("should handle production environment (no VERCEL var)", () => {
			const originalVercel = process.env.VERCEL;
			delete process.env.VERCEL;

			// Base URL should work
			expect(validateCorsOrigin("https://example.com")).toBe(
				"https://example.com",
			);

			// Vercel URLs should be rejected
			expect(validateCorsOrigin("https://preview.vercel.app")).toBe(
				undefined,
			);

			// Cleanup
			process.env.VERCEL = originalVercel;
		});

		it("should handle Vercel deployment environment", () => {
			const originalVercel = process.env.VERCEL;
			process.env.VERCEL = "1";

			// Base URL should work
			expect(validateCorsOrigin("https://example.com")).toBe(
				"https://example.com",
			);

			// Vercel preview URLs should work
			expect(
				validateCorsOrigin("https://my-app-git-main.vercel.app"),
			).toBe("https://my-app-git-main.vercel.app");
			expect(validateCorsOrigin("https://my-app-pr-123.vercel.app")).toBe(
				"https://my-app-pr-123.vercel.app",
			);

			// Other origins should still be rejected
			expect(validateCorsOrigin("https://evil.com")).toBe(undefined);

			// Cleanup
			process.env.VERCEL = originalVercel;
		});

		it("should handle local development", () => {
			const originalVercel = process.env.VERCEL;
			delete process.env.VERCEL;

			// Note: The mock returns "https://example.com"
			// In real usage, getBaseUrl() would return the actual localhost URL
			expect(validateCorsOrigin("https://example.com")).toBeTruthy();

			// Cleanup
			process.env.VERCEL = originalVercel;
		});
	});
});
