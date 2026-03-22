import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getNewsAnalysisByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	getNewsAnalysisById: getNewsAnalysisByIdMock,
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

import { shareRouter } from "./router";

describe("Share Router", () => {
	const client = createProcedureClient(shareRouter.getNewsAnalysis);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns analysis data when found", async () => {
		const mockAnalysis = {
			id: "analysis-1",
			title: "Test Analysis",
			sourceUrl: "https://example.com",
			sourceText: "Some source text",
			analysis: { summary: "summary" },
			createdAt: new Date("2024-01-01"),
			user: { name: "Alice" },
		};
		getNewsAnalysisByIdMock.mockResolvedValue(mockAnalysis);

		const result = await client({ analysisId: "analysis-1" });

		expect(result.analysis.id).toBe("analysis-1");
		expect(result.analysis.title).toBe("Test Analysis");
		expect(result.analysis.createdBy).toBe("Alice");
	});

	it("returns Anonymous when user is null", async () => {
		const mockAnalysis = {
			id: "analysis-1",
			title: "Test",
			sourceUrl: "https://example.com",
			sourceText: "text",
			analysis: {},
			createdAt: new Date(),
			user: null,
		};
		getNewsAnalysisByIdMock.mockResolvedValue(mockAnalysis);

		const result = await client({ analysisId: "analysis-1" });

		expect(result.analysis.createdBy).toBe("Anonymous");
	});

	it("throws NOT_FOUND when analysis does not exist", async () => {
		getNewsAnalysisByIdMock.mockResolvedValue(null);

		await expect(client({ analysisId: "missing" })).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});
