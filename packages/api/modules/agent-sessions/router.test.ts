import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { agentSessionsRouter } from "./router";

const TEST_USER_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const TEST_SESSION_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

const getSessionMock = vi.hoisted(() => vi.fn());
const getAgentSessionByIdMock = vi.hoisted(() => vi.fn());
const AgentSessionMock = vi.hoisted(() => ({
	create: vi.fn(),
}));
const createFeedbackCollectorConfigMock = vi.hoisted(() => vi.fn(() => ({})));
const PrismaSessionPersistenceMock = vi.hoisted(() => vi.fn());
const isExtractedFeedbackMock = vi.hoisted(() => vi.fn(() => false));
const updateToolFeedbackMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getAgentSessionById: getAgentSessionByIdMock,
	updateToolFeedback: updateToolFeedbackMock,
}));

vi.mock("@repo/agent-sdk", () => ({
	AgentSession: AgentSessionMock,
	createFeedbackCollectorConfig: createFeedbackCollectorConfigMock,
	PrismaSessionPersistence: PrismaSessionPersistenceMock,
	isExtractedFeedback: isExtractedFeedbackMock,
}));

vi.mock("@repo/logs", () => ({
	logger: loggerMock,
}));

const authenticatedContext = {
	headers: new Headers(),
};

const mockSession = {
	session: { activeOrganizationId: "org-1" },
	user: { id: TEST_USER_ID, email: "test@example.com" },
};

function makeClient() {
	return createProcedureClient(agentSessionsRouter.get, {
		context: authenticatedContext,
	});
}

