import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { aiRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getAiChatByIdMock = vi.hoisted(() => vi.fn());
const getAiChatsByUserIdMock = vi.hoisted(() => vi.fn());
const getAiChatsByOrganizationIdMock = vi.hoisted(() => vi.fn());
const createAiChatMock = vi.hoisted(() => vi.fn());
const updateAiChatMock = vi.hoisted(() => vi.fn());
const deleteAiChatMock = vi.hoisted(() => vi.fn());
const verifyOrganizationMembershipMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	db: {},
	getAiChatById: getAiChatByIdMock,
	getAiChatsByUserId: getAiChatsByUserIdMock,
	getAiChatsByOrganizationId: getAiChatsByOrganizationIdMock,
	createAiChat: createAiChatMock,
	updateAiChat: updateAiChatMock,
	deleteAiChat: deleteAiChatMock,
}));

vi.mock("../organizations/lib/membership", () => ({
	verifyOrganizationMembership: verifyOrganizationMembershipMock,
}));

const streamTextMock = vi.hoisted(() => vi.fn());
const streamToEventIteratorMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/ai", () => ({
	convertToModelMessages: vi.fn().mockResolvedValue([]),
	streamText: streamTextMock,
	textModel: "mock-model",
}));

vi.mock("@orpc/client", () => ({
	ORPCError: class ORPCError extends Error {
		constructor(
			public readonly code: string,
			options?: { message?: string },
		) {
			super(options?.message ?? code);
			this.name = "ORPCError";
		}
	},
	streamToEventIterator: streamToEventIteratorMock,
}));

const TEST_CHAT_ID = "clz1234567890abcdefghij";
const TEST_USER_ID = "clu1234567890abcdefghij";
const TEST_ORG_ID = "clo1234567890abcdefghij";

const mockUser = {
	id: TEST_USER_ID,
	email: "test@example.com",
	name: "Test User",
};
const mockSessionData = { activeOrganizationId: TEST_ORG_ID };

const makeClient = <T>(procedure: T) =>
	createProcedureClient(
		procedure as Parameters<typeof createProcedureClient>[0],
		{
			context: { headers: new Headers() },
		},
	);

const mockChat = {
	id: TEST_CHAT_ID,
	userId: TEST_USER_ID,
	organizationId: null as string | null,
	title: "Test Chat",
	messages: [],
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("AI Router - listChats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: mockUser,
			session: mockSessionData,
		});
	});

	it("returns user chats when no organizationId provided", async () => {
		getAiChatsByUserIdMock.mockResolvedValue([mockChat]);
		const client = makeClient(aiRouter.chats.list);
		const result = await client({});
		expect(getAiChatsByUserIdMock).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
			userId: TEST_USER_ID,
		});
		expect(result.chats).toHaveLength(1);
	});

	it("returns org chats when organizationId provided and member", async () => {
		verifyOrganizationMembershipMock.mockResolvedValue({ role: "OWNER" });
		getAiChatsByOrganizationIdMock.mockResolvedValue([mockChat]);
		const client = makeClient(aiRouter.chats.list);
		const result = await client({ organizationId: TEST_ORG_ID });
		expect(getAiChatsByOrganizationIdMock).toHaveBeenCalled();
		expect(result.chats).toHaveLength(1);
	});

	it("throws FORBIDDEN when not org member", async () => {
		verifyOrganizationMembershipMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.list);
		await expect(client({ organizationId: TEST_ORG_ID })).rejects.toThrow();
	});
});

describe("AI Router - findChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: mockUser,
			session: mockSessionData,
		});
	});

	it("returns chat for owner", async () => {
		getAiChatByIdMock.mockResolvedValue(mockChat);
		const client = makeClient(aiRouter.chats.find);
		const result = await client({ id: TEST_CHAT_ID });
		expect(result.chat.id).toBe(TEST_CHAT_ID);
	});

	it("throws NOT_FOUND when chat does not exist", async () => {
		getAiChatByIdMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.find);
		await expect(client({ id: TEST_CHAT_ID })).rejects.toThrow();
	});

	it("throws FORBIDDEN when chat belongs to different user and no org", async () => {
		getAiChatByIdMock.mockResolvedValue({
			...mockChat,
			userId: "other-user",
		});
		const client = makeClient(aiRouter.chats.find);
		await expect(client({ id: TEST_CHAT_ID })).rejects.toThrow();
	});

	it("checks org membership for org chats", async () => {
		const orgChat = { ...mockChat, organizationId: TEST_ORG_ID };
		getAiChatByIdMock.mockResolvedValue(orgChat);
		verifyOrganizationMembershipMock.mockResolvedValue({ role: "MEMBER" });
		const client = makeClient(aiRouter.chats.find);
		const result = await client({ id: TEST_CHAT_ID });
		expect(verifyOrganizationMembershipMock).toHaveBeenCalledWith(
			TEST_ORG_ID,
			TEST_USER_ID,
		);
		expect(result.chat.id).toBe(TEST_CHAT_ID);
	});
});

