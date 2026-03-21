import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	aiChatFindMany: vi.fn(),
	aiChatFindFirst: vi.fn(),
	aiChatInsert: vi.fn(),
	aiChatUpdate: vi.fn(),
	aiChatDelete: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		query: {
			aiChat: {
				findMany: mocks.aiChatFindMany,
				findFirst: mocks.aiChatFindFirst,
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: mocks.aiChatInsert,
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: mocks.aiChatUpdate,
				})),
			})),
		})),
		delete: vi.fn(() => ({
			where: mocks.aiChatDelete,
		})),
	},
}));

import {
	createAiChat,
	deleteAiChat,
	getAiChatById,
	getAiChatsByOrganizationId,
	getAiChatsByUserId,
	updateAiChat,
} from "./ai-chats";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getAiChatsByUserId", () => {
	it("returns chats for a user", async () => {
		mocks.aiChatFindMany.mockResolvedValueOnce([{ id: "c1" }]);
		const result = await getAiChatsByUserId({
			userId: "u1",
			limit: 10,
			offset: 0,
		});
		expect(result).toEqual([{ id: "c1" }]);
		expect(mocks.aiChatFindMany).toHaveBeenCalledOnce();
	});
});

describe("getAiChatsByOrganizationId", () => {
	it("returns chats for an org", async () => {
		mocks.aiChatFindMany.mockResolvedValueOnce([{ id: "c2" }]);
		const result = await getAiChatsByOrganizationId({
			organizationId: "org1",
			limit: 5,
			offset: 0,
		});
		expect(result).toEqual([{ id: "c2" }]);
		expect(mocks.aiChatFindMany).toHaveBeenCalledOnce();
	});
});

describe("getAiChatById", () => {
	it("returns chat by id", async () => {
		mocks.aiChatFindFirst.mockResolvedValueOnce({ id: "c3" });
		const result = await getAiChatById("c3");
		expect(result).toEqual({ id: "c3" });
		expect(mocks.aiChatFindFirst).toHaveBeenCalledOnce();
	});
});

describe("createAiChat", () => {
	it("inserts and returns the new chat", async () => {
		mocks.aiChatInsert.mockResolvedValueOnce([{ id: "c4" }]);
		mocks.aiChatFindFirst.mockResolvedValueOnce({ id: "c4", userId: "u1" });
		const result = await createAiChat({ userId: "u1", title: "Test" });
		expect(result).toEqual({ id: "c4", userId: "u1" });
	});

	it("throws if insert returns no chat", async () => {
		mocks.aiChatInsert.mockResolvedValueOnce([{ id: "c5" }]);
		mocks.aiChatFindFirst.mockResolvedValueOnce(null);
		await expect(createAiChat({ userId: "u1" })).rejects.toThrow(
			"Failed to create chat",
		);
	});
});

describe("updateAiChat", () => {
	it("updates and returns the chat", async () => {
		mocks.aiChatUpdate.mockResolvedValueOnce([{ id: "c6", title: "New" }]);
		const result = await updateAiChat({ id: "c6", title: "New" });
		expect(result).toEqual([{ id: "c6", title: "New" }]);
	});
});

describe("deleteAiChat", () => {
	it("deletes the chat", async () => {
		mocks.aiChatDelete.mockResolvedValueOnce(undefined);
		await deleteAiChat("c7");
		expect(mocks.aiChatDelete).toHaveBeenCalledOnce();
	});
});
