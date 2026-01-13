import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processExpenseJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

describe("Expense Categorizer", () => {
	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "expense-categorizer",
		status: "PROCESSING",
		priority: 0,
		input: {
			expenses: [
				{
					description: "Adobe Creative Cloud subscription",
					amount: 54.99,
					date: "2024-01-15",
					vendor: "Adobe",
				},
				{
					description: "Client dinner at restaurant",
					amount: 125.0,
					date: "2024-01-16",
					vendor: "The Steakhouse",
				},
				{
					description: "Office supplies from Staples",
					amount: 45.5,
					vendor: "Staples",
				},
			],
			businessType: "Software Consulting",
			taxYear: 2024,
			country: "US",
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
		categorizedExpenses: [
			{
				originalDescription: "Adobe Creative Cloud subscription",
				amount: 54.99,
				date: "2024-01-15",
				vendor: "Adobe",
				category: "office_expense",
				subcategory: "Software Subscriptions",
				taxInfo: {
					irsCategory: "Office Expense",
					scheduleLocation: "Schedule C, Line 18",
					isDeductible: true,
					deductionPercentage: 100,
					notes: null,
				},
				confidence: 0.95,
				flags: [],
				suggestedNotes:
					"Monthly software subscription for business use",
			},
			{
				originalDescription: "Client dinner at restaurant",
				amount: 125.0,
				date: "2024-01-16",
				vendor: "The Steakhouse",
				category: "meals_entertainment",
				subcategory: "Business Meals",
				taxInfo: {
					irsCategory: "Meals and Entertainment",
					scheduleLocation: "Schedule C, Line 24b",
					isDeductible: true,
					deductionPercentage: 50,
					notes: "Business meals are 50% deductible",
				},
				confidence: 0.9,
				flags: ["Keep receipt with attendee names"],
				suggestedNotes: "Document client name and business purpose",
			},
			{
				originalDescription: "Office supplies from Staples",
				amount: 45.5,
				date: null,
				vendor: "Staples",
				category: "supplies",
				subcategory: "Office Supplies",
				taxInfo: {
					irsCategory: "Supplies",
					scheduleLocation: "Schedule C, Line 22",
					isDeductible: true,
					deductionPercentage: 100,
					notes: null,
				},
				confidence: 0.98,
				flags: [],
				suggestedNotes: null,
			},
		],
		summary: {
			totalAmount: 225.49,
			totalDeductible: 162.99,
			totalNonDeductible: 62.5,
			categoryBreakdown: [
				{
					category: "office_expense",
					amount: 54.99,
					count: 1,
					deductibleAmount: 54.99,
				},
				{
					category: "meals_entertainment",
					amount: 125.0,
					count: 1,
					deductibleAmount: 62.5,
				},
				{
					category: "supplies",
					amount: 45.5,
					count: 1,
					deductibleAmount: 45.5,
				},
			],
		},
		taxInsights: {
			estimatedDeductions: 162.99,
			potentialRedFlags: [],
			missingDocumentation: ["Date for office supplies purchase"],
			optimizationSuggestions: [
				"Consider annual subscription for Adobe to potentially save money",
			],
		},
		exportFormats: {
			quickbooksReady: true,
			xeroReady: true,
			csvAvailable: true,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("successfully categorizes expenses array", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 400, outputTokens: 900 },
			stopReason: "end_turn",
		});

		const result = await processExpenseJob(mockJob);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();
		const output = result.output as typeof mockAIResponse;
		expect(output.categorizedExpenses).toHaveLength(3);
		expect(output.summary.totalAmount).toBe(225.49);
		expect(output.exportFormats.quickbooksReady).toBe(true);
	});

	it("successfully categorizes single expense", async () => {
		const singleExpenseJob = {
			...mockJob,
			input: {
				expenses: {
					description: "Business lunch",
					amount: 50.0,
				},
			},
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify({
				...mockAIResponse,
				categorizedExpenses: [mockAIResponse.categorizedExpenses[1]],
			}),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 200, outputTokens: 500 },
			stopReason: "end_turn",
		});

		const result = await processExpenseJob(singleExpenseJob);

		expect(result.success).toBe(true);
		expect(executePromptMock).toHaveBeenCalledWith(
			expect.stringContaining("Business lunch"),
			expect.any(Object),
		);
	});

	it("returns error when expenses array is empty", async () => {
		const emptyJob = {
			...mockJob,
			input: { expenses: [] },
		};

		const result = await processExpenseJob(emptyJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("At least one expense is required");
	});

	it("includes business context in prompt", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 400, outputTokens: 900 },
			stopReason: "end_turn",
		});

		await processExpenseJob(mockJob);

		expect(executePromptMock).toHaveBeenCalledWith(
			expect.stringContaining("Software Consulting"),
			expect.any(Object),
		);
		expect(executePromptMock).toHaveBeenCalledWith(
			expect.stringContaining("2024"),
			expect.any(Object),
		);
	});

	it("handles AI response parsing errors", async () => {
		executePromptMock.mockResolvedValue({
			content: "Invalid JSON",
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 400, outputTokens: 100 },
			stopReason: "end_turn",
		});

		const result = await processExpenseJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("handles AI service errors", async () => {
		executePromptMock.mockRejectedValue(new Error("Service timeout"));

		const result = await processExpenseJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Service timeout");
	});

	it("provides default values for missing fields", async () => {
		const partialResponse = {
			categorizedExpenses: [],
			summary: {
				totalAmount: 0,
			},
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(partialResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 400, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processExpenseJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as typeof mockAIResponse;
		expect(output.summary.totalDeductible).toBe(0);
		expect(output.taxInsights.potentialRedFlags).toEqual([]);
		expect(output.exportFormats.quickbooksReady).toBe(true);
	});
});
