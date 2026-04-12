import { getToolFeedbackStats } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", async (importOriginal) => {
	const original = await importOriginal<typeof import("@repo/database")>();
	return {
		...original,
		db: {},
		getToolFeedbackStats: vi.fn(),
	};
});

type Handler = (ctx: {
	input: { toolSlug?: string };
	context: object;
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { getFeedbackStatsProcedure } = await import("./get-feedback-stats");
	const handler = (
		getFeedbackStatsProcedure as unknown as {
			"~orpc": { handler: Handler };
		}
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

describe("getFeedbackStatsProcedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("returns stats for all tools when no toolSlug provided", async () => {
		const stats = { totalCount: 10, positiveCount: 8 };
		vi.mocked(getToolFeedbackStats).mockResolvedValue(stats as never);

		const handler = await getHandler();
		const result = await handler({ input: {}, context: {} });

		expect(result).toEqual({ stats });
		expect(vi.mocked(getToolFeedbackStats)).toHaveBeenCalledWith(undefined);
	});

	it("passes toolSlug to stats query", async () => {
		const stats = { totalCount: 3, positiveCount: 2 };
		vi.mocked(getToolFeedbackStats).mockResolvedValue(stats as never);

		const handler = await getHandler();
		const result = await handler({
			input: { toolSlug: "my-tool" },
			context: {},
		});

		expect(result).toEqual({ stats });
		expect(vi.mocked(getToolFeedbackStats)).toHaveBeenCalledWith("my-tool");
	});
});
