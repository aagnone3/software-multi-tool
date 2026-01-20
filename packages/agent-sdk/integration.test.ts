import { describe, expect, it } from "vitest";
import { executePrompt } from "./prompt";
import { CLAUDE_MODELS } from "./src/models";

/**
 * Integration test for Claude Agent SDK.
 *
 * This test verifies that the SDK can successfully communicate with the Anthropic API.
 * It uses the Haiku model with a minimal prompt to minimize API costs.
 *
 * IMPORTANT: This test REQUIRES ANTHROPIC_API_KEY to be set.
 * Tests will be SKIPPED if the key is missing (to allow local pre-commit hooks to pass).
 *
 * Environment variables are loaded from apps/web/.env.local via tests/setup/environment.ts.
 *
 * The test is intentionally simple and cheap:
 * - Model: CLAUDE_MODELS.HAIKU_3_5 (cheapest model)
 * - Max tokens: 50 (minimal response)
 * - Prompt: Simple greeting (minimal input tokens)
 */
describe("Claude Agent SDK Integration", () => {
	const skipIfNoApiKey = () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			console.log(
				"Skipping integration test: ANTHROPIC_API_KEY not set. " +
					"Set it in apps/web/.env.local to run these tests.",
			);
			return true;
		}
		return false;
	};

	it(
		"should execute a prompt and return a response",
		{ timeout: 30000 },
		async () => {
			if (skipIfNoApiKey()) return;

			const result = await executePrompt("Say hello in one word", {
				model: CLAUDE_MODELS.HAIKU_3_5,
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
		},
	);

	it(
		"should handle system prompts correctly",
		{ timeout: 30000 },
		async () => {
			if (skipIfNoApiKey()) return;

			const result = await executePrompt("What color is the sky?", {
				model: CLAUDE_MODELS.HAIKU_3_5,
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
		},
	);
});
