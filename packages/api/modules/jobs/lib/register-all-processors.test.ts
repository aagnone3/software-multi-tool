import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerContractProcessor } from "../../contract-analyzer";
import { registerExpenseProcessor } from "../../expense-categorizer";
import { registerFeedbackProcessor } from "../../feedback-analyzer";
import { registerGdprExporterProcessor } from "../../gdpr-exporter";
import { registerInvoiceProcessor } from "../../invoice-processor";
import { registerMeetingProcessor } from "../../meeting-summarizer";
import { registerSpeakerSeparationProcessor } from "../../speaker-separation";

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
vi.mock("../../speaker-separation", () => ({
	registerSpeakerSeparationProcessor: vi.fn(),
}));

import {
	registerAllProcessors,
	resetRegisteredProcessorsForTests,
} from "./register-all-processors";

describe("registerAllProcessors", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetRegisteredProcessorsForTests();
	});

	it("registers all processors", () => {
		registerAllProcessors();

		expect(registerInvoiceProcessor).toHaveBeenCalledTimes(1);
		expect(registerContractProcessor).toHaveBeenCalledTimes(1);
		expect(registerFeedbackProcessor).toHaveBeenCalledTimes(1);
		expect(registerExpenseProcessor).toHaveBeenCalledTimes(1);
		expect(registerMeetingProcessor).toHaveBeenCalledTimes(1);
		expect(registerGdprExporterProcessor).toHaveBeenCalledTimes(1);
		expect(registerSpeakerSeparationProcessor).toHaveBeenCalledTimes(1);
	});

	it("only registers processors once", () => {
		registerAllProcessors();
		registerAllProcessors();
		registerAllProcessors();

		expect(registerInvoiceProcessor).toHaveBeenCalledTimes(1);
		expect(registerContractProcessor).toHaveBeenCalledTimes(1);
		expect(registerFeedbackProcessor).toHaveBeenCalledTimes(1);
		expect(registerExpenseProcessor).toHaveBeenCalledTimes(1);
		expect(registerMeetingProcessor).toHaveBeenCalledTimes(1);
		expect(registerGdprExporterProcessor).toHaveBeenCalledTimes(1);
		expect(registerSpeakerSeparationProcessor).toHaveBeenCalledTimes(1);
	});
});
