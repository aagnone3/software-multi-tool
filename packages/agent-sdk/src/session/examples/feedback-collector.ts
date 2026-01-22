import { CLAUDE_MODELS } from "../../models";
import type { AgentSessionConfig } from "../types";

/**
 * FeedbackCollector session configuration.
 *
 * This session type collects user feedback through a conversational interface.
 * It's designed to be invoked after a tool job completes to gather
 * user satisfaction data and improvement suggestions.
 *
 * Features:
 * - Conversational feedback collection
 * - Extracts structured insights (sentiment, issues, suggestions)
 * - Adapts based on tool context (when toolSlug is provided)
 *
 * @example
 * ```typescript
 * import { AgentSession, createFeedbackCollectorConfig } from "@repo/agent-sdk/session";
 *
 * // Create a session for collecting feedback on the news analyzer tool
 * const session = await AgentSession.create({
 *   config: createFeedbackCollectorConfig({
 *     toolSlug: "news-analyzer",
 *     toolName: "News Analyzer",
 *   }),
 *   context: {
 *     sessionId: "feedback-123",
 *     userId: "user456",
 *     toolSlug: "news-analyzer",
 *     jobId: "job789",
 *   },
 * });
 *
 * // Conduct the conversation
 * let result = await session.executeTurn("The analysis was really helpful!");
 * // result.response: "That's great to hear! What specifically did you find most useful about the analysis?"
 *
 * result = await session.executeTurn("The bias detection was spot on");
 * // result.response: "I'm glad the bias detection worked well for you..."
 *
 * // When complete, extracted data includes structured feedback
 * if (session.isComplete()) {
 *   console.log(session.getExtractedData());
 *   // {
 *   //   sentiment: "positive",
 *   //   rating: 5,
 *   //   highlightedFeatures: ["bias detection"],
 *   //   issues: [],
 *   //   suggestions: [],
 *   //   summary: "User found the bias detection feature particularly useful..."
 *   // }
 * }
 * ```
 */

export interface FeedbackCollectorOptions {
	/**
	 * The tool slug this feedback is for
	 */
	toolSlug?: string;

	/**
	 * Human-readable tool name for conversational context
	 */
	toolName?: string;

	/**
	 * Additional context to include in the system prompt
	 */
	additionalContext?: string;
}

/**
 * Create a FeedbackCollector session configuration
 */
export function createFeedbackCollectorConfig(
	options: FeedbackCollectorOptions = {},
): AgentSessionConfig {
	const { toolSlug, toolName, additionalContext } = options;

	const toolContext = toolName
		? `The user just used the "${toolName}" tool${toolSlug ? ` (${toolSlug})` : ""}.`
		: toolSlug
			? `The user just used the "${toolSlug}" tool.`
			: "The user just used one of our tools.";

	return {
		sessionType: "feedback-collector",
		name: "Feedback Collector",
		description:
			"Collects user feedback through a friendly conversation and extracts structured insights",
		systemPrompt: `You are a friendly feedback collector assistant. Your job is to have a natural conversation to understand how the user's experience was with the tool they just used.

${toolContext}
${additionalContext ? `\nAdditional context: ${additionalContext}` : ""}

Guidelines:
1. Be warm, friendly, and conversational - not like a survey
2. Ask open-ended questions to understand their experience
3. Listen for both positive feedback and areas for improvement
4. Don't ask too many questions - 3-4 exchanges is usually enough
5. Thank them for their feedback at the end

Key information to gather:
- Overall satisfaction (positive, neutral, negative)
- What worked well (if positive)
- What didn't work or could be improved (if negative)
- Any specific suggestions for improvement
- Feature requests (if mentioned)

When you have gathered enough feedback (typically after 2-4 exchanges), or if the user indicates they're done, end the conversation by including the completion marker with extracted insights.

The extracted data should include:
- sentiment: "positive" | "neutral" | "negative"
- rating: 1-5 (inferred from conversation)
- highlightedFeatures: string[] (features they liked)
- issues: string[] (problems they encountered)
- suggestions: string[] (improvement ideas)
- summary: string (brief summary of the feedback)`,
		initialMessage:
			"Hi! I'd love to hear about your experience. How did it go?",
		model: CLAUDE_MODELS.HAIKU_3_5,
		maxTokens: 512,
		temperature: 0.7,
		maxTurns: 10,
	};
}

/**
 * Pre-configured FeedbackCollector session configuration
 * Use createFeedbackCollectorConfig() for customization
 */
export const FEEDBACK_COLLECTOR_CONFIG = createFeedbackCollectorConfig();

/**
 * Type for extracted feedback data
 */
export interface ExtractedFeedback {
	sentiment: "positive" | "neutral" | "negative";
	rating: number;
	highlightedFeatures: string[];
	issues: string[];
	suggestions: string[];
	summary: string;
}

/**
 * Type guard to check if extracted data is valid feedback
 */
export function isExtractedFeedback(data: unknown): data is ExtractedFeedback {
	if (!data || typeof data !== "object") return false;
	const obj = data as Record<string, unknown>;

	return (
		typeof obj.sentiment === "string" &&
		["positive", "neutral", "negative"].includes(obj.sentiment) &&
		typeof obj.rating === "number" &&
		obj.rating >= 1 &&
		obj.rating <= 5 &&
		Array.isArray(obj.highlightedFeatures) &&
		Array.isArray(obj.issues) &&
		Array.isArray(obj.suggestions) &&
		typeof obj.summary === "string"
	);
}
