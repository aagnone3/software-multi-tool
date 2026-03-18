import { describe, expect, it } from "vitest";
import { extractContentFromUrl } from "./content-extractor";

const VERBOSE_INTEGRATION_TESTS =
	process.env.SMT_VERBOSE_INTEGRATION_TESTS === "1";

function logIntegrationDetails(...args: unknown[]) {
	if (VERBOSE_INTEGRATION_TESTS) {
		console.log(...args);
	}
}

/**
 * Integration tests for content extraction with real HTTP requests
 *
 * These tests make actual network requests and may be slower.
 * They validate that the content extractor works with real websites.
 */
describe("content-extractor (integration)", () => {
	// Increase timeout for real network requests
	const TIMEOUT = 30000;

	describe("extractContentFromUrl - real HTTP requests", () => {
		it(
			"should extract content from a real news article",
			async () => {
				// Use a stable, publicly accessible article
				const testUrl =
					"https://www.foxnews.com/world/us-forces-attempting-board-sanctioned-russian-flagged-oil-tanker-north-atlantic-sources-say";

				const result = await extractContentFromUrl(testUrl);

				// Verify successful extraction
				expect(result.success).toBe(true);

				if (result.success) {
					const { data } = result;

					// Verify extracted content structure
					expect(data.title).toBeTruthy();
					expect(data.title.length).toBeGreaterThan(0);

					expect(data.content).toBeTruthy();
					expect(data.content.length).toBeGreaterThan(100); // Should have substantial content

					expect(data.textContent).toBeTruthy();
					expect(data.textContent.length).toBeGreaterThan(100);

					expect(data.url).toBe(testUrl);

					// Fox News should have byline and siteName
					expect(data.siteName).toBeTruthy();
					expect(data.siteName).toContain("Fox");

					// Manual inspection stays available, but only when explicitly requested.
					logIntegrationDetails("Extracted title:", data.title);
					logIntegrationDetails("Extracted byline:", data.byline);
					logIntegrationDetails(
						"Content length:",
						data.textContent.length,
						"characters",
					);
				}
			},
			TIMEOUT,
		);

		it(
			"should handle HTTP errors gracefully (404)",
			async () => {
				const invalidUrl =
					"https://example.com/this-page-does-not-exist-12345";

				const result = await extractContentFromUrl(invalidUrl);

				// Should return error result (not throw)
				expect(result.success).toBe(false);

				if (!result.success) {
					expect(result.errorType).toBe("FETCH_FAILED");
					expect(result.error).toBeTruthy();
				}
			},
			TIMEOUT,
		);

		it(
			"should handle invalid URLs",
			async () => {
				const invalidUrl = "not-a-valid-url";

				const result = await extractContentFromUrl(invalidUrl);

				expect(result.success).toBe(false);

				if (!result.success) {
					expect(result.errorType).toBe("INVALID_URL");
					expect(result.error).toContain("Invalid URL");
				}
			},
			TIMEOUT,
		);

		it(
			"should handle timeout gracefully",
			async () => {
				// Use a URL that's likely to timeout (httpstat.us allows custom delays)
				const slowUrl = "https://httpstat.us/200?sleep=20000"; // 20 second delay

				const result = await extractContentFromUrl(slowUrl);

				// Should timeout after 15 seconds (configured in content-extractor.ts)
				expect(result.success).toBe(false);

				if (!result.success) {
					expect(result.errorType).toBe("FETCH_FAILED");
					expect(result.error).toContain("fetch");
				}
			},
			TIMEOUT,
		);
	});
});
