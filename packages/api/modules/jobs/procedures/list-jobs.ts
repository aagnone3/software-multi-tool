import { ORPCError } from "@orpc/client";
import { getToolJobsBySessionId, getToolJobsByUserId } from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { ListJobsInputSchema } from "../types";

export const listJobs = publicProcedure
	.route({
		method: "GET",
		path: "/jobs",
		tags: ["Jobs"],
		summary: "List jobs",
		description: "List jobs for the current user or session",
	})
	.input(ListJobsInputSchema)
	.handler(async ({ input, context }) => {
		const { toolSlug, limit, offset } = input;

		// Get user from session if authenticated
		let userId: string | undefined;
		try {
			const { auth } = await import("@repo/auth");
			const session = await auth.api.getSession({
				headers: context.headers,
			});
			userId = session?.user?.id;
		} catch {
			// Not authenticated
		}

		const sessionId = context.headers.get("x-session-id");

		if (!userId && !sessionId) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"Either authentication or x-session-id header is required",
			});
		}

		if (userId) {
			const jobs = await getToolJobsByUserId({
				userId,
				toolSlug,
				limit,
				offset,
			});
			return { jobs };
		}

		if (sessionId) {
			const jobs = await getToolJobsBySessionId({
				sessionId,
				toolSlug,
				limit,
				offset,
			});
			return { jobs };
		}

		return { jobs: [] };
	});
