import { z } from "zod";

export const JobStatusSchema = z.enum([
	"PENDING",
	"PROCESSING",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

// Use z.record with z.any() for JSON-like objects
const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(JsonValueSchema),
		z.record(z.string(), JsonValueSchema),
	]),
);

export const CreateJobInputSchema = z.object({
	toolSlug: z.string().min(1),
	input: z.record(z.string(), JsonValueSchema),
	priority: z.number().int().min(0).max(10).optional(),
	sessionId: z.string().optional(),
});

export const GetJobInputSchema = z.object({
	jobId: z.string().cuid(),
});

export const ListJobsInputSchema = z.object({
	toolSlug: z.string().optional(),
	limit: z.number().int().min(1).max(100).optional().default(20),
	offset: z.number().int().min(0).optional().default(0),
});

export const CancelJobInputSchema = z.object({
	jobId: z.string().cuid(),
});

export const JobOutputSchema = z.object({
	id: z.string(),
	toolSlug: z.string(),
	status: JobStatusSchema,
	priority: z.number(),
	input: z.record(z.string(), JsonValueSchema),
	output: z.record(z.string(), JsonValueSchema).nullable(),
	error: z.string().nullable(),
	userId: z.string().nullable(),
	sessionId: z.string().nullable(),
	attempts: z.number(),
	maxAttempts: z.number(),
	startedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	expiresAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
