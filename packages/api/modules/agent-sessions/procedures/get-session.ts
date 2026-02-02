import { ORPCError } from "@orpc/client";
import { getAgentSessionById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const getSessionInputSchema = z.object({
	sessionId: z.string(),
});

export const getSessionProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/agent-sessions/{sessionId}",
		tags: ["Agent Sessions"],
		summary: "Get an agent session",
		description: "Retrieves the current state of an agent session",
	})
	.input(getSessionInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const { sessionId } = input;

		const sessionRecord = await getAgentSessionById(sessionId);

		if (!sessionRecord) {
			throw new ORPCError("NOT_FOUND", {
				message: "Session not found",
			});
		}

		// Verify ownership
		if (sessionRecord.userId !== user.id) {
			throw new ORPCError("FORBIDDEN", {
				message: "You don't have access to this session",
			});
		}

		return {
			session: {
				id: sessionRecord.id,
				sessionType: sessionRecord.sessionType,
				isComplete: sessionRecord.isComplete,
				messages: sessionRecord.messages as unknown as Array<{
					role: "user" | "assistant";
					content: string;
					timestamp: Date;
				}>,
				extractedData: sessionRecord.extractedData as Record<
					string,
					unknown
				> | null,
				toolSlug: sessionRecord.toolSlug,
				jobId: sessionRecord.jobId,
				createdAt: sessionRecord.createdAt,
				updatedAt: sessionRecord.updatedAt,
			},
		};
	});
