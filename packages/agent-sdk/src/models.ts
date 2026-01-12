/**
 * Available Claude models for the agent SDK
 *
 * Note: Model availability depends on your API key's tier and permissions.
 * Using unavailable models will result in 404 not_found_error responses.
 */
export const CLAUDE_MODELS = {
	// Haiku models (fastest, most cost-effective)
	HAIKU_3_5: "claude-3-5-haiku-20241022",

	// Sonnet models (balanced performance and capability)
	// Note: Requires appropriate API tier
	SONNET_3: "claude-3-sonnet-20240229",
	SONNET_3_5_V1: "claude-3-5-sonnet-20240620",
	SONNET_3_5_V2: "claude-3-5-sonnet-20241022",

	// Opus models (most capable, slowest)
	// Note: Requires appropriate API tier
	OPUS_3: "claude-3-opus-20240229",
} as const;

/**
 * Type for valid Claude model names
 */
export type ClaudeModel =
	| (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS]
	| string; // Allow custom model strings for future models

/**
 * Default model to use when none is specified
 *
 * Uses Haiku as it's the most widely available model tier
 */
export const DEFAULT_MODEL: ClaudeModel = CLAUDE_MODELS.HAIKU_3_5;

/**
 * Model recommendations by use case
 */
export const MODEL_RECOMMENDATIONS = {
	/**
	 * For simple, structured tasks (e.g., JSON generation, classification)
	 * Fastest and most cost-effective
	 */
	structured: CLAUDE_MODELS.HAIKU_3_5,

	/**
	 * For complex analysis and reasoning
	 * Balanced performance and capability
	 */
	analysis: CLAUDE_MODELS.SONNET_3_5_V2,

	/**
	 * For creative writing and complex problem solving
	 * Most capable but slowest
	 */
	creative: CLAUDE_MODELS.OPUS_3,
} as const;
