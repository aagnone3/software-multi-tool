import { ORPCError } from "@orpc/client";
import {
	AgentSession,
	type AgentSessionConfig,
	createFeedbackCollectorConfig,
	isExtractedFeedback,
	PrismaSessionPersistence,
} from "@repo/agent-sdk";
import { getAgentSessionById, updateToolFeedback } from "@repo/database";
import { logger } from "@repo/logs";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const executeTurnInputSchema = z.object({
	sessionId: z.string(),
	message: z.string().min(1),
});

export const executeTurnProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/agent-sessions/{sessionId}/turns",
		tags: ["Agent Sessions"],
		summary: "Execute a turn in an agent session",
		description:
			"Sends a user message and receives the assistant's response",
	})
	.input(executeTurnInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const { sessionId, message } = input;

		try {
			// Load existing session from database
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

			// Get the appropriate config
			let config: AgentSessionConfig;
			switch (sessionRecord.sessionType) {
				case "feedback-collector":
					config = createFeedbackCollectorConfig({
						toolSlug: sessionRecord.toolSlug ?? undefined,
					});
					break;
				default:
					throw new ORPCError("BAD_REQUEST", {
						message: `Unknown session type: ${sessionRecord.sessionType}`,
					});
			}

			// Create persistence adapter
			const persistence = new PrismaSessionPersistence();

			// Restore session from state
			const sessionState = {
				id: sessionRecord.id,
				sessionType: sessionRecord.sessionType,
				context: {
					sessionId: sessionRecord.id,
					userId: sessionRecord.userId,
					organizationId: sessionRecord.organizationId ?? undefined,
					toolSlug: sessionRecord.toolSlug ?? undefined,
					jobId: sessionRecord.jobId ?? undefined,
					metadata: sessionRecord.context as
						| Record<string, unknown>
						| undefined,
				},
				messages:
					(sessionRecord.messages as unknown as Array<{
						role: "user" | "assistant";
						content: string;
						timestamp: Date;
					}>) ?? [],
				isComplete: sessionRecord.isComplete,
				extractedData: sessionRecord.extractedData as
					| Record<string, unknown>
					| undefined,
				totalUsage: {
					inputTokens: sessionRecord.totalInputTokens,
					outputTokens: sessionRecord.totalOutputTokens,
				},
				createdAt: sessionRecord.createdAt,
				updatedAt: sessionRecord.updatedAt,
			};

			const session = await AgentSession.restore(
				sessionState,
				config,
				persistence,
			);

			// Execute the turn
			const result = await session.executeTurn(message);

			// If session is complete and there's a feedbackId, update the feedback record
			if (result.isComplete) {
				const metadata = sessionRecord.context as
					| Record<string, unknown>
					| undefined;
				const feedbackId = metadata?.feedbackId as string | undefined;

				if (feedbackId && result.extractedData) {
					try {
						await updateToolFeedback(feedbackId, user.id, {
							chatTranscript: session.getTranscript(),
							extractedData: isExtractedFeedback(
								result.extractedData,
							)
								? result.extractedData
								: undefined,
						});
					} catch (err) {
						logger.warn(
							"Failed to update feedback with extracted data",
							{ err, feedbackId },
						);
					}
				}
			}

			return {
				turn: {
					response: result.response,
					isComplete: result.isComplete,
					extractedData: result.extractedData,
					usage: result.usage,
				},
			};
		} catch (error) {
			logger.error("Failed to execute turn", { error });
			if (error instanceof ORPCError) {
				throw error;
			}
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to execute turn",
			});
		}
	});
