import { registerContractProcessor } from "../../contract-analyzer";
import { registerExpenseProcessor } from "../../expense-categorizer";
import { registerFeedbackProcessor } from "../../feedback-analyzer";
import { registerInvoiceProcessor } from "../../invoice-processor";
import { registerMeetingProcessor } from "../../meeting-summarizer";

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

	initialized = true;
}
