import { getUserFeedbackForJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", async (importOriginal) => {
	const original = await importOriginal<typeof import("@repo/database")>();
	return {
		...original,
		db: {},
		getUserFeedbackForJob: vi.fn(),
	};
});

type Handler = (ctx: {
	input: { jobId: string };
	context: { user: { id: string } };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { getFeedbackForJobProcedure } = await import(
		"./get-feedback-for-job"
	);
	const handler = (
		getFeedbackForJobProcedure as unknown as {
			"~orpc": { handler: Handler };
		}
	)["~orpc"]?.handler;
	if (!handler) throw new Error("handler not found");
	return handler;
}

describe("getFeedbackForJobProcedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("returns feedback for the given job and user", async () => {
		const feedback = { id: "fb1", jobId: "j1", userId: "u1" };
		vi.mocked(getUserFeedbackForJob).mockResolvedValue(feedback as never);

		const handler = await getHandler();
		const result = await handler({
			input: { jobId: "j1" },
			context: { user: { id: "u1" } },
		});

		expect(result).toEqual({ feedback });
		expect(vi.mocked(getUserFeedbackForJob)).toHaveBeenCalledWith(
			"u1",
			"j1",
		);
	});

	it("returns null feedback when no feedback exists for job", async () => {
		vi.mocked(getUserFeedbackForJob).mockResolvedValue(null);

		const handler = await getHandler();
		const result = await handler({
			input: { jobId: "j1" },
			context: { user: { id: "u1" } },
		});

		expect(result).toEqual({ feedback: null });
	});
});
