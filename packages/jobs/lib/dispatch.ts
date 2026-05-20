import { logger } from "@repo/logs";
import { inngest } from "./client";
import { TOOL_JOB_EVENTS, type ToolSlug } from "./tool-events";

/**
 * Dispatches an Inngest event to start background processing for a tool job.
 *
 * The Inngest function on the receiving side re-fetches the job from the
 * database (the event `input` payload is currently included for schema
 * compatibility but ignored by every consumer — see the receiving functions
 * in apps/web/inngest/functions). The `input` argument here is forwarded
 * verbatim to keep the schema satisfied.
 *
 * Idempotency: the event ID is derived from the job ID so retried calls
 * with the same job ID are deduplicated by Inngest.
 *
 * Throws if `inngest.send` fails. Callers should mark the job FAILED on
 * dispatch failure so the user sees an error rather than a perpetually
 * PENDING job.
 */
export async function dispatchToolJob(
	toolSlug: ToolSlug,
	toolJobId: string,
	input: Record<string, unknown>,
): Promise<void> {
	const name = TOOL_JOB_EVENTS[toolSlug];
	logger.info(`[dispatchToolJob] Sending ${name} for job ${toolJobId}`, {
		toolSlug,
		toolJobId,
	});
	await inngest.send({
		id: `job:${toolJobId}`,
		// The strict per-event schemas in client.ts require a specific
		// `input` shape, but the receiving functions don't read it.
		// Cast to satisfy the typed `send` signature.
		name: name as never,
		data: { toolJobId, input } as never,
	});
}
