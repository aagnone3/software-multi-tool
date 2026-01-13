import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processGdprExportJob } from "./processor";

export function registerGdprExporterProcessor() {
	registerProcessor("gdpr-exporter", processGdprExportJob);
}
