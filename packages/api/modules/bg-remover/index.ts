/**
 * Background Remover Module Initialization
 *
 * This module registers the bg-remover processor with the job queue system.
 */

import { registerProcessor } from "../jobs/lib/processor-registry";
import { processBgRemoverJob } from "./lib/processor";

// Register the bg-remover processor
registerProcessor("bg-remover", processBgRemoverJob);

export { processBgRemoverJob } from "./lib/processor";
// Export types for use in frontend
export * from "./types";
