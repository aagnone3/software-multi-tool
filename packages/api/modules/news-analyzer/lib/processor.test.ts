import { describe, expect, it, vi } from "vitest";
import { processNewsAnalyzerJob } from "./processor";

// Mock the agent SDK
vi.mock("@repo/agent-sdk", () => ({
	executePrompt: vi.fn(),
}));

// Mock the content extractor
vi.mock("./content-extractor", () => ({
	extractContentFromUrl: vi.fn(),
	extractContentFromText: vi.fn(),
}));

import { executePrompt } from "@repo/agent-sdk";
import {
	extractContentFromText,
	extractContentFromUrl,
} from "./content-extractor";

describe("News Analyzer Processor", () => {
	describe("processNewsAnalyzerJob", () => {
		it("should return error if no URL or text provided", async () => {
			const job = {
				id: "test-job-1",
				input: {},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("articleUrl");
			}
		});

		it("should handle URL extraction failure", async () => {
			vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
				success: false,
				error: "Failed to fetch",
				errorType: "FETCH_FAILED",
			});

			const job = {
				id: "test-job-2",
				input: {
					articleUrl: "https://example.com/article",
				},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Failed to fetch");
			}
		});

		it("should process article from URL successfully", async () => {
			// Mock successful content extraction
			vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
				success: true,
				data: {
					title: "Test Article",
					content: "<p>Test content</p>",
					textContent: "Test content",
					excerpt: "Test",
					byline: "Author Name",
					siteName: "Example News",
					url: "https://example.com/article",
				},
			});

			// Mock successful Claude analysis
			vi.mocked(executePrompt).mockResolvedValueOnce({
				content: JSON.stringify({
					summary: ["Point 1", "Point 2", "Point 3"],
					bias: {
						politicalLean: "Center",
						sensationalism: 3,
						factualRating: "High",
					},
					entities: {
						people: ["Person A"],
						organizations: ["Org B"],
						places: ["City C"],
					},
					sentiment: "Neutral",
					sourceCredibility: "High",
				}),
			});

			const job = {
				id: "test-job-3",
				input: {
					articleUrl: "https://example.com/article",
				},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output).toBeDefined();
				const output = result.output as any;
				expect(output.summary).toHaveLength(3);
				expect(output.bias.politicalLean).toBe("Center");
				expect(output.sentiment).toBe("Neutral");
			}
		});

		it("should process article from text successfully", async () => {
			// Mock successful content extraction from text
			vi.mocked(extractContentFromText).mockResolvedValueOnce({
				success: true,
				data: {
					title: "Article",
					content: "<p>Article text content goes here</p>",
					textContent: "Article text content goes here",
					excerpt: "",
					byline: null,
					siteName: null,
					url: "",
				},
			});

			// Mock successful Claude analysis
			vi.mocked(executePrompt).mockResolvedValueOnce({
				content: JSON.stringify({
					summary: ["Summary point"],
					bias: {
						politicalLean: "Center-Left",
						sensationalism: 2,
						factualRating: "Medium",
					},
					entities: {
						people: [],
						organizations: [],
						places: [],
					},
					sentiment: "Positive",
				}),
			});

			const job = {
				id: "test-job-4",
				input: {
					articleText: "Article text content goes here",
				},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(true);
			if (result.success) {
				const output = result.output as any;
				expect(output.bias.politicalLean).toBe("Center-Left");
				expect(output.sentiment).toBe("Positive");
			}
		});

		it("should handle Claude analysis failure", async () => {
			// Mock successful content extraction
			vi.mocked(extractContentFromUrl).mockResolvedValueOnce({
				success: true,
				data: {
					title: "Test Article",
					content: "<p>Test content</p>",
					textContent: "Test content",
					excerpt: "Test",
					byline: null,
					siteName: null,
					url: "https://example.com/article",
				},
			});

			// Mock Claude API error
			vi.mocked(executePrompt).mockRejectedValueOnce(
				new Error("API rate limit exceeded"),
			);

			const job = {
				id: "test-job-5",
				input: {
					articleUrl: "https://example.com/article",
				},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Analysis failed");
				expect(result.error).toContain("API rate limit");
			}
		});

		it("should handle malformed Claude JSON response", async () => {
			// Mock successful content extraction
			vi.mocked(extractContentFromText).mockResolvedValueOnce({
				success: true,
				data: {
					title: "Article",
					content: "<p>Content</p>",
					textContent: "Content",
					excerpt: "",
					byline: null,
					siteName: null,
					url: "",
				},
			});

			// Mock Claude returning invalid JSON
			vi.mocked(executePrompt).mockResolvedValueOnce({
				content: "This is not JSON",
			});

			const job = {
				id: "test-job-6",
				input: {
					articleText: "Some text content",
				},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Analysis failed");
			}
		});

		it("should handle Claude JSON wrapped in markdown code fence", async () => {
			// Mock successful content extraction
			vi.mocked(extractContentFromText).mockResolvedValueOnce({
				success: true,
				data: {
					title: "Article",
					content: "<p>Content</p>",
					textContent: "Content",
					excerpt: "",
					byline: null,
					siteName: null,
					url: "",
				},
			});

			// Mock Claude returning JSON wrapped in code fence
			vi.mocked(executePrompt).mockResolvedValueOnce({
				content: `\`\`\`json
{
  "summary": ["Point 1"],
  "bias": {
    "politicalLean": "Right",
    "sensationalism": 7,
    "factualRating": "Low"
  },
  "entities": {
    "people": [],
    "organizations": [],
    "places": []
  },
  "sentiment": "Negative"
}
\`\`\``,
			});

			const job = {
				id: "test-job-7",
				input: {
					articleText: "Some text content",
				},
			};

			const result = await processNewsAnalyzerJob(job);

			expect(result.success).toBe(true);
			if (result.success) {
				const output = result.output as any;
				expect(output.bias.politicalLean).toBe("Right");
				expect(output.bias.sensationalism).toBe(7);
			}
		});
	});
});
