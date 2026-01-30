import {
	calculateSpeakerStats,
	downloadAudioFromStorage,
	formatTranscriptWithSpeakers,
} from "@repo/api/modules/speaker-separation";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { AssemblyAI } from "assemblyai";
import { inngest } from "../client";

/**
 * AssemblyAI utterance type for speaker diarization.
 */
interface AssemblyAIUtterance {
	speaker: string;
	text: string;
	start: number;
	end: number;
	confidence: number;
}

/**
 * Result of the poll-transcription step.
 * Must be JSON-serializable for Inngest.
 */
interface TranscriptResult {
	success: boolean;
	error?: string;
	utterances?: AssemblyAIUtterance[];
	audioDuration?: number;
}

/**
 * Get AssemblyAI client instance.
 */
function getAssemblyAIClient(): AssemblyAI {
	const apiKey = process.env.ASSEMBLYAI_API_KEY;
	if (!apiKey) {
		throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
	}
	return new AssemblyAI({ apiKey });
}

/**
 * Convert AssemblyAI utterances to our segment format.
 */
function convertUtterancesToSegments(utterances: AssemblyAIUtterance[]): Array<{
	speaker: string;
	text: string;
	startTime: number;
	endTime: number;
	confidence: number;
}> {
	return utterances.map((utterance) => ({
		speaker: utterance.speaker,
		text: utterance.text,
		startTime: utterance.start / 1000,
		endTime: utterance.end / 1000,
		confidence: utterance.confidence,
	}));
}

/**
 * Speaker Separation Inngest function
 *
 * This is a long-running job that uses Inngest steps to handle AssemblyAI's
 * asynchronous transcription. The transcription can take 5-60+ minutes depending
 * on audio length.
 *
 * Steps:
 * 1. Validate job exists
 * 2. Download audio from storage
 * 3. Upload audio to AssemblyAI
 * 4. Submit transcription request (returns immediately)
 * 5. Poll for completion (Inngest step can run up to 2 hours)
 * 6. Process results and update database
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Individual steps retry on transient failures
 */
export const speakerSeparation = inngest.createFunction(
	{
		id: "speaker-separation",
		name: "Speaker Separation",
		retries: 3,
	},
	{ event: "jobs/speaker-separation.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:SpeakerSeparation] Starting job", { toolJobId });

		// Step 1: Validate job exists and get audio URL
		const jobData = await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}

			// Get audio URL from job record or input
			const input = job.input as { audioFileUrl?: string } | null;
			const audioFileUrl = job.audioFileUrl || input?.audioFileUrl;

			if (!audioFileUrl) {
				throw new Error("No audio file URL found in job");
			}

			return { audioFileUrl };
		});

		// Step 2: Download audio and upload to AssemblyAI
		const uploadUrl = await step.run("upload-to-assemblyai", async () => {
			logger.info("[Inngest:SpeakerSeparation] Downloading audio", {
				toolJobId,
				audioFileUrl: jobData.audioFileUrl,
			});

			const audioBuffer = await downloadAudioFromStorage(
				jobData.audioFileUrl,
			);
			logger.info("[Inngest:SpeakerSeparation] Audio downloaded", {
				toolJobId,
				size: audioBuffer.length,
			});

			const client = getAssemblyAIClient();
			const url = await client.files.upload(audioBuffer);

			logger.info(
				"[Inngest:SpeakerSeparation] Audio uploaded to AssemblyAI",
				{
					toolJobId,
				},
			);

			return url;
		});

		// Step 3: Submit transcription request (returns immediately with transcript ID)
		const transcriptId = await step.run(
			"submit-transcription",
			async () => {
				const client = getAssemblyAIClient();

				logger.info(
					"[Inngest:SpeakerSeparation] Submitting transcription",
					{
						toolJobId,
					},
				);

				// Use submit() instead of transcribe() to get immediate response
				const transcript = await client.transcripts.submit({
					audio: uploadUrl,
					speaker_labels: true,
				});

				logger.info(
					"[Inngest:SpeakerSeparation] Transcription submitted",
					{
						toolJobId,
						transcriptId: transcript.id,
					},
				);

				return transcript.id;
			},
		);

		// Step 4: Poll for transcription completion
		// This step can take 5-60+ minutes but Inngest steps can run up to 2 hours
		const transcriptResult: TranscriptResult = await step.run(
			"poll-transcription",
			async () => {
				const client = getAssemblyAIClient();

				logger.info(
					"[Inngest:SpeakerSeparation] Polling for completion",
					{
						toolJobId,
						transcriptId,
					},
				);

				// waitUntilReady polls with 3s interval until complete or error
				// The SDK handles all the polling logic internally
				const transcript = await client.transcripts.waitUntilReady(
					transcriptId,
					{
						pollingInterval: 5000, // Poll every 5 seconds
						pollingTimeout: 7200000, // 2 hour max (matches Inngest step limit)
					},
				);

				logger.info(
					"[Inngest:SpeakerSeparation] Transcription complete",
					{
						toolJobId,
						status: transcript.status,
					},
				);

				if (transcript.status === "error") {
					return {
						success: false,
						error:
							transcript.error ||
							"AssemblyAI transcription failed",
					};
				}

				if (
					!transcript.utterances ||
					transcript.utterances.length === 0
				) {
					return {
						success: false,
						error: "No speech detected in audio",
					};
				}

				// Return the data needed for processing
				// Cast utterances to our interface - AssemblyAI SDK types are compatible
				return {
					success: true,
					utterances:
						transcript.utterances as unknown as AssemblyAIUtterance[],
					audioDuration: transcript.audio_duration ?? 0,
				};
			},
		);

		// Step 5: Process results and update database
		await step.run("process-and-save", async () => {
			if (!transcriptResult.success) {
				await markJobFailed(
					toolJobId,
					transcriptResult.error ?? "Transcription failed",
				);
				logger.error("[Inngest:SpeakerSeparation] Job failed", {
					toolJobId,
					error: transcriptResult.error,
				});
				return;
			}

			if (
				!transcriptResult.utterances ||
				!transcriptResult.audioDuration
			) {
				await markJobFailed(toolJobId, "Missing transcription data");
				logger.error("[Inngest:SpeakerSeparation] Missing data", {
					toolJobId,
				});
				return;
			}

			// Convert utterances to segments
			const segments = convertUtterancesToSegments(
				transcriptResult.utterances,
			);

			// Calculate speaker statistics
			const speakers = calculateSpeakerStats(
				segments,
				transcriptResult.audioDuration,
			);

			// Format transcript with speaker labels
			const formattedTranscript = formatTranscriptWithSpeakers(segments);

			const output = {
				speakerCount: speakers.length,
				duration: transcriptResult.audioDuration,
				speakers,
				segments,
				transcript: formattedTranscript,
			};

			await markJobCompleted(toolJobId, output as Prisma.InputJsonValue);

			logger.info(
				"[Inngest:SpeakerSeparation] Job completed successfully",
				{
					toolJobId,
					speakerCount: speakers.length,
					duration: transcriptResult.audioDuration,
				},
			);
		});

		return {
			success: transcriptResult.success,
			toolJobId,
			error: transcriptResult.error,
		};
	},
);
