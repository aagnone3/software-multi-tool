import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSessionState } from "../types";
import { PrismaSessionPersistence } from "./prisma";

const getAgentSessionByIdMock = vi.hoisted(() => vi.fn());
const createAgentSessionMock = vi.hoisted(() => vi.fn());
const updateAgentSessionMock = vi.hoisted(() => vi.fn());
const deleteAgentSessionMock = vi.hoisted(() => vi.fn());
const getAgentSessionsByUserIdMock = vi.hoisted(() => vi.fn());
const getAgentSessionsBySessionTypeMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	getAgentSessionById: getAgentSessionByIdMock,
	createAgentSession: createAgentSessionMock,
	updateAgentSession: updateAgentSessionMock,
	deleteAgentSession: deleteAgentSessionMock,
	getAgentSessionsByUserId: getAgentSessionsByUserIdMock,
	getAgentSessionsBySessionType: getAgentSessionsBySessionTypeMock,
}));

const TEST_SESSION_ID = "test-session-id";
const TEST_USER_ID = "user-123";

function makePrismaSession(overrides = {}) {
	return {
		id: TEST_SESSION_ID,
		sessionType: "feedback",
		userId: TEST_USER_ID,
		organizationId: "org-123",
		toolSlug: "my-tool",
		jobId: "job-456",
		messages: [
			{
				role: "user",
				content: "hello",
				timestamp: new Date("2025-01-01T00:00:00Z"),
			},
		],
		context: { sessionId: TEST_SESSION_ID, metadata: { key: "value" } },
		extractedData: { result: "done" },
		isComplete: false,
		totalInputTokens: 100,
		totalOutputTokens: 50,
		createdAt: new Date("2025-01-01T00:00:00Z"),
		updatedAt: new Date("2025-01-02T00:00:00Z"),
		...overrides,
	};
}

function makeState(overrides = {}): AgentSessionState {
	return {
		id: TEST_SESSION_ID,
		sessionType: "feedback",
		context: {
			sessionId: TEST_SESSION_ID,
			userId: TEST_USER_ID,
			organizationId: "org-123",
			toolSlug: "my-tool",
			jobId: "job-456",
		},
		messages: [
			{
				role: "user",
				content: "hello",
				timestamp: new Date("2025-01-01T00:00:00Z"),
			},
		],
		isComplete: false,
		extractedData: { result: "done" },
		totalUsage: { inputTokens: 100, outputTokens: 50 },
		createdAt: new Date("2025-01-01T00:00:00Z"),
		updatedAt: new Date("2025-01-02T00:00:00Z"),
		...overrides,
	};
}

describe("PrismaSessionPersistence", () => {
	let persistence: PrismaSessionPersistence;

	beforeEach(() => {
		vi.clearAllMocks();
		persistence = new PrismaSessionPersistence();
	});

	describe("save", () => {
		it("creates a new session when none exists", async () => {
			getAgentSessionByIdMock.mockResolvedValue(null);
			const state = makeState();

			await persistence.save(state);

			expect(createAgentSessionMock).toHaveBeenCalledWith(
				expect.objectContaining({
					id: TEST_SESSION_ID,
					sessionType: "feedback",
					userId: TEST_USER_ID,
					organizationId: "org-123",
				}),
			);
			expect(updateAgentSessionMock).not.toHaveBeenCalled();
		});

		it("updates an existing session when one exists", async () => {
			getAgentSessionByIdMock.mockResolvedValue(makePrismaSession());
			const state = makeState({ isComplete: true });

			await persistence.save(state);

			expect(updateAgentSessionMock).toHaveBeenCalledWith(
				TEST_SESSION_ID,
				expect.objectContaining({ isComplete: true }),
			);
			expect(createAgentSessionMock).not.toHaveBeenCalled();
		});
	});

	describe("load", () => {
		it("returns null when session not found", async () => {
			getAgentSessionByIdMock.mockResolvedValue(null);

			const result = await persistence.load("nonexistent");

			expect(result).toBeNull();
		});

		it("maps prisma session to AgentSessionState", async () => {
			getAgentSessionByIdMock.mockResolvedValue(makePrismaSession());

			const result = await persistence.load(TEST_SESSION_ID);

			expect(result).not.toBeNull();
			expect(result?.id).toBe(TEST_SESSION_ID);
			expect(result?.sessionType).toBe("feedback");
			expect(result?.context.userId).toBe(TEST_USER_ID);
			expect(result?.totalUsage.inputTokens).toBe(100);
			expect(result?.totalUsage.outputTokens).toBe(50);
		});

		it("parses message timestamps as Date objects", async () => {
			getAgentSessionByIdMock.mockResolvedValue(makePrismaSession());

			const result = await persistence.load(TEST_SESSION_ID);

			expect(result?.messages[0].timestamp).toBeInstanceOf(Date);
		});
	});

	describe("delete", () => {
		it("calls deleteAgentSession with the id", async () => {
			deleteAgentSessionMock.mockResolvedValue(undefined);

			await persistence.delete(TEST_SESSION_ID);

			expect(deleteAgentSessionMock).toHaveBeenCalledWith(
				TEST_SESSION_ID,
			);
		});

		it("does not throw when session does not exist", async () => {
			deleteAgentSessionMock.mockRejectedValue(new Error("not found"));

			await expect(
				persistence.delete("nonexistent"),
			).resolves.not.toThrow();
		});
	});

	describe("listByUser", () => {
		it("returns mapped sessions for user", async () => {
			getAgentSessionsByUserIdMock.mockResolvedValue([
				makePrismaSession(),
			]);

			const results = await persistence.listByUser(TEST_USER_ID);

			expect(results).toHaveLength(1);
			expect(results[0].context.userId).toBe(TEST_USER_ID);
		});

		it("passes default limit and offset", async () => {
			getAgentSessionsByUserIdMock.mockResolvedValue([]);

			await persistence.listByUser(TEST_USER_ID);

			expect(getAgentSessionsByUserIdMock).toHaveBeenCalledWith({
				userId: TEST_USER_ID,
				limit: 50,
				offset: 0,
			});
		});

		it("passes custom limit and offset", async () => {
			getAgentSessionsByUserIdMock.mockResolvedValue([]);

			await persistence.listByUser(TEST_USER_ID, {
				limit: 10,
				offset: 5,
			});

			expect(getAgentSessionsByUserIdMock).toHaveBeenCalledWith({
				userId: TEST_USER_ID,
				limit: 10,
				offset: 5,
			});
		});
	});

	describe("listBySessionType", () => {
		it("returns mapped sessions for session type", async () => {
			getAgentSessionsBySessionTypeMock.mockResolvedValue([
				makePrismaSession(),
			]);

			const results = await persistence.listBySessionType("feedback");

			expect(results).toHaveLength(1);
			expect(results[0].sessionType).toBe("feedback");
		});

		it("passes default limit and offset", async () => {
			getAgentSessionsBySessionTypeMock.mockResolvedValue([]);

			await persistence.listBySessionType("feedback");

			expect(getAgentSessionsBySessionTypeMock).toHaveBeenCalledWith({
				sessionType: "feedback",
				limit: 50,
				offset: 0,
			});
		});
	});
});
