import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shareRouter } from "./router";

// Mock dependencies
const getNewsAnalysisByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@repo/database")>();
	return {
		...actual,
		getNewsAnalysisById: getNewsAnalysisByIdMock,
	};
});

describe("Share Router", () => {
	// Use valid CUID format for test IDs
	const TEST_ANALYSIS_ID = "clz1234567890abcdefghij";
	const TEST_USER_ID = "clu1234567890abcdefghij";
	const TEST_ORG_ID = "clo1234567890abcdefghij";

	const mockAnalysis = {
		id: TEST_ANALYSIS_ID,
		organizationId: TEST_ORG_ID,
		userId: TEST_USER_ID,
		sourceUrl: "https://example.com/news-article",
		sourceText: null,
		title: "Test Article Analysis",
		analysis: {
			summary: ["Point 1", "Point 2"],
			bias: {
				politicalLean: "Center",
				sensationalism: 3,
				factualRating: "High",
			},
			entities: {
				people: ["John Doe"],
				organizations: ["Example Corp"],
				places: ["New York"],
			},
			sentiment: "Neutral",
		},
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-01T00:00:00Z"),
		user: {
			name: "Test User",
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("share.getNewsAnalysis", () => {
		const createClient = () =>
			createProcedureClient(shareRouter.getNewsAnalysis, {
				context: {
					headers: new Headers(),
				},
			});

		it("returns analysis for valid ID", async () => {
			getNewsAnalysisByIdMock.mockResolvedValue(mockAnalysis);

			const client = createClient();
			const result = await client({ analysisId: TEST_ANALYSIS_ID });

			expect(result).toEqual({
				analysis: {
					id: TEST_ANALYSIS_ID,
					title: "Test Article Analysis",
					sourceUrl: "https://example.com/news-article",
					sourceText: null,
					analysis: mockAnalysis.analysis,
					createdAt: mockAnalysis.createdAt,
					createdBy: "Test User",
				},
			});
		});

		it("returns 'Anonymous' when user name is not available", async () => {
			const analysisWithoutUser = {
				...mockAnalysis,
				user: null,
			};
			getNewsAnalysisByIdMock.mockResolvedValue(analysisWithoutUser);

			const client = createClient();
			const result = await client({ analysisId: TEST_ANALYSIS_ID });

			expect(result.analysis.createdBy).toBe("Anonymous");
		});

		it("throws NOT_FOUND when analysis does not exist", async () => {
			getNewsAnalysisByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({ analysisId: "cln9999999999abcdefghij" }),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("does not require authentication", async () => {
			getNewsAnalysisByIdMock.mockResolvedValue(mockAnalysis);

			// Create client with no auth headers
			const client = createProcedureClient(shareRouter.getNewsAnalysis, {
				context: {
					headers: new Headers(),
				},
			});

			const result = await client({ analysisId: TEST_ANALYSIS_ID });

			expect(result).toBeDefined();
			expect(result.analysis).toBeDefined();
		});

		it("returns analysis with text source instead of URL", async () => {
			const analysisWithText = {
				...mockAnalysis,
				sourceUrl: null,
				sourceText: "This is the article text content...",
			};
			getNewsAnalysisByIdMock.mockResolvedValue(analysisWithText);

			const client = createClient();
			const result = await client({ analysisId: TEST_ANALYSIS_ID });

			expect(result.analysis.sourceUrl).toBeNull();
			expect(result.analysis.sourceText).toBe(
				"This is the article text content...",
			);
		});

		it("validates analysisId is required", async () => {
			const client = createClient();

			await expect(
				// @ts-expect-error - testing runtime validation
				client({}),
			).rejects.toThrow();
		});

		it("validates analysisId is not empty", async () => {
			const client = createClient();

			await expect(client({ analysisId: "" })).rejects.toThrow();
		});
	});
});
