import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	agentSessionCreate: vi.fn(),
	agentSessionFindUnique: vi.fn(),
	agentSessionFindMany: vi.fn(),
	agentSessionUpdate: vi.fn(),
	agentSessionDelete: vi.fn(),
	agentSessionCount: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		agentSession: {
			create: mocks.agentSessionCreate,
			findUnique: mocks.agentSessionFindUnique,
			findMany: mocks.agentSessionFindMany,
			update: mocks.agentSessionUpdate,
			delete: mocks.agentSessionDelete,
			count: mocks.agentSessionCount,
		},
	},
}));

import {
	countAgentSessionsByUser,
	createAgentSession,
	deleteAgentSession,
	getAgentSessionById,
	getAgentSessionsByJobId,
	getAgentSessionsBySessionType,
	getAgentSessionsByToolSlug,
	getAgentSessionsByUserId,
	updateAgentSession,
} from "./agent-sessions";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createAgentSession", () => {
	it("creates a session with required fields", async () => {
		const session = { id: "s1", sessionType: "chat", userId: "u1" };
		mocks.agentSessionCreate.mockResolvedValueOnce(session);
		const result = await createAgentSession({
			id: "s1",
			sessionType: "chat",
			userId: "u1",
		});
		expect(result).toBe(session);
		expect(mocks.agentSessionCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				id: "s1",
				sessionType: "chat",
				userId: "u1",
				messages: [],
				context: {},
			}),
		});
	});

	it("uses provided messages and context", async () => {
		mocks.agentSessionCreate.mockResolvedValueOnce({});
		await createAgentSession({
			id: "s2",
			sessionType: "tool",
			userId: "u2",
			messages: [{ role: "user" }],
			context: { foo: "bar" },
			organizationId: "org1",
			toolSlug: "expense-tracker",
			jobId: "j1",
		});
		expect(mocks.agentSessionCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				messages: [{ role: "user" }],
				context: { foo: "bar" },
				organizationId: "org1",
				toolSlug: "expense-tracker",
				jobId: "j1",
			}),
		});
	});
});

describe("getAgentSessionById", () => {
	it("returns session when found", async () => {
		mocks.agentSessionFindUnique.mockResolvedValueOnce({ id: "s1" });
		const result = await getAgentSessionById("s1");
		expect(result).toEqual({ id: "s1" });
		expect(mocks.agentSessionFindUnique).toHaveBeenCalledWith({
			where: { id: "s1" },
		});
	});

	it("returns null when not found", async () => {
		mocks.agentSessionFindUnique.mockResolvedValueOnce(null);
		const result = await getAgentSessionById("missing");
		expect(result).toBeNull();
	});
});

describe("updateAgentSession", () => {
	it("updates a session", async () => {
		const updated = { id: "s1", isComplete: true };
		mocks.agentSessionUpdate.mockResolvedValueOnce(updated);
		const result = await updateAgentSession("s1", {
			isComplete: true,
			totalInputTokens: 100,
			totalOutputTokens: 50,
		});
		expect(result).toBe(updated);
		expect(mocks.agentSessionUpdate).toHaveBeenCalledWith({
			where: { id: "s1" },
			data: expect.objectContaining({
				isComplete: true,
				totalInputTokens: 100,
				totalOutputTokens: 50,
			}),
		});
	});
});

describe("deleteAgentSession", () => {
	it("deletes a session by id", async () => {
		mocks.agentSessionDelete.mockResolvedValueOnce({});
		await deleteAgentSession("s1");
		expect(mocks.agentSessionDelete).toHaveBeenCalledWith({
			where: { id: "s1" },
		});
	});
});

describe("getAgentSessionsByUserId", () => {
	it("queries with userId and defaults", async () => {
		mocks.agentSessionFindMany.mockResolvedValueOnce([]);
		const result = await getAgentSessionsByUserId({ userId: "u1" });
		expect(result).toEqual([]);
		expect(mocks.agentSessionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "u1" },
				take: 50,
				skip: 0,
			}),
		);
	});

	it("applies sessionType and isComplete filters", async () => {
		mocks.agentSessionFindMany.mockResolvedValueOnce([{ id: "s1" }]);
		await getAgentSessionsByUserId({
			userId: "u1",
			sessionType: "chat",
			isComplete: true,
			limit: 10,
			offset: 5,
		});
		expect(mocks.agentSessionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "u1", sessionType: "chat", isComplete: true },
				take: 10,
				skip: 5,
			}),
		);
	});
});

describe("getAgentSessionsBySessionType", () => {
	it("queries by sessionType with defaults", async () => {
		mocks.agentSessionFindMany.mockResolvedValueOnce([]);
		await getAgentSessionsBySessionType({ sessionType: "tool" });
		expect(mocks.agentSessionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { sessionType: "tool" },
				take: 50,
				skip: 0,
			}),
		);
	});

	it("applies isComplete filter", async () => {
		mocks.agentSessionFindMany.mockResolvedValueOnce([]);
		await getAgentSessionsBySessionType({
			sessionType: "tool",
			isComplete: false,
		});
		expect(mocks.agentSessionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { sessionType: "tool", isComplete: false },
			}),
		);
	});
});

describe("getAgentSessionsByToolSlug", () => {
	it("queries by toolSlug", async () => {
		mocks.agentSessionFindMany.mockResolvedValueOnce([{ id: "s1" }]);
		const result = await getAgentSessionsByToolSlug({
			toolSlug: "expense-tracker",
		});
		expect(result).toEqual([{ id: "s1" }]);
		expect(mocks.agentSessionFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { toolSlug: "expense-tracker" },
				take: 50,
			}),
		);
	});
});

describe("getAgentSessionsByJobId", () => {
	it("queries by jobId", async () => {
		mocks.agentSessionFindMany.mockResolvedValueOnce([{ id: "s1" }]);
		await getAgentSessionsByJobId("j1");
		expect(mocks.agentSessionFindMany).toHaveBeenCalledWith({
			where: { jobId: "j1" },
			orderBy: { updatedAt: "desc" },
		});
	});
});

describe("countAgentSessionsByUser", () => {
	it("counts without sessionType filter", async () => {
		mocks.agentSessionCount.mockResolvedValueOnce(5);
		const result = await countAgentSessionsByUser("u1");
		expect(result).toBe(5);
		expect(mocks.agentSessionCount).toHaveBeenCalledWith({
			where: { userId: "u1" },
		});
	});

	it("counts with sessionType filter", async () => {
		mocks.agentSessionCount.mockResolvedValueOnce(2);
		await countAgentSessionsByUser("u1", "chat");
		expect(mocks.agentSessionCount).toHaveBeenCalledWith({
			where: { userId: "u1", sessionType: "chat" },
		});
	});
});
