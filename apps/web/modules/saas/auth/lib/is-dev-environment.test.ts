import { describe, expect, it } from "vitest";
import { isDevEnvironment } from "./is-dev-environment";

describe("isDevEnvironment", () => {
	describe("local development (NODE_ENV !== production)", () => {
		it("returns true when NODE_ENV is 'development'", () => {
			expect(isDevEnvironment("development")).toBe(true);
		});

		it("returns true when NODE_ENV is 'test'", () => {
			expect(isDevEnvironment("test")).toBe(true);
		});

		it("returns true when NODE_ENV is undefined", () => {
			expect(isDevEnvironment(undefined)).toBe(true);
		});

		it("returns true when NODE_ENV is empty string", () => {
			expect(isDevEnvironment("")).toBe(true);
		});

		it("returns true when NODE_ENV is 'preview'", () => {
			expect(isDevEnvironment("preview")).toBe(true);
		});

		it("is case-sensitive and returns true for 'Production'", () => {
			// Uppercase Production is not 'production', so it's not production
			expect(isDevEnvironment("Production")).toBe(true);
		});

		it("returns true for any non-production value", () => {
			expect(isDevEnvironment("staging")).toBe(true);
			expect(isDevEnvironment("local")).toBe(true);
			expect(isDevEnvironment("ci")).toBe(true);
		});

		it("uses process.env.NODE_ENV when no argument provided", () => {
			// Test with test environment (default during testing)
			// In vitest, NODE_ENV is 'test', which is not production
			expect(isDevEnvironment()).toBe(true);
		});
	});

	describe("Vercel preview environments", () => {
		it("returns true when NODE_ENV is production but NEXT_PUBLIC_VERCEL_ENV is 'preview'", () => {
			// This is the key case: Vercel builds preview deploys with NODE_ENV=production
			// but sets NEXT_PUBLIC_VERCEL_ENV=preview
			expect(isDevEnvironment("production", "preview")).toBe(true);
		});

		it("returns false when NODE_ENV is production and NEXT_PUBLIC_VERCEL_ENV is 'production'", () => {
			expect(isDevEnvironment("production", "production")).toBe(false);
		});

		it("returns false when NODE_ENV is production and NEXT_PUBLIC_VERCEL_ENV is undefined", () => {
			expect(isDevEnvironment("production", undefined)).toBe(false);
		});

		it("returns false when NODE_ENV is production and NEXT_PUBLIC_VERCEL_ENV is empty string", () => {
			expect(isDevEnvironment("production", "")).toBe(false);
		});

		it("returns true for development regardless of NEXT_PUBLIC_VERCEL_ENV", () => {
			// Local dev takes precedence
			expect(isDevEnvironment("development", "production")).toBe(true);
			expect(isDevEnvironment("development", "preview")).toBe(true);
			expect(isDevEnvironment("development", undefined)).toBe(true);
		});

		it("returns true for 'development' value of NEXT_PUBLIC_VERCEL_ENV with NODE_ENV=production", () => {
			// NEXT_PUBLIC_VERCEL_ENV='development' is set when running `vercel dev`
			// This should NOT be treated as preview - only 'preview' string triggers dev mode
			expect(isDevEnvironment("production", "development")).toBe(false);
		});
	});

	describe("production environment", () => {
		it("returns false when NODE_ENV is 'production' and no vercel env", () => {
			expect(isDevEnvironment("production")).toBe(false);
		});

		it("returns false when both NODE_ENV and NEXT_PUBLIC_VERCEL_ENV are 'production'", () => {
			expect(isDevEnvironment("production", "production")).toBe(false);
		});
	});
});
