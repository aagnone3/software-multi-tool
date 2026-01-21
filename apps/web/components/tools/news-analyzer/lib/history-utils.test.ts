import { describe, expect, it } from "vitest";
import {
	filterJobsBySearch,
	filterJobsByStatus,
	formatDuration,
	getArticleTitle,
	type NewsAnalyzerJob,
	paginateJobs,
	statusConfig,
} from "./history-utils";

describe("history-utils", () => {
	describe("getArticleTitle", () => {
		it("extracts hostname and path from valid URL", () => {
			const input = {
				articleUrl: "https://example.com/article/my-news-story",
			};
			const result = getArticleTitle(input);
			expect(result).toBe("example.com/article/my-news-story");
		});

		it("truncates long paths with ellipsis", () => {
			const input = {
				articleUrl:
					"https://example.com/very/long/path/that/exceeds/the/maximum/length/limit/here",
			};
			const result = getArticleTitle(input);
			expect(result).toContain("example.com");
			expect(result).toContain("...");
			expect(result.length).toBeLessThanOrEqual(50);
		});

		it("handles invalid URLs gracefully", () => {
			const input = { articleUrl: "not-a-valid-url" };
			const result = getArticleTitle(input);
			expect(result).toBe("not-a-valid-url");
		});

		it("truncates long invalid URLs", () => {
			const longUrl = "a".repeat(100);
			const input = { articleUrl: longUrl };
			const result = getArticleTitle(input);
			expect(result).toBe("a".repeat(50) + "...");
		});

		it("returns truncated text for articleText input", () => {
			const input = {
				articleText: "This is a sample article text content",
			};
			const result = getArticleTitle(input);
			expect(result).toBe("This is a sample article text content");
		});

		it("truncates long article text with ellipsis", () => {
			const longText = "x".repeat(100);
			const input = { articleText: longText };
			const result = getArticleTitle(input);
			expect(result).toBe("x".repeat(50) + "...");
		});

		it('returns "Unknown" when no input provided', () => {
			const input = {};
			const result = getArticleTitle(input);
			expect(result).toBe("Unknown");
		});

		it("prefers URL over text when both provided", () => {
			const input = {
				articleUrl: "https://example.com/test",
				articleText: "Some text",
			};
			const result = getArticleTitle(input);
			expect(result).toContain("example.com");
		});
	});

	describe("formatDuration", () => {
		it('returns "-" when startedAt is null', () => {
			const result = formatDuration(null, new Date());
			expect(result).toBe("-");
		});

		it('returns "-" when completedAt is null', () => {
			const result = formatDuration(new Date(), null);
			expect(result).toBe("-");
		});

		it('returns "-" when both are null', () => {
			const result = formatDuration(null, null);
			expect(result).toBe("-");
		});

		it("formats seconds correctly for durations under 60s", () => {
			const start = new Date("2025-01-01T10:00:00Z");
			const end = new Date("2025-01-01T10:00:30Z");
			const result = formatDuration(start, end);
			expect(result).toBe("30s");
		});

		it("formats minutes and seconds correctly", () => {
			const start = new Date("2025-01-01T10:00:00Z");
			const end = new Date("2025-01-01T10:02:15Z");
			const result = formatDuration(start, end);
			expect(result).toBe("2m 15s");
		});

		it("handles exactly 60 seconds", () => {
			const start = new Date("2025-01-01T10:00:00Z");
			const end = new Date("2025-01-01T10:01:00Z");
			const result = formatDuration(start, end);
			expect(result).toBe("1m 0s");
		});

		it("handles zero duration", () => {
			const time = new Date("2025-01-01T10:00:00Z");
			const result = formatDuration(time, time);
			expect(result).toBe("0s");
		});
	});

	describe("filterJobsBySearch", () => {
		const mockJobs: NewsAnalyzerJob[] = [
			{
				id: "1",
				toolSlug: "news-analyzer",
				status: "COMPLETED",
				input: { articleUrl: "https://example.com/politics" },
				output: null,
				error: null,
				createdAt: new Date(),
				completedAt: new Date(),
			},
			{
				id: "2",
				toolSlug: "news-analyzer",
				status: "COMPLETED",
				input: { articleText: "Breaking news about technology" },
				output: null,
				error: null,
				createdAt: new Date(),
				completedAt: new Date(),
			},
			{
				id: "3",
				toolSlug: "news-analyzer",
				status: "FAILED",
				input: { articleUrl: "https://news.site/sports" },
				output: null,
				error: "Failed",
				createdAt: new Date(),
				completedAt: null,
			},
		];

		it("returns all jobs when search term is empty", () => {
			const result = filterJobsBySearch(mockJobs, "");
			expect(result).toHaveLength(3);
		});

		it("filters by URL hostname", () => {
			const result = filterJobsBySearch(mockJobs, "example");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("1");
		});

		it("filters by URL path", () => {
			const result = filterJobsBySearch(mockJobs, "politics");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("1");
		});

		it("filters by article text", () => {
			const result = filterJobsBySearch(mockJobs, "technology");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("2");
		});

		it("is case insensitive", () => {
			const result = filterJobsBySearch(mockJobs, "BREAKING");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("2");
		});

		it("returns empty array when no matches", () => {
			const result = filterJobsBySearch(mockJobs, "nonexistent");
			expect(result).toHaveLength(0);
		});
	});

	describe("filterJobsByStatus", () => {
		const mockJobs: NewsAnalyzerJob[] = [
			{
				id: "1",
				toolSlug: "news-analyzer",
				status: "COMPLETED",
				input: { articleUrl: "https://example.com" },
				output: null,
				error: null,
				createdAt: new Date(),
				completedAt: new Date(),
			},
			{
				id: "2",
				toolSlug: "news-analyzer",
				status: "FAILED",
				input: { articleUrl: "https://example.com" },
				output: null,
				error: "Error",
				createdAt: new Date(),
				completedAt: null,
			},
			{
				id: "3",
				toolSlug: "news-analyzer",
				status: "PENDING",
				input: { articleUrl: "https://example.com" },
				output: null,
				error: null,
				createdAt: new Date(),
				completedAt: null,
			},
		];

		it("returns all jobs when status is empty string", () => {
			const result = filterJobsByStatus(mockJobs, "");
			expect(result).toHaveLength(3);
		});

		it("filters by COMPLETED status", () => {
			const result = filterJobsByStatus(mockJobs, "COMPLETED");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("1");
		});

		it("filters by FAILED status", () => {
			const result = filterJobsByStatus(mockJobs, "FAILED");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("2");
		});

		it("filters by PENDING status", () => {
			const result = filterJobsByStatus(mockJobs, "PENDING");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("3");
		});

		it("returns empty array when no matches", () => {
			const result = filterJobsByStatus(mockJobs, "PROCESSING");
			expect(result).toHaveLength(0);
		});
	});

	describe("paginateJobs", () => {
		const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		it("returns first page correctly", () => {
			const result = paginateJobs(items, 1, 3);
			expect(result).toEqual([1, 2, 3]);
		});

		it("returns second page correctly", () => {
			const result = paginateJobs(items, 2, 3);
			expect(result).toEqual([4, 5, 6]);
		});

		it("handles last page with fewer items", () => {
			const result = paginateJobs(items, 4, 3);
			expect(result).toEqual([10]);
		});

		it("returns empty array for out of range page", () => {
			const result = paginateJobs(items, 10, 3);
			expect(result).toEqual([]);
		});

		it("handles empty array", () => {
			const result = paginateJobs([], 1, 10);
			expect(result).toEqual([]);
		});

		it("returns all items when page size exceeds total", () => {
			const result = paginateJobs(items, 1, 20);
			expect(result).toEqual(items);
		});
	});

	describe("statusConfig", () => {
		it("has all job statuses defined", () => {
			expect(statusConfig.PENDING).toBeDefined();
			expect(statusConfig.PROCESSING).toBeDefined();
			expect(statusConfig.COMPLETED).toBeDefined();
			expect(statusConfig.FAILED).toBeDefined();
			expect(statusConfig.CANCELLED).toBeDefined();
		});

		it("has correct labels", () => {
			expect(statusConfig.COMPLETED.label).toBe("Completed");
			expect(statusConfig.FAILED.label).toBe("Failed");
		});

		it("has correct variants", () => {
			expect(statusConfig.COMPLETED.variant).toBe("success");
			expect(statusConfig.FAILED.variant).toBe("error");
			expect(statusConfig.PENDING.variant).toBe("warning");
		});
	});
});
