import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./client";

export interface PromptOptions {
	/**
	 * The model to use for the prompt.
	 * @default "claude-3-5-sonnet-20241022"
	 */
	model?: string;

	/**
	 * Maximum tokens to generate in the response.
	 * @default 1024
	 */
	maxTokens?: number;

	/**
	 * System prompt to provide context.
	 */
	system?: string;

	/**
	 * Temperature for response randomness (0-1).
	 * @default 1
	 */
	temperature?: number;

	/**
	 * Custom Anthropic client instance.
	 * If not provided, uses the default client.
	 */
	client?: Anthropic;
}

export interface PromptResult {
	/**
	 * The generated text content from Claude.
	 */
	content: string;

	/**
	 * The model that was used for generation.
	 */
	model: string;

	/**
	 * Usage statistics for the request.
	 */
	usage: {
		inputTokens: number;
		outputTokens: number;
	};

	/**
	 * Stop reason for the generation.
	 */
	stopReason: string | null;
}

/**
 * Execute a prompt using Claude Agent SDK.
 *
 * @param prompt - The user prompt/message to send to Claude
 * @param options - Configuration options for the prompt execution
 * @returns Promise resolving to the prompt result
 *
 * @example
 * ```typescript
 * const result = await executePrompt("What is the capital of France?");
 * console.log(result.content); // "The capital of France is Paris."
 * ```
 *
 * @example
 * ```typescript
 * const result = await executePrompt("Explain quantum computing", {
 *   model: "claude-3-5-haiku-20241022",
 *   maxTokens: 500,
 *   system: "You are a helpful physics teacher."
 * });
 * ```
 */
export async function executePrompt(
	prompt: string,
	options: PromptOptions = {},
): Promise<PromptResult> {
	const {
		model = "claude-3-5-sonnet-20241022",
		maxTokens = 1024,
		system,
		temperature = 1,
		client,
	} = options;

	const anthropic = client ?? getAnthropicClient();

	const message = await anthropic.messages.create({
		model,
		max_tokens: maxTokens,
		temperature,
		system,
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
	});

	// Extract text content from the response
	const textContent = message.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("");

	return {
		content: textContent,
		model: message.model,
		usage: {
			inputTokens: message.usage.input_tokens,
			outputTokens: message.usage.output_tokens,
		},
		stopReason: message.stop_reason,
	};
}
