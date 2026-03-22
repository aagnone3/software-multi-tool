import { describe, expect, it, vi } from "vitest";
import {
	MAX_TRANSCRIPT_SIZE,
	parseSrtTranscript,
	parseTranscript,
	parseTxtTranscript,
	parseVttTranscript,
	SUPPORTED_TRANSCRIPT_EXTENSIONS,
	SUPPORTED_TRANSCRIPT_MIME_TYPES,
} from "./transcript-parser";

// Mock mammoth for docx tests
vi.mock("mammoth", () => ({
	default: {
		extractRawText: vi.fn().mockResolvedValue({ value: "Hello World" }),
	},
}));

describe("constants", () => {
	it("exports supported extensions", () => {
		expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".txt");
		expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".docx");
		expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".vtt");
		expect(SUPPORTED_TRANSCRIPT_EXTENSIONS).toContain(".srt");
	});

	it("exports supported MIME types", () => {
		expect(SUPPORTED_TRANSCRIPT_MIME_TYPES).toContain("text/plain");
		expect(SUPPORTED_TRANSCRIPT_MIME_TYPES).toContain("text/vtt");
	});

	it("has correct max size (5MB)", () => {
		expect(MAX_TRANSCRIPT_SIZE).toBe(5 * 1024 * 1024);
	});
});

describe("parseTxtTranscript", () => {
	it("parses plain text with no speakers", async () => {
		const buffer = Buffer.from("Hello world\nThis is a transcript.");
		const result = await parseTxtTranscript(buffer);
		expect(result.format).toBe("txt");
		expect(result.text).toBe("Hello world\nThis is a transcript.");
		expect(result.speakers).toEqual([]);
		expect(result.hasTimestamps).toBe(false);
	});

	it("extracts speakers from colon pattern", async () => {
		const buffer = Buffer.from("Alice: Hello there\nBob: Hi Alice");
		const result = await parseTxtTranscript(buffer);
		expect(result.speakers).toContain("Alice");
		expect(result.speakers).toContain("Bob");
	});

	it("extracts speakers from bracket pattern", async () => {
		const buffer = Buffer.from("[Alice] Hello there\n[Bob] Hi Alice");
		const result = await parseTxtTranscript(buffer);
		expect(result.speakers).toContain("Alice");
		expect(result.speakers).toContain("Bob");
	});
});

describe("parseVttTranscript", () => {
	it("parses basic VTT file", async () => {
		const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
Hello world

00:00:02.000 --> 00:00:04.000
Goodbye world`;
		const result = await parseVttTranscript(Buffer.from(vtt));
		expect(result.format).toBe("vtt");
		expect(result.hasTimestamps).toBe(true);
		expect(result.text).toContain("Hello world");
		expect(result.text).toContain("Goodbye world");
		expect(result.speakers).toEqual([]);
	});

	it("extracts speakers from VTT voice tags", async () => {
		const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
<v Alice>Hello there</v>

00:00:02.000 --> 00:00:04.000
<v Bob>Hi Alice</v>`;
		const result = await parseVttTranscript(Buffer.from(vtt));
		expect(result.speakers).toContain("Alice");
		expect(result.speakers).toContain("Bob");
	});

	it("extracts speakers from speaker prefix pattern in VTT", async () => {
		const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
Alice: Hello there`;
		const result = await parseVttTranscript(Buffer.from(vtt));
		expect(result.speakers).toContain("Alice");
	});
});

describe("parseSrtTranscript", () => {
	it("parses basic SRT file", async () => {
		const srt = `1
00:00:00,000 --> 00:00:02,000
Hello world

2
00:00:02,000 --> 00:00:04,000
Goodbye world`;
		const result = await parseSrtTranscript(Buffer.from(srt));
		expect(result.format).toBe("srt");
		expect(result.hasTimestamps).toBe(true);
		expect(result.text).toContain("Hello world");
		expect(result.text).toContain("Goodbye world");
		expect(result.speakers).toEqual([]);
	});

	it("extracts speakers from SRT", async () => {
		const srt = `1
00:00:00,000 --> 00:00:02,000
Alice: Hello there

2
00:00:02,000 --> 00:00:04,000
Bob: Hi Alice`;
		const result = await parseSrtTranscript(Buffer.from(srt));
		expect(result.speakers).toContain("Alice");
		expect(result.speakers).toContain("Bob");
	});

	it("converts SRT comma timestamps to dot format", async () => {
		const srt = `1
00:00:01,500 --> 00:00:03,000
Test cue`;
		const result = await parseSrtTranscript(Buffer.from(srt));
		expect(result.text).toContain("00:00:01.500");
	});
});

describe("parseTranscript", () => {
	it("routes .txt extension to txt parser", async () => {
		const result = await parseTranscript(
			Buffer.from("Hello"),
			"transcript.txt",
		);
		expect(result.format).toBe("txt");
	});

	it("routes .docx extension to docx parser", async () => {
		const result = await parseTranscript(
			Buffer.from("fake docx"),
			"transcript.docx",
		);
		expect(result.format).toBe("docx");
		expect(result.text).toBe("Hello World"); // from mock
	});

	it("routes .vtt extension to vtt parser", async () => {
		const vtt = "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHi";
		const result = await parseTranscript(
			Buffer.from(vtt),
			"transcript.vtt",
		);
		expect(result.format).toBe("vtt");
	});

	it("routes .srt extension to srt parser", async () => {
		const srt = "1\n00:00:00,000 --> 00:00:01,000\nHi";
		const result = await parseTranscript(
			Buffer.from(srt),
			"transcript.srt",
		);
		expect(result.format).toBe("srt");
	});

	it("throws for unsupported extension", async () => {
		await expect(
			parseTranscript(Buffer.from("data"), "transcript.pdf"),
		).rejects.toThrow("Unsupported transcript format");
	});
});
