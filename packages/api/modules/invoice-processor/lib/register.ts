import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processInvoiceJob } from "./processor";

export function registerInvoiceProcessor() {
	registerProcessor("invoice-processor", processInvoiceJob);
}
