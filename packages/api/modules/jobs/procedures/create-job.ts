import { ORPCError } from "@orpc/client";
import { createToolJob, db, findCachedJob, type Prisma } from "@repo/database";
import { logger } from "@repo/logs";
import { shouldUseSupabaseStorage } from "@repo/storage";
import { publicProcedure } from "../../../orpc/procedures";
import { uploadAudioToStorage } from "../../speaker-separation/lib/audio-storage";
import type { AudioMetadata } from "../../speaker-separation/types";
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

		// Try to get user and organization from session if authenticated
		let userId: string | undefined;
		let organizationId: string | undefined;
		try {
			const { auth } = await import("@repo/auth");
			const session = await auth.api.getSession({
				headers: context.headers,
			});
			userId = session?.user?.id;
			organizationId =
				session?.session?.activeOrganizationId ?? undefined;
			if (userId) {
				logger.debug(
					`[CreateJob] Authenticated user found: ${userId}, org: ${organizationId ?? "none"}`,
				);
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
		let audioMetadata: (AudioMetadata & { size: number }) | undefined;
		let processedInput = jobInput as Record<string, unknown>;

		if (AUDIO_STORAGE_TOOLS.has(toolSlug) && processedInput.audioFile) {
			// Speaker separation requires organization context for file storage
			if (!organizationId || !userId) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Speaker separation requires authentication with an active organization",
				});
			}

			if (!shouldUseSupabaseStorage()) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Storage is not configured",
				});
			}

			const audioFile = processedInput.audioFile as {
				content: string;
				filename: string;
				mimeType: string;
				duration?: number;
			};

			logger.info(
				`[CreateJob] Uploading audio to storage for organization: ${organizationId}`,
			);

			// Upload to the files bucket
			const uploadResult = await uploadAudioToStorage(
				organizationId,
				audioFile.content,
				{
					filename: audioFile.filename,
					mimeType: audioFile.mimeType,
					duration: audioFile.duration,
				},
			);

			// Prepare metadata
			audioMetadata = {
				filename: audioFile.filename,
				mimeType: audioFile.mimeType,
				duration: audioFile.duration,
				size: uploadResult.size,
			};

			audioFileUrl = uploadResult.storagePath;

			// Register the file in the Files table so it appears in the Files page
			const file = await db.file.create({
				data: {
					organizationId,
					userId,
					filename: audioFile.filename,
					mimeType: audioFile.mimeType,
					size: uploadResult.size,
					storagePath: uploadResult.storagePath,
					bucket: uploadResult.bucket,
				},
			});

			logger.info(
				`[CreateJob] File registered in Files table: ${file.id}`,
				{
					filename: audioFile.filename,
					organizationId,
				},
			);

			// Remove base64 content from input to reduce job size
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
		}

		const job = await createToolJob({
			toolSlug,
			input: processedInput as Prisma.InputJsonValue,
			userId,
			sessionId: userId ? undefined : sessionId, // Only use sessionId if not authenticated
			priority,
			audioFileUrl,
			audioMetadata: audioMetadata as unknown as
				| Prisma.InputJsonValue
				| undefined,
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

		// Job processing is triggered by Inngest events from the caller
		// The job record is created in PENDING status
		// Inngest functions in apps/web/inngest/ will process the job

		return { job };
	});
