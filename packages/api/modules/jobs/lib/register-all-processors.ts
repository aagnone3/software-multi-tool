import { registerContractProcessor } from "../../contract-analyzer";
import { registerDiarizationProcessor } from "../../diarization";
import { registerExpenseProcessor } from "../../expense-categorizer";
import { registerFeedbackProcessor } from "../../feedback-analyzer";
import { registerGdprExporterProcessor } from "../../gdpr-exporter";
import { registerInvoiceProcessor } from "../../invoice-processor";
import { registerMeetingProcessor } from "../../meeting-summarizer";
import { registerSpeakerSeparationProcessor } from "../../speaker-separation";

let initialized = false;

export function registerAllProcessors() {
	if (initialized) {
		return;
	}

	registerInvoiceProcessor();
	registerContractProcessor();
	registerFeedbackProcessor();
	registerExpenseProcessor();
	registerMeetingProcessor();
	registerGdprExporterProcessor();
	registerDiarizationProcessor();
	registerSpeakerSeparationProcessor();

	initialized = true;
}
