import { ORPCError } from "@orpc/client";
import { createToolJob, findCachedJob, type Prisma } from "@repo/database";
import { logger } from "@repo/logs";
import { publicProcedure } from "../../../orpc/procedures";
import { submitJobToQueue } from "../lib/queue";
import { CreateJobInputSchema } from "../types";

// Tools that support caching (check for existing completed jobs)
const CACHEABLE_TOOLS = new Set(["news-analyzer"]);

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
		const job = await createToolJob({
			toolSlug,
			input: jobInput as Prisma.InputJsonValue,
			userId,
			sessionId: userId ? undefined : sessionId, // Only use sessionId if not authenticated
			priority,
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
