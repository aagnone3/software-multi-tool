import type { ToolJob } from "@repo/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeakerSegment } from "../types";
import {
	calculateSpeakerStats,
	formatTranscriptWithSpeakers,
	processSpeakerSeparationJob,
} from "./processor";

// Mock AssemblyAI
const mockTranscribe = vi.hoisted(() => vi.fn());
const mockUpload = vi.hoisted(() => vi.fn());

vi.mock("assemblyai", () => ({
	AssemblyAI: class MockAssemblyAI {
		files = {
			upload: mockUpload,
		};
		transcripts = {
			transcribe: mockTranscribe,
		};
	},
}));

describe("Speaker Separation Processor", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv, ASSEMBLYAI_API_KEY: "test-api-key" };
		// Default mock for file upload
		mockUpload.mockResolvedValue(
			"https://cdn.assemblyai.com/upload/test-upload-url",
		);
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	// Sample base64 audio content (just a placeholder for testing)
	const sampleBase64Audio =
		Buffer.from("test audio content").toString("base64");

	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "speaker-separation",
		status: "PROCESSING",
		priority: 0,
		input: {
			audioFile: {
				content: sampleBase64Audio,
				mimeType: "audio/wav",
				filename: "test.wav",
			},
		},
		output: null,
		error: null,
		userId: "user-123",
		sessionId: null,
		attempts: 1,
		maxAttempts: 3,
		startedAt: new Date(),
		completedAt: null,
		processAfter: null,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAssemblyAIResponse = {
		id: "transcript-123",
		status: "completed",
		text: "Hello how are you I am fine thank you",
		utterances: [
			{
				speaker: "A",
				text: "Hello, how are you?",
				start: 0,
				end: 2500,
				confidence: 0.95,
				words: [],
			},
			{
				speaker: "B",
				text: "I am fine, thank you.",
				start: 2500,
				end: 5000,
				confidence: 0.92,
				words: [],
			},
			{
				speaker: "A",
				text: "That's great to hear!",
				start: 5000,
				end: 7500,
				confidence: 0.88,
				words: [],
			},
		],
		audio_duration: 7.5,
		error: null,
	};

	describe("processSpeakerSeparationJob", () => {
		it("successfully processes speaker separation job", async () => {
			mockTranscribe.mockResolvedValue(mockAssemblyAIResponse);

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(true);
			expect(result.output).toBeDefined();

			const output = result.output as {
				speakerCount: number;
				duration: number;
				speakers: Array<{ id: string; label: string }>;
				segments: Array<{ speaker: string; text: string }>;
				transcript: string;
			};

			expect(output.speakerCount).toBe(2);
			expect(output.duration).toBe(7.5);
			expect(output.segments).toHaveLength(3);
			expect(output.speakers).toHaveLength(2);
		});

		it("returns error when audio file is missing", async () => {
			const missingFileJob = {
				...mockJob,
				input: {},
			};

			const result = await processSpeakerSeparationJob(missingFileJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Audio file is required");
		});

		it("returns error when audio content is empty", async () => {
			const emptyContentJob = {
				...mockJob,
				input: {
					audioFile: {
						content: "",
						mimeType: "audio/wav",
						filename: "empty.wav",
					},
				},
			};

			const result = await processSpeakerSeparationJob(emptyContentJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Audio file is required");
		});

		it("returns error when ASSEMBLYAI_API_KEY is not set", async () => {
			delete process.env.ASSEMBLYAI_API_KEY;

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe(
				"ASSEMBLYAI_API_KEY environment variable is not set",
			);
		});

		it("returns error when AssemblyAI returns error status", async () => {
			mockTranscribe.mockResolvedValue({
				...mockAssemblyAIResponse,
				status: "error",
				error: "Audio file could not be processed",
			});

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Audio file could not be processed");
		});

		it("returns error when no speech is detected", async () => {
			mockTranscribe.mockResolvedValue({
				...mockAssemblyAIResponse,
				utterances: [],
			});

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("No speech detected in audio");
		});

		it("returns error when utterances is null", async () => {
			mockTranscribe.mockResolvedValue({
				...mockAssemblyAIResponse,
				utterances: null,
			});

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("No speech detected in audio");
		});

		it("handles AssemblyAI service errors", async () => {
			mockTranscribe.mockRejectedValue(
				new Error("API rate limit exceeded"),
			);

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("API rate limit exceeded");
		});

		it("converts milliseconds to seconds correctly", async () => {
			mockTranscribe.mockResolvedValue(mockAssemblyAIResponse);

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(true);
			const output = result.output as {
				segments: Array<{ startTime: number; endTime: number }>;
			};

			// First segment: 0ms -> 0s, 2500ms -> 2.5s
			expect(output.segments[0].startTime).toBe(0);
			expect(output.segments[0].endTime).toBe(2.5);

			// Second segment: 2500ms -> 2.5s, 5000ms -> 5s
			expect(output.segments[1].startTime).toBe(2.5);
			expect(output.segments[1].endTime).toBe(5);
		});

		it("uploads audio file and calls AssemblyAI with speaker_labels enabled", async () => {
			mockTranscribe.mockResolvedValue(mockAssemblyAIResponse);

			await processSpeakerSeparationJob(mockJob);

			// Should upload the file first
			expect(mockUpload).toHaveBeenCalled();

			// Should call transcribe with the uploaded URL
			expect(mockTranscribe).toHaveBeenCalledWith({
				audio: "https://cdn.assemblyai.com/upload/test-upload-url",
				speaker_labels: true,
			});
		});

		it("handles file upload errors", async () => {
			mockUpload.mockRejectedValue(new Error("Upload failed"));

			const result = await processSpeakerSeparationJob(mockJob);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Upload failed");
		});
	});

	describe("calculateSpeakerStats", () => {
		const segments: SpeakerSegment[] = [
			{
				speaker: "A",
				text: "Hello",
				startTime: 0,
				endTime: 10,
				confidence: 0.9,
			},
			{
				speaker: "B",
				text: "Hi there",
				startTime: 10,
				endTime: 25,
				confidence: 0.85,
			},
			{
				speaker: "A",
				text: "How are you?",
				startTime: 25,
				endTime: 35,
				confidence: 0.92,
			},
			{
				speaker: "C",
				text: "Good!",
				startTime: 35,
				endTime: 40,
				confidence: 0.88,
			},
		];

		it("calculates total time per speaker correctly", () => {
			const stats = calculateSpeakerStats(segments, 40);

			const speakerA = stats.find((s) => s.id === "A");
			const speakerB = stats.find((s) => s.id === "B");
			const speakerC = stats.find((s) => s.id === "C");

			// Speaker A: 10s + 10s = 20s
			expect(speakerA?.totalTime).toBe(20);
			// Speaker B: 15s
			expect(speakerB?.totalTime).toBe(15);
			// Speaker C: 5s
			expect(speakerC?.totalTime).toBe(5);
		});

		it("calculates segment count per speaker correctly", () => {
			const stats = calculateSpeakerStats(segments, 40);

			const speakerA = stats.find((s) => s.id === "A");
			const speakerB = stats.find((s) => s.id === "B");
			const speakerC = stats.find((s) => s.id === "C");

			expect(speakerA?.segmentCount).toBe(2);
			expect(speakerB?.segmentCount).toBe(1);
			expect(speakerC?.segmentCount).toBe(1);
		});

		it("calculates percentage of total correctly", () => {
			const stats = calculateSpeakerStats(segments, 40);

			const speakerA = stats.find((s) => s.id === "A");
			const speakerB = stats.find((s) => s.id === "B");
			const speakerC = stats.find((s) => s.id === "C");

			// Speaker A: 20/40 = 50%
			expect(speakerA?.percentage).toBe(50);
			// Speaker B: 15/40 = 37.5%
			expect(speakerB?.percentage).toBe(37.5);
			// Speaker C: 5/40 = 12.5%
			expect(speakerC?.percentage).toBe(12.5);
		});

		it("returns empty array for empty segments", () => {
			const stats = calculateSpeakerStats([], 0);
			expect(stats).toEqual([]);
		});

		it("handles zero total duration", () => {
			const stats = calculateSpeakerStats(segments, 0);

			for (const speaker of stats) {
				expect(speaker.percentage).toBe(0);
			}
		});

		it("sorts speakers by ID", () => {
			const stats = calculateSpeakerStats(segments, 40);

			expect(stats[0].id).toBe("A");
			expect(stats[1].id).toBe("B");
			expect(stats[2].id).toBe("C");
		});

		it("generates correct labels", () => {
			const stats = calculateSpeakerStats(segments, 40);

			expect(stats[0].label).toBe("Speaker A");
			expect(stats[1].label).toBe("Speaker B");
			expect(stats[2].label).toBe("Speaker C");
		});

		it("rounds totalTime to 2 decimal places", () => {
			const precisionSegments: SpeakerSegment[] = [
				{
					speaker: "A",
					text: "Test",
					startTime: 0,
					endTime: 1.3333,
					confidence: 0.9,
				},
				{
					speaker: "A",
					text: "Test",
					startTime: 1.3333,
					endTime: 2.6666,
					confidence: 0.9,
				},
			];

			const stats = calculateSpeakerStats(precisionSegments, 3);

			// 1.3333 + 1.3333 = 2.6666 -> rounded to 2.67
			expect(stats[0].totalTime).toBe(2.67);
		});
	});

	describe("formatTranscriptWithSpeakers", () => {
		it("formats transcript with speaker labels", () => {
			const segments: SpeakerSegment[] = [
				{
					speaker: "A",
					text: "Hello",
					startTime: 0,
					endTime: 2,
					confidence: 0.9,
				},
				{
					speaker: "B",
					text: "Hi there",
					startTime: 2,
					endTime: 4,
					confidence: 0.85,
				},
			];

			const transcript = formatTranscriptWithSpeakers(segments);

			expect(transcript).toBe("Speaker A: Hello\nSpeaker B: Hi there");
		});

		it("concatenates consecutive segments from same speaker", () => {
			const segments: SpeakerSegment[] = [
				{
					speaker: "A",
					text: "Hello,",
					startTime: 0,
					endTime: 1,
					confidence: 0.9,
				},
				{
					speaker: "A",
					text: "how are you?",
					startTime: 1,
					endTime: 3,
					confidence: 0.9,
				},
				{
					speaker: "B",
					text: "I'm fine.",
					startTime: 3,
					endTime: 5,
					confidence: 0.85,
				},
			];

			const transcript = formatTranscriptWithSpeakers(segments);

			expect(transcript).toBe(
				"Speaker A: Hello, how are you?\nSpeaker B: I'm fine.",
			);
		});

		it("handles single segment", () => {
			const segments: SpeakerSegment[] = [
				{
					speaker: "A",
					text: "Monologue",
					startTime: 0,
					endTime: 10,
					confidence: 0.9,
				},
			];

			const transcript = formatTranscriptWithSpeakers(segments);

			expect(transcript).toBe("Speaker A: Monologue");
		});

		it("returns empty string for empty segments", () => {
			const transcript = formatTranscriptWithSpeakers([]);
			expect(transcript).toBe("");
		});

		it("handles multiple speaker switches", () => {
			const segments: SpeakerSegment[] = [
				{
					speaker: "A",
					text: "First",
					startTime: 0,
					endTime: 1,
					confidence: 0.9,
				},
				{
					speaker: "B",
					text: "Second",
					startTime: 1,
					endTime: 2,
					confidence: 0.9,
				},
				{
					speaker: "A",
					text: "Third",
					startTime: 2,
					endTime: 3,
					confidence: 0.9,
				},
				{
					speaker: "B",
					text: "Fourth",
					startTime: 3,
					endTime: 4,
					confidence: 0.9,
				},
			];

			const transcript = formatTranscriptWithSpeakers(segments);

			expect(transcript).toBe(
				"Speaker A: First\nSpeaker B: Second\nSpeaker A: Third\nSpeaker B: Fourth",
			);
		});
	});
});
