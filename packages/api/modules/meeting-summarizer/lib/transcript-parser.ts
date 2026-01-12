import mammoth from "mammoth";

/**
 * Represents a parsed transcript with optional speaker labels and timestamps.
 */
export interface ParsedTranscript {
	/** The full text content of the transcript */
	text: string;
	/** Speaker labels found in the transcript, if any */
	speakers: string[];
	/** Whether the transcript contains timestamps */
	hasTimestamps: boolean;
	/** The original file format */
	format: "txt" | "docx" | "vtt" | "srt";
}

/**
 * VTT/SRT cue with timing and content.
 */
interface SubtitleCue {
	startTime: string;
	endTime: string;
	speaker: string | null;
	text: string;
}

/**
 * Supported transcript file extensions.
 */
export const SUPPORTED_TRANSCRIPT_EXTENSIONS = [
	".txt",
	".docx",
	".vtt",
	".srt",
] as const;

/**
 * Supported transcript MIME types.
 */
export const SUPPORTED_TRANSCRIPT_MIME_TYPES = [
	"text/plain",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/vtt",
	"application/x-subrip",
	"text/srt",
] as const;

/**
 * Maximum file size for transcript uploads (5MB).
 */
export const MAX_TRANSCRIPT_SIZE = 5 * 1024 * 1024;

/**
 * Validation rules for transcript file uploads.
 */
export const transcriptUploadRules = {
	maxSize: MAX_TRANSCRIPT_SIZE,
	allowedMimeTypes: [...SUPPORTED_TRANSCRIPT_MIME_TYPES],
	allowedExtensions: [...SUPPORTED_TRANSCRIPT_EXTENSIONS],
} as const;

/**
 * Determine the file format from the filename extension.
 */
function getFileFormat(
	filename: string,
): ParsedTranscript["format"] | undefined {
	const ext = filename.toLowerCase().split(".").pop();
	switch (ext) {
		case "txt":
			return "txt";
		case "docx":
			return "docx";
		case "vtt":
			return "vtt";
		case "srt":
			return "srt";
		default:
			return undefined;
	}
}

/**
 * Extract unique speaker labels from text.
 * Looks for patterns like "Speaker Name:" or "[Speaker Name]" at the start of lines.
 */
function extractSpeakers(text: string): string[] {
	const speakers = new Set<string>();

	// Pattern: "Name:" at start of line (common in transcripts)
	const colonPattern = /^([A-Z][a-zA-Z\s]+?):\s/gm;
	let match: RegExpExecArray | null;
	while ((match = colonPattern.exec(text)) !== null) {
		const speaker = match[1].trim();
		if (speaker.length > 0 && speaker.length < 50) {
			speakers.add(speaker);
		}
	}

	// Pattern: "[Name]" or "(Name)" at start of line
	const bracketPattern = /^[\[(]([A-Z][a-zA-Z\s]+?)[\])]\s/gm;
	while ((match = bracketPattern.exec(text)) !== null) {
		const speaker = match[1].trim();
		if (speaker.length > 0 && speaker.length < 50) {
			speakers.add(speaker);
		}
	}

	return Array.from(speakers);
}

/**
 * Parse a plain text transcript file.
 */
export async function parseTxtTranscript(
	buffer: Buffer,
): Promise<ParsedTranscript> {
	const text = buffer.toString("utf-8").trim();
	const speakers = extractSpeakers(text);

	return {
		text,
		speakers,
		hasTimestamps: false,
		format: "txt",
	};
}

/**
 * Parse a DOCX transcript file.
 */
export async function parseDocxTranscript(
	buffer: Buffer,
): Promise<ParsedTranscript> {
	const result = await mammoth.extractRawText({ buffer });
	const text = result.value.trim();
	const speakers = extractSpeakers(text);

	return {
		text,
		speakers,
		hasTimestamps: false,
		format: "docx",
	};
}

/**
 * Parse VTT timestamp format: 00:00:00.000 or 00:00.000
 */
function parseVttTimestamp(timestamp: string): string {
	return timestamp.trim();
}

/**
 * Parse SRT timestamp format: 00:00:00,000
 */
function parseSrtTimestamp(timestamp: string): string {
	// Convert SRT format (comma) to VTT format (period)
	return timestamp.trim().replace(",", ".");
}

/**
 * Extract speaker from VTT/SRT cue text.
 * Looks for patterns like "<v Speaker Name>" (VTT) or "Speaker Name:" at start.
 */
function extractSpeakerFromCue(text: string): {
	speaker: string | null;
	cleanText: string;
} {
	// VTT voice tag: <v Speaker Name>text</v> or <v Speaker Name>text
	// Use [\s\S] instead of . with s flag for cross-line matching
	const vttVoiceMatch = text.match(/^<v\s+([^>]+)>([\s\S]+?)(?:<\/v>)?$/);
	if (vttVoiceMatch) {
		return {
			speaker: vttVoiceMatch[1].trim(),
			cleanText: vttVoiceMatch[2].trim(),
		};
	}

	// Speaker prefix: "Name: text"
	// Use [\s\S] instead of . with s flag for cross-line matching
	const speakerMatch = text.match(/^([A-Z][a-zA-Z\s]+?):\s*([\s\S]+)$/);
	if (speakerMatch) {
		return {
			speaker: speakerMatch[1].trim(),
			cleanText: speakerMatch[2].trim(),
		};
	}

	return { speaker: null, cleanText: text.trim() };
}

