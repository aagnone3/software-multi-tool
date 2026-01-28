import { ORPCError } from "@orpc/client";
import { createToolJob, findCachedJob, type Prisma } from "@repo/database";
import { logger } from "@repo/logs";
import { shouldUseSupabaseStorage } from "@repo/storage";
import { publicProcedure } from "../../../orpc/procedures";
import { uploadAudioToStorage } from "../../speaker-separation/lib/audio-storage";
import type { AudioMetadata } from "../../speaker-separation/types";
import { submitJobToQueue } from "../lib/queue";
import { CreateJobInputSchema } from "../types";

// Tools that support caching (check for existing completed jobs)
const CACHEABLE_TOOLS = new Set(["news-analyzer"]);

// Tools that use audio storage
const AUDIO_STORAGE_TOOLS = new Set(["speaker-separation"]);

export const createJob = publicProcedure
	.route({
		method: "POST",
		path: "/jobs",
		tags: ["Jobs"],
		summary: "Create job",
		description:
			"Create a new async job for a tool. Authenticated users get jobs linked to their account. For cacheable tools (e.g., news-analyzer), returns existing results if available.",
	})
	.input(CreateJobInputSchema)
	.handler(async ({ input, context }) => {
		const { toolSlug, input: jobInput, priority, sessionId } = input;

		logger.info(`[CreateJob] Starting job creation for tool: ${toolSlug}`, {
			hasSessionId: !!sessionId,
			priority,
			inputKeys: Object.keys(jobInput || {}),
		});

		// Try to get user from session if authenticated
		let userId: string | undefined;
		try {
			const { auth } = await import("@repo/auth");
			const session = await auth.api.getSession({
				headers: context.headers,
			});
			userId = session?.user?.id;
			if (userId) {
				logger.debug(`[CreateJob] Authenticated user found: ${userId}`);
			}
		} catch (error) {
			logger.debug(
				`[CreateJob] No authenticated session: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			// Not authenticated, continue without userId
		}

		// Require either userId or sessionId for job ownership
		if (!userId && !sessionId) {
			logger.error("[CreateJob] Neither userId nor sessionId provided");
			throw new ORPCError("BAD_REQUEST", {
				message: "Either authentication or sessionId is required",
			});
		}

		// Check for cached results for cacheable tools
		if (CACHEABLE_TOOLS.has(toolSlug)) {
			logger.debug(`[CreateJob] Checking cache for tool: ${toolSlug}`);
			const cachedJob = await findCachedJob(
				toolSlug,
				jobInput as Prisma.InputJsonValue,
				24, // 24 hour cache
			);

			if (cachedJob) {
				logger.info(
					`[CreateJob] Returning cached job: ${cachedJob.id} (status: ${cachedJob.status})`,
				);

				// Return the cached job (already completed)
				return { job: cachedJob };
			}
			logger.debug("[CreateJob] No cached job found");
		}

		logger.info(`[CreateJob] Creating new job for tool: ${toolSlug}`);

		// Handle audio storage for speaker-separation jobs
		let audioFileUrl: string | undefined;
		let audioMetadata: AudioMetadata | undefined;
		let processedInput = jobInput as Record<string, unknown>;

		if (
			AUDIO_STORAGE_TOOLS.has(toolSlug) &&
			shouldUseSupabaseStorage() &&
			processedInput.audioFile
		) {
			const audioFile = processedInput.audioFile as {
				content: string;
				filename: string;
				mimeType: string;
				duration?: number;
			};

			// Generate a temporary job ID for the storage key
			// We'll create the job with this key, then the storage key becomes permanent
			const tempJobId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

			logger.info(
				`[CreateJob] Uploading audio to storage for temp job: ${tempJobId}`,
			);

			try {
				// Prepare metadata
				audioMetadata = {
					filename: audioFile.filename,
					mimeType: audioFile.mimeType,
					duration: audioFile.duration,
					size: audioFile.content.length, // Base64 size (actual is ~75% of this)
				};

				// Upload to storage
				audioFileUrl = await uploadAudioToStorage(
					tempJobId,
					audioFile.content,
					audioMetadata,
				);

				// Remove base64 content from input to reduce job size
				// Keep other audioFile fields for reference
				processedInput = {
					...processedInput,
					audioFile: {
						filename: audioFile.filename,
						mimeType: audioFile.mimeType,
						duration: audioFile.duration,
						// content removed - now in storage
					},
					audioFileUrl, // Add storage reference to input
				};

				logger.info(
					`[CreateJob] Audio uploaded successfully: ${audioFileUrl}`,
				);
			} catch (error) {
				logger.error("[CreateJob] Failed to upload audio to storage", {
					error:
						error instanceof Error ? error.message : String(error),
				});
				// Fall back to storing base64 in input (legacy behavior)
				// This ensures the job can still be processed
				logger.warn(
					"[CreateJob] Falling back to base64 storage in job input",
				);
			}
		}

		const job = await createToolJob({
			toolSlug,
			input: processedInput as Prisma.InputJsonValue,
			userId,
			sessionId: userId ? undefined : sessionId, // Only use sessionId if not authenticated
			priority,
			audioFileUrl,
			audioMetadata: audioMetadata as Prisma.InputJsonValue | undefined,
		});

		if (!job) {
			logger.error(
				`[CreateJob] Failed to create job for tool: ${toolSlug}`,
			);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create job",
			});
		}

		logger.info(
			`[CreateJob] Job created successfully: ${job.id} (status: ${job.status})`,
		);

		// Submit job to pg-boss queue for worker processing
		// Workers in api-server will pick up the job and process it
		// Cron handles maintenance only (stuck jobs, cleanup)
		if (process.env.NODE_ENV !== "test") {
			logger.debug(
				`[CreateJob] Submitting job to pg-boss queue: ${job.id}`,
			);
			submitJobToQueue(toolSlug, job.id, {
				priority: priority ?? 0,
			}).catch((error) => {
				logger.error(
					`[CreateJob] Failed to submit job to queue: ${job.id}`,
					{
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
				);
				// Job is still in ToolJob table with PENDING status
				// Cron can handle stuck jobs that never got submitted
			});
		}

		return { job };
	});
