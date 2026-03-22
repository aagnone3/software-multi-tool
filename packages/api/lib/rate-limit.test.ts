import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkRateLimit,
	cleanupExpiredEntries,
	getAnonymousIdentifier,
	getOrgIdentifier,
	getUserIdentifier,
	hashIP,
	incrementRateLimit,
	parseWindow,
} from "./rate-limit";

const dbMock = vi.hoisted(() => ({
	rateLimitEntry: {
		findUnique: vi.fn(),
		upsert: vi.fn(),
		deleteMany: vi.fn(),
	},
}));

vi.mock("@repo/database", () => ({
	db: dbMock,
}));

describe("parseWindow", () => {
	it("parses minutes", () => {
		expect(parseWindow("5m")).toBe(5 * 60 * 1000);
		expect(parseWindow("1m")).toBe(60 * 1000);
	});

	it("parses hours", () => {
		expect(parseWindow("1h")).toBe(60 * 60 * 1000);
		expect(parseWindow("24h")).toBe(24 * 60 * 60 * 1000);
	});

	it("parses days", () => {
		expect(parseWindow("1d")).toBe(24 * 60 * 60 * 1000);
		expect(parseWindow("7d")).toBe(7 * 24 * 60 * 60 * 1000);
	});

	it("throws on invalid format", () => {
		expect(() => parseWindow("invalid")).toThrow("Invalid window format");
		expect(() => parseWindow("1x")).toThrow("Invalid window format");
		expect(() => parseWindow("")).toThrow("Invalid window format");
	});
});

describe("hashIP", () => {
	it("returns a 16-char hex string", () => {
		const result = hashIP("192.168.1.1");
		expect(result).toHaveLength(16);
		expect(result).toMatch(/^[0-9a-f]+$/);
	});

	it("produces consistent results", () => {
		expect(hashIP("10.0.0.1")).toBe(hashIP("10.0.0.1"));
	});

	it("produces different results for different IPs", () => {
		expect(hashIP("10.0.0.1")).not.toBe(hashIP("10.0.0.2"));
	});
});

describe("getAnonymousIdentifier", () => {
	it("returns anon-prefixed identifier with hashed IP", () => {
		const result = getAnonymousIdentifier("sess-1", "192.168.1.1");
		expect(result).toMatch(/^anon:sess-1:[0-9a-f]{16}$/);
	});
});

describe("getUserIdentifier", () => {
	it("returns user-prefixed identifier", () => {
		expect(getUserIdentifier("user-1")).toBe("user:user-1");
	});
});

describe("getOrgIdentifier", () => {
	it("returns org-prefixed identifier", () => {
		expect(getOrgIdentifier("org-1")).toBe("org:org-1");
	});
});

describe("checkRateLimit", () => {
	const baseOptions = {
		identifier: "user:test",
		toolSlug: "test-tool",
		limit: 10,
		windowMs: 60 * 60 * 1000, // 1 hour
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("allows request when no entry exists", async () => {
		dbMock.rateLimitEntry.findUnique.mockResolvedValue(null);

		const result = await checkRateLimit(baseOptions);

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(9);
		expect(result.limit).toBe(10);
		expect(result.resetAt).toBeInstanceOf(Date);
	});

	it("allows request when under limit", async () => {
		dbMock.rateLimitEntry.findUnique.mockResolvedValue({
			count: 5,
			windowEnd: new Date(Date.now() + 60000),
		});

		const result = await checkRateLimit(baseOptions);

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("denies request when at limit", async () => {
		dbMock.rateLimitEntry.findUnique.mockResolvedValue({
			count: 10,
			windowEnd: new Date(Date.now() + 60000),
		});

		const result = await checkRateLimit(baseOptions);

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});
});

describe("incrementRateLimit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("upserts rate limit entry", async () => {
		dbMock.rateLimitEntry.upsert.mockResolvedValue({});

		await incrementRateLimit({
			identifier: "user:test",
			toolSlug: "test-tool",
			windowMs: 60 * 60 * 1000,
		});

		expect(dbMock.rateLimitEntry.upsert).toHaveBeenCalledOnce();
		const call = dbMock.rateLimitEntry.upsert.mock.calls[0][0];
		expect(call.create.count).toBe(1);
		expect(call.update.count.increment).toBe(1);
	});
});

describe("cleanupExpiredEntries", () => {
	it("deletes expired entries and returns count", async () => {
		dbMock.rateLimitEntry.deleteMany.mockResolvedValue({ count: 5 });

		const result = await cleanupExpiredEntries();

		expect(result).toBe(5);
		expect(dbMock.rateLimitEntry.deleteMany).toHaveBeenCalledWith({
			where: { windowEnd: { lt: expect.any(Date) } },
		});
	});
});
