import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processInvoiceJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());
const extractTextFromInvoiceDocumentMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	debug: vi.fn(),
	error: vi.fn(),
}));
const shouldUseSupabaseStorageMock = vi.hoisted(() => vi.fn());
const getDefaultSupabaseProviderMock = vi.hoisted(() => vi.fn());
const getSignedUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

vi.mock("./document-extractor", () => ({
	extractTextFromInvoiceDocument: extractTextFromInvoiceDocumentMock,
}));

vi.mock("@repo/logs", () => ({
	logger: loggerMock,
}));

vi.mock("@repo/storage", () => ({
	shouldUseSupabaseStorage: shouldUseSupabaseStorageMock,
	getDefaultSupabaseProvider: getDefaultSupabaseProviderMock,
	getSignedUrl: getSignedUrlMock,
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
		expect(result.error).toContain("No text could be extracted");
	});

	it("returns error when invoice text is missing", async () => {
		const missingJob = {
			...mockJob,
			input: {},
		};

		const result = await processInvoiceJob(missingJob);

		expect(result.success).toBe(false);
		expect(result.error).toContain("No text could be extracted");
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

	describe("file upload processing", () => {
		const fileUploadJob: ToolJob = {
			...mockJob,
			input: {
				filePath:
					"organizations/org-123/users/user-123/invoices/test.pdf",
				bucket: "invoices",
				mimeType: "application/pdf",
			},
		};

		const mockFileBuffer = Buffer.from("fake pdf content");
		const mockSignedUrl = "https://storage.example.com/signed-url";

		beforeEach(() => {
			// Mock storage functions for file fetching
			shouldUseSupabaseStorageMock.mockReturnValue(true);
			getDefaultSupabaseProviderMock.mockReturnValue({
				getSignedDownloadUrl: vi.fn().mockResolvedValue(mockSignedUrl),
			});

			// Mock global fetch for file download
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer.buffer),
			}) as unknown as typeof fetch;
		});

		it("extracts text from uploaded file and processes it", async () => {
			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: true,
				text: "Invoice from PDF file\nTotal: $500.00",
				metadata: {
					fileType: "pdf",
					characterCount: 37,
					usedOcr: false,
				},
			});

			executePromptMock.mockResolvedValue({
				content: JSON.stringify(mockAIResponse),
				model: "claude-3-5-haiku-20241022",
				usage: { inputTokens: 100, outputTokens: 200 },
				stopReason: "end_turn",
			});

			const result = await processInvoiceJob(fileUploadJob);

			expect(extractTextFromInvoiceDocumentMock).toHaveBeenCalledWith(
				expect.any(Buffer),
				"application/pdf",
				"organizations/org-123/users/user-123/invoices/test.pdf",
			);
			expect(result.success).toBe(true);
		});

		it("returns extraction metadata when OCR was used", async () => {
			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: true,
				text: "Invoice from scanned PDF",
				metadata: {
					fileType: "pdf",
					characterCount: 24,
					usedOcr: true,
					ocrConfidence: 0.85,
				},
			});

			executePromptMock.mockResolvedValue({
				content: JSON.stringify(mockAIResponse),
				model: "claude-3-5-haiku-20241022",
				usage: { inputTokens: 100, outputTokens: 200 },
				stopReason: "end_turn",
			});

			const result = await processInvoiceJob(fileUploadJob);

			expect(result.success).toBe(true);
			const output = result.output as typeof mockAIResponse & {
				extractionMetadata?: {
					usedOcr: boolean;
					ocrConfidence?: number;
					fileType?: string;
				};
			};
			expect(output.extractionMetadata).toBeDefined();
			expect(output.extractionMetadata?.usedOcr).toBe(true);
			expect(output.extractionMetadata?.ocrConfidence).toBe(0.85);
		});

		it("adjusts confidence when OCR was used", async () => {
			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: true,
				text: "Invoice from scanned PDF",
				metadata: {
					fileType: "pdf",
					characterCount: 24,
					usedOcr: true,
					ocrConfidence: 0.8,
				},
			});

			const aiResponseWithHighConfidence = {
				...mockAIResponse,
				confidence: 0.95,
			};

			executePromptMock.mockResolvedValue({
				content: JSON.stringify(aiResponseWithHighConfidence),
				model: "claude-3-5-haiku-20241022",
				usage: { inputTokens: 100, outputTokens: 200 },
				stopReason: "end_turn",
			});

			const result = await processInvoiceJob(fileUploadJob);

			expect(result.success).toBe(true);
			const output = result.output as typeof mockAIResponse;
			// Confidence should be adjusted: min(0.95, 0.95 * 0.8) = min(0.95, 0.76) = 0.76
			expect(output.confidence).toBe(0.76);
		});

		it("returns error when file extraction fails", async () => {
			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: false,
				error: {
					code: "UNSUPPORTED_FILE_TYPE",
					message:
						"Unsupported file type. Please upload a PDF or image file.",
				},
			});

			const result = await processInvoiceJob(fileUploadJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe(
				"Unsupported file type. Please upload a PDF or image file.",
			);
		});

		it("returns error when extracted text is empty", async () => {
			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: true,
				text: "",
				metadata: {
					fileType: "pdf",
					characterCount: 0,
					usedOcr: true,
				},
			});

			const result = await processInvoiceJob(fileUploadJob);

			expect(result.success).toBe(false);
			expect(result.error).toContain("No text could be extracted");
		});

		it("processes image files with OCR", async () => {
			const imageJob: ToolJob = {
				...mockJob,
				input: {
					filePath:
						"organizations/org-123/users/user-123/invoices/test.jpg",
					bucket: "invoices",
					mimeType: "image/jpeg",
				},
			};

			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: true,
				text: "Invoice from image file",
				metadata: {
					fileType: "image",
					characterCount: 23,
					usedOcr: true,
					ocrConfidence: 0.92,
				},
			});

			executePromptMock.mockResolvedValue({
				content: JSON.stringify(mockAIResponse),
				model: "claude-3-5-haiku-20241022",
				usage: { inputTokens: 100, outputTokens: 200 },
				stopReason: "end_turn",
			});

			const result = await processInvoiceJob(imageJob);

			expect(extractTextFromInvoiceDocumentMock).toHaveBeenCalledWith(
				expect.any(Buffer),
				"image/jpeg",
				"organizations/org-123/users/user-123/invoices/test.jpg",
			);
			expect(result.success).toBe(true);
		});

		it("returns error when storage fetch fails", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: "Not Found",
			}) as unknown as typeof fetch;

			const result = await processInvoiceJob(fileUploadJob);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to fetch file from storage");
		});

		it("uses legacy getSignedUrl when Supabase storage is not available", async () => {
			shouldUseSupabaseStorageMock.mockReturnValue(false);
			getSignedUrlMock.mockResolvedValue(mockSignedUrl);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				arrayBuffer: vi.fn().mockResolvedValue(mockFileBuffer.buffer),
			}) as unknown as typeof fetch;

			extractTextFromInvoiceDocumentMock.mockResolvedValue({
				success: true,
				text: "Invoice from PDF file\nTotal: $500.00",
				metadata: {
					fileType: "pdf",
					characterCount: 37,
					usedOcr: false,
				},
			});

			executePromptMock.mockResolvedValue({
				content: JSON.stringify(mockAIResponse),
				model: "claude-3-5-haiku-20241022",
				usage: { inputTokens: 100, outputTokens: 200 },
				stopReason: "end_turn",
			});

			const result = await processInvoiceJob(fileUploadJob);

			expect(getSignedUrlMock).toHaveBeenCalledWith(
				"organizations/org-123/users/user-123/invoices/test.pdf",
				{ bucket: "invoices" },
			);
			expect(result.success).toBe(true);
		});
	});
});
