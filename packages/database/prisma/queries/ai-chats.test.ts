import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	aiChatFindMany: vi.fn(),
	aiChatFindUnique: vi.fn(),
	aiChatCreate: vi.fn(),
	aiChatUpdate: vi.fn(),
	aiChatDelete: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		aiChat: {
			findMany: mocks.aiChatFindMany,
			findUnique: mocks.aiChatFindUnique,
			create: mocks.aiChatCreate,
			update: mocks.aiChatUpdate,
			delete: mocks.aiChatDelete,
		},
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
	it("queries by userId with limit and offset", async () => {
		mocks.aiChatFindMany.mockResolvedValueOnce([{ id: "c1" }]);
		const result = await getAiChatsByUserId({
			userId: "u1",
			limit: 10,
			offset: 0,
		});
		expect(result).toEqual([{ id: "c1" }]);
		expect(mocks.aiChatFindMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			take: 10,
			skip: 0,
		});
	});
});

describe("getAiChatsByOrganizationId", () => {
	it("queries by organizationId with limit and offset", async () => {
		mocks.aiChatFindMany.mockResolvedValueOnce([{ id: "c2" }]);
		await getAiChatsByOrganizationId({
			organizationId: "org1",
			limit: 5,
			offset: 10,
		});
		expect(mocks.aiChatFindMany).toHaveBeenCalledWith({
			where: { organizationId: "org1" },
			take: 5,
			skip: 10,
		});
	});
});

describe("getAiChatById", () => {
	it("returns chat when found", async () => {
		mocks.aiChatFindUnique.mockResolvedValueOnce({ id: "c1" });
		const result = await getAiChatById("c1");
		expect(result).toEqual({ id: "c1" });
		expect(mocks.aiChatFindUnique).toHaveBeenCalledWith({
			where: { id: "c1" },
		});
	});

	it("returns null when not found", async () => {
		mocks.aiChatFindUnique.mockResolvedValueOnce(null);
		const result = await getAiChatById("missing");
		expect(result).toBeNull();
	});
});

describe("createAiChat", () => {
	it("creates a chat for a user", async () => {
		mocks.aiChatCreate.mockResolvedValueOnce({ id: "c3" });
		const result = await createAiChat({ userId: "u1", title: "Hello" });
		expect(result).toEqual({ id: "c3" });
		expect(mocks.aiChatCreate).toHaveBeenCalledWith({
			data: { userId: "u1", title: "Hello", organizationId: undefined },
		});
	});

	it("creates with organizationId", async () => {
		mocks.aiChatCreate.mockResolvedValueOnce({ id: "c4" });
		await createAiChat({ userId: "u1", organizationId: "org1" });
		expect(mocks.aiChatCreate).toHaveBeenCalledWith({
			data: { userId: "u1", organizationId: "org1", title: undefined },
		});
	});
});

describe("updateAiChat", () => {
	it("updates title and messages", async () => {
		mocks.aiChatUpdate.mockResolvedValueOnce({ id: "c1" });
		await updateAiChat({
			id: "c1",
			title: "New title",
			messages: [{ role: "user", content: "hi" }],
		});
		expect(mocks.aiChatUpdate).toHaveBeenCalledWith({
			where: { id: "c1" },
			data: {
				title: "New title",
				messages: [{ role: "user", content: "hi" }],
			},
		});
	});
});

describe("deleteAiChat", () => {
	it("deletes by id", async () => {
		mocks.aiChatDelete.mockResolvedValueOnce({ id: "c1" });
		await deleteAiChat("c1");
		expect(mocks.aiChatDelete).toHaveBeenCalledWith({
			where: { id: "c1" },
		});
	});
});
