import { ORPCError } from "@orpc/client";
import { createToolFeedback, getToolJobById } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", async (importOriginal) => {
	const original = await importOriginal<typeof import("@repo/database")>();
	return {
		...original,
		db: {},
		createToolFeedback: vi.fn(),
		getToolJobById: vi.fn(),
	};
});

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn() },
}));

type Handler = (ctx: {
	input: {
		toolSlug: string;
		rating: string;
		jobId?: string;
		chatTranscript?: string;
		extractedData?: Record<string, unknown>;
	};
	context: { user: { id: string } };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { createFeedbackProcedure } = await import("./create-feedback");
	const handler = (
		createFeedbackProcedure as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

describe("createFeedbackProcedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("creates feedback without jobId", async () => {
		vi.mocked(createToolFeedback).mockResolvedValue({
			id: "fb1",
			toolSlug: "test-tool",
			userId: "u1",
			rating: "POSITIVE",
		} as never);

		const handler = await getHandler();
		const result = await handler({
			input: { toolSlug: "test-tool", rating: "POSITIVE" },
			context: { user: { id: "u1" } },
		});

		expect(result).toEqual({
			feedback: expect.objectContaining({ id: "fb1" }),
		});
		expect(vi.mocked(createToolFeedback)).toHaveBeenCalledWith(
			expect.objectContaining({ toolSlug: "test-tool", userId: "u1" }),
		);
	});

	it("throws NOT_FOUND when jobId provided but job not found", async () => {
		vi.mocked(getToolJobById).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: {
					toolSlug: "test-tool",
					rating: "POSITIVE",
					jobId: "j1",
				},
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when job belongs to different user", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "j1",
			userId: "other-user",
			toolSlug: "test-tool",
		} as never);

		const handler = await getHandler();
		await expect(
			handler({
				input: {
					toolSlug: "test-tool",
					rating: "POSITIVE",
					jobId: "j1",
				},
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws BAD_REQUEST when toolSlug does not match job", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "j1",
			userId: "u1",
			toolSlug: "different-tool",
		} as never);

		const handler = await getHandler();
		await expect(
			handler({
				input: {
					toolSlug: "test-tool",
					rating: "POSITIVE",
					jobId: "j1",
				},
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws INTERNAL_SERVER_ERROR when createToolFeedback fails", async () => {
		vi.mocked(createToolFeedback).mockRejectedValue(new Error("db error"));

		const handler = await getHandler();
		await expect(
			handler({
				input: { toolSlug: "test-tool", rating: "POSITIVE" },
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});
});
