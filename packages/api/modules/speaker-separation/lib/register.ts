import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processSpeakerSeparationJob } from "./processor";

export function registerSpeakerSeparationProcessor() {
	registerProcessor("speaker-separation", processSpeakerSeparationJob);
}
