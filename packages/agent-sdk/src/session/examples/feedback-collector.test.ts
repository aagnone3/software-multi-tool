import { describe, expect, it } from "vitest";
import {
	createFeedbackCollectorConfig,
	type ExtractedFeedback,
	FEEDBACK_COLLECTOR_CONFIG,
	isExtractedFeedback,
} from "./feedback-collector";

describe("FeedbackCollector", () => {
	describe("createFeedbackCollectorConfig", () => {
		it("should create default config without options", () => {
			const config = createFeedbackCollectorConfig();

			expect(config.sessionType).toBe("feedback-collector");
			expect(config.name).toBe("Feedback Collector");
			expect(config.initialMessage).toBe(
				"Hi! I'd love to hear about your experience. How did it go?",
			);
			expect(config.maxTurns).toBe(10);
		});

		it("should include tool context in system prompt when toolSlug provided", () => {
			const config = createFeedbackCollectorConfig({
				toolSlug: "news-analyzer",
			});

			expect(config.systemPrompt).toContain('"news-analyzer"');
		});

		it("should include tool name in system prompt when provided", () => {
			const config = createFeedbackCollectorConfig({
				toolName: "News Analyzer",
				toolSlug: "news-analyzer",
			});

			expect(config.systemPrompt).toContain('"News Analyzer"');
			expect(config.systemPrompt).toContain("(news-analyzer)");
		});

		it("should include additional context when provided", () => {
			const config = createFeedbackCollectorConfig({
				additionalContext: "User is a premium subscriber",
			});

			expect(config.systemPrompt).toContain(
				"User is a premium subscriber",
			);
		});

		it("should use Haiku model by default", () => {
			const config = createFeedbackCollectorConfig();
			expect(config.model).toBe("claude-3-5-haiku-20241022");
		});
	});

	describe("FEEDBACK_COLLECTOR_CONFIG", () => {
		it("should be a valid pre-configured config", () => {
			expect(FEEDBACK_COLLECTOR_CONFIG.sessionType).toBe(
				"feedback-collector",
			);
			expect(FEEDBACK_COLLECTOR_CONFIG.name).toBe("Feedback Collector");
			expect(FEEDBACK_COLLECTOR_CONFIG.systemPrompt).toBeDefined();
			expect(
				FEEDBACK_COLLECTOR_CONFIG.systemPrompt.length,
			).toBeGreaterThan(100);
		});
	});

	describe("isExtractedFeedback", () => {
		it("should return true for valid feedback", () => {
			const validFeedback: ExtractedFeedback = {
				sentiment: "positive",
				rating: 5,
				highlightedFeatures: ["speed", "accuracy"],
				issues: [],
				suggestions: ["add dark mode"],
				summary: "User loved the tool",
			};

			expect(isExtractedFeedback(validFeedback)).toBe(true);
		});

		it("should return false for null", () => {
			expect(isExtractedFeedback(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(isExtractedFeedback(undefined)).toBe(false);
		});

		it("should return false for non-object", () => {
			expect(isExtractedFeedback("string")).toBe(false);
			expect(isExtractedFeedback(123)).toBe(false);
			expect(isExtractedFeedback(true)).toBe(false);
		});

		it("should return false for invalid sentiment", () => {
			const invalid = {
				sentiment: "invalid",
				rating: 5,
				highlightedFeatures: [],
				issues: [],
				suggestions: [],
				summary: "test",
			};

			expect(isExtractedFeedback(invalid)).toBe(false);
		});

		it("should return false for out-of-range rating", () => {
			const lowRating = {
				sentiment: "positive",
				rating: 0,
				highlightedFeatures: [],
				issues: [],
				suggestions: [],
				summary: "test",
			};

			const highRating = {
				sentiment: "positive",
				rating: 6,
				highlightedFeatures: [],
				issues: [],
				suggestions: [],
				summary: "test",
			};

			expect(isExtractedFeedback(lowRating)).toBe(false);
			expect(isExtractedFeedback(highRating)).toBe(false);
		});

		it("should return false for non-array fields", () => {
			const invalidFeatures = {
				sentiment: "positive",
				rating: 5,
				highlightedFeatures: "not an array",
				issues: [],
				suggestions: [],
				summary: "test",
			};

			expect(isExtractedFeedback(invalidFeatures)).toBe(false);
		});

		it("should return false for missing summary", () => {
			const noSummary = {
				sentiment: "positive",
				rating: 5,
				highlightedFeatures: [],
				issues: [],
				suggestions: [],
			};

			expect(isExtractedFeedback(noSummary)).toBe(false);
		});

		it("should accept all valid sentiment values", () => {
			const sentiments = ["positive", "neutral", "negative"];

			for (const sentiment of sentiments) {
				const feedback = {
					sentiment,
					rating: 3,
					highlightedFeatures: [],
					issues: [],
					suggestions: [],
					summary: "test",
				};

				expect(isExtractedFeedback(feedback)).toBe(true);
			}
		});

		it("should accept ratings 1 through 5", () => {
			for (let rating = 1; rating <= 5; rating++) {
				const feedback = {
					sentiment: "neutral",
					rating,
					highlightedFeatures: [],
					issues: [],
					suggestions: [],
					summary: "test",
				};

				expect(isExtractedFeedback(feedback)).toBe(true);
			}
		});
	});
});
