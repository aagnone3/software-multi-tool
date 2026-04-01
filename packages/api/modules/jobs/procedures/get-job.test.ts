import { ORPCError } from "@orpc/client";
import { getToolJobById } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getToolJobById: vi.fn(),
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
	const { getJob } = await import("./get-job");
	const handler = (getJob as unknown as { "~orpc": { handler: Handler } })[
		"~orpc"
	]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

describe("getJob procedure", () => {
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
				input: { jobId: "missing-id" },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when requester has neither matching userId nor sessionId", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-1",
			userId: "user-1",
			sessionId: "session-1",
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

	it("returns job when authenticated user owns it", async () => {
		const job = { id: "job-1", userId: "user-1", sessionId: null };
		vi.mocked(getToolJobById).mockResolvedValue(job as never);
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
		expect(result).toEqual({ job });
	});

	it("returns job when sessionId matches", async () => {
		const job = { id: "job-1", userId: null, sessionId: "sess-abc" };
		vi.mocked(getToolJobById).mockResolvedValue(job as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		const headers = new Headers();
		headers.set("x-session-id", "sess-abc");
		const result = await handler({
			input: { jobId: "job-1" },
			context: { headers },
		});
		expect(result).toEqual({ job });
	});
});
