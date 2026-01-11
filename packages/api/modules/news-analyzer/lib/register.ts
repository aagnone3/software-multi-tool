import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processNewsAnalyzerJob } from "./processor";

/**
 * Register the news-analyzer processor with the job system
 * This should be called during API initialization
 */
export function registerNewsAnalyzerProcessor() {
	registerProcessor("news-analyzer", processNewsAnalyzerJob);
}
