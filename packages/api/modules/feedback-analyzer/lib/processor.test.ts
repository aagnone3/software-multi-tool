import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processFeedbackJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

describe("Feedback Analyzer", () => {
	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "feedback-analyzer",
		status: "PROCESSING",
		priority: 0,
		input: {
			feedback:
				"The product is great but customer support is slow. I love the features but the pricing is too high. Would recommend to others despite the issues.",
			analysisType: "individual",
		},
		output: null,
		error: null,
		userId: "user-123",
		sessionId: null,
		attempts: 1,
		maxAttempts: 3,
		startedAt: new Date(),
		completedAt: null,
		processAfter: null,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAIResponse = {
		sentiment: {
			overall: "positive",
			score: 0.4,
			emotions: {
				joy: 0.6,
				anger: 0.1,
				sadness: 0.1,
				fear: 0.0,
				surprise: 0.1,
				trust: 0.5,
			},
		},
		topics: [
			{
				name: "Product Features",
				sentiment: "positive",
				mentions: 2,
				keyPhrases: ["great", "love the features"],
			},
			{
				name: "Customer Support",
				sentiment: "negative",
				mentions: 1,
				keyPhrases: ["slow"],
			},
			{
				name: "Pricing",
				sentiment: "negative",
				mentions: 1,
				keyPhrases: ["too high"],
			},
		],
		keyThemes: ["Product Quality", "Service Issues", "Value Concerns"],
		strengths: ["Product features", "Overall satisfaction"],
		weaknesses: ["Customer support speed", "Pricing"],
		actionableInsights: [
			{
				category: "support",
				priority: "high",
				insight: "Customer support response time is a concern",
				suggestedAction: "Implement faster response SLAs",
				impactedArea: "Customer Satisfaction",
				frequency: 1,
			},
			{
				category: "pricing",
				priority: "medium",
				insight: "Price perceived as too high",
				suggestedAction:
					"Review pricing strategy or communicate value better",
				impactedArea: "Acquisition",
				frequency: 1,
			},
		],
		customerSegments: [],
		competitorMentions: [],
		summary:
			"Overall positive feedback with specific concerns about support response time and pricing. Customer recommends the product despite noted issues.",
		recommendedPriorities: [
			"Improve support response times",
			"Review pricing or value communication",
		],
		npsIndicator: {
			estimatedScore: 30,
			promoters: 60,
			passives: 20,
			detractors: 20,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("successfully analyzes feedback string", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 300, outputTokens: 800 },
			stopReason: "end_turn",
		});

		const result = await processFeedbackJob(mockJob);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();
		const output = result.output as typeof mockAIResponse;
		expect(output.sentiment.overall).toBe("positive");
		expect(output.topics).toHaveLength(3);
		expect(output.actionableInsights).toHaveLength(2);
	});

	it("successfully analyzes feedback array", async () => {
		const arrayJob = {
			...mockJob,
			input: {
				feedback: [
					{ text: "Great product!", source: "App Store" },
					{ text: "Too expensive", source: "Email" },
				],
			},
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 300, outputTokens: 800 },
			stopReason: "end_turn",
		});

		const result = await processFeedbackJob(arrayJob);

		expect(result.success).toBe(true);
		expect(executePromptMock).toHaveBeenCalledWith(
			expect.stringContaining("Great product!"),
			expect.any(Object),
		);
	});

	it("returns error when feedback is empty string", async () => {
		const emptyJob = {
			...mockJob,
			input: { feedback: "" },
		};

		const result = await processFeedbackJob(emptyJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Feedback text is required");
	});

	it("returns error when feedback is empty array", async () => {
		const emptyArrayJob = {
			...mockJob,
			input: { feedback: [] },
		};

		const result = await processFeedbackJob(emptyArrayJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Feedback text is required");
	});

	it("handles AI response parsing errors", async () => {
		executePromptMock.mockResolvedValue({
			content: "Invalid JSON",
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 300, outputTokens: 100 },
			stopReason: "end_turn",
		});

		const result = await processFeedbackJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("handles AI service errors", async () => {
		executePromptMock.mockRejectedValue(new Error("API error"));

		const result = await processFeedbackJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("API error");
	});

	it("provides default values for missing fields", async () => {
		const partialResponse = {
			sentiment: {
				overall: "neutral",
				score: 0,
			},
			summary: "Basic feedback analysis",
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(partialResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 300, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processFeedbackJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as typeof mockAIResponse;
		expect(output.sentiment.overall).toBe("neutral");
		expect(output.topics).toEqual([]);
		expect(output.npsIndicator.promoters).toBe(0);
	});
});
