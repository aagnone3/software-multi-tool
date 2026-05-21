import { ORPCError } from "@orpc/client";
import { cancelToolJob, getToolJobById } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refundCreditsForJob } = vi.hoisted(() => ({
	refundCreditsForJob: vi.fn(async () => null),
}));

vi.mock("@repo/database", () => ({
	getToolJobById: vi.fn(),
	cancelToolJob: vi.fn(),
}));

vi.mock("../../../lib/credits", () => ({
	refundCreditsForJob,
}));

vi.mock("@repo/logs", () => ({
	logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type Handler = (ctx: {
	input: { jobId: string };
	context: { headers: Headers };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { cancelJob } = await import("./cancel-job");
	const handler = (cancelJob as unknown as { "~orpc": { handler: Handler } })[
		"~orpc"
	]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

describe("cancelJob procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("throws NOT_FOUND when job does not exist", async () => {
		vi.mocked(getToolJobById).mockResolvedValue(null);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: { jobId: "missing" },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when requester does not own the job", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-1",
			userId: "owner-user",
			sessionId: "owner-session",
			status: "PENDING",
		} as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "other-user" },
		});

		const handler = await getHandler();
		const headers = new Headers();
		headers.set("x-session-id", "other-session");
		await expect(
			handler({ input: { jobId: "job-1" }, context: { headers } }),
		).rejects.toThrow(ORPCError);
	});

	it("throws BAD_REQUEST when job status is not PENDING", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-1",
			userId: "user-1",
			sessionId: null,
			status: "COMPLETED",
		} as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "user-1" },
		});

		const handler = await getHandler();
		await expect(
			handler({
				input: { jobId: "job-1" },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("cancels job when owner with userId and status PENDING", async () => {
		const cancelledJob = { id: "job-1", status: "CANCELLED" };
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-1",
			userId: "user-1",
			sessionId: null,
			status: "PENDING",
		} as never);
		vi.mocked(cancelToolJob).mockResolvedValue(cancelledJob as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "user-1" },
		});

		const handler = await getHandler();
		const result = await handler({
			input: { jobId: "job-1" },
			context: { headers: new Headers() },
		});
		expect(cancelToolJob).toHaveBeenCalledWith("job-1");
		expect(result).toEqual({ job: cancelledJob });
	});

	it("cancels job when owner via sessionId", async () => {
		const cancelledJob = { id: "job-2", status: "CANCELLED" };
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-2",
			userId: null,
			sessionId: "sess-abc",
			status: "PENDING",
		} as never);
		vi.mocked(cancelToolJob).mockResolvedValue(cancelledJob as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		const headers = new Headers();
		headers.set("x-session-id", "sess-abc");
		const result = await handler({
			input: { jobId: "job-2" },
			context: { headers },
		});
		expect(result).toEqual({ job: cancelledJob });
	});

	it("refunds the up-front credit deduction on successful cancel", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-3",
			userId: "user-1",
			sessionId: null,
			status: "PENDING",
		} as never);
		vi.mocked(cancelToolJob).mockResolvedValue({
			id: "job-3",
			status: "CANCELLED",
		} as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "user-1" },
		});

		const handler = await getHandler();
		await handler({
			input: { jobId: "job-3" },
			context: { headers: new Headers() },
		});

		expect(refundCreditsForJob).toHaveBeenCalledWith(
			"job-3",
			expect.stringContaining("cancelled"),
		);
	});

	it("swallows refund failures so the cancel still returns success", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-4",
			userId: "user-1",
			sessionId: null,
			status: "PENDING",
		} as never);
		vi.mocked(cancelToolJob).mockResolvedValue({
			id: "job-4",
			status: "CANCELLED",
		} as never);
		refundCreditsForJob.mockRejectedValueOnce(new Error("db down"));
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "user-1" },
		});

		const handler = await getHandler();
		await expect(
			handler({
				input: { jobId: "job-4" },
				context: { headers: new Headers() },
			}),
		).resolves.toMatchObject({ job: { id: "job-4" } });
	});
});
