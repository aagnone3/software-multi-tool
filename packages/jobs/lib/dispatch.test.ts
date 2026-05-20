import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({
	mockSend: vi.fn(async () => ({ ids: ["evt-1"] })),
}));

vi.mock("./client", () => ({
	inngest: { send: mockSend },
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { dispatchToolJob } from "./dispatch";
import { TOOL_JOB_EVENTS, type ToolSlug } from "./tool-events";

describe("dispatchToolJob", () => {
	beforeEach(() => {
		mockSend.mockReset();
		mockSend.mockResolvedValue({ ids: ["evt-1"] });
	});

	it("sends the event name registered for the tool slug", async () => {
		await dispatchToolJob("news-analyzer", "job-123", {
			articleUrl: "https://example.com/article",
		});

		expect(mockSend).toHaveBeenCalledOnce();
		const call = mockSend.mock.calls[0]?.[0];
		expect(call?.name).toBe(TOOL_JOB_EVENTS["news-analyzer"]);
	});

	it("uses the job id as the Inngest event id for idempotency", async () => {
		await dispatchToolJob("news-analyzer", "job-abc", {});
		expect(mockSend.mock.calls[0]?.[0]?.id).toBe("job:job-abc");
	});

	it("forwards toolJobId and input verbatim in event data", async () => {
		const input = { foo: "bar", count: 7 };
		await dispatchToolJob("expense-categorizer", "job-9", input);

		const data = mockSend.mock.calls[0]?.[0]?.data;
		expect(data).toEqual({ toolJobId: "job-9", input });
	});

	it("dispatches every registered tool slug to its mapped event", async () => {
		for (const slug of Object.keys(TOOL_JOB_EVENTS) as ToolSlug[]) {
			mockSend.mockClear();
			await dispatchToolJob(slug, `job-${slug}`, {});
			expect(mockSend).toHaveBeenCalledOnce();
			expect(mockSend.mock.calls[0]?.[0]?.name).toBe(
				TOOL_JOB_EVENTS[slug],
			);
		}
	});

	it("propagates failures from inngest.send", async () => {
		mockSend.mockRejectedValueOnce(new Error("inngest down"));

		await expect(
			dispatchToolJob("news-analyzer", "job-x", {}),
		).rejects.toThrow("inngest down");
	});
});
