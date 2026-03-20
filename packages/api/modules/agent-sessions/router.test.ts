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
