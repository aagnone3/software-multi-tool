import { describe, expect, it } from "vitest";
import {
	getAnonymousIdentifier,
	getOrgIdentifier,
	getUserIdentifier,
	hashIP,
	parseWindow,
} from "./rate-limit";

describe("parseWindow", () => {
	it("should parse minute windows correctly", () => {
		expect(parseWindow("1m")).toBe(60 * 1000);
		expect(parseWindow("5m")).toBe(5 * 60 * 1000);
		expect(parseWindow("30m")).toBe(30 * 60 * 1000);
	});

	it("should parse hour windows correctly", () => {
		expect(parseWindow("1h")).toBe(60 * 60 * 1000);
		expect(parseWindow("24h")).toBe(24 * 60 * 60 * 1000);
	});

	it("should parse day windows correctly", () => {
		expect(parseWindow("1d")).toBe(24 * 60 * 60 * 1000);
		expect(parseWindow("7d")).toBe(7 * 24 * 60 * 60 * 1000);
	});

	it("should throw error for invalid window format", () => {
		expect(() => parseWindow("invalid")).toThrow("Invalid window format");
		expect(() => parseWindow("1x")).toThrow("Invalid window format");
		expect(() => parseWindow("")).toThrow("Invalid window format");
	});
});

describe("hashIP", () => {
	it("should hash IP addresses consistently", () => {
		const ip = "192.168.1.1";
		const hash1 = hashIP(ip);
		const hash2 = hashIP(ip);
		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(16);
	});

	it("should produce different hashes for different IPs", () => {
		const hash1 = hashIP("192.168.1.1");
		const hash2 = hashIP("192.168.1.2");
		expect(hash1).not.toBe(hash2);
	});
});

describe("identifier functions", () => {
	it("should create anonymous identifiers", () => {
		const sessionId = "session-123";
		const ip = "192.168.1.1";
		const identifier = getAnonymousIdentifier(sessionId, ip);

		expect(identifier).toMatch(/^anon:session-123:[a-f0-9]{16}$/);
	});

	it("should create user identifiers", () => {
		const userId = "user-123";
		const identifier = getUserIdentifier(userId);

		expect(identifier).toBe("user:user-123");
	});

	it("should create organization identifiers", () => {
		const orgId = "org-123";
		const identifier = getOrgIdentifier(orgId);

		expect(identifier).toBe("org:org-123");
	});
});

// Note: Integration tests for checkRateLimit, incrementRateLimit, and cleanupExpiredEntries
// should be added in a separate integration test file with database setup (e.g., using Testcontainers).
// These functions require database access and are better tested in an integration environment.
