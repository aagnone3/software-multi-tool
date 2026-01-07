import { ORPCError } from "@orpc/client";
import { createToolJob, findCachedJob, type Prisma } from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
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

		// Try to get user from session if authenticated
		let userId: string | undefined;
		try {
			const { auth } = await import("@repo/auth");
			const session = await auth.api.getSession({
				headers: context.headers,
			});
			userId = session?.user?.id;
		} catch {
			// Not authenticated, continue without userId
		}

		// Require either userId or sessionId for job ownership
		if (!userId && !sessionId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Either authentication or sessionId is required",
			});
		}

		// Check for cached results for cacheable tools
		if (CACHEABLE_TOOLS.has(toolSlug)) {
			const cachedJob = await findCachedJob(
				toolSlug,
				jobInput as Prisma.InputJsonValue,
				24, // 24 hour cache
			);

			if (cachedJob) {
				// Return the cached job (already completed)
				return { job: cachedJob };
			}
		}

		const job = await createToolJob({
			toolSlug,
			input: jobInput as Prisma.InputJsonValue,
			userId,
			sessionId: userId ? undefined : sessionId, // Only use sessionId if not authenticated
			priority,
		});

		if (!job) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create job",
			});
		}

		return { job };
	});
