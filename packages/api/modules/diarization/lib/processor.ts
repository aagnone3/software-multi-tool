import { executePrompt } from "@repo/agent-sdk";
import type { Prisma, ToolJob } from "@repo/database";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type {
	DiarizationInput,
	DiarizationOutput,
	SpeakerSegment,
	SpeakerStats,
} from "../types";
import { validateAudioFile } from "../types";

/**
 * Prompt for the diarization analysis.
 * Since we're using an LLM for this, we'll simulate diarization based on audio metadata.
 * In a production system, this would use a dedicated ML model like pyannote.audio.
 */
const DIARIZATION_PROMPT = `You are an expert audio analysis system specializing in speaker diarization.

Given information about an audio file, simulate a realistic speaker diarization analysis. This is a demonstration system - in production, actual audio processing would be used.

IMPORTANT: Return ONLY valid JSON with no additional text or explanation. The JSON must conform exactly to this schema:

{
  "segments": [
    {
      "speaker": "Speaker 1",
      "start": 0.0,
      "end": 5.5,
      "confidence": 0.95
    }
  ],
  "totalSpeakers": 2,
  "confidence": 0.85
}

Guidelines:
- Generate realistic speaker segments that would be typical for the audio duration
- Alternate speakers naturally, with varying segment lengths (typically 2-30 seconds)
- Include some overlap and short gaps between segments
- Speaker names should be "Speaker 1", "Speaker 2", etc.
- Confidence scores should vary slightly between segments (0.7-0.99)
- Overall confidence should reflect the complexity of the audio

Audio file information:
`;

/**
 * Calculate speaker statistics from segments.
 */
function calculateSpeakerStats(
	segments: SpeakerSegment[],
	totalDuration: number,
): SpeakerStats[] {
	const speakerMap = new Map<
		string,
		{ totalDuration: number; segmentCount: number }
	>();

	for (const segment of segments) {
		const existing = speakerMap.get(segment.speaker) ?? {
			totalDuration: 0,
			segmentCount: 0,
		};
		speakerMap.set(segment.speaker, {
			totalDuration:
				existing.totalDuration + (segment.end - segment.start),
			segmentCount: existing.segmentCount + 1,
		});
	}

	const stats: SpeakerStats[] = [];
	speakerMap.forEach((data, speaker) => {
		stats.push({
			speaker,
			totalDuration: data.totalDuration,
			segmentCount: data.segmentCount,
			percentageOfTotal:
				totalDuration > 0
					? (data.totalDuration / totalDuration) * 100
					: 0,
		});
	});

	// Sort by speaker name
	return stats.sort((a, b) => a.speaker.localeCompare(b.speaker));
}

/**
 * Process a diarization job.
 */
export async function processDiarizationJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as DiarizationInput;

	// Validate input
	if (!input.audioFile) {
		return {
			success: false,
			error: "Audio file is required",
		};
	}

	// Validate audio file
	const validation = validateAudioFile(input.audioFile);
	if (!validation.valid) {
		return {
			success: false,
			error: validation.error,
		};
	}

	try {
		// Build prompt with audio file information
		const audioInfo = {
			filename: input.audioFile.filename,
			mimeType: input.audioFile.mimeType,
			duration: input.audioFile.duration ?? 60, // Default to 60s if unknown
			maxSpeakers: input.maxSpeakers,
		};

		const prompt = `${DIARIZATION_PROMPT}
Filename: ${audioInfo.filename}
Format: ${audioInfo.mimeType}
Duration: ${audioInfo.duration} seconds
${audioInfo.maxSpeakers ? `Maximum speakers to detect: ${audioInfo.maxSpeakers}` : "Auto-detect number of speakers"}

Generate a realistic diarization analysis for this audio.`;

		const result = await executePrompt(prompt, {
			model: "claude-3-5-haiku-20241022",
			maxTokens: 8192,
			temperature: 0.3,
			system: "You are a precise speaker diarization system. Output only valid JSON.",
		});

		// Parse the response
		const parsedResult = JSON.parse(result.content) as {
			segments: SpeakerSegment[];
			totalSpeakers: number;
			confidence: number;
		};

		// Ensure segments are sorted by start time
		const sortedSegments = [...parsedResult.segments].sort(
			(a, b) => a.start - b.start,
		);

		// Calculate total duration from segments or use provided duration
		const totalDuration =
			input.audioFile.duration ??
			(sortedSegments.length > 0
				? sortedSegments[sortedSegments.length - 1].end
				: 0);

		// Calculate speaker statistics
		const speakers = calculateSpeakerStats(sortedSegments, totalDuration);

		const output: DiarizationOutput = {
			segments: sortedSegments,
			speakers,
			totalDuration,
			totalSpeakers: parsedResult.totalSpeakers ?? speakers.length,
			confidence: parsedResult.confidence ?? 0.85,
		};

		return {
			success: true,
			output: output as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to process audio for speaker diarization";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
