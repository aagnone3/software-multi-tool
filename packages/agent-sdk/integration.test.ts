import { describe, expect, it } from "vitest";
import { executePrompt } from "./prompt";

/**
 * Integration test for Claude Agent SDK.
 *
 * This test verifies that the SDK can successfully communicate with the Anthropic API.
 * It uses the Haiku model with a minimal prompt to minimize API costs.
 *
 * IMPORTANT: This test requires ANTHROPIC_API_KEY to be set in the environment.
 * For CI, add ANTHROPIC_API_KEY to GitHub Actions secrets.
 *
 * The test is intentionally simple and cheap:
 * - Model: claude-3-5-haiku-20241022 (cheapest model)
 * - Max tokens: 50 (minimal response)
 * - Prompt: Simple greeting (minimal input tokens)
 *
 * Behavior:
 * - Both CI and local dev: Skips if ANTHROPIC_API_KEY is not set (with informative warnings)
 * - CI: Shows additional message about configuring GitHub Actions secrets
 * - Once configured: Tests run automatically and validate SDK integration
 */
describe("Claude Agent SDK Integration", () => {
	it("should execute a prompt and return a response", async () => {
		// Skip if API key is not set (both CI and local dev)
		// This allows the PR to merge before API key is configured
		if (!process.env.ANTHROPIC_API_KEY) {
			const isCI = process.env.CI === "true";
			const envType = isCI ? "CI" : "local dev";
			console.warn(
				`⚠️  Skipping integration test: ANTHROPIC_API_KEY is not set (${envType})`,
			);
			if (isCI) {
				console.warn(
					"ℹ️  To enable integration tests, add ANTHROPIC_API_KEY to GitHub Actions secrets",
				);
			}
			return;
		}

		const result = await executePrompt("Say hello in one word", {
			model: "claude-3-5-haiku-20241022",
			maxTokens: 50,
		});

		// Verify response structure
		expect(result).toBeDefined();
		expect(result.content).toBeDefined();
		expect(typeof result.content).toBe("string");
		expect(result.content.length).toBeGreaterThan(0);

		// Verify model information
		expect(result.model).toContain("haiku");

		// Verify usage statistics
		expect(result.usage).toBeDefined();
		expect(result.usage.inputTokens).toBeGreaterThan(0);
		expect(result.usage.outputTokens).toBeGreaterThan(0);

		// Verify stop reason
		expect(result.stopReason).toBeDefined();

		// Log for debugging (will show in CI logs)
		console.log("Integration test passed:");
		console.log(`- Model: ${result.model}`);
		console.log(`- Response: ${result.content}`);
		console.log(
			`- Tokens used: ${result.usage.inputTokens} input, ${result.usage.outputTokens} output`,
		);
	});

	it("should handle system prompts correctly", async () => {
		// Skip if API key is not set (both CI and local dev)
		if (!process.env.ANTHROPIC_API_KEY) {
			const isCI = process.env.CI === "true";
			const envType = isCI ? "CI" : "local dev";
			console.warn(
				`⚠️  Skipping integration test: ANTHROPIC_API_KEY is not set (${envType})`,
			);
			if (isCI) {
				console.warn(
					"ℹ️  To enable integration tests, add ANTHROPIC_API_KEY to GitHub Actions secrets",
				);
			}
			return;
		}

		const result = await executePrompt("What color is the sky?", {
			model: "claude-3-5-haiku-20241022",
			maxTokens: 50,
			system: "You always answer with exactly one word.",
		});

		expect(result.content).toBeDefined();
		expect(typeof result.content).toBe("string");

		// Verify the response is short (system prompt should constrain it)
		const wordCount = result.content.trim().split(/\s+/).length;
		expect(wordCount).toBeLessThanOrEqual(3); // Allow some flexibility

		console.log("System prompt test passed:");
		console.log(`- Response: ${result.content}`);
		console.log(`- Word count: ${wordCount}`);
	});
});
