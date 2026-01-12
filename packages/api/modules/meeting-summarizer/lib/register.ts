import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processMeetingJob } from "./processor";

export function registerMeetingProcessor() {
	registerProcessor("meeting-summarizer", processMeetingJob);
}
