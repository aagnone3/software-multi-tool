import { describe, expect, it } from "vitest";
import {
	type AudioFileData,
	DiarizationInputSchema,
	isSupportedAudioType,
	MAX_AUDIO_SIZE_BYTES,
	SUPPORTED_AUDIO_TYPES,
	validateAudioFile,
} from "./types";

describe("diarization types", () => {
	describe("isSupportedAudioType", () => {
		it.each([
			["audio/mpeg", true],
			["audio/wav", true],
			["audio/x-wav", true],
			["audio/mp4", true],
			["audio/x-m4a", true],
			["audio/ogg", true],
			["audio/webm", true],
		])("should return %s for %s", (mimeType, expected) => {
			expect(isSupportedAudioType(mimeType)).toBe(expected);
		});

		it.each([
			["video/mp4", false],
			["image/png", false],
			["application/pdf", false],
			["text/plain", false],
			["audio/flac", false],
			["", false],
		])("should return false for unsupported type %s", (mimeType) => {
			expect(isSupportedAudioType(mimeType)).toBe(false);
		});
	});

	describe("validateAudioFile", () => {
		const validAudioFile: AudioFileData = {
			content: "dGVzdCBhdWRpbyBjb250ZW50", // base64 for "test audio content"
			mimeType: "audio/mpeg",
			filename: "test.mp3",
			duration: 60,
		};

		it("should validate a valid MP3 file", () => {
			const result = validateAudioFile(validAudioFile);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should validate a valid WAV file", () => {
			const wavFile: AudioFileData = {
				...validAudioFile,
				mimeType: "audio/wav",
				filename: "test.wav",
			};
			const result = validateAudioFile(wavFile);
			expect(result.valid).toBe(true);
		});

		it("should validate a valid M4A file", () => {
			const m4aFile: AudioFileData = {
				...validAudioFile,
				mimeType: "audio/x-m4a",
				filename: "test.m4a",
			};
			const result = validateAudioFile(m4aFile);
			expect(result.valid).toBe(true);
		});

		it("should validate a valid OGG file", () => {
			const oggFile: AudioFileData = {
				...validAudioFile,
				mimeType: "audio/ogg",
				filename: "test.ogg",
			};
			const result = validateAudioFile(oggFile);
			expect(result.valid).toBe(true);
		});

		it("should validate a valid WEBM file", () => {
			const webmFile: AudioFileData = {
				...validAudioFile,
				mimeType: "audio/webm",
				filename: "test.webm",
			};
			const result = validateAudioFile(webmFile);
			expect(result.valid).toBe(true);
		});

		it("should reject unsupported audio format", () => {
			const unsupportedFile: AudioFileData = {
				...validAudioFile,
				mimeType: "audio/flac",
				filename: "test.flac",
			};
			const result = validateAudioFile(unsupportedFile);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Unsupported audio format");
			expect(result.error).toContain("MP3, WAV, M4A, OGG, WEBM");
		});

		it("should reject non-audio file types", () => {
			const videoFile: AudioFileData = {
				...validAudioFile,
				mimeType: "video/mp4",
				filename: "test.mp4",
			};
			const result = validateAudioFile(videoFile);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Unsupported audio format");
		});

		it("should reject files that exceed maximum size", () => {
			// Create a base64 string that would decode to > 100MB
			// Base64 encoding increases size by ~33%, so we need ~133MB of base64
			const largeContentLength =
				Math.ceil((MAX_AUDIO_SIZE_BYTES * 4) / 3) + 1000;
			const largeFile: AudioFileData = {
				...validAudioFile,
				content: "A".repeat(largeContentLength),
			};
			const result = validateAudioFile(largeFile);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("too large");
			expect(result.error).toContain("100MB");
		});

		it("should accept files at the size limit", () => {
			// Create a base64 string that would decode to exactly 100MB
			const limitContentLength = Math.floor(
				(MAX_AUDIO_SIZE_BYTES * 4) / 3,
			);
			const limitFile: AudioFileData = {
				...validAudioFile,
				content: "A".repeat(limitContentLength),
			};
			const result = validateAudioFile(limitFile);
			expect(result.valid).toBe(true);
		});
	});

	describe("DiarizationInputSchema", () => {
		it("should validate valid input with all fields", () => {
			const input = {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
					duration: 120,
				},
				maxSpeakers: 5,
			};
			const result = DiarizationInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it("should validate input without optional fields", () => {
			const input = {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
				},
			};
			const result = DiarizationInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it("should reject input without required audio content", () => {
			const input = {
				audioFile: {
					content: "",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
				},
			};
			const result = DiarizationInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject maxSpeakers below minimum", () => {
			const input = {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
				},
				maxSpeakers: 1,
			};
			const result = DiarizationInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject maxSpeakers above maximum", () => {
			const input = {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
				},
				maxSpeakers: 21,
			};
			const result = DiarizationInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should accept maxSpeakers at boundaries", () => {
			const inputMin = {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
				},
				maxSpeakers: 2,
			};
			const inputMax = {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "test.mp3",
				},
				maxSpeakers: 20,
			};
			expect(DiarizationInputSchema.safeParse(inputMin).success).toBe(
				true,
			);
			expect(DiarizationInputSchema.safeParse(inputMax).success).toBe(
				true,
			);
		});
	});

	describe("SUPPORTED_AUDIO_TYPES constant", () => {
		it("should include all expected audio formats", () => {
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/mpeg");
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/wav");
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/x-wav");
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/mp4");
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/x-m4a");
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/ogg");
			expect(SUPPORTED_AUDIO_TYPES).toContain("audio/webm");
		});

		it("should have exactly 7 supported types", () => {
			expect(SUPPORTED_AUDIO_TYPES).toHaveLength(7);
		});
	});

	describe("MAX_AUDIO_SIZE_BYTES constant", () => {
		it("should be 100MB", () => {
			expect(MAX_AUDIO_SIZE_BYTES).toBe(100 * 1024 * 1024);
		});
	});
});
