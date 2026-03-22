import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processExpenseJob } from "./processor";

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
	categorizedExpenses: [
		{
			originalDescription: "Office supplies",
			amount: 50,
			date: "2024-01-01",
			vendor: "Staples",
			category: "supplies",
			subcategory: null,
			taxInfo: {
				irsCategory: "Office supplies",
				scheduleLocation: "Schedule C, Line 22",
				isDeductible: true,
				deductionPercentage: 100,
				notes: null,
			},
			confidence: 0.95,
			flags: [],
			suggestedNotes: null,
		},
	],
	summary: {
		totalAmount: 50,
		totalDeductible: 50,
		totalNonDeductible: 0,
		categoryBreakdown: [],
	},
	taxInsights: {
		estimatedDeductions: 50,
		potentialRedFlags: [],
		recommendations: [],
	},
});

describe("processExpenseJob", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns error when expenses is empty array", async () => {
		const job = makeJob({ expenses: [] });
		const result = await processExpenseJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("At least one expense");
	});

	it("processes a single expense successfully", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeOutput()),
		});
		const job = makeJob({
			expenses: { description: "Office supplies", amount: 50 },
		});
		const result = await processExpenseJob(job);
		expect(result.success).toBe(true);
		expect(result.output).toBeTruthy();
	});

	it("processes an array of expenses successfully", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeOutput()),
		});
		const job = makeJob({
			expenses: [
				{ description: "Office supplies", amount: 50 },
				{
					description: "Travel",
					amount: 200,
					date: "2024-01-02",
					vendor: "Delta",
				},
			],
		});
		const result = await processExpenseJob(job);
		expect(result.success).toBe(true);
	});

	it("returns error when LLM fails", async () => {
		mockExecutePrompt.mockRejectedValue(new Error("LLM error"));
		const job = makeJob({
			expenses: [{ description: "Office supplies", amount: 50 }],
		});
		const result = await processExpenseJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("LLM error");
	});

	it("returns error on invalid JSON from LLM", async () => {
		mockExecutePrompt.mockResolvedValue({ content: "not json" });
		const job = makeJob({
			expenses: [{ description: "Office supplies", amount: 50 }],
		});
		const result = await processExpenseJob(job);
		expect(result.success).toBe(false);
	});
});
