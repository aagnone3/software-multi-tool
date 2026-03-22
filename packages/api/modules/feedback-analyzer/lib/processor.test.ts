import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processFeedbackJob } from "./processor";

const { mockExecutePrompt } = vi.hoisted(() => ({
	mockExecutePrompt: vi.fn(),
}));

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: mockExecutePrompt,
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const makeJob = (input: unknown): ToolJob =>
	({
		id: "job-1",
		input,
	}) as ToolJob;

const makeOutput = () => ({
	overallSentiment: "positive",
	sentimentScore: 0.8,
	themes: [],
	insights: [],
	recommendations: [],
	urgentIssues: [],
	statistics: {
		totalFeedbackCount: 1,
		positiveCount: 1,
		negativeCount: 0,
		neutralCount: 0,
		averageRating: null,
	},
});

describe("processFeedbackJob", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns error when feedback is empty string", async () => {
		const job = makeJob({ feedback: "   " });
		const result = await processFeedbackJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Feedback text is required");
	});

	it("processes a string feedback successfully", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeOutput()),
		});
		const job = makeJob({ feedback: "The product is great!" });
		const result = await processFeedbackJob(job);
		expect(result.success).toBe(true);
		expect(result.output).toBeTruthy();
	});

	it("processes an array of feedback items successfully", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeOutput()),
		});
		const job = makeJob({
			feedback: [
				{ text: "Great product!" },
				{ text: "Could improve the UI." },
			],
		});
		const result = await processFeedbackJob(job);
		expect(result.success).toBe(true);
	});

	it("returns error when LLM fails", async () => {
		mockExecutePrompt.mockRejectedValue(new Error("LLM error"));
		const job = makeJob({ feedback: "Some feedback." });
		const result = await processFeedbackJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("LLM error");
	});

	it("returns error on invalid JSON from LLM", async () => {
		mockExecutePrompt.mockResolvedValue({ content: "not json" });
		const job = makeJob({ feedback: "Some feedback." });
		const result = await processFeedbackJob(job);
		expect(result.success).toBe(false);
	});
});
