import type { Prisma, ToolJob } from "@repo/database";
import { AssemblyAI } from "assemblyai";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type {
	AssemblyAIUtterance,
	SpeakerSegment,
	SpeakerSeparationInput,
	SpeakerSeparationOutput,
	SpeakerStats,
} from "../types";

/**
 * Get AssemblyAI client instance.
 * API key is read from ASSEMBLYAI_API_KEY environment variable.
 */
function getAssemblyAIClient(): AssemblyAI {
	const apiKey = process.env.ASSEMBLYAI_API_KEY;
	if (!apiKey) {
		throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
	}
	return new AssemblyAI({ apiKey });
}

/**
 * Calculate speaker statistics from segments.
 */
export function calculateSpeakerStats(
	segments: SpeakerSegment[],
	totalDuration: number,
): SpeakerStats[] {
	const speakerMap = new Map<
		string,
		{ totalTime: number; segmentCount: number }
	>();

	for (const segment of segments) {
		const duration = segment.endTime - segment.startTime;
		const existing = speakerMap.get(segment.speaker) ?? {
			totalTime: 0,
			segmentCount: 0,
		};
		speakerMap.set(segment.speaker, {
			totalTime: existing.totalTime + duration,
			segmentCount: existing.segmentCount + 1,
		});
	}

	const stats: SpeakerStats[] = [];
	speakerMap.forEach((data, speaker) => {
		stats.push({
			id: speaker,
			label: `Speaker ${speaker}`,
			totalTime: Math.round(data.totalTime * 100) / 100, // Round to 2 decimal places
			percentage:
				totalDuration > 0
					? Math.round((data.totalTime / totalDuration) * 10000) / 100 // Round to 2 decimal places
					: 0,
			segmentCount: data.segmentCount,
		});
	});

	// Sort by speaker ID
	return stats.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Format transcript with speaker labels.
 */
export function formatTranscriptWithSpeakers(
	segments: SpeakerSegment[],
): string {
	const lines: string[] = [];
	let currentSpeaker: string | null = null;
	let currentText: string[] = [];

	for (const segment of segments) {
		if (segment.speaker !== currentSpeaker) {
			// Flush current speaker's text
			if (currentSpeaker !== null && currentText.length > 0) {
				lines.push(
					`Speaker ${currentSpeaker}: ${currentText.join(" ")}`,
				);
			}
			currentSpeaker = segment.speaker;
			currentText = [segment.text];
		} else {
			currentText.push(segment.text);
		}
	}

	// Flush final speaker's text
	if (currentSpeaker !== null && currentText.length > 0) {
		lines.push(`Speaker ${currentSpeaker}: ${currentText.join(" ")}`);
	}

	return lines.join("\n");
}

/**
 * Convert AssemblyAI utterances to our segment format.
 */
function convertUtterancesToSegments(
	utterances: AssemblyAIUtterance[],
): SpeakerSegment[] {
	return utterances.map((utterance) => ({
		speaker: utterance.speaker,
		text: utterance.text,
		startTime: utterance.start / 1000, // Convert ms to seconds
		endTime: utterance.end / 1000, // Convert ms to seconds
		confidence: utterance.confidence,
	}));
}

/**
 * Process a speaker separation job using AssemblyAI.
 */
export async function processSpeakerSeparationJob(
	job: ToolJob,
): Promise<JobResult> {
	const input = job.input as unknown as SpeakerSeparationInput;

	// Validate input
	if (!input.audioUrl) {
		return {
			success: false,
			error: "Audio URL is required",
		};
	}

	try {
		const client = getAssemblyAIClient();

		// Submit transcription request with speaker labels enabled
		const transcript = await client.transcripts.transcribe({
			audio: input.audioUrl,
			speaker_labels: true,
		});

		// Check for errors
		if (transcript.status === "error") {
			return {
				success: false,
				error: transcript.error || "AssemblyAI transcription failed",
			};
		}

		// Ensure we have utterances
		if (!transcript.utterances || transcript.utterances.length === 0) {
			return {
				success: false,
				error: "No speech detected in audio",
			};
		}

		// Convert utterances to our segment format
		const segments = convertUtterancesToSegments(
			transcript.utterances as AssemblyAIUtterance[],
		);

		// Calculate total duration
		const totalDuration = transcript.audio_duration ?? 0;

		// Calculate speaker statistics
		const speakers = calculateSpeakerStats(segments, totalDuration);

		// Format transcript with speaker labels
		const formattedTranscript = formatTranscriptWithSpeakers(segments);

		const output: SpeakerSeparationOutput = {
			speakerCount: speakers.length,
			duration: totalDuration,
			speakers,
			segments,
			transcript: formattedTranscript,
		};

		return {
			success: true,
			output: output as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to process audio for speaker separation";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