describe("AI Router - createChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: mockUser,
			session: mockSessionData,
		});
	});

	it("creates a chat without org", async () => {
		createAiChatMock.mockResolvedValue(mockChat);
		const client = makeClient(aiRouter.chats.create);
		const result = await client({ title: "New Chat" });
		expect(createAiChatMock).toHaveBeenCalledWith({
			title: "New Chat",
			organizationId: undefined,
			userId: TEST_USER_ID,
		});
		expect(result.chat).toBeDefined();
	});

	it("throws INTERNAL_SERVER_ERROR when createAiChat returns null", async () => {
		createAiChatMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.create);
		await expect(client({})).rejects.toThrow();
	});

	it("throws FORBIDDEN when org membership not satisfied", async () => {
		verifyOrganizationMembershipMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.create);
		await expect(client({ organizationId: TEST_ORG_ID })).rejects.toThrow();
	});
});

describe("AI Router - updateChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: mockUser,
			session: mockSessionData,
		});
	});

	it("updates a chat title for owner", async () => {
		getAiChatByIdMock.mockResolvedValue(mockChat);
		const updatedChat = { ...mockChat, title: "Updated" };
		updateAiChatMock.mockResolvedValue(updatedChat);
		const client = makeClient(aiRouter.chats.update);
		const result = await client({ id: TEST_CHAT_ID, title: "Updated" });
		expect(result.chat.title).toBe("Updated");
	});

	it("throws NOT_FOUND when chat does not exist", async () => {
		getAiChatByIdMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.update);
		await expect(client({ id: TEST_CHAT_ID })).rejects.toThrow();
	});

	it("throws FORBIDDEN for non-owner personal chat", async () => {
		getAiChatByIdMock.mockResolvedValue({
			...mockChat,
			userId: "other-user",
		});
		const client = makeClient(aiRouter.chats.update);
		await expect(client({ id: TEST_CHAT_ID })).rejects.toThrow();
	});
});

describe("AI Router - deleteChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: mockUser,
			session: mockSessionData,
		});
	});

	it("deletes a chat for owner", async () => {
		getAiChatByIdMock.mockResolvedValue(mockChat);
		deleteAiChatMock.mockResolvedValue(undefined);
		const client = makeClient(aiRouter.chats.delete);
		const result = await client({ id: TEST_CHAT_ID });
		expect(deleteAiChatMock).toHaveBeenCalledWith(TEST_CHAT_ID);
		expect(result.success).toBe(true);
	});

	it("throws NOT_FOUND when chat does not exist", async () => {
		getAiChatByIdMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.delete);
		await expect(client({ id: TEST_CHAT_ID })).rejects.toThrow();
	});

	it("throws FORBIDDEN for non-owner personal chat", async () => {
		getAiChatByIdMock.mockResolvedValue({
			...mockChat,
			userId: "other-user",
		});
		const client = makeClient(aiRouter.chats.delete);
		await expect(client({ id: TEST_CHAT_ID })).rejects.toThrow();
	});
});

describe("AI Router - chats.messages.add", () => {
	const mockMessages = [
		{
			id: "msg-1",
			role: "user" as const,
			parts: [{ type: "text" as const, text: "Hello" }],
			createdAt: new Date(),
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: mockUser,
			session: mockSessionData,
		});
		const mockStream = { toUIMessageStream: vi.fn().mockReturnValue({}) };
		streamTextMock.mockReturnValue(mockStream);
		streamToEventIteratorMock.mockReturnValue("mock-event-iterator");
	});

	it("streams response for personal chat owner", async () => {
		getAiChatByIdMock.mockResolvedValue(mockChat);
		const client = makeClient(aiRouter.chats.messages.add);
		const result = await client({
			chatId: TEST_CHAT_ID,
			messages: mockMessages,
		});
		expect(streamTextMock).toHaveBeenCalled();
		expect(result).toBe("mock-event-iterator");
	});

	it("throws NOT_FOUND when chat does not exist", async () => {
		getAiChatByIdMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.messages.add);
		await expect(
			client({ chatId: TEST_CHAT_ID, messages: mockMessages }),
		).rejects.toThrow();
	});

	it("throws FORBIDDEN for non-owner personal chat", async () => {
		getAiChatByIdMock.mockResolvedValue({
			...mockChat,
			userId: "other-user",
		});
		const client = makeClient(aiRouter.chats.messages.add);
		await expect(
			client({ chatId: TEST_CHAT_ID, messages: mockMessages }),
		).rejects.toThrow();
	});

	it("streams for org chat when user is a member", async () => {
		const orgChat = {
			...mockChat,
			organizationId: TEST_ORG_ID,
			userId: null,
		};
		getAiChatByIdMock.mockResolvedValue(orgChat);
		verifyOrganizationMembershipMock.mockResolvedValue({ role: "MEMBER" });
		const client = makeClient(aiRouter.chats.messages.add);
		const result = await client({
			chatId: TEST_CHAT_ID,
			messages: mockMessages,
		});
		expect(verifyOrganizationMembershipMock).toHaveBeenCalledWith(
			TEST_ORG_ID,
			TEST_USER_ID,
		);
		expect(result).toBe("mock-event-iterator");
	});

	it("throws FORBIDDEN for org chat when user is not a member", async () => {
		const orgChat = {
			...mockChat,
			organizationId: TEST_ORG_ID,
			userId: null,
		};
		getAiChatByIdMock.mockResolvedValue(orgChat);
		verifyOrganizationMembershipMock.mockResolvedValue(null);
		const client = makeClient(aiRouter.chats.messages.add);
		await expect(
			client({ chatId: TEST_CHAT_ID, messages: mockMessages }),
		).rejects.toThrow();
	});
});