describe("agentSessionsRouter.get", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
	});

	it("returns session when found and owned by user", async () => {
		const sessionRecord = {
			id: TEST_SESSION_ID,
			sessionType: "feedback-collector",
			isComplete: false,
			messages: [],
			extractedData: null,
			toolSlug: "my-tool",
			jobId: null,
			userId: TEST_USER_ID,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		getAgentSessionByIdMock.mockResolvedValue(sessionRecord);

		const client = makeClient();
		const result = await client({ sessionId: TEST_SESSION_ID });

		expect(result.session.id).toBe(TEST_SESSION_ID);
		expect(result.session.sessionType).toBe("feedback-collector");
	});

	it("throws NOT_FOUND when session does not exist", async () => {
		getAgentSessionByIdMock.mockResolvedValue(null);

		const client = makeClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("throws FORBIDDEN when session belongs to another user", async () => {
		getAgentSessionByIdMock.mockResolvedValue({
			id: TEST_SESSION_ID,
			userId: "other-user",
			sessionType: "feedback-collector",
			isComplete: false,
			messages: [],
			extractedData: null,
			toolSlug: null,
			jobId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const client = makeClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("throws UNAUTHORIZED when no session", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = makeClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});

describe("agentSessionsRouter.create", () => {
	const mockState = {
		context: { sessionId: TEST_SESSION_ID, userId: TEST_USER_ID },
		sessionType: "feedback-collector",
		isComplete: false,
		messages: [],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
		AgentSessionMock.create.mockResolvedValue({
			getState: () => mockState,
		});
		createFeedbackCollectorConfigMock.mockReturnValue({
			initialMessage: "Hi",
		});
	});

	it("creates a feedback-collector session successfully", async () => {
		AgentSessionMock.create.mockResolvedValue({
			getState: () => ({
				context: { sessionId: TEST_SESSION_ID },
				sessionType: "feedback-collector",
				isComplete: false,
				messages: [],
			}),
		});

		const client = createProcedureClient(agentSessionsRouter.create, {
			context: authenticatedContext,
		});
		const result = await client({ sessionType: "feedback-collector" });

		expect(result.session).toBeDefined();
		expect(result.session.id).toBe(TEST_SESSION_ID);
	});

	it("throws UNAUTHORIZED when no auth session", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = createProcedureClient(agentSessionsRouter.create, {
			context: authenticatedContext,
		});
		await expect(
			client({ sessionType: "feedback-collector" }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});

describe("agentSessionsRouter.executeTurn", () => {
	const mockSessionRecord = {
		id: TEST_SESSION_ID,
		userId: TEST_USER_ID,
		organizationId: null,
		toolSlug: "expense-tracker",
		jobId: null,
		sessionType: "feedback-collector",
		isComplete: false,
		messages: [],
		extractedData: null,
		context: {},
		totalInputTokens: 0,
		totalOutputTokens: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockTurnResult = {
		response: "Hello from assistant",
		isComplete: false,
		extractedData: null,
		usage: { inputTokens: 10, outputTokens: 5 },
	};

	const AgentSessionRestoreMock = vi.hoisted(() => vi.fn());

	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
		getAgentSessionByIdMock.mockResolvedValue(mockSessionRecord);
		createFeedbackCollectorConfigMock.mockReturnValue({
			initialMessage: "Hi",
		});
		AgentSessionRestoreMock.mockResolvedValue({
			executeTurn: vi.fn().mockResolvedValue(mockTurnResult),
			getTranscript: vi.fn().mockReturnValue([]),
		});
		AgentSessionMock.restore = AgentSessionRestoreMock;
	});

	function makeExecuteTurnClient() {
		return createProcedureClient(agentSessionsRouter.executeTurn, {
			context: authenticatedContext,
		});
	}

	it("executes a turn successfully", async () => {
		const client = makeExecuteTurnClient();
		const result = await client({
			sessionId: TEST_SESSION_ID,
			message: "Hello",
		});

		expect(result.turn.response).toBe("Hello from assistant");
		expect(result.turn.isComplete).toBe(false);
	});

	it("throws UNAUTHORIZED when no auth session", async () => {
		getSessionMock.mockResolvedValue(null);
		const client = makeExecuteTurnClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID, message: "Hello" }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("throws NOT_FOUND when session does not exist", async () => {
		getAgentSessionByIdMock.mockResolvedValue(null);
		const client = makeExecuteTurnClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID, message: "Hello" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("throws FORBIDDEN when session belongs to another user", async () => {
		getAgentSessionByIdMock.mockResolvedValue({
			...mockSessionRecord,
			userId: "other-user-id",
		});
		const client = makeExecuteTurnClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID, message: "Hello" }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("throws BAD_REQUEST for unknown session type", async () => {
		getAgentSessionByIdMock.mockResolvedValue({
			...mockSessionRecord,
			sessionType: "unknown-type",
		});
		const client = makeExecuteTurnClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID, message: "Hello" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("updates tool feedback when session completes with feedbackId", async () => {
		const completedResult = {
			...mockTurnResult,
			isComplete: true,
			extractedData: { rating: "POSITIVE" },
		};
		getAgentSessionByIdMock.mockResolvedValue({
			...mockSessionRecord,
			context: { feedbackId: "feedback-123" },
		});
		isExtractedFeedbackMock.mockReturnValue(true);
		AgentSessionRestoreMock.mockResolvedValue({
			executeTurn: vi.fn().mockResolvedValue(completedResult),
			getTranscript: vi.fn().mockReturnValue([]),
		});
		updateToolFeedbackMock.mockResolvedValue({});

		const client = makeExecuteTurnClient();
		await client({ sessionId: TEST_SESSION_ID, message: "Done" });

		expect(updateToolFeedbackMock).toHaveBeenCalledWith(
			"feedback-123",
			TEST_USER_ID,
			expect.objectContaining({ extractedData: { rating: "POSITIVE" } }),
		);
	});

	it("throws INTERNAL_SERVER_ERROR on unexpected error", async () => {
		AgentSessionRestoreMock.mockRejectedValue(new Error("boom"));
		const client = makeExecuteTurnClient();
		await expect(
			client({ sessionId: TEST_SESSION_ID, message: "Hello" }),
		).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
	});
});

describe("agentSessionsRouter.create", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
		createFeedbackCollectorConfigMock.mockReturnValue({
			initialMessage: "How was your experience?",
		});
		AgentSessionMock.create = vi.fn().mockResolvedValue({
			getState: vi.fn().mockReturnValue({
				context: { sessionId: "session_new" },
				sessionType: "feedback-collector",
				isComplete: false,
				messages: [],
			}),
		});
	});

	function makeCreateClient() {
		return createProcedureClient(agentSessionsRouter.create, {
			context: authenticatedContext,
		});
	}

	it("creates a feedback-collector session successfully", async () => {
		const client = makeCreateClient();
		const result = await client({
			sessionType: "feedback-collector",
			toolSlug: "my-tool",
			toolName: "My Tool",
		});

		expect(result.session.id).toBe("session_new");
		expect(result.session.sessionType).toBe("feedback-collector");
		expect(result.session.isComplete).toBe(false);
		expect(result.session.initialMessage).toBe("How was your experience?");
	});

	it("throws UNAUTHORIZED when no auth session", async () => {
		getSessionMock.mockResolvedValue(null);
		const client = makeCreateClient();
		await expect(
			client({ sessionType: "feedback-collector" }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("throws INTERNAL_SERVER_ERROR on unexpected error", async () => {
		AgentSessionMock.create = vi
			.fn()
			.mockRejectedValue(new Error("db failure"));
		const client = makeCreateClient();
		await expect(
			client({ sessionType: "feedback-collector" }),
		).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
	});
});
