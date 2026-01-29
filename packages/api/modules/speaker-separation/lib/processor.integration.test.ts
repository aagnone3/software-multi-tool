import * as fs from "node:fs";
import * as path from "node:path";
import type { Prisma, ToolJob } from "@repo/database";
import { describe, expect, it } from "vitest";
import { processSpeakerSeparationJob } from "./processor";

const hasApiKey = !!process.env.ASSEMBLYAI_API_KEY;

/**
 * Helper to create a mock job object for testing.
 */
function createMockJob(input: Record<string, unknown>): ToolJob {
	return {
		id: `integration-test-speaker-${Date.now()}`,
		toolSlug: "speaker-separation",
		toolId: null,
		status: "PROCESSING",
		priority: 0,
		input: input as Prisma.JsonValue,
		output: null,
		error: null,
		userId: "integration-test-user",
		sessionId: null,
		attempts: 1,
		maxAttempts: 3,
		startedAt: new Date(),
		completedAt: null,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
		pgBossJobId: null,
		newsAnalysisId: null,
		audioFileUrl: null,
		audioMetadata: null,
	};
}

/**
 * Helper to read a file and convert to base64.
 */
function fileToBase64(filePath: string): string {
	const buffer = fs.readFileSync(filePath);
	return buffer.toString("base64");
}

/**
 * Integration tests for the speaker separation processor with real AssemblyAI API calls
 *
 * IMPORTANT: These tests REQUIRE ASSEMBLYAI_API_KEY to be set.
 * Tests will be SKIPPED if the key is missing (set in apps/web/.env.local).
 *
 * Environment variables are loaded from apps/web/.env.local via tests/setup/environment.ts.
 *
 * NOTE: These tests make real API calls to AssemblyAI and incur costs (~$0.015/minute).
 * The sample audio files are short to minimize costs while still validating functionality.
 */
describe.skipIf(!hasApiKey)(
	"Speaker Separation Processor (integration)",
	() => {
		// AssemblyAI transcription can take 30-180 seconds depending on audio length
		const TIMEOUT = 300000; // 5 minutes for longer files

		// Path to the local test fixture
		// NOTE: Fixture is gitignored to prevent expensive API calls in CI (~$0.015/min).
		// The test below uses skipIf(!hasFixture) so it only runs locally when you
		// manually place an audio file in __fixtures__/. This saves CI costs.
		const FIXTURE_PATH = path.join(
			__dirname,
			"__fixtures__",
			"IB4001.Mix-Headset.wav",
		);
		const hasFixture = fs.existsSync(FIXTURE_PATH);

		describe("processSpeakerSeparationJob with base64 audio file", () => {
			it.skipIf(!hasFixture)(
				"should process a real WAV audio file with speaker separation",
				async () => {
					console.log(
						"\n=== Starting Speaker Separation Integration Test (Local Fixture) ===",
					);
					console.log("Fixture path:", FIXTURE_PATH);

					// Read the audio file and convert to base64
					const base64Content = fileToBase64(FIXTURE_PATH);
					console.log(
						"Audio file size:",
						(base64Content.length / 1024 / 1024).toFixed(2),
						"MB (base64)",
					);
					console.log(
						"This may take 2-5 minutes for AssemblyAI processing...\n",
					);

					const job = createMockJob({
						audioFile: {
							content: base64Content,
							mimeType: "audio/wav",
							filename: "IB4001.Mix-Headset.wav",
						},
					});

					const result = await processSpeakerSeparationJob(job);

					// Log error if failed for debugging
					if (!result.success) {
						console.error(
							"❌ Integration test failed:",
							result.error,
						);
					}

					// Should succeed
					expect(result.success).toBe(true);

					if (result.success) {
						const output = result.output as {
							speakerCount: number;
							duration: number;
							speakers: Array<{
								id: string;
								label: string;
								totalTime: number;
								percentage: number;
								segmentCount: number;
							}>;
							segments: Array<{
								speaker: string;
								text: string;
								startTime: number;
								endTime: number;
								confidence: number;
							}>;
							transcript: string;
						};

						// Verify output structure
						expect(output.speakerCount).toBeGreaterThan(0);
						expect(output.duration).toBeGreaterThan(0);
						expect(output.speakers).toBeDefined();
						expect(Array.isArray(output.speakers)).toBe(true);
						expect(output.speakers.length).toBe(
							output.speakerCount,
						);
						expect(output.segments).toBeDefined();
						expect(Array.isArray(output.segments)).toBe(true);
						expect(output.segments.length).toBeGreaterThan(0);
						expect(output.transcript).toBeDefined();
						expect(output.transcript.length).toBeGreaterThan(0);

						// Verify speaker stats structure
						for (const speaker of output.speakers) {
							expect(speaker.id).toBeDefined();
							expect(speaker.label).toMatch(/^Speaker [A-Z]$/);
							expect(speaker.totalTime).toBeGreaterThanOrEqual(0);
							expect(speaker.percentage).toBeGreaterThanOrEqual(
								0,
							);
							expect(speaker.percentage).toBeLessThanOrEqual(100);
							expect(speaker.segmentCount).toBeGreaterThan(0);
						}

						// Verify segment structure
						for (const segment of output.segments) {
							expect(segment.speaker).toBeDefined();
							expect(segment.text).toBeDefined();
							expect(segment.startTime).toBeGreaterThanOrEqual(0);
							expect(segment.endTime).toBeGreaterThan(
								segment.startTime,
							);
							expect(segment.confidence).toBeGreaterThanOrEqual(
								0,
							);
							expect(segment.confidence).toBeLessThanOrEqual(1);
						}

						// Verify percentages sum reasonably (may be <100% due to silence/gaps)
						const totalPercentage = output.speakers.reduce(
							(sum, s) => sum + s.percentage,
							0,
						);
						expect(totalPercentage).toBeGreaterThan(50); // At least half should be speech
						expect(totalPercentage).toBeLessThanOrEqual(100.5);

						// Log results for manual verification
						console.log("\n=== Integration Test Results ===");
						console.log("Speaker Count:", output.speakerCount);
						console.log("Duration:", output.duration, "seconds");
						console.log("\nSpeakers:");
						for (const speaker of output.speakers) {
							console.log(
								`  ${speaker.label}: ${speaker.totalTime.toFixed(2)}s (${speaker.percentage.toFixed(1)}%), ${speaker.segmentCount} segments`,
							);
						}
						console.log("\nFirst 5 segments:");
						for (const segment of output.segments.slice(0, 5)) {
							console.log(
								`  [${segment.startTime.toFixed(2)}s - ${segment.endTime.toFixed(2)}s] ${segment.speaker}: "${segment.text.substring(0, 80)}..."`,
							);
						}
						console.log("\nTranscript preview:");
						console.log(
							`${output.transcript.substring(0, 1000)}...`,
						);
					}
				},
				TIMEOUT,
			);

			it(
				"should return error for missing audio file",
				async () => {
					const job = createMockJob({}); // Missing audioFile

					const result = await processSpeakerSeparationJob(job);

					expect(result.success).toBe(false);
					expect(result.error).toBe("Audio file is required");
				},
				TIMEOUT,
			);

			it(
				"should return error for empty audio content",
				async () => {
					const job = createMockJob({
						audioFile: {
							content: "",
							mimeType: "audio/wav",
							filename: "empty.wav",
						},
					});

					const result = await processSpeakerSeparationJob(job);

					expect(result.success).toBe(false);
					expect(result.error).toBe("Audio file is required");
				},
				TIMEOUT,
			);
		});
	},
);
