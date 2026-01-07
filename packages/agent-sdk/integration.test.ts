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
 * - CI (CI=true): FAILS if ANTHROPIC_API_KEY is not set (ensures proper configuration)
 * - Local dev: Skips if ANTHROPIC_API_KEY is not set (developer convenience)
 * - Once configured: Tests run and validate SDK integration
 */
describe("Claude Agent SDK Integration", () => {
	it("should execute a prompt and return a response", async () => {
		const isCI = process.env.CI === "true";

		// In CI: fail if API key is missing (configuration error)
		// In local dev: skip if API key is missing (developer convenience)
		if (!process.env.ANTHROPIC_API_KEY) {
			if (isCI) {
				throw new Error(
					"ANTHROPIC_API_KEY is not set in CI environment. Verify the secret is configured in GitHub Actions.",
				);
			}
			console.warn(
				"⚠️  Skipping integration test: ANTHROPIC_API_KEY is not set (local dev)",
			);
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
		const isCI = process.env.CI === "true";

		// In CI: fail if API key is missing (configuration error)
		// In local dev: skip if API key is missing (developer convenience)
		if (!process.env.ANTHROPIC_API_KEY) {
			if (isCI) {
				throw new Error(
					"ANTHROPIC_API_KEY is not set in CI environment. Verify the secret is configured in GitHub Actions.",
				);
			}
			console.warn(
				"⚠️  Skipping integration test: ANTHROPIC_API_KEY is not set (local dev)",
			);
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
