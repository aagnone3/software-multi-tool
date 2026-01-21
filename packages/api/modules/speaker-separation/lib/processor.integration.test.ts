import { describe, expect, it } from "vitest";
import { processSpeakerSeparationJob } from "./processor";

/**
 * Integration tests for the speaker separation processor with real AssemblyAI API calls
 *
 * IMPORTANT: These tests REQUIRE ASSEMBLYAI_API_KEY to be set.
 * Tests will FAIL if the key is missing (not skip).
 *
 * Environment variables are loaded from apps/web/.env.local via tests/setup/environment.ts.
 *
 * NOTE: These tests make real API calls to AssemblyAI and incur costs (~$0.015/minute).
 * The sample audio files are short to minimize costs while still validating functionality.
 */
describe("Speaker Separation Processor (integration)", () => {
	// AssemblyAI transcription can take 30-120 seconds depending on audio length
	const TIMEOUT = 180000; // 3 minutes

	const requireApiKey = () => {
		if (!process.env.ASSEMBLYAI_API_KEY) {
			throw new Error(
				"ASSEMBLYAI_API_KEY is required for integration tests. " +
					"Set it in apps/web/.env.local. " +
					"Environment variables are loaded automatically from this file via tests/setup/environment.ts.",
			);
		}
	};

	// Sample audio for testing (sports injuries explainer - single speaker, ~3 min)
	// Using AssemblyAI's official sample for reliable availability
	const SAMPLE_AUDIO_URL =
		"https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3";

	describe("processSpeakerSeparationJob - full end-to-end", () => {
		it(
			"should process a real audio file with speaker separation",
			async () => {
				requireApiKey();

				const job = {
					id: "integration-test-speaker-1",
					toolSlug: "speaker-separation",
					status: "PROCESSING" as const,
					priority: 0,
					input: {
						audioUrl: SAMPLE_AUDIO_URL,
					},
					output: null,
					error: null,
					userId: "integration-test-user",
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

				console.log(
					"\n=== Starting Speaker Separation Integration Test ===",
				);
				console.log("Audio URL:", SAMPLE_AUDIO_URL);
				console.log(
					"This may take 1-2 minutes for AssemblyAI processing...\n",
				);

				const result = await processSpeakerSeparationJob(job);

				// Log error if failed for debugging
				if (!result.success) {
					console.error("❌ Integration test failed:", result.error);
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
					expect(output.speakers.length).toBe(output.speakerCount);
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
						expect(speaker.percentage).toBeGreaterThanOrEqual(0);
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
						expect(segment.confidence).toBeGreaterThanOrEqual(0);
						expect(segment.confidence).toBeLessThanOrEqual(1);
					}

					// Verify percentages sum to ~100%
					const totalPercentage = output.speakers.reduce(
						(sum, s) => sum + s.percentage,
						0,
					);
					expect(totalPercentage).toBeGreaterThan(90); // Allow some margin for rounding
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
					console.log("\nFirst 3 segments:");
					for (const segment of output.segments.slice(0, 3)) {
						console.log(
							`  [${segment.startTime.toFixed(2)}s - ${segment.endTime.toFixed(2)}s] ${segment.speaker}: "${segment.text.substring(0, 50)}..."`,
						);
					}
					console.log("\nTranscript preview:");
					console.log(output.transcript.substring(0, 500) + "...");
				}
			},
			TIMEOUT,
		);

		it(
			"should handle invalid audio URL gracefully",
			async () => {
				requireApiKey();

				const job = {
					id: "integration-test-speaker-2",
					toolSlug: "speaker-separation",
					status: "PROCESSING" as const,
					priority: 0,
					input: {
						audioUrl:
							"https://example.com/nonexistent-audio-12345.mp3",
					},
					output: null,
					error: null,
					userId: "integration-test-user",
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

				console.log("\n=== Testing Invalid Audio URL Handling ===");

				const result = await processSpeakerSeparationJob(job);

				// Should fail gracefully
				expect(result.success).toBe(false);
				expect(result.error).toBeTruthy();
				console.log("Expected error:", result.error);
			},
			TIMEOUT,
		);

		it(
			"should return error for missing audio URL",
			async () => {
				requireApiKey();

				const job = {
					id: "integration-test-speaker-3",
					toolSlug: "speaker-separation",
					status: "PROCESSING" as const,
					priority: 0,
					input: {}, // Missing audioUrl
					output: null,
					error: null,
					userId: "integration-test-user",
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

				const result = await processSpeakerSeparationJob(job);

				expect(result.success).toBe(false);
				expect(result.error).toBe("Audio URL is required");
			},
			TIMEOUT,
		);
	});
});
