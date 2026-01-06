import type { Prisma, ToolJob } from "@repo/database/prisma/generated/client";

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

// Default timeout for job processing (5 minutes)
export const DEFAULT_JOB_TIMEOUT_MS = 5 * 60 * 1000;

export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number = DEFAULT_JOB_TIMEOUT_MS,
): Promise<T> {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Job processing timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	return Promise.race([promise, timeoutPromise]);
}
