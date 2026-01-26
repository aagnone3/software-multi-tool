import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	toolFindUnique: vi.fn(),
	toolFindMany: vi.fn(),
	toolUpsert: vi.fn(),
	toolUpdate: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		tool: {
			findUnique: mocks.toolFindUnique,
			findMany: mocks.toolFindMany,
			upsert: mocks.toolUpsert,
			update: mocks.toolUpdate,
		},
	},
}));

import {
	getAllTools,
	getEnabledTools,
	getPublicTools,
	getToolById,
	getToolBySlug,
	getToolIdBySlug,
	getToolIdsBySlug,
	setToolEnabled,
	syncToolsFromConfig,
} from "./tools";

describe("tools queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("getToolBySlug", () => {
		it("returns tool by slug", async () => {
			const mockTool = {
				id: "tool-1",
				slug: "news-analyzer",
				name: "News Analyzer",
			};
			mocks.toolFindUnique.mockResolvedValueOnce(mockTool);

			const result = await getToolBySlug("news-analyzer");

			expect(result).toEqual(mockTool);
			expect(mocks.toolFindUnique).toHaveBeenCalledWith({
				where: { slug: "news-analyzer" },
			});
		});

		it("returns null when tool not found", async () => {
			mocks.toolFindUnique.mockResolvedValueOnce(null);

			const result = await getToolBySlug("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("getToolById", () => {
		it("returns tool by id", async () => {
			const mockTool = {
				id: "tool-1",
				slug: "news-analyzer",
				name: "News Analyzer",
			};
			mocks.toolFindUnique.mockResolvedValueOnce(mockTool);

			const result = await getToolById("tool-1");

			expect(result).toEqual(mockTool);
			expect(mocks.toolFindUnique).toHaveBeenCalledWith({
				where: { id: "tool-1" },
			});
		});
	});

	describe("getAllTools", () => {
		it("returns all tools sorted by name", async () => {
			const mockTools = [
				{ id: "tool-1", name: "A Tool" },
				{ id: "tool-2", name: "B Tool" },
			];
			mocks.toolFindMany.mockResolvedValueOnce(mockTools);

			const result = await getAllTools();

			expect(result).toEqual(mockTools);
			expect(mocks.toolFindMany).toHaveBeenCalledWith({
				orderBy: { name: "asc" },
			});
		});
	});

	describe("getEnabledTools", () => {
		it("returns only enabled tools", async () => {
			const mockTools = [{ id: "tool-1", enabled: true, name: "A Tool" }];
			mocks.toolFindMany.mockResolvedValueOnce(mockTools);

			const result = await getEnabledTools();

			expect(result).toEqual(mockTools);
			expect(mocks.toolFindMany).toHaveBeenCalledWith({
				where: { enabled: true },
				orderBy: { name: "asc" },
			});
		});
	});

	describe("getPublicTools", () => {
		it("returns only public and enabled tools", async () => {
			const mockTools = [
				{
					id: "tool-1",
					enabled: true,
					public: true,
					name: "Public Tool",
				},
			];
			mocks.toolFindMany.mockResolvedValueOnce(mockTools);

			const result = await getPublicTools();

			expect(result).toEqual(mockTools);
			expect(mocks.toolFindMany).toHaveBeenCalledWith({
				where: { public: true, enabled: true },
				orderBy: { name: "asc" },
			});
		});
	});

	describe("syncToolsFromConfig", () => {
		it("upserts tools from config", async () => {
			const configTools = [
				{
					slug: "news-analyzer",
					name: "News Analyzer",
					description: "Analyze news",
					icon: "newspaper",
					creditCost: 1,
					enabled: true,
					public: true,
				},
				{
					slug: "bg-remover",
					name: "Background Remover",
					description: "Remove backgrounds",
					icon: "image-minus",
					creditCost: 2,
					creditUnit: "page",
					enabled: false,
					public: true,
				},
			];

			const mockUpsertResults = configTools.map((t, i) => ({
				id: `tool-${i + 1}`,
				...t,
				creditUnit: t.creditUnit ?? "request",
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			mocks.toolUpsert
				.mockResolvedValueOnce(mockUpsertResults[0])
				.mockResolvedValueOnce(mockUpsertResults[1]);

			const result = await syncToolsFromConfig(configTools);

			expect(result).toHaveLength(2);
			expect(mocks.toolUpsert).toHaveBeenCalledTimes(2);

			// Check first upsert call
			expect(mocks.toolUpsert).toHaveBeenCalledWith({
				where: { slug: "news-analyzer" },
				create: {
					slug: "news-analyzer",
					name: "News Analyzer",
					description: "Analyze news",
					icon: "newspaper",
					creditCost: 1,
					creditUnit: "request",
					enabled: true,
					public: true,
				},
				update: {
					name: "News Analyzer",
					description: "Analyze news",
					icon: "newspaper",
					creditCost: 1,
					creditUnit: "request",
					enabled: true,
					public: true,
				},
			});

			// Check second upsert call preserves custom creditUnit
			expect(mocks.toolUpsert).toHaveBeenCalledWith({
				where: { slug: "bg-remover" },
				create: expect.objectContaining({
					creditUnit: "page",
				}),
				update: expect.objectContaining({
					creditUnit: "page",
				}),
			});
		});
	});

	describe("setToolEnabled", () => {
		it("updates tool enabled status", async () => {
			const mockTool = {
				id: "tool-1",
				slug: "news-analyzer",
				enabled: false,
			};
			mocks.toolUpdate.mockResolvedValueOnce(mockTool);

			const result = await setToolEnabled("news-analyzer", false);

			expect(result).toEqual(mockTool);
			expect(mocks.toolUpdate).toHaveBeenCalledWith({
				where: { slug: "news-analyzer" },
				data: { enabled: false },
			});
		});
	});

	describe("getToolIdBySlug", () => {
		it("returns tool id for slug", async () => {
			mocks.toolFindUnique.mockResolvedValueOnce({ id: "tool-1" });

			const result = await getToolIdBySlug("news-analyzer");

			expect(result).toBe("tool-1");
			expect(mocks.toolFindUnique).toHaveBeenCalledWith({
				where: { slug: "news-analyzer" },
				select: { id: true },
			});
		});

		it("returns null when tool not found", async () => {
			mocks.toolFindUnique.mockResolvedValueOnce(null);

			const result = await getToolIdBySlug("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("getToolIdsBySlug", () => {
		it("returns map of slug to id", async () => {
			mocks.toolFindMany.mockResolvedValueOnce([
				{ id: "tool-1", slug: "news-analyzer" },
				{ id: "tool-2", slug: "bg-remover" },
			]);

			const result = await getToolIdsBySlug([
				"news-analyzer",
				"bg-remover",
			]);

			expect(result).toBeInstanceOf(Map);
			expect(result.get("news-analyzer")).toBe("tool-1");
			expect(result.get("bg-remover")).toBe("tool-2");
			expect(mocks.toolFindMany).toHaveBeenCalledWith({
				where: { slug: { in: ["news-analyzer", "bg-remover"] } },
				select: { id: true, slug: true },
			});
		});
	});
});
