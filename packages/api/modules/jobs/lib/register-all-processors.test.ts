import { beforeEach, describe, expect, it, vi } from "vitest";
import * as processorRegistry from "./processor-registry";

// Mock the processor registration functions
vi.mock("../../invoice-processor", () => ({
	registerInvoiceProcessor: vi.fn(),
}));
vi.mock("../../contract-analyzer", () => ({
	registerContractProcessor: vi.fn(),
}));
vi.mock("../../feedback-analyzer", () => ({
	registerFeedbackProcessor: vi.fn(),
}));
vi.mock("../../expense-categorizer", () => ({
	registerExpenseProcessor: vi.fn(),
}));
vi.mock("../../meeting-summarizer", () => ({
	registerMeetingProcessor: vi.fn(),
}));
vi.mock("../../gdpr-exporter", () => ({
	registerGdprExporterProcessor: vi.fn(),
}));

describe("registerAllProcessors", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("registers all processors", async () => {
		const registerProcessorSpy = vi.spyOn(
			processorRegistry,
			"registerProcessor",
		);

		const { registerAllProcessors } = await import(
			"./register-all-processors"
		);
		registerAllProcessors();

		// Verify each tool's register function was called
		const invoiceProcessor = await import("../../invoice-processor");
		const contractAnalyzer = await import("../../contract-analyzer");
		const feedbackAnalyzer = await import("../../feedback-analyzer");
		const expenseCategorizer = await import("../../expense-categorizer");
		const meetingSummarizer = await import("../../meeting-summarizer");
		const gdprExporter = await import("../../gdpr-exporter");

		expect(invoiceProcessor.registerInvoiceProcessor).toHaveBeenCalled();
		expect(contractAnalyzer.registerContractProcessor).toHaveBeenCalled();
		expect(feedbackAnalyzer.registerFeedbackProcessor).toHaveBeenCalled();
		expect(expenseCategorizer.registerExpenseProcessor).toHaveBeenCalled();
		expect(meetingSummarizer.registerMeetingProcessor).toHaveBeenCalled();
		expect(gdprExporter.registerGdprExporterProcessor).toHaveBeenCalled();

		registerProcessorSpy.mockRestore();
	});

	it("only registers processors once", async () => {
		vi.resetModules();

		const { registerAllProcessors } = await import(
			"./register-all-processors"
		);

		registerAllProcessors();
		registerAllProcessors();
		registerAllProcessors();

		const invoiceProcessor = await import("../../invoice-processor");
		expect(invoiceProcessor.registerInvoiceProcessor).toHaveBeenCalledTimes(
			1,
		);
	});
});
