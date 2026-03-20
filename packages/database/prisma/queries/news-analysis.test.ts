import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	newsAnalysisCreate: vi.fn(),
	newsAnalysisFindUnique: vi.fn(),
	newsAnalysisCount: vi.fn(),
	toolJobUpdate: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		$transaction: mocks.transaction,
		newsAnalysis: {
			findUnique: mocks.newsAnalysisFindUnique,
			count: mocks.newsAnalysisCount,
		},
	},
}));

import {
	createNewsAnalysis,
	getNewsAnalysisById,
	getNewsAnalysisByIdWithOrg,
	newsAnalysisExists,
} from "./news-analysis";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createNewsAnalysis", () => {
	it("creates analysis without linking to a job", async () => {
		const analysis = { id: "na1", analysis: {} };
		mocks.transaction.mockImplementationOnce(
			async (fn: (tx: unknown) => Promise<unknown>) => {
				const tx = {
					newsAnalysis: {
						create: vi.fn().mockResolvedValueOnce(analysis),
					},
					toolJob: { update: mocks.toolJobUpdate },
				};
				return fn(tx);
			},
		);
		const result = await createNewsAnalysis({
			analysis: { foo: "bar" },
			userId: "u1",
		});
		expect(result).toBe(analysis);
		expect(mocks.toolJobUpdate).not.toHaveBeenCalled();
	});

	it("creates analysis and links to toolJob when jobId provided", async () => {
		const analysis = { id: "na2", analysis: {} };
		mocks.transaction.mockImplementationOnce(
			async (fn: (tx: unknown) => Promise<unknown>) => {
				const tx = {
					newsAnalysis: {
						create: vi.fn().mockResolvedValueOnce(analysis),
					},
					toolJob: { update: mocks.toolJobUpdate },
				};
				return fn(tx);
			},
		);
		await createNewsAnalysis({ analysis: { foo: "bar" } }, "job1");
		expect(mocks.toolJobUpdate).toHaveBeenCalledWith({
			where: { id: "job1" },
			data: { newsAnalysisId: "na2" },
		});
	});

	it("passes all input fields to create", async () => {
		const createFn = vi.fn().mockResolvedValueOnce({ id: "na3" });
		mocks.transaction.mockImplementationOnce(
			async (fn: (tx: unknown) => Promise<unknown>) => {
				return fn({
					newsAnalysis: { create: createFn },
					toolJob: { update: vi.fn() },
				});
			},
		);
		await createNewsAnalysis({
			analysis: {},
			sourceUrl: "https://example.com",
			sourceText: "text",
			title: "My title",
			userId: "u1",
			organizationId: "org1",
		});
		expect(createFn).toHaveBeenCalledWith({
			data: expect.objectContaining({
				sourceUrl: "https://example.com",
				sourceText: "text",
				title: "My title",
				userId: "u1",
				organizationId: "org1",
			}),
		});
	});
});

describe("getNewsAnalysisById", () => {
	it("returns analysis with user include", async () => {
		const record = { id: "na1", user: { name: "Alice" } };
		mocks.newsAnalysisFindUnique.mockResolvedValueOnce(record);
		const result = await getNewsAnalysisById("na1");
		expect(result).toBe(record);
		expect(mocks.newsAnalysisFindUnique).toHaveBeenCalledWith({
			where: { id: "na1" },
			include: { user: { select: { name: true } } },
		});
	});

	it("returns null when not found", async () => {
		mocks.newsAnalysisFindUnique.mockResolvedValueOnce(null);
		const result = await getNewsAnalysisById("missing");
		expect(result).toBeNull();
	});
});

describe("getNewsAnalysisByIdWithOrg", () => {
	it("returns analysis with organization include", async () => {
		const record = {
			id: "na1",
			organization: { name: "Org", slug: "org" },
		};
		mocks.newsAnalysisFindUnique.mockResolvedValueOnce(record);
		const result = await getNewsAnalysisByIdWithOrg("na1");
		expect(result).toBe(record);
		expect(mocks.newsAnalysisFindUnique).toHaveBeenCalledWith({
			where: { id: "na1" },
			include: {
				organization: { select: { name: true, slug: true } },
				user: { select: { name: true } },
			},
		});
	});
});

describe("newsAnalysisExists", () => {
	it("returns true when count > 0", async () => {
		mocks.newsAnalysisCount.mockResolvedValueOnce(1);
		const result = await newsAnalysisExists("na1");
		expect(result).toBe(true);
	});

	it("returns false when count is 0", async () => {
		mocks.newsAnalysisCount.mockResolvedValueOnce(0);
		const result = await newsAnalysisExists("missing");
		expect(result).toBe(false);
	});
});
