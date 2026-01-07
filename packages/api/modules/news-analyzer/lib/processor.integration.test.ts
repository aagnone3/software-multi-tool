import { describe, expect, it } from "vitest";
import { processNewsAnalyzerJob } from "./processor";

/**
 * Integration tests for the news analyzer processor with real Claude API calls
 *
 * These tests require ANTHROPIC_API_KEY to be set and will be skipped if not available.
 */
describe("News Analyzer Processor (integration)", () => {
	const TIMEOUT = 60000; // 60 seconds for Claude API calls

	const skipIfNoApiKey = () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			console.warn(
				"⚠️  Skipping integration test: ANTHROPIC_API_KEY is not set",
			);
			return true;
		}
		return false;
	};

	describe("processNewsAnalyzerJob - full end-to-end", () => {
		it(
			"should process a real article from URL to analysis",
			async () => {
				if (skipIfNoApiKey()) {
					return;
				}

				const job = {
					id: "integration-test-1",
					input: {
						articleUrl:
							"https://www.foxnews.com/world/us-forces-attempting-board-sanctioned-russian-flagged-oil-tanker-north-atlantic-sources-say",
					},
				};

				const result = await processNewsAnalyzerJob(job);

				// Should succeed
				expect(result.success).toBe(true);

				if (result.success) {
					const output = result.output as any;

					// Verify Claude analysis structure
					expect(output.summary).toBeDefined();
					expect(Array.isArray(output.summary)).toBe(true);
					expect(output.summary.length).toBeGreaterThan(0);

					expect(output.bias).toBeDefined();
					expect(output.bias.politicalLean).toBeDefined();
					expect(output.bias.sensationalism).toBeGreaterThanOrEqual(
						0,
					);
					expect(output.bias.sensationalism).toBeLessThanOrEqual(10);
					expect(output.bias.factualRating).toBeDefined();

					expect(output.entities).toBeDefined();
					expect(output.entities.people).toBeDefined();
					expect(output.entities.organizations).toBeDefined();
					expect(output.entities.places).toBeDefined();

					expect(output.sentiment).toBeDefined();
					expect(output.sourceCredibility).toBeDefined();

					// Log results for manual verification
					console.log("\n=== Integration Test Results ===");
					console.log("Summary:", output.summary);
					console.log("Bias:", output.bias);
					console.log("Entities:", output.entities);
					console.log("Sentiment:", output.sentiment);
					console.log(
						"Source Credibility:",
						output.sourceCredibility,
					);
				}
			},
			TIMEOUT,
		);

		it(
			"should handle extraction failures",
			async () => {
				if (skipIfNoApiKey()) {
					return;
				}

				const job = {
					id: "integration-test-2",
					input: {
						articleUrl:
							"https://example.com/nonexistent-article-12345",
					},
				};

				const result = await processNewsAnalyzerJob(job);

				// Should fail gracefully
				expect(result.success).toBe(false);
				expect(result.error).toBeTruthy();
			},
			TIMEOUT,
		);

		it(
			"should process article from text input",
			async () => {
				if (skipIfNoApiKey()) {
					return;
				}

				const job = {
					id: "integration-test-3",
					input: {
						articleText: `
              Breaking: Major Technology Company Announces Layoffs

              In a surprising move today, a leading technology company announced it will be laying off
              10% of its workforce due to economic concerns and shifting market conditions. The CEO
              stated that this difficult decision was necessary to ensure long-term sustainability.
              Industry experts are divided on whether this signals broader tech sector struggles or
              is an isolated incident.
            `,
					},
				};

				const result = await processNewsAnalyzerJob(job);

				// Should succeed
				expect(result.success).toBe(true);

				if (result.success) {
					const output = result.output as any;

					// Should have analysis structure
					expect(output.summary).toBeDefined();
					expect(output.bias).toBeDefined();
					expect(output.sentiment).toBeDefined();

					console.log("\n=== Text Input Results ===");
					console.log("Summary:", output.summary);
					console.log("Sentiment:", output.sentiment);
				}
			},
			TIMEOUT,
		);
	});
});
