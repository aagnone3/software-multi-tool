import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processInvoiceJob } from "./processor";

const {
	mockExecutePrompt,
	mockExtractText,
	mockGetSignedUrl,
	mockIsStorageConfigured,
	mockGetDefaultS3Provider,
} = vi.hoisted(() => ({
	mockExecutePrompt: vi.fn(),
	mockExtractText: vi.fn(),
	mockGetSignedUrl: vi.fn(),
	mockIsStorageConfigured: vi.fn().mockReturnValue(false),
	mockGetDefaultS3Provider: vi.fn(),
}));

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: mockExecutePrompt,
}));

vi.mock("./document-extractor", () => ({
	extractTextFromInvoiceDocument: mockExtractText,
}));

vi.mock("@repo/storage", () => ({
	getSignedUrl: mockGetSignedUrl,
	isStorageConfigured: mockIsStorageConfigured,
	getDefaultS3Provider: mockGetDefaultS3Provider,
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Mock global fetch used by fetchFileFromStorage
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const makeJob = (input: unknown): ToolJob =>
	({
		id: "job-1",
		input,
	}) as ToolJob;

const makeInvoiceOutput = () => ({
	invoiceNumber: "INV-001",
	invoiceDate: "2024-01-01",
	dueDate: "2024-02-01",
	vendor: { name: "ACME", address: "123 Main St", taxId: null },
	customer: { name: "Client", address: null, taxId: null },
	lineItems: [],
	subtotal: 1000,
	taxAmount: 100,
	totalAmount: 1100,
	currency: "USD",
	paymentTerms: "Net 30",
	notes: null,
	confidence: 0.95,
});

describe("processInvoiceJob", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns error when no invoice text and no file path", async () => {
		const job = makeJob({});
		const result = await processInvoiceJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("No text could be extracted");
	});

	it("returns error when invoiceText is empty", async () => {
		const job = makeJob({ invoiceText: "   " });
		const result = await processInvoiceJob(job);
		expect(result.success).toBe(false);
	});

	it("processes direct invoiceText successfully", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeInvoiceOutput()),
		});
		const job = makeJob({ invoiceText: "Invoice #001\nTotal: $1000" });
		const result = await processInvoiceJob(job);
		expect(result.success).toBe(true);
		expect(result.output).toBeTruthy();
	});

	it("returns error when file extraction fails", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			arrayBuffer: async () => Buffer.from("fake").buffer,
		});
		mockGetSignedUrl.mockResolvedValue(
			"https://storage.example.com/file.pdf",
		);
		mockExtractText.mockResolvedValue({
			success: false,
			error: { message: "OCR failed" },
		});
		const job = makeJob({
			filePath: "invoices/test.pdf",
			bucket: "uploads",
			mimeType: "application/pdf",
		});
		const result = await processInvoiceJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toBe("OCR failed");
	});

	it("returns error when LLM call fails", async () => {
		mockExecutePrompt.mockRejectedValue(new Error("LLM timeout"));
		const job = makeJob({ invoiceText: "Invoice data here." });
		const result = await processInvoiceJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("LLM timeout");
	});

	it("returns error on invalid JSON from LLM", async () => {
		mockExecutePrompt.mockResolvedValue({ content: "not valid json" });
		const job = makeJob({ invoiceText: "Invoice data here." });
		const result = await processInvoiceJob(job);
		expect(result.success).toBe(false);
	});
});
