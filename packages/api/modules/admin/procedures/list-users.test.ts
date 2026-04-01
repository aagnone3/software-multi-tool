import { countAllUsers, getUsers } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getUsers: vi.fn(),
	countAllUsers: vi.fn(),
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type Handler = (ctx: {
	input: { query?: string; limit: number; offset: number };
	context: { headers: Headers };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { listUsers } = await import("./list-users");
	const handler = (listUsers as unknown as { "~orpc": { handler: Handler } })[
		"~orpc"
	]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

const adminSession = {
	session: { id: "s1" },
	user: { id: "u1", role: "admin", email: "admin@example.com" },
};

describe("listUsers procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(adminSession);
	});

	it("returns users and total", async () => {
		const users = [{ id: "user-1", name: "Alice" }];
		vi.mocked(getUsers).mockResolvedValue(users as never);
		vi.mocked(countAllUsers).mockResolvedValue(1);

		const handler = await getHandler();
		const result = await handler({
			input: { limit: 10, offset: 0 },
			context: { headers: new Headers() },
		});

		expect(result).toEqual({ users, total: 1 });
	});

	it("passes query filter to getUsers", async () => {
		vi.mocked(getUsers).mockResolvedValue([]);
		vi.mocked(countAllUsers).mockResolvedValue(0);

		const handler = await getHandler();
		await handler({
			input: { query: "alice", limit: 5, offset: 20 },
			context: { headers: new Headers() },
		});

		expect(getUsers).toHaveBeenCalledWith({
			query: "alice",
			limit: 5,
			offset: 20,
		});
	});

	it("returns empty list when no users exist", async () => {
		vi.mocked(getUsers).mockResolvedValue([]);
		vi.mocked(countAllUsers).mockResolvedValue(0);

		const handler = await getHandler();
		const result = await handler({
			input: { limit: 10, offset: 0 },
			context: { headers: new Headers() },
		});

		expect(result).toEqual({ users: [], total: 0 });
	});
});
