import { describe, expect, it, vi } from "vitest";
import { registerContractProcessor } from "../modules/contract-analyzer/lib/register";
import { registerExpenseProcessor } from "../modules/expense-categorizer/lib/register";
import { registerFeedbackProcessor } from "../modules/feedback-analyzer/lib/register";
import { registerGdprExporterProcessor } from "../modules/gdpr-exporter/lib/register";
import { registerInvoiceProcessor } from "../modules/invoice-processor/lib/register";
import { getProcessor } from "../modules/jobs/lib/processor-registry";
import { registerMeetingProcessor } from "../modules/meeting-summarizer/lib/register";
import { registerNewsAnalyzerProcessor } from "../modules/news-analyzer/lib/register";
import { registerSpeakerSeparationProcessor } from "../modules/speaker-separation/lib/register";

// Mock all processors to prevent real AI/external calls
vi.mock("../modules/invoice-processor/lib/processor", () => ({
	processInvoiceJob: vi.fn(),
}));
vi.mock("../modules/meeting-summarizer/lib/processor", () => ({
	processMeetingJob: vi.fn(),
}));
vi.mock("../modules/contract-analyzer/lib/processor", () => ({
	processContractJob: vi.fn(),
}));
vi.mock("../modules/news-analyzer/lib/processor", () => ({
	processNewsAnalyzerJob: vi.fn(),
}));
vi.mock("../modules/gdpr-exporter/lib/processor", () => ({
	processGdprExportJob: vi.fn(),
}));
vi.mock("../modules/expense-categorizer/lib/processor", () => ({
	processExpenseJob: vi.fn(),
}));
vi.mock("../modules/feedback-analyzer/lib/processor", () => ({
	processFeedbackJob: vi.fn(),
}));
vi.mock("../modules/speaker-separation/lib/processor", () => ({
	processSpeakerSeparationJob: vi.fn(),
}));

describe("Processor registration", () => {
	it("registerInvoiceProcessor registers invoice-processor slug", () => {
		registerInvoiceProcessor();
		expect(getProcessor("invoice-processor")).toBeDefined();
	});

	it("registerMeetingProcessor registers meeting-summarizer slug", () => {
		registerMeetingProcessor();
		expect(getProcessor("meeting-summarizer")).toBeDefined();
	});

	it("registerNewsAnalyzerProcessor registers news-analyzer slug", () => {
		registerNewsAnalyzerProcessor();
		expect(getProcessor("news-analyzer")).toBeDefined();
	});

	it("registerSpeakerSeparationProcessor registers speaker-separation slug", () => {
		registerSpeakerSeparationProcessor();
		expect(getProcessor("speaker-separation")).toBeDefined();
	});

	it("registerExpenseProcessor registers expense-categorizer slug", () => {
		registerExpenseProcessor();
		expect(getProcessor("expense-categorizer")).toBeDefined();
	});

	it("registerFeedbackProcessor registers feedback-analyzer slug", () => {
		registerFeedbackProcessor();
		expect(getProcessor("feedback-analyzer")).toBeDefined();
	});

	it("registerGdprExporterProcessor registers gdpr-exporter slug", () => {
		registerGdprExporterProcessor();
		expect(getProcessor("gdpr-exporter")).toBeDefined();
	});

	it("registerContractProcessor registers contract-analyzer slug", () => {
		registerContractProcessor();
		expect(getProcessor("contract-analyzer")).toBeDefined();
	});
});
