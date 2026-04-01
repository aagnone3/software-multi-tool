import { countToolFeedback, getToolFeedback } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", async (importOriginal) => {
	const original = await importOriginal<typeof import("@repo/database")>();
	return {
		...original,
		db: {},
		getToolFeedback: vi.fn(),
		countToolFeedback: vi.fn(),
	};
});

type Handler = (ctx: {
	input: {
		limit: number;
		offset: number;
		toolSlug?: string;
		rating?: string;
		myFeedbackOnly?: boolean;
	};
	context: { user: { id: string } };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { listFeedbackProcedure } = await import("./list-feedback");
	const handler = (
		listFeedbackProcedure as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) throw new Error("handler not found");
	return handler;
}

describe("listFeedbackProcedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("returns feedback and total", async () => {
		const items = [{ id: "fb1" }];
		vi.mocked(getToolFeedback).mockResolvedValue(items as never);
		vi.mocked(countToolFeedback).mockResolvedValue(1);

		const handler = await getHandler();
		const result = await handler({
			input: { limit: 25, offset: 0 },
			context: { user: { id: "u1" } },
		});

		expect(result).toEqual({ feedback: items, total: 1 });
	});

	it("filters by userId when myFeedbackOnly is true", async () => {
		vi.mocked(getToolFeedback).mockResolvedValue([]);
		vi.mocked(countToolFeedback).mockResolvedValue(0);

		const handler = await getHandler();
		await handler({
			input: { limit: 25, offset: 0, myFeedbackOnly: true },
			context: { user: { id: "u1" } },
		});

		expect(vi.mocked(getToolFeedback)).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "u1" }),
		);
	});

	it("does not filter by userId when myFeedbackOnly is false", async () => {
		vi.mocked(getToolFeedback).mockResolvedValue([]);
		vi.mocked(countToolFeedback).mockResolvedValue(0);

		const handler = await getHandler();
		await handler({
			input: { limit: 25, offset: 0, myFeedbackOnly: false },
			context: { user: { id: "u1" } },
		});

		expect(vi.mocked(getToolFeedback)).toHaveBeenCalledWith(
			expect.objectContaining({ userId: undefined }),
		);
	});
});
