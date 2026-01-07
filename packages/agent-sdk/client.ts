import Anthropic from "@anthropic-ai/sdk";

/**
 * Creates and returns a configured Anthropic client instance.
 * Requires ANTHROPIC_API_KEY to be set in environment variables.
 *
 * @throws {Error} If ANTHROPIC_API_KEY is not set
 * @returns Configured Anthropic client
 */
export function createAnthropicClient(): Anthropic {
	const apiKey = process.env.ANTHROPIC_API_KEY;

	if (!apiKey) {
		throw new Error(
			"ANTHROPIC_API_KEY is not set. Add it to your .env.local file.",
		);
	}

	return new Anthropic({ apiKey });
}

/**
 * Default Anthropic client instance (lazy-initialized).
 * Use this for convenience, or create your own with createAnthropicClient().
 */
let defaultClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
	if (!defaultClient) {
		defaultClient = createAnthropicClient();
	}
	return defaultClient;
}
