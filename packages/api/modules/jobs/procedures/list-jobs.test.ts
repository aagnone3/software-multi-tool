import { ORPCError } from "@orpc/client";
import { getToolJobsBySessionId, getToolJobsByUserId } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getToolJobsByUserId: vi.fn(),
	getToolJobsBySessionId: vi.fn(),
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type Handler = (ctx: {
	input: { toolSlug?: string; limit: number; offset: number };
	context: { headers: Headers };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { listJobs } = await import("./list-jobs");
	const handler = (listJobs as unknown as { "~orpc": { handler: Handler } })[
		"~orpc"
	]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

describe("listJobs procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("throws BAD_REQUEST when neither auth nor sessionId provided", async () => {
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: { limit: 20, offset: 0 },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("fetches by userId when authenticated", async () => {
		const jobs = [{ id: "job-1" }, { id: "job-2" }];
		vi.mocked(getToolJobsByUserId).mockResolvedValue(jobs as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "user-1" },
		});

		const handler = await getHandler();
		const result = await handler({
			input: { limit: 20, offset: 0 },
			context: { headers: new Headers() },
		});
		expect(getToolJobsByUserId).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1" }),
		);
		expect(result).toEqual({ jobs });
	});

	it("fetches by sessionId when not authenticated", async () => {
		const jobs = [{ id: "job-3" }];
		vi.mocked(getToolJobsBySessionId).mockResolvedValue(jobs as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		const headers = new Headers();
		headers.set("x-session-id", "sess-xyz");
		const result = await handler({
			input: { limit: 20, offset: 0 },
			context: { headers },
		});
		expect(getToolJobsBySessionId).toHaveBeenCalledWith(
			expect.objectContaining({ sessionId: "sess-xyz" }),
		);
		expect(result).toEqual({ jobs });
	});

	it("passes toolSlug filter when provided", async () => {
		const jobs: never[] = [];
		vi.mocked(getToolJobsByUserId).mockResolvedValue(jobs);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			user: { id: "user-2" },
		});

		const handler = await getHandler();
		await handler({
			input: { toolSlug: "contract-analyzer", limit: 10, offset: 5 },
			context: { headers: new Headers() },
		});
		expect(getToolJobsByUserId).toHaveBeenCalledWith(
			expect.objectContaining({
				toolSlug: "contract-analyzer",
				limit: 10,
				offset: 5,
			}),
		);
	});
});
