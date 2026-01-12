import type { ToolJob } from "@repo/database/prisma/generated/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processInvoiceJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

describe("Invoice Processor", () => {
	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "invoice-processor",
		status: "PROCESSING",
		priority: 0,
		input: {
			invoiceText: `
				ACME Corporation
				123 Business Street
				New York, NY 10001

				Invoice #: INV-2024-001
				Date: 2024-01-15
				Due Date: 2024-02-15

				Bill To:
				Widget Corp
				456 Client Avenue

				Description          Qty    Price    Amount
				Consulting Services   10    $150     $1,500
				Software License       1    $500       $500

				Subtotal: $2,000
				Tax (8%): $160
				Total: $2,160

				Payment Terms: Net 30
			`,
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
		vendor: {
			name: "ACME Corporation",
			address: "123 Business Street, New York, NY 10001",
			phone: null,
			email: null,
			taxId: null,
		},
		invoice: {
			number: "INV-2024-001",
			date: "2024-01-15",
			dueDate: "2024-02-15",
			purchaseOrderNumber: null,
		},
		customer: {
			name: "Widget Corp",
			address: "456 Client Avenue",
		},
		lineItems: [
			{
				description: "Consulting Services",
				quantity: 10,
				unitPrice: 150,
				amount: 1500,
			},
			{
				description: "Software License",
				quantity: 1,
				unitPrice: 500,
				amount: 500,
			},
		],
		totals: {
			subtotal: 2000,
			tax: 160,
			taxRate: "8%",
			discount: null,
			shipping: null,
			total: 2160,
		},
		paymentInfo: {
			terms: "Net 30",
			method: null,
			bankDetails: null,
		},
		currency: "USD",
		confidence: 0.95,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("successfully extracts invoice data", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processInvoiceJob(mockJob);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();
		const output = result.output as typeof mockAIResponse;
		expect(output.vendor.name).toBe("ACME Corporation");
		expect(output.lineItems).toHaveLength(2);
		expect(output.totals.total).toBe(2160);
	});

	it("returns error when invoice text is empty", async () => {
		const emptyJob = {
			...mockJob,
			input: { invoiceText: "" },
		};

		const result = await processInvoiceJob(emptyJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Invoice text is required");
	});

	it("returns error when invoice text is missing", async () => {
		const missingJob = {
			...mockJob,
			input: {},
		};

		const result = await processInvoiceJob(missingJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Invoice text is required");
	});

	it("handles AI response parsing errors", async () => {
		executePromptMock.mockResolvedValue({
			content: "Invalid JSON response",
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processInvoiceJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("handles AI service errors", async () => {
		executePromptMock.mockRejectedValue(
			new Error("API rate limit exceeded"),
		);

		const result = await processInvoiceJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("API rate limit exceeded");
	});

	it("provides default values for missing fields", async () => {
		const partialResponse = {
			vendor: { name: "Test Vendor" },
			totals: { total: 100 },
			currency: "EUR",
			confidence: 0.7,
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(partialResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processInvoiceJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as typeof mockAIResponse;
		expect(output.vendor.name).toBe("Test Vendor");
		expect(output.vendor.address).toBeNull();
		expect(output.lineItems).toEqual([]);
		expect(output.currency).toBe("EUR");
	});
});
