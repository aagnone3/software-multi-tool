import { ORPCError } from "@orpc/client";
import {
	AgentSession,
	type AgentSessionConfig,
	createFeedbackCollectorConfig,
	PrismaSessionPersistence,
} from "@repo/agent-sdk";
import { logger } from "@repo/logs";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const createSessionInputSchema = z.object({
	sessionType: z.enum(["feedback-collector"]),
	toolSlug: z.string().optional(),
	toolName: z.string().optional(),
	jobId: z.string().optional(),
	feedbackId: z.string().optional(),
});

export const createSessionProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/agent-sessions",
		tags: ["Agent Sessions"],
		summary: "Create a new agent session",
		description:
			"Creates a new agent session for feedback collection or other skill types",
	})
	.input(createSessionInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const { sessionType, toolSlug, toolName, jobId, feedbackId } = input;

		try {
			// Get the appropriate config based on session type
			let config: AgentSessionConfig;
			switch (sessionType) {
				case "feedback-collector":
					config = createFeedbackCollectorConfig({
						toolSlug,
						toolName,
					});
					break;
				default:
					throw new ORPCError("BAD_REQUEST", {
						message: `Unknown session type: ${sessionType}`,
					});
			}

			// Create persistence adapter
			const persistence = new PrismaSessionPersistence();

			// Create the session
			const session = await AgentSession.create({
				config,
				context: {
					sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
					userId: user.id,
					toolSlug,
					jobId,
					metadata: feedbackId ? { feedbackId } : undefined,
				},
				persistence,
			});

			const state = session.getState();

			return {
				session: {
					id: state.context.sessionId,
					sessionType: state.sessionType,
					isComplete: state.isComplete,
					messages: state.messages,
					initialMessage: config.initialMessage,
				},
			};
		} catch (error) {
			logger.error("Failed to create agent session", { error });
			if (error instanceof ORPCError) {
				throw error;
			}
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create agent session",
			});
		}
	});
