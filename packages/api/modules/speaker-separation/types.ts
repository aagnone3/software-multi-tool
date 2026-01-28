import { z } from "zod";

/**
 * Audio file data schema - matches frontend AudioFileData interface.
 * Used when audio is provided as base64 content (legacy/inline mode).
 */
export const AudioFileDataSchema = z.object({
	content: z.string().min(1, "Audio content is required"),
	mimeType: z.string(),
	filename: z.string(),
	duration: z.number().optional(),
});

export type AudioFileData = z.infer<typeof AudioFileDataSchema>;

/**
 * Audio metadata schema - stored alongside the job for quick access.
 */
export const AudioMetadataSchema = z.object({
	filename: z.string(),
	mimeType: z.string(),
	duration: z.number().optional(),
	size: z.number().optional(),
});

export type AudioMetadata = z.infer<typeof AudioMetadataSchema>;

/**
 * Input schema for the speaker separation processor.
 * Supports two modes:
 * 1. audioFile with base64 content (legacy, used during upload before storage)
 * 2. audioFileUrl with S3 reference (new, used after storage upload)
 */
export const SpeakerSeparationInputSchema = z
	.object({
		audioFile: AudioFileDataSchema.optional(),
		audioFileUrl: z.string().optional(),
		audioMetadata: AudioMetadataSchema.optional(),
	})
	.refine((data) => data.audioFile || data.audioFileUrl, {
		message: "Either audioFile or audioFileUrl must be provided",
	});

export type SpeakerSeparationInput = z.infer<
	typeof SpeakerSeparationInputSchema
>;

/**
 * Speaker segment returned from AssemblyAI.
 */
export const SpeakerSegmentSchema = z.object({
	speaker: z.string(),
	text: z.string(),
	startTime: z.number(), // seconds
	endTime: z.number(), // seconds
	confidence: z.number().min(0).max(1),
});

export type SpeakerSegment = z.infer<typeof SpeakerSegmentSchema>;

/**
 * Per-speaker statistics.
 */
export const SpeakerStatsSchema = z.object({
	id: z.string(),
	label: z.string(),
	totalTime: z.number(), // seconds
	percentage: z.number(), // 0-100
	segmentCount: z.number(),
});

export type SpeakerStats = z.infer<typeof SpeakerStatsSchema>;

/**
 * Output schema for the speaker separation processor.
 */
export const SpeakerSeparationOutputSchema = z.object({
	speakerCount: z.number(),
	duration: z.number(), // Total audio duration in seconds
	speakers: z.array(SpeakerStatsSchema),
	segments: z.array(SpeakerSegmentSchema),
	transcript: z.string(), // Full transcript with speaker labels
});

export type SpeakerSeparationOutput = z.infer<
	typeof SpeakerSeparationOutputSchema
>;

/**
 * Supported audio formats for AssemblyAI.
 */
export const SUPPORTED_AUDIO_FORMATS = [
	"mp3",
	"wav",
	"m4a",
	"flac",
	"ogg",
	"webm",
] as const;

/**
 * Maximum audio duration in seconds (60 minutes).
 */
export const MAX_AUDIO_DURATION_SECONDS = 60 * 60;

/**
 * AssemblyAI utterance type (from their API).
 */
export interface AssemblyAIUtterance {
	speaker: string;
	text: string;
	start: number; // milliseconds
	end: number; // milliseconds
	confidence: number;
	words: Array<{
		text: string;
		start: number;
		end: number;
		confidence: number;
		speaker: string;
	}>;
}

/**
 * AssemblyAI transcript response (partial type).
 */
export interface AssemblyAITranscriptResponse {
	id: string;
	status: "queued" | "processing" | "completed" | "error";
	text: string | null;
	utterances: AssemblyAIUtterance[] | null;
	audio_duration: number | null;
	error: string | null;
}
