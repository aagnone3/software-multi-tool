import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetToolJobById = vi.hoisted(() => vi.fn());
const mockMarkJobCompleted = vi.hoisted(() => vi.fn());
const mockMarkJobFailed = vi.hoisted(() => vi.fn());
const mockCalculateSpeakerStats = vi.hoisted(() => vi.fn());
const mockDownloadAudioFromStorage = vi.hoisted(() => vi.fn());
const mockFormatTranscriptWithSpeakers = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

// Mock AssemblyAI client
const mockUpload = vi.hoisted(() => vi.fn());
const mockSubmit = vi.hoisted(() => vi.fn());
const mockWaitUntilReady = vi.hoisted(() => vi.fn());

vi.mock("assemblyai", () => {
	const AssemblyAI = vi.fn(function (this: unknown) {
		(this as Record<string, unknown>).files = { upload: mockUpload };
		(this as Record<string, unknown>).transcripts = {
			submit: mockSubmit,
			waitUntilReady: mockWaitUntilReady,
		};
	});
	return { AssemblyAI };
});

vi.mock("@repo/database", () => ({
	getToolJobById: mockGetToolJobById,
	markJobCompleted: mockMarkJobCompleted,
	markJobFailed: mockMarkJobFailed,
}));

vi.mock("@repo/api/modules/speaker-separation", () => ({
	calculateSpeakerStats: mockCalculateSpeakerStats,
	downloadAudioFromStorage: mockDownloadAudioFromStorage,
	formatTranscriptWithSpeakers: mockFormatTranscriptWithSpeakers,
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: mockLoggerInfo,
		error: mockLoggerError,
	},
}));

vi.mock("../client", () => ({
	inngest: {
		createFunction: (
			_config: unknown,
			_trigger: unknown,
			handler: (args: { event: unknown; step: unknown }) => unknown,
		) => handler,
	},
}));

import { speakerSeparation } from "./speaker-separation";

describe("speakerSeparation inngest function", () => {
	const toolJobId = "job-ss-1";
	const audioFileUrl = "https://storage.example.com/audio.mp3";
	const mockJob = {
		id: toolJobId,
		toolSlug: "speaker-separation",
		audioFileUrl,
		input: null,
	};
	const mockUtterances = [
		{ speaker: "A", text: "Hello", start: 0, end: 1000, confidence: 0.95 },
		{
			speaker: "B",
			text: "World",
			start: 1000,
			end: 2000,
			confidence: 0.9,
		},
	];

	const makeStep = () => ({
		run: vi.fn(async (_name: string, fn: () => unknown) => fn()),
	});

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("ASSEMBLYAI_API_KEY", "test-key");
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockDownloadAudioFromStorage.mockResolvedValue(Buffer.from("audio"));
		mockUpload.mockResolvedValue("https://assemblyai.com/upload/123");
		mockSubmit.mockResolvedValue({ id: "transcript-abc" });
		mockWaitUntilReady.mockResolvedValue({
			status: "completed",
			utterances: mockUtterances,
			audio_duration: 10,
		});
		mockCalculateSpeakerStats.mockReturnValue([
			{ speaker: "A", duration: 1, percentage: 50 },
			{ speaker: "B", duration: 1, percentage: 50 },
		]);
		mockFormatTranscriptWithSpeakers.mockReturnValue("A: Hello\nB: World");
		mockMarkJobCompleted.mockResolvedValue(undefined);
		mockMarkJobFailed.mockResolvedValue(undefined);
	});

	it("runs all 5 steps in order", async () => {
		const step = makeStep();
		await (
			speakerSeparation as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(step.run).toHaveBeenCalledTimes(5);
		expect(step.run).toHaveBeenNthCalledWith(
			1,
			"validate-job",
			expect.any(Function),
		);
		expect(step.run).toHaveBeenNthCalledWith(
			2,
			"upload-to-assemblyai",
			expect.any(Function),
		);
		expect(step.run).toHaveBeenNthCalledWith(
			3,
			"submit-transcription",
			expect.any(Function),
		);
		expect(step.run).toHaveBeenNthCalledWith(
			4,
			"poll-transcription",
			expect.any(Function),
		);
		expect(step.run).toHaveBeenNthCalledWith(
			5,
			"process-and-save",
			expect.any(Function),
		);
	});

	it("returns success when job completes", async () => {
		const step = makeStep();
		const result = await (
			speakerSeparation as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(result.success).toBe(true);
		expect(result.toolJobId).toBe(toolJobId);
		expect(mockMarkJobCompleted).toHaveBeenCalledOnce();
	});

	it("throws if job not found during validate step", async () => {
		mockGetToolJobById.mockResolvedValueOnce(null);

		const step = makeStep();
		await expect(
			(
				speakerSeparation as unknown as (
					...args: unknown[]
				) => Promise<Record<string, unknown>>
			)({
				event: { data: { toolJobId } },
				step,
			}),
		).rejects.toThrow(`Tool job not found: ${toolJobId}`);
	});

	it("throws if no audio file URL in job", async () => {
		mockGetToolJobById.mockResolvedValueOnce({
			...mockJob,
			audioFileUrl: null,
			input: null,
		});

		const step = makeStep();
		await expect(
			(
				speakerSeparation as unknown as (
					...args: unknown[]
				) => Promise<Record<string, unknown>>
			)({
				event: { data: { toolJobId } },
				step,
			}),
		).rejects.toThrow("No audio file URL found in job");
	});

	it("marks job failed when AssemblyAI returns error status", async () => {
		mockWaitUntilReady.mockResolvedValueOnce({
			status: "error",
			error: "Audio too long",
			utterances: null,
		});

		const step = makeStep();
		const result = await (
			speakerSeparation as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(mockMarkJobFailed).toHaveBeenCalledWith(
			toolJobId,
			"Audio too long",
		);
		expect(result.success).toBe(false);
	});

	it("marks job failed when no utterances detected", async () => {
		mockWaitUntilReady.mockResolvedValueOnce({
			status: "completed",
			utterances: [],
			audio_duration: 5,
		});

		const step = makeStep();
		const result = await (
			speakerSeparation as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(mockMarkJobFailed).toHaveBeenCalledWith(
			toolJobId,
			"No speech detected in audio",
		);
		expect(result.success).toBe(false);
	});

	it("falls back to input.audioFileUrl when job.audioFileUrl is null", async () => {
		mockGetToolJobById.mockResolvedValueOnce({
			...mockJob,
			audioFileUrl: null,
			input: { audioFileUrl },
		});

		const step = makeStep();
		const result = await (
			speakerSeparation as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(result.success).toBe(true);
		expect(mockDownloadAudioFromStorage).toHaveBeenCalledWith(audioFileUrl);
	});
});
