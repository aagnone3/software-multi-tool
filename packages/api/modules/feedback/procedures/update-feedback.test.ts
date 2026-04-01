import { ORPCError } from "@orpc/client";
import { getToolFeedbackById, updateToolFeedback } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", async (importOriginal) => {
	const original = await importOriginal<typeof import("@repo/database")>();
	return {
		...original,
		db: {},
		getToolFeedbackById: vi.fn(),
		updateToolFeedback: vi.fn(),
	};
});

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn() },
}));

type Handler = (ctx: {
	input: {
		feedbackId: string;
		rating?: string;
		chatTranscript?: string;
		extractedData?: Record<string, unknown>;
	};
	context: { user: { id: string } };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { updateFeedbackProcedure } = await import("./update-feedback");
	const handler = (
		updateFeedbackProcedure as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) throw new Error("handler not found");
	return handler;
}

describe("updateFeedbackProcedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("throws NOT_FOUND when feedback does not exist", async () => {
		vi.mocked(getToolFeedbackById).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: { feedbackId: "fb1" },
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when feedback belongs to different user", async () => {
		vi.mocked(getToolFeedbackById).mockResolvedValue({
			id: "fb1",
			userId: "other-user",
		} as never);

		const handler = await getHandler();
		await expect(
			handler({
				input: { feedbackId: "fb1" },
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("updates feedback and returns updated record", async () => {
		const existing = { id: "fb1", userId: "u1", rating: "POSITIVE" };
		const updated = { id: "fb1", userId: "u1", rating: "NEGATIVE" };

		vi.mocked(getToolFeedbackById)
			.mockResolvedValueOnce(existing as never)
			.mockResolvedValueOnce(updated as never);
		vi.mocked(updateToolFeedback).mockResolvedValue(undefined as never);

		const handler = await getHandler();
		const result = await handler({
			input: { feedbackId: "fb1", rating: "NEGATIVE" },
			context: { user: { id: "u1" } },
		});

		expect(result).toEqual({ feedback: updated });
		expect(vi.mocked(updateToolFeedback)).toHaveBeenCalledWith(
			"fb1",
			"u1",
			expect.objectContaining({ rating: "NEGATIVE" }),
		);
	});

	it("throws INTERNAL_SERVER_ERROR when updateToolFeedback fails", async () => {
		vi.mocked(getToolFeedbackById).mockResolvedValue({
			id: "fb1",
			userId: "u1",
		} as never);
		vi.mocked(updateToolFeedback).mockRejectedValue(new Error("db error"));

		const handler = await getHandler();
		await expect(
			handler({
				input: { feedbackId: "fb1" },
				context: { user: { id: "u1" } },
			}),
		).rejects.toThrow(ORPCError);
	});
});
