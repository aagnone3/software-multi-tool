import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processFeedbackJob } from "./processor";

export function registerFeedbackProcessor() {
	registerProcessor("feedback-analyzer", processFeedbackJob);
}
