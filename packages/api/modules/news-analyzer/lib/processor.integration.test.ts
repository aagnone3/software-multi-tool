import { describe, expect, it } from "vitest";
import { processNewsAnalyzerJob } from "./processor";

const VERBOSE_INTEGRATION_TESTS =
	process.env.SMT_VERBOSE_INTEGRATION_TESTS === "1";

function logIntegrationDetails(...args: unknown[]) {
	if (VERBOSE_INTEGRATION_TESTS) {
		console.log(...args);
	}
}

function logIntegrationFailure(...args: unknown[]) {
	if (VERBOSE_INTEGRATION_TESTS) {
		console.error(...args);
	}
}

/**
 * Integration tests for the news analyzer processor with real Claude API calls
 *
 * IMPORTANT: These tests REQUIRE ANTHROPIC_API_KEY to be set.
 * Tests will be skipped if the key is missing.
 *
 * Environment variables are loaded from apps/web/.env.local via tests/setup/environment.ts.
 */
const runIntegrationTests = process.env.ANTHROPIC_API_KEY ? describe : describe.skip;
runIntegrationTests("News Analyzer Processor (integration)", () => {
	const TIMEOUT = 60000; // 60 seconds for Claude API calls

	const requireApiKey = () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			throw new Error(
				"ANTHROPIC_API_KEY is required for integration tests. " +
					"Set it in apps/web/.env.local. " +
					"Environment variables are loaded automatically from this file via tests/setup/environment.ts.",
			);
		}
	};

	describe("processNewsAnalyzerJob - full end-to-end", () => {
		it(
			"should process a real article from URL to analysis",
			async () => {
				requireApiKey();

				const job = {
					id: "integration-test-1",
					input: {
						articleUrl:
							"https://www.foxnews.com/world/us-forces-attempting-board-sanctioned-russian-flagged-oil-tanker-north-atlantic-sources-say",
					},
				};

				const result = await processNewsAnalyzerJob(job);

				// Keep routine runs quiet; opt in with SMT_VERBOSE_INTEGRATION_TESTS=1.
				if (!result.success) {
					logIntegrationFailure(
						"❌ Integration test failed:",
						result.error,
					);
				}

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

					// Manual inspection stays available, but only when explicitly requested.
					logIntegrationDetails("\n=== Integration Test Results ===");
					logIntegrationDetails("Summary:", output.summary);
					logIntegrationDetails("Bias:", output.bias);
					logIntegrationDetails("Entities:", output.entities);
					logIntegrationDetails("Sentiment:", output.sentiment);
					logIntegrationDetails(
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
				requireApiKey();

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
				requireApiKey();

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

				// Keep routine runs quiet; opt in with SMT_VERBOSE_INTEGRATION_TESTS=1.
				if (!result.success) {
					logIntegrationFailure(
						"❌ Integration test failed:",
						result.error,
					);
				}

				// Should succeed
				expect(result.success).toBe(true);

				if (result.success) {
					const output = result.output as any;

					// Should have analysis structure
					expect(output.summary).toBeDefined();
					expect(output.bias).toBeDefined();
					expect(output.sentiment).toBeDefined();

					logIntegrationDetails("\n=== Text Input Results ===");
					logIntegrationDetails("Summary:", output.summary);
					logIntegrationDetails("Sentiment:", output.sentiment);
				}
			},
			TIMEOUT,
		);
	});
});