/**
 * Parse a VTT (WebVTT) transcript file.
 */
export async function parseVttTranscript(
	buffer: Buffer,
): Promise<ParsedTranscript> {
	const content = buffer.toString("utf-8").trim();
	const lines = content.split(/\r?\n/);
	const cues: SubtitleCue[] = [];
	const speakers = new Set<string>();

	let i = 0;

	// Skip header (WEBVTT and any header text)
	while (i < lines.length && !lines[i].includes("-->")) {
		i++;
	}

	// Parse cues
	while (i < lines.length) {
		const line = lines[i].trim();

		// Skip empty lines and cue identifiers
		if (!line || !line.includes("-->")) {
			i++;
			continue;
		}

		// Parse timestamp line: 00:00:00.000 --> 00:00:00.000
		const timestampMatch = line.match(
			/(\d{2}:\d{2}(?::\d{2})?[.,]\d{3})\s*-->\s*(\d{2}:\d{2}(?::\d{2})?[.,]\d{3})/,
		);
		if (!timestampMatch) {
			i++;
			continue;
		}

		const startTime = parseVttTimestamp(timestampMatch[1]);
		const endTime = parseVttTimestamp(timestampMatch[2]);
		i++;

		// Collect cue text (may span multiple lines)
		const textLines: string[] = [];
		while (i < lines.length && lines[i].trim() !== "") {
			textLines.push(lines[i].trim());
			i++;
		}

		const rawText = textLines.join(" ");
		const { speaker, cleanText } = extractSpeakerFromCue(rawText);

		if (speaker) {
			speakers.add(speaker);
		}

		cues.push({
			startTime,
			endTime,
			speaker,
			text: cleanText,
		});
	}

	// Format output: include timestamps and speaker labels
	const textParts = cues.map((cue) => {
		const speakerPrefix = cue.speaker ? `${cue.speaker}: ` : "";
		return `[${cue.startTime}] ${speakerPrefix}${cue.text}`;
	});

	return {
		text: textParts.join("\n"),
		speakers: Array.from(speakers),
		hasTimestamps: true,
		format: "vtt",
	};
}

/**
 * Parse an SRT (SubRip) transcript file.
 */
export async function parseSrtTranscript(
	buffer: Buffer,
): Promise<ParsedTranscript> {
	const content = buffer.toString("utf-8").trim();
	const lines = content.split(/\r?\n/);
	const cues: SubtitleCue[] = [];
	const speakers = new Set<string>();

	let i = 0;

	while (i < lines.length) {
		// Skip empty lines
		while (i < lines.length && lines[i].trim() === "") {
			i++;
		}

		if (i >= lines.length) break;

		// Skip cue number
		const cueNum = lines[i].trim();
		if (!/^\d+$/.test(cueNum)) {
			i++;
			continue;
		}
		i++;

		if (i >= lines.length) break;

		// Parse timestamp line: 00:00:00,000 --> 00:00:00,000
		const timestampLine = lines[i].trim();
		const timestampMatch = timestampLine.match(
			/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/,
		);
		if (!timestampMatch) {
			i++;
			continue;
		}

		const startTime = parseSrtTimestamp(timestampMatch[1]);
		const endTime = parseSrtTimestamp(timestampMatch[2]);
		i++;

		// Collect cue text (may span multiple lines until empty line)
		const textLines: string[] = [];
		while (i < lines.length && lines[i].trim() !== "") {
			textLines.push(lines[i].trim());
			i++;
		}

		const rawText = textLines.join(" ");
		const { speaker, cleanText } = extractSpeakerFromCue(rawText);

		if (speaker) {
			speakers.add(speaker);
		}

		cues.push({
			startTime,
			endTime,
			speaker,
			text: cleanText,
		});
	}

	// Format output: include timestamps and speaker labels
	const textParts = cues.map((cue) => {
		const speakerPrefix = cue.speaker ? `${cue.speaker}: ` : "";
		return `[${cue.startTime}] ${speakerPrefix}${cue.text}`;
	});

	return {
		text: textParts.join("\n"),
		speakers: Array.from(speakers),
		hasTimestamps: true,
		format: "srt",
	};
}

/**
 * Parse a transcript file based on its filename extension.
 *
 * @param buffer - The file content as a Buffer
 * @param filename - The original filename with extension
 * @returns Parsed transcript with text, speakers, and metadata
 * @throws Error if the file format is not supported
 */
export async function parseTranscript(
	buffer: Buffer,
	filename: string,
): Promise<ParsedTranscript> {
	const format = getFileFormat(filename);

	if (!format) {
		throw new Error(
			`Unsupported transcript format. Supported formats: ${SUPPORTED_TRANSCRIPT_EXTENSIONS.join(", ")}`,
		);
	}

	switch (format) {
		case "txt":
			return parseTxtTranscript(buffer);
		case "docx":
			return parseDocxTranscript(buffer);
		case "vtt":
			return parseVttTranscript(buffer);
		case "srt":
			return parseSrtTranscript(buffer);
	}
}
