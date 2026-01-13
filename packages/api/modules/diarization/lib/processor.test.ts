import type { ToolJob } from "@repo/database/prisma/generated/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processDiarizationJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

describe("Diarization Processor", () => {
	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "diarization",
		status: "PROCESSING",
		priority: 0,
		input: {
			audioFile: {
				content: "dGVzdCBhdWRpbyBjb250ZW50", // base64 for "test audio content"
				mimeType: "audio/mpeg",
				filename: "meeting.mp3",
				duration: 120,
			},
			maxSpeakers: 4,
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

	const mockAIResponse = {
		segments: [
			{ speaker: "Speaker 1", start: 0, end: 15.5, confidence: 0.92 },
			{ speaker: "Speaker 2", start: 15.5, end: 35.2, confidence: 0.88 },
			{ speaker: "Speaker 1", start: 35.2, end: 55.0, confidence: 0.95 },
			{ speaker: "Speaker 2", start: 55.0, end: 80.3, confidence: 0.91 },
			{ speaker: "Speaker 1", start: 80.3, end: 100.0, confidence: 0.89 },
			{
				speaker: "Speaker 3",
				start: 100.0,
				end: 120.0,
				confidence: 0.85,
			},
		],
		totalSpeakers: 3,
		confidence: 0.9,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("successfully processes diarization job", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(mockJob);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();

		const output = result.output as {
			segments: Array<{
				speaker: string;
				start: number;
				end: number;
				confidence: number;
			}>;
			speakers: Array<{
				speaker: string;
				totalDuration: number;
				segmentCount: number;
				percentageOfTotal: number;
			}>;
			totalDuration: number;
			totalSpeakers: number;
			confidence: number;
		};

		expect(output.segments).toHaveLength(6);
		expect(output.totalSpeakers).toBe(3);
		expect(output.confidence).toBe(0.9);
		expect(output.totalDuration).toBe(120);
	});

	it("calculates speaker statistics correctly", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as {
			speakers: Array<{
				speaker: string;
				totalDuration: number;
				segmentCount: number;
				percentageOfTotal: number;
			}>;
		};

		// Verify speaker statistics are calculated
		expect(output.speakers).toBeDefined();
		expect(output.speakers.length).toBeGreaterThan(0);

		// Verify each speaker has required fields
		for (const speaker of output.speakers) {
			expect(speaker.speaker).toBeDefined();
			expect(speaker.totalDuration).toBeGreaterThanOrEqual(0);
			expect(speaker.segmentCount).toBeGreaterThanOrEqual(0);
			expect(speaker.percentageOfTotal).toBeGreaterThanOrEqual(0);
			expect(speaker.percentageOfTotal).toBeLessThanOrEqual(100);
		}
	});

	it("returns error when audio file is missing", async () => {
		const missingFileJob = {
			...mockJob,
			input: {},
		};

		const result = await processDiarizationJob(missingFileJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Audio file is required");
	});

	it("returns error for unsupported audio format", async () => {
		const unsupportedFormatJob = {
			...mockJob,
			input: {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "video/mp4",
					filename: "video.mp4",
				},
			},
		};

		const result = await processDiarizationJob(unsupportedFormatJob);

		expect(result.success).toBe(false);
		expect(result.error).toContain("Unsupported audio format");
	});

	it("handles AI response parsing errors", async () => {
		executePromptMock.mockResolvedValue({
			content: "Invalid JSON response",
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("handles AI service errors", async () => {
		executePromptMock.mockRejectedValue(
			new Error("API rate limit exceeded"),
		);

		const result = await processDiarizationJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("API rate limit exceeded");
	});

	it("sorts segments by start time", async () => {
		const unsortedResponse = {
			segments: [
				{ speaker: "Speaker 1", start: 50, end: 75, confidence: 0.9 },
				{ speaker: "Speaker 2", start: 0, end: 25, confidence: 0.85 },
				{ speaker: "Speaker 1", start: 25, end: 50, confidence: 0.92 },
			],
			totalSpeakers: 2,
			confidence: 0.88,
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(unsortedResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as {
			segments: Array<{ start: number; end: number }>;
		};

		// Verify segments are sorted by start time
		for (let i = 1; i < output.segments.length; i++) {
			expect(output.segments[i].start).toBeGreaterThanOrEqual(
				output.segments[i - 1].start,
			);
		}
	});

	it("processes job without maxSpeakers (auto-detect)", async () => {
		const jobWithoutMaxSpeakers = {
			...mockJob,
			input: {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "meeting.mp3",
					duration: 60,
				},
			},
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(jobWithoutMaxSpeakers);

		expect(result.success).toBe(true);
		expect(executePromptMock).toHaveBeenCalled();
		const callArg = executePromptMock.mock.calls[0][0] as string;
		expect(callArg).toContain("Auto-detect number of speakers");
	});

	it("uses provided duration from audio file", async () => {
		const jobWithDuration = {
			...mockJob,
			input: {
				audioFile: {
					content: "dGVzdA==",
					mimeType: "audio/mpeg",
					filename: "meeting.mp3",
					duration: 300, // 5 minutes
				},
			},
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(jobWithDuration);

		expect(result.success).toBe(true);
		const output = result.output as { totalDuration: number };
		expect(output.totalDuration).toBe(300);
	});

	it("provides default confidence when not in AI response", async () => {
		const responseWithoutConfidence = {
			segments: [
				{ speaker: "Speaker 1", start: 0, end: 30, confidence: 0.9 },
			],
			totalSpeakers: 1,
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(responseWithoutConfidence),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processDiarizationJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as { confidence: number };
		expect(output.confidence).toBe(0.85); // default confidence
	});

	it("validates all supported audio formats", async () => {
		const formats = [
			{ mimeType: "audio/mpeg", filename: "test.mp3" },
			{ mimeType: "audio/wav", filename: "test.wav" },
			{ mimeType: "audio/x-wav", filename: "test.wav" },
			{ mimeType: "audio/mp4", filename: "test.m4a" },
			{ mimeType: "audio/x-m4a", filename: "test.m4a" },
			{ mimeType: "audio/ogg", filename: "test.ogg" },
			{ mimeType: "audio/webm", filename: "test.webm" },
		];

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-haiku-20241022",
			usage: { inputTokens: 100, outputTokens: 200 },
			stopReason: "end_turn",
		});

		for (const format of formats) {
			const formatJob = {
				...mockJob,
				input: {
					audioFile: {
						content: "dGVzdA==",
						mimeType: format.mimeType,
						filename: format.filename,
						duration: 60,
					},
				},
			};

			const result = await processDiarizationJob(formatJob);
			expect(result.success).toBe(true);
		}
	});
});
