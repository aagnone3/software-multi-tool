import type { Prisma, ToolJob } from "@repo/database";
import { JOB_TIMEOUT_MS } from "./job-config";

export interface JobResult {
	success: boolean;
	output?: Prisma.InputJsonValue;
	error?: string;
}

export type JobProcessor = (job: ToolJob) => Promise<JobResult>;

const processors = new Map<string, JobProcessor>();

export function registerProcessor(toolSlug: string, processor: JobProcessor) {
	processors.set(toolSlug, processor);
}

export function getProcessor(toolSlug: string): JobProcessor | undefined {
	return processors.get(toolSlug);
}

export function hasProcessor(toolSlug: string): boolean {
	return processors.has(toolSlug);
}

export function getRegisteredTools(): string[] {
	return Array.from(processors.keys());
}

/**
 * Default timeout for job processing.
 *
 * @deprecated Import JOB_TIMEOUT_MS from './job-config' instead.
 * This export is kept for backwards compatibility.
 */
export const DEFAULT_JOB_TIMEOUT_MS = JOB_TIMEOUT_MS;

/**
 * Wrap a promise with a timeout.
 *
 * If the promise doesn't resolve within the specified timeout,
 * a TimeoutError is thrown.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: JOB_TIMEOUT_MS from job-config)
 * @returns The resolved value of the promise
 * @throws Error if the promise times out
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number = JOB_TIMEOUT_MS,
): Promise<T> {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Job processing timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	return Promise.race([promise, timeoutPromise]);
}
