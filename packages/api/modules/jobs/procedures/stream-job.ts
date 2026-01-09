import { ORPCError } from "@orpc/client";
import { getToolJobById } from "@repo/database";
import type { JsonValue } from "@repo/database/prisma/generated/client/runtime/library";
import { publicProcedure } from "../../../orpc/procedures";
import { GetJobInputSchema } from "../types";

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
const MAX_DURATION_MS = 58000; // 58s (2s buffer before Vercel 60s timeout)
const POLL_INTERVAL_MS = 1000; // 1s internal polling

interface JobData {
	id: string;
	toolSlug: string;
	status: string;
	priority: number;
	input: JsonValue;
	output: JsonValue;
	error: string | null;
	userId: string | null;
	sessionId: string | null;
	attempts: number;
	maxAttempts: number;
	startedAt: Date | null;
	completedAt: Date | null;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface UpdateEvent {
	type: "update";
	job: JobData;
}

interface TimeoutEvent {
	type: "timeout";
}

type StreamEvent = UpdateEvent | TimeoutEvent;

export const streamJob = publicProcedure
	.route({
		method: "GET",
		path: "/jobs/{jobId}/stream",
		tags: ["Jobs"],
		summary: "Stream job updates",
		description:
			"Stream real-time job status updates via Server-Sent Events",
	})
	.input(GetJobInputSchema)
	.handler(async function* ({
		input,
		context,
		signal,
	}): AsyncGenerator<StreamEvent> {
		const { jobId } = input;

		// First, validate job exists and check ownership
		const initialJob = await getToolJobById(jobId);

		if (!initialJob) {
			throw new ORPCError("NOT_FOUND", {
				message: "Job not found",
			});
		}

		// Check ownership - job should be accessible if:
		// 1. User is authenticated and owns the job
		// 2. Request has matching sessionId (checked via header)
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

		const requestSessionId = context.headers.get("x-session-id");

		const isOwner =
			(userId && initialJob.userId === userId) ||
			(requestSessionId && initialJob.sessionId === requestSessionId);

		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "You do not have access to this job",
			});
		}

		// Start streaming job updates
		const startTime = Date.now();
		let lastStatus: string | undefined;
		let lastUpdatedAt: Date | undefined;

		while (Date.now() - startTime < MAX_DURATION_MS && !signal?.aborted) {
			const job = await getToolJobById(jobId);

			if (!job) {
				throw new ORPCError("NOT_FOUND", {
					message: "Job not found",
				});
			}

			// Only emit if changed (or first emission)
			const hasChanged =
				lastStatus !== job.status ||
				lastUpdatedAt?.getTime() !== job.updatedAt.getTime();

			if (hasChanged || lastStatus === undefined) {
				yield { type: "update", job };
				lastStatus = job.status;
				lastUpdatedAt = job.updatedAt;
			}

			// Auto-close on terminal states
			if (TERMINAL_STATUSES.includes(job.status)) {
				return;
			}

			await new Promise((resolve) =>
				setTimeout(resolve, POLL_INTERVAL_MS),
			);
		}

		// Signal client to reconnect
		yield { type: "timeout" };
	});
