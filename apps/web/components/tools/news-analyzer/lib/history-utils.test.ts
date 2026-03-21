import { describe, expect, it } from "vitest";
import {
	cleanArticleTitle,
	filterJobsBySearch,
	filterJobsByStatus,
	formatDuration,
	getArticleTitle,
	type NewsAnalyzerJob,
	paginateJobs,
	statusConfig,
} from "./history-utils";

function makeJob(overrides: Partial<NewsAnalyzerJob> = {}): NewsAnalyzerJob {
	return {
		id: "job-1",
		toolSlug: "news-analyzer",
		status: "COMPLETED",
		input: {},
		output: null,
		error: null,
		createdAt: new Date("2024-01-01"),
		completedAt: new Date("2024-01-01T00:01:00"),
		startedAt: new Date("2024-01-01T00:00:00"),
		...overrides,
	};
}

describe("cleanArticleTitle", () => {
	it("strips pipe-separated site suffix", () => {
		expect(cleanArticleTitle("Article Title | CNN")).toBe("Article Title");
	});

	it("strips dash-separated site suffix", () => {
		expect(cleanArticleTitle("Article Title - The New York Times")).toBe(
			"Article Title",
		);
	});

	it("does not strip if suffix is >= 40 chars", () => {
		const longSuffix = "A".repeat(40);
		const title = `Article Title | ${longSuffix}`;
		expect(cleanArticleTitle(title)).toBe(title);
	});

	it("returns original title if no separator found", () => {
		expect(cleanArticleTitle("Just a title")).toBe("Just a title");
	});
});

describe("getArticleTitle", () => {
	it("returns hostname + truncated path for URLs", () => {
		const result = getArticleTitle({
			articleUrl: "https://example.com/some/path",
		});
		expect(result).toContain("example.com");
	});

	it("truncates text input at 50 chars", () => {
		const text = "A".repeat(60);
		const result = getArticleTitle({ articleText: text });
		expect(result).toBe(`${"A".repeat(50)}...`);
	});

	it("returns Unknown for empty input", () => {
		expect(getArticleTitle({})).toBe("Unknown");
	});
});

describe("formatDuration", () => {
	it("returns dash when startedAt is missing", () => {
		expect(formatDuration(null, new Date())).toBe("-");
	});

	it("returns dash when completedAt is missing", () => {
		expect(formatDuration(new Date(), null)).toBe("-");
	});

	it("formats seconds when < 60", () => {
		const start = new Date("2024-01-01T00:00:00");
		const end = new Date("2024-01-01T00:00:45");
		expect(formatDuration(start, end)).toBe("45s");
	});

	it("formats minutes and seconds when >= 60", () => {
		const start = new Date("2024-01-01T00:00:00");
		const end = new Date("2024-01-01T00:01:30");
		expect(formatDuration(start, end)).toBe("1m 30s");
	});
});

describe("filterJobsBySearch", () => {
	const jobs = [
		makeJob({ input: { articleUrl: "https://cnn.com/politics" } }),
		makeJob({ input: { articleText: "Breaking news about tech" } }),
	];

	it("returns all jobs for empty search", () => {
		expect(filterJobsBySearch(jobs, "")).toHaveLength(2);
	});

	it("filters by URL content", () => {
		const result = filterJobsBySearch(jobs, "cnn");
		expect(result).toHaveLength(1);
	});

	it("filters by text content", () => {
		const result = filterJobsBySearch(jobs, "tech");
		expect(result).toHaveLength(1);
	});
});

describe("filterJobsByStatus", () => {
	const jobs = [
		makeJob({ status: "COMPLETED" }),
		makeJob({ status: "FAILED" }),
		makeJob({ status: "PENDING" }),
	];

	it("returns all for empty status", () => {
		expect(filterJobsByStatus(jobs, "")).toHaveLength(3);
	});

	it("filters by status", () => {
		expect(filterJobsByStatus(jobs, "FAILED")).toHaveLength(1);
	});
});

describe("paginateJobs", () => {
	const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	it("returns first page", () => {
		expect(paginateJobs(items, 1, 3)).toEqual([1, 2, 3]);
	});

	it("returns second page", () => {
		expect(paginateJobs(items, 2, 3)).toEqual([4, 5, 6]);
	});

	it("returns partial last page", () => {
		expect(paginateJobs(items, 4, 3)).toEqual([10]);
	});
});

describe("statusConfig", () => {
	it("has entries for all statuses", () => {
		const statuses = [
			"PENDING",
			"PROCESSING",
			"COMPLETED",
			"FAILED",
			"CANCELLED",
		] as const;
		for (const status of statuses) {
			expect(statusConfig[status]).toBeDefined();
			expect(statusConfig[status].label).toBeTruthy();
		}
	});
});
