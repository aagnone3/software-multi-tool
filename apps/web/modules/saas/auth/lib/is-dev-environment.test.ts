import { describe, expect, it, vi } from "vitest";
import { isDevEnvironment } from "./is-dev-environment";

describe("isDevEnvironment", () => {
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

	it("returns false when NODE_ENV is 'production'", () => {
		expect(isDevEnvironment("production")).toBe(false);
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
