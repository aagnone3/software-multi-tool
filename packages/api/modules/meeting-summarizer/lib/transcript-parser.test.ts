import { describe, expect, it } from "vitest";
import {
	MAX_TRANSCRIPT_SIZE,
	parseDocxTranscript,
	parseSrtTranscript,
	parseTranscript,
	parseTxtTranscript,
	parseVttTranscript,
	SUPPORTED_TRANSCRIPT_EXTENSIONS,
	SUPPORTED_TRANSCRIPT_MIME_TYPES,
	transcriptUploadRules,
} from "./transcript-parser";

describe("transcript-parser", () => {
	describe("constants", () => {
		it("should export supported extensions", () => {
			expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".txt");
			expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".docx");
			expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".vtt");
			expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".srt");
		});

		it("should export supported MIME types", () => {
			expect(SUPPORTED_TRANSCRIPT_MIME_TYPES).toContain("text/plain");
			expect(SUPPORTED_TRANSCRIPT_MIME_TYPES).toContain(
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			);
			expect(SUPPORTED_TRANSCRIPT_MIME_TYPES).toContain("text/vtt");
		});

		it("should have correct max file size (5MB)", () => {
			expect(MAX_TRANSCRIPT_SIZE).toBe(5 * 1024 * 1024);
		});

		it("should export transcript upload rules", () => {
			expect(transcriptUploadRules.maxSize).toBe(MAX_TRANSCRIPT_SIZE);
			expect(transcriptUploadRules.allowedExtensions).toEqual(
				SUPPORTED_TRANSCRIPT_EXTENSIONS,
			);
			expect(transcriptUploadRules.allowedMimeTypes).toEqual(
				SUPPORTED_TRANSCRIPT_MIME_TYPES,
			);
		});
	});

	describe("parseTxtTranscript", () => {
		it("should parse plain text transcript", async () => {
			const text = "Hello, this is a meeting transcript.";
			const buffer = Buffer.from(text, "utf-8");

			const result = await parseTxtTranscript(buffer);

			expect(result.text).toBe(text);
			expect(result.format).toBe("txt");
			expect(result.hasTimestamps).toBe(false);
			expect(result.speakers).toEqual([]);
		});

		it("should extract speakers from colon-prefixed lines", async () => {
			const text = `John: Hello everyone
Sarah: Hi John
John: Let's discuss the project`;
			const buffer = Buffer.from(text, "utf-8");

			const result = await parseTxtTranscript(buffer);

			expect(result.speakers).toContain("John");
			expect(result.speakers).toContain("Sarah");
			expect(result.speakers.length).toBe(2);
		});

		it("should extract speakers from bracket-prefixed lines", async () => {
			const text = `[Speaker A] Good morning
[Speaker B] Good morning
(Speaker A) Let's begin`;
			const buffer = Buffer.from(text, "utf-8");

			const result = await parseTxtTranscript(buffer);

			expect(result.speakers).toContain("Speaker A");
			expect(result.speakers).toContain("Speaker B");
		});

		it("should handle empty text", async () => {
			const buffer = Buffer.from("", "utf-8");

			const result = await parseTxtTranscript(buffer);

			expect(result.text).toBe("");
			expect(result.speakers).toEqual([]);
		});

		it("should trim whitespace", async () => {
			const text = "  \n\nHello World\n\n  ";
			const buffer = Buffer.from(text, "utf-8");

			const result = await parseTxtTranscript(buffer);

			expect(result.text).toBe("Hello World");
		});
	});

	describe("parseVttTranscript", () => {
		it("should parse basic VTT file", async () => {
			const vtt = `WEBVTT

00:00:00.000 --> 00:00:05.000
Hello everyone, welcome to the meeting.

00:00:05.000 --> 00:00:10.000
Let's get started.`;
			const buffer = Buffer.from(vtt, "utf-8");

			const result = await parseVttTranscript(buffer);

			expect(result.format).toBe("vtt");
			expect(result.hasTimestamps).toBe(true);
			expect(result.text).toContain("[00:00:00.000]");
			expect(result.text).toContain("Hello everyone");
			expect(result.text).toContain("[00:00:05.000]");
		});

		it("should extract speakers from VTT voice tags", async () => {
			const vtt = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v John>Hello everyone</v>

00:00:05.000 --> 00:00:10.000
<v Sarah>Hi John`;
			const buffer = Buffer.from(vtt, "utf-8");

			const result = await parseVttTranscript(buffer);

			expect(result.speakers).toContain("John");
			expect(result.speakers).toContain("Sarah");
			expect(result.text).toContain("John: Hello everyone");
			expect(result.text).toContain("Sarah: Hi John");
		});

		it("should handle VTT with speaker prefix format", async () => {
			const vtt = `WEBVTT

00:00:00.000 --> 00:00:05.000
John: Hello everyone

00:00:05.000 --> 00:00:10.000
Sarah: Let's begin`;
			const buffer = Buffer.from(vtt, "utf-8");

			const result = await parseVttTranscript(buffer);

			expect(result.speakers).toContain("John");
			expect(result.speakers).toContain("Sarah");
		});

		it("should handle VTT with short timestamp format", async () => {
			const vtt = `WEBVTT

00:00.000 --> 00:05.000
Hello world`;
			const buffer = Buffer.from(vtt, "utf-8");

			const result = await parseVttTranscript(buffer);

			expect(result.hasTimestamps).toBe(true);
			expect(result.text).toContain("Hello world");
		});

		it("should skip header metadata", async () => {
			const vtt = `WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:05.000
Content here`;
			const buffer = Buffer.from(vtt, "utf-8");

			const result = await parseVttTranscript(buffer);

			expect(result.text).not.toContain("Kind:");
			expect(result.text).toContain("Content here");
		});
	});

	describe("parseSrtTranscript", () => {
		it("should parse basic SRT file", async () => {
			const srt = `1
00:00:00,000 --> 00:00:05,000
Hello everyone, welcome.

2
00:00:05,000 --> 00:00:10,000
Let's begin.`;
			const buffer = Buffer.from(srt, "utf-8");

			const result = await parseSrtTranscript(buffer);

			expect(result.format).toBe("srt");
			expect(result.hasTimestamps).toBe(true);
			expect(result.text).toContain("[00:00:00.000]");
			expect(result.text).toContain("Hello everyone");
		});

		it("should convert SRT timestamps from comma to period", async () => {
			const srt = `1
00:00:00,500 --> 00:00:05,500
Test content`;
			const buffer = Buffer.from(srt, "utf-8");

			const result = await parseSrtTranscript(buffer);

			expect(result.text).toContain("[00:00:00.500]");
			expect(result.text).not.toContain(",500");
		});

		it("should extract speakers from SRT content", async () => {
			const srt = `1
00:00:00,000 --> 00:00:05,000
John: Hello everyone

2
00:00:05,000 --> 00:00:10,000
Sarah: Welcome to the meeting`;
			const buffer = Buffer.from(srt, "utf-8");

			const result = await parseSrtTranscript(buffer);

			expect(result.speakers).toContain("John");
			expect(result.speakers).toContain("Sarah");
		});

		it("should handle multiline cues", async () => {
			const srt = `1
00:00:00,000 --> 00:00:05,000
First line
Second line`;
			const buffer = Buffer.from(srt, "utf-8");

			const result = await parseSrtTranscript(buffer);

			expect(result.text).toContain("First line Second line");
		});
	});

	describe("parseDocxTranscript", () => {
		// Note: DOCX parsing requires actual DOCX binary content
		// These tests use minimal valid DOCX structures

		it("should handle invalid DOCX gracefully", async () => {
			const buffer = Buffer.from("not a valid docx", "utf-8");

			await expect(parseDocxTranscript(buffer)).rejects.toThrow();
		});
	});

	describe("parseTranscript", () => {
		it("should route to correct parser based on extension", async () => {
			const text = "Hello world";
			const buffer = Buffer.from(text, "utf-8");

			const result = await parseTranscript(buffer, "meeting.txt");

			expect(result.format).toBe("txt");
			expect(result.text).toBe(text);
		});

		it("should throw for unsupported extension", async () => {
			const buffer = Buffer.from("content", "utf-8");

			await expect(parseTranscript(buffer, "file.pdf")).rejects.toThrow(
				"Unsupported transcript format",
			);
		});

		it("should throw for missing extension", async () => {
			const buffer = Buffer.from("content", "utf-8");

			await expect(parseTranscript(buffer, "filename")).rejects.toThrow(
				"Unsupported transcript format",
			);
		});

		it("should handle case-insensitive extensions", async () => {
			const vtt = `WEBVTT

00:00:00.000 --> 00:00:05.000
Content`;
			const buffer = Buffer.from(vtt, "utf-8");

			const result = await parseTranscript(buffer, "FILE.VTT");

			expect(result.format).toBe("vtt");
		});

		it("should parse SRT files", async () => {
			const srt = `1
00:00:00,000 --> 00:00:05,000
Hello`;
			const buffer = Buffer.from(srt, "utf-8");

			const result = await parseTranscript(buffer, "subtitle.srt");

			expect(result.format).toBe("srt");
		});
	});
});
