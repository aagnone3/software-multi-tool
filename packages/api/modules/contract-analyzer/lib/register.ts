import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processContractJob } from "./processor";

export function registerContractProcessor() {
	registerProcessor("contract-analyzer", processContractJob);
}
