import { describe, expect, it } from "vitest";
import {
	MAX_AUDIO_DURATION_SECONDS,
	SpeakerSegmentSchema,
	SpeakerSeparationInputSchema,
	SpeakerSeparationOutputSchema,
	SpeakerStatsSchema,
	SUPPORTED_AUDIO_FORMATS,
} from "./types";

describe("Speaker Separation Types", () => {
	describe("SpeakerSeparationInputSchema", () => {
		it("accepts valid audio URL", () => {
			const input = { audioUrl: "https://example.com/audio.mp3" };
			const result = SpeakerSeparationInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it("rejects invalid URL", () => {
			const input = { audioUrl: "not-a-url" };
			const result = SpeakerSeparationInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("rejects missing audioUrl", () => {
			const input = {};
			const result = SpeakerSeparationInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("SpeakerSegmentSchema", () => {
		it("accepts valid segment", () => {
			const segment = {
				speaker: "A",
				text: "Hello, world!",
				startTime: 0,
				endTime: 2.5,
				confidence: 0.95,
			};
			const result = SpeakerSegmentSchema.safeParse(segment);
			expect(result.success).toBe(true);
		});

		it("rejects confidence below 0", () => {
			const segment = {
				speaker: "A",
				text: "Hello",
				startTime: 0,
				endTime: 1,
				confidence: -0.1,
			};
			const result = SpeakerSegmentSchema.safeParse(segment);
			expect(result.success).toBe(false);
		});

		it("rejects confidence above 1", () => {
			const segment = {
				speaker: "A",
				text: "Hello",
				startTime: 0,
				endTime: 1,
				confidence: 1.5,
			};
			const result = SpeakerSegmentSchema.safeParse(segment);
			expect(result.success).toBe(false);
		});
	});

	describe("SpeakerStatsSchema", () => {
		it("accepts valid speaker stats", () => {
			const stats = {
				id: "A",
				label: "Speaker A",
				totalTime: 120.5,
				percentage: 42.5,
				segmentCount: 15,
			};
			const result = SpeakerStatsSchema.safeParse(stats);
			expect(result.success).toBe(true);
		});

		it("requires all fields", () => {
			const incompleteStats = {
				id: "A",
				label: "Speaker A",
			};
			const result = SpeakerStatsSchema.safeParse(incompleteStats);
			expect(result.success).toBe(false);
		});
	});

	describe("SpeakerSeparationOutputSchema", () => {
		it("accepts valid output", () => {
			const output = {
				speakerCount: 2,
				duration: 300,
				speakers: [
					{
						id: "A",
						label: "Speaker A",
						totalTime: 150,
						percentage: 50,
						segmentCount: 10,
					},
					{
						id: "B",
						label: "Speaker B",
						totalTime: 150,
						percentage: 50,
						segmentCount: 8,
					},
				],
				segments: [
					{
						speaker: "A",
						text: "Hello",
						startTime: 0,
						endTime: 5,
						confidence: 0.9,
					},
				],
				transcript: "Speaker A: Hello",
			};
			const result = SpeakerSeparationOutputSchema.safeParse(output);
			expect(result.success).toBe(true);
		});
	});

	describe("Constants", () => {
		it("has supported audio formats", () => {
			expect(SUPPORTED_AUDIO_FORMATS).toContain("mp3");
			expect(SUPPORTED_AUDIO_FORMATS).toContain("wav");
			expect(SUPPORTED_AUDIO_FORMATS).toContain("m4a");
			expect(SUPPORTED_AUDIO_FORMATS).toContain("flac");
			expect(SUPPORTED_AUDIO_FORMATS).toContain("ogg");
			expect(SUPPORTED_AUDIO_FORMATS).toContain("webm");
		});

		it("has correct max audio duration", () => {
			// 60 minutes in seconds
			expect(MAX_AUDIO_DURATION_SECONDS).toBe(3600);
		});
	});
});
