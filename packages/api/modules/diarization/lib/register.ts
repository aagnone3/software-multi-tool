import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processDiarizationJob } from "./processor";

export function registerDiarizationProcessor() {
	registerProcessor("diarization", processDiarizationJob);
}
