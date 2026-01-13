import { z } from "zod";

/**
 * Audio file data schema - matches frontend AudioFileData interface.
 */
export const AudioFileDataSchema = z.object({
	content: z.string().min(1, "Audio content is required"),
	mimeType: z.string(),
	filename: z.string(),
	duration: z.number().optional(),
});

export type AudioFileData = z.infer<typeof AudioFileDataSchema>;

/**
 * Input schema for the diarization processor.
 */
export const DiarizationInputSchema = z.object({
	audioFile: AudioFileDataSchema,
	maxSpeakers: z.number().min(2).max(20).optional(),
});

export type DiarizationInput = z.infer<typeof DiarizationInputSchema>;

/**
 * Speaker segment in the diarization output.
 */
export const SpeakerSegmentSchema = z.object({
	speaker: z.string(),
	start: z.number(),
	end: z.number(),
	confidence: z.number().min(0).max(1),
});

export type SpeakerSegment = z.infer<typeof SpeakerSegmentSchema>;

/**
 * Speaker statistics in the output.
 */
export const SpeakerStatsSchema = z.object({
	speaker: z.string(),
	totalDuration: z.number(),
	segmentCount: z.number(),
	percentageOfTotal: z.number(),
});

export type SpeakerStats = z.infer<typeof SpeakerStatsSchema>;

/**
 * Output schema for the diarization processor.
 */
export const DiarizationOutputSchema = z.object({
	segments: z.array(SpeakerSegmentSchema),
	speakers: z.array(SpeakerStatsSchema),
	totalDuration: z.number(),
	totalSpeakers: z.number(),
	confidence: z.number().min(0).max(1),
});

export type DiarizationOutput = z.infer<typeof DiarizationOutputSchema>;

/**
 * Supported audio MIME types.
 */
export const SUPPORTED_AUDIO_TYPES = [
	"audio/mpeg",
	"audio/wav",
	"audio/x-wav",
	"audio/mp4",
	"audio/x-m4a",
	"audio/ogg",
	"audio/webm",
] as const;

/**
 * Maximum audio file size (100MB).
 */
export const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * Validate that the MIME type is a supported audio format.
 */
export function isSupportedAudioType(mimeType: string): boolean {
	return SUPPORTED_AUDIO_TYPES.includes(
		mimeType as (typeof SUPPORTED_AUDIO_TYPES)[number],
	);
}

/**
 * Validate audio file data.
 */
export function validateAudioFile(fileData: AudioFileData): {
	valid: boolean;
	error?: string;
} {
	// Check MIME type
	if (!isSupportedAudioType(fileData.mimeType)) {
		return {
			valid: false,
			error: `Unsupported audio format: ${fileData.mimeType}. Supported formats: MP3, WAV, M4A, OGG, WEBM`,
		};
	}

	// Check file size (base64 content is ~33% larger than binary)
	const estimatedBinarySize = (fileData.content.length * 3) / 4;
	if (estimatedBinarySize > MAX_AUDIO_SIZE_BYTES) {
		return {
			valid: false,
			error: "Audio file too large. Maximum size is 100MB",
		};
	}

	return { valid: true };
}
