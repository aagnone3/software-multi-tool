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

type GeneratorHandler = (ctx: {
	input: { jobId: string };
	context: { headers: Headers };
	signal?: AbortSignal;
}) => AsyncGenerator<unknown>;

async function getHandler(): Promise<GeneratorHandler> {
	const { streamJob } = await import("./stream-job");
	const handler = (
		streamJob as unknown as { "~orpc": { handler: GeneratorHandler } }
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

async function _collectEvents(
	gen: AsyncGenerator<unknown>,
	limit = 20,
): Promise<unknown[]> {
	const events: unknown[] = [];
	for await (const event of gen) {
		events.push(event);
		if (events.length >= limit) {
			break;
		}
	}
	return events;
}

describe("streamJob procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("throws NOT_FOUND when job does not exist initially", async () => {
		vi.mocked(getToolJobById).mockResolvedValue(null);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		const gen = handler({
			input: { jobId: "missing-id" },
			context: { headers: new Headers() },
		});

		await expect(gen.next()).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when requester has neither matching userId nor sessionId", async () => {
		vi.mocked(getToolJobById).mockResolvedValue({
			id: "job-1",
			userId: "user-1",
			sessionId: "session-1",
			status: "PENDING",
			updatedAt: new Date(),
		} as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({ user: { id: "other-user" } });

		const handler = await getHandler();
		const headers = new Headers();
		headers.set("x-session-id", "other-session");
		const gen = handler({
			input: { jobId: "job-1" },
			context: { headers },
		});

		await expect(gen.next()).rejects.toThrow(ORPCError);
	});

	it("emits an update event for an authenticated owner and returns on terminal status", async () => {
		const job = {
			id: "job-1",
			userId: "user-1",
			sessionId: null,
			status: "COMPLETED",
			updatedAt: new Date(),
		};
		vi.mocked(getToolJobById).mockResolvedValue(job as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({ user: { id: "user-1" } });

		const handler = await getHandler();
		const gen = handler({
			input: { jobId: "job-1" },
			context: { headers: new Headers() },
		});

		const first = await gen.next();
		expect(first.done).toBe(false);
		expect((first.value as { type: string }).type).toBe("update");

		// After COMPLETED, generator should return
		const second = await gen.next();
		expect(second.done).toBe(true);
	});

	it("emits update when sessionId matches (unauthenticated user)", async () => {
		const job = {
			id: "job-2",
			userId: null,
			sessionId: "sess-xyz",
			status: "FAILED",
			updatedAt: new Date(),
		};
		vi.mocked(getToolJobById).mockResolvedValue(job as never);
		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue(null);

		const handler = await getHandler();
		const headers = new Headers();
		headers.set("x-session-id", "sess-xyz");
		const gen = handler({
			input: { jobId: "job-2" },
			context: { headers },
		});

		const first = await gen.next();
		expect(first.done).toBe(false);
		expect((first.value as { type: string }).type).toBe("update");
	});

	it("throws NOT_FOUND when job disappears mid-stream", async () => {
		const completedJob = {
			id: "job-3",
			userId: "user-1",
			sessionId: null,
			status: "COMPLETED",
			updatedAt: new Date(),
		};
		// First call (ownership check) returns job; second call (inside loop) returns null
		vi.mocked(getToolJobById)
			.mockResolvedValueOnce(completedJob as never)
			.mockResolvedValueOnce(null);

		const authMod = await import("@repo/auth");
		(
			authMod.auth.api.getSession as ReturnType<typeof vi.fn>
		).mockResolvedValue({ user: { id: "user-1" } });

		const handler = await getHandler();
		const gen = handler({
			input: { jobId: "job-3" },
			context: { headers: new Headers() },
		});

		// First event should succeed (first call returns job for ownership check, second call in loop is null — but wait, the code does initialJob check then loop)
		// Actually: initialJob check uses first call, loop uses subsequent calls
		// Second call (inside loop) returns null → throws NOT_FOUND
		await expect(gen.next()).rejects.toThrow(ORPCError);
	});
});
