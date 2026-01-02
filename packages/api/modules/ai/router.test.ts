import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { aiRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getAiChatsByUserIdMock = vi.hoisted(() => vi.fn());
const getAiChatsByOrganizationIdMock = vi.hoisted(() => vi.fn());
const createAiChatMock = vi.hoisted(() => vi.fn());
const getAiChatByIdMock = vi.hoisted(() => vi.fn());
const updateAiChatMock = vi.hoisted(() => vi.fn());
const deleteAiChatMock = vi.hoisted(() => vi.fn());
const addMessageToAiChatMock = vi.hoisted(() => vi.fn());
const verifyOrganizationMembershipMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getAiChatsByUserId: getAiChatsByUserIdMock,
	getAiChatsByOrganizationId: getAiChatsByOrganizationIdMock,
	createAiChat: createAiChatMock,
	getAiChatById: getAiChatByIdMock,
	updateAiChat: updateAiChatMock,
	deleteAiChat: deleteAiChatMock,
	addMessageToAiChat: addMessageToAiChatMock,
}));

vi.mock("../organizations/lib/membership", () => ({
	verifyOrganizationMembership: verifyOrganizationMembershipMock,
}));

describe("AI Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		getSessionMock.mockResolvedValue({
			user: { id: "user-123", role: "member" },
			session: { id: "session-1" },
		});
	});

	describe("ai.chats.list", () => {
		const createClient = () =>
			createProcedureClient(aiRouter.chats.list, {
				context: {
					headers: new Headers(),
				},
			});

		it("lists user chats when no organization specified", async () => {
			const mockChats = [
				{ id: "chat-1", title: "Chat 1", messages: [] },
				{ id: "chat-2", title: "Chat 2", messages: [] },
			];
			getAiChatsByUserIdMock.mockResolvedValue(mockChats);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ chats: mockChats });
			expect(getAiChatsByUserIdMock).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
				userId: "user-123",
			});
		});

		it("lists organization chats when organization specified", async () => {
			const mockChats = [
				{ id: "chat-1", title: "Org Chat", messages: [] },
			];
			getAiChatsByOrganizationIdMock.mockResolvedValue(mockChats);
			verifyOrganizationMembershipMock.mockResolvedValue({
				role: "member",
			});

			const client = createClient();
			const result = await client({ organizationId: "org-123" });

			expect(result).toEqual({ chats: mockChats });
			expect(getAiChatsByOrganizationIdMock).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
				organizationId: "org-123",
			});
		});

		it("throws FORBIDDEN when user is not organization member", async () => {
			verifyOrganizationMembershipMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({ organizationId: "org-123" }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(aiRouter.chats.list, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("ai.chats.create", () => {
		const createClient = () =>
			createProcedureClient(aiRouter.chats.create, {
				context: {
					headers: new Headers(),
				},
			});

		it("creates chat for user", async () => {
			const mockChat = { id: "chat-123", title: "New Chat" };
			createAiChatMock.mockResolvedValue(mockChat);

			const client = createClient();
			const result = await client({ title: "New Chat" });

			expect(result).toEqual({ chat: mockChat });
			expect(createAiChatMock).toHaveBeenCalledWith({
				title: "New Chat",
				organizationId: undefined,
				userId: "user-123",
			});
		});

		it("creates chat without title", async () => {
			const mockChat = { id: "chat-123", title: null };
			createAiChatMock.mockResolvedValue(mockChat);

			const client = createClient();
			await client({});

			expect(createAiChatMock).toHaveBeenCalledWith({
				title: undefined,
				organizationId: undefined,
				userId: "user-123",
			});
		});

		it("creates chat for organization when user is member", async () => {
			const mockChat = { id: "chat-123", title: "Org Chat" };
			createAiChatMock.mockResolvedValue(mockChat);
			verifyOrganizationMembershipMock.mockResolvedValue({
				role: "member",
			});

			const client = createClient();
			const result = await client({
				title: "Org Chat",
				organizationId: "org-123",
			});

			expect(result).toEqual({ chat: mockChat });
			expect(createAiChatMock).toHaveBeenCalledWith({
				title: "Org Chat",
				organizationId: "org-123",
				userId: "user-123",
			});
		});

		it("throws FORBIDDEN when user is not organization member", async () => {
			verifyOrganizationMembershipMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({ title: "Chat", organizationId: "org-123" }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws INTERNAL_SERVER_ERROR when chat creation fails", async () => {
			createAiChatMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({ title: "Chat" })).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});
		});
	});

	describe("ai.chats.find", () => {
		const createClient = () =>
			createProcedureClient(aiRouter.chats.find, {
				context: {
					headers: new Headers(),
				},
			});

		it("finds chat by id", async () => {
			const mockChat = {
				id: "chat-123",
				title: "Test Chat",
				userId: "user-123",
				messages: [],
			};
			getAiChatByIdMock.mockResolvedValue(mockChat);

			const client = createClient();
			const result = await client({ id: "chat-123" });

			expect(result).toEqual({ chat: mockChat });
			expect(getAiChatByIdMock).toHaveBeenCalledWith("chat-123");
		});

		it("throws NOT_FOUND when chat does not exist", async () => {
			getAiChatByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({ id: "non-existent" })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the chat", async () => {
			getAiChatByIdMock.mockResolvedValue({
				id: "chat-123",
				userId: "different-user",
			});

			const client = createClient();

			await expect(client({ id: "chat-123" })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("allows access to organization chat when user is member", async () => {
			const mockChat = {
				id: "chat-123",
				organizationId: "org-123",
				messages: [],
			};
			getAiChatByIdMock.mockResolvedValue(mockChat);
			verifyOrganizationMembershipMock.mockResolvedValue({
				role: "member",
			});

			const client = createClient();
			const result = await client({ id: "chat-123" });

			expect(result).toEqual({ chat: mockChat });
		});
	});

	describe("ai.chats.update", () => {
		const createClient = () =>
			createProcedureClient(aiRouter.chats.update, {
				context: {
					headers: new Headers(),
				},
			});

		it("updates chat title", async () => {
			const mockChat = {
				id: "chat-123",
				userId: "user-123",
				title: "Old Title",
			};
			getAiChatByIdMock.mockResolvedValue(mockChat);
			updateAiChatMock.mockResolvedValue({
				...mockChat,
				title: "New Title",
			});

			const client = createClient();
			const result = await client({
				id: "chat-123",
				title: "New Title",
			});

			expect(result).toEqual({
				chat: expect.objectContaining({ title: "New Title" }),
			});
			expect(updateAiChatMock).toHaveBeenCalledWith({
				id: "chat-123",
				title: "New Title",
			});
		});

		it("throws NOT_FOUND when chat does not exist", async () => {
			getAiChatByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({ id: "non-existent", title: "Title" }),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the chat", async () => {
			getAiChatByIdMock.mockResolvedValue({
				id: "chat-123",
				userId: "different-user",
			});

			const client = createClient();

			await expect(
				client({ id: "chat-123", title: "Title" }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});
	});

	describe("ai.chats.delete", () => {
		const createClient = () =>
			createProcedureClient(aiRouter.chats.delete, {
				context: {
					headers: new Headers(),
				},
			});

		it("deletes chat", async () => {
			getAiChatByIdMock.mockResolvedValue({
				id: "chat-123",
				userId: "user-123",
			});
			deleteAiChatMock.mockResolvedValue({ id: "chat-123" });

			const client = createClient();
			await client({ id: "chat-123" });

			expect(deleteAiChatMock).toHaveBeenCalledWith("chat-123");
		});

		it("throws NOT_FOUND when chat does not exist", async () => {
			getAiChatByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({ id: "non-existent" })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the chat", async () => {
			getAiChatByIdMock.mockResolvedValue({
				id: "chat-123",
				userId: "different-user",
			});

			const client = createClient();

			await expect(client({ id: "chat-123" })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});
	});

	describe("ai.chats.messages.add", () => {
		const createClient = () =>
			createProcedureClient(aiRouter.chats.messages.add, {
				context: {
					headers: new Headers(),
				},
			});

		it("throws NOT_FOUND when chat does not exist", async () => {
			getAiChatByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({
					chatId: "non-existent",
					messages: [{ role: "user", content: "Hi" }],
				}),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the chat", async () => {
			getAiChatByIdMock.mockResolvedValue({
				id: "chat-123",
				userId: "different-user",
			});

			const client = createClient();

			await expect(
				client({
					chatId: "chat-123",
					messages: [{ role: "user", content: "Hi" }],
				}),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});
	});
});
