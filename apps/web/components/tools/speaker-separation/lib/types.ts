/**
 * Speaker segment from the speaker separation output.
 */
export interface SpeakerSegment {
	speaker: string;
	text: string;
	startTime: number;
	endTime: number;
	confidence: number;
}

/**
 * Per-speaker statistics.
 */
export interface SpeakerStats {
	id: string;
	label: string;
	totalTime: number;
	percentage: number;
	segmentCount: number;
}

/**
 * Speaker separation output structure.
 */
export interface SpeakerSeparationOutput {
	speakerCount: number;
	duration: number;
	speakers: SpeakerStats[];
	segments: SpeakerSegment[];
	transcript: string;
}

/**
 * Audio file data from upload.
 */
export interface AudioFileData {
	content: string;
	mimeType: string;
	filename: string;
	duration?: number;
}
