import type { ToolJob } from "@repo/database/prisma/generated/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processContractJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

describe("Contract Analyzer", () => {
	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "contract-analyzer",
		status: "PROCESSING",
		priority: 0,
		input: {
			contractText: `
				SERVICE AGREEMENT

				This Service Agreement ("Agreement") is entered into as of January 1, 2024
				by and between:

				PROVIDER: ABC Technologies Inc.
				CLIENT: XYZ Corporation

				1. SERVICES
				Provider agrees to deliver software development services.

				2. TERM
				This Agreement shall commence on January 1, 2024 and continue for 12 months.

				3. COMPENSATION
				Client shall pay Provider $10,000 per month.

				4. TERMINATION
				Either party may terminate with 30 days written notice.

				5. CONFIDENTIALITY
				All information shared shall remain confidential for 2 years.

				6. GOVERNING LAW
				This Agreement shall be governed by the laws of California.
			`,
			analysisDepth: "standard",
		},
		output: null,
		error: null,
		userId: "user-123",
		sessionId: null,
		attempts: 1,
		maxAttempts: 3,
		startedAt: new Date(),
		completedAt: null,
		processAfter: null,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAIResponse = {
		summary: {
			contractType: "Service Agreement",
			parties: [
				{ name: "ABC Technologies Inc.", role: "Service Provider" },
				{ name: "XYZ Corporation", role: "Client" },
			],
			effectiveDate: "2024-01-01",
			expirationDate: "2024-12-31",
			governingLaw: "California",
			overview:
				"A 12-month software development service agreement with monthly compensation.",
		},
		keyTerms: [
			{
				term: "Services",
				definition: "Software development services",
				section: "1",
			},
		],
		financialTerms: {
			totalValue: 120000,
			currency: "USD",
			paymentSchedule: "Monthly",
			penalties: [],
		},
		obligations: [
			{
				party: "Provider",
				description: "Deliver software development services",
				deadline: null,
				isRecurring: true,
				frequency: "Monthly",
			},
			{
				party: "Client",
				description: "Pay $10,000 per month",
				deadline: null,
				isRecurring: true,
				frequency: "Monthly",
			},
		],
		risks: [
			{
				category: "Termination",
				description:
					"Short notice period may not be sufficient for transition",
				severity: "medium",
				clause: "30 days written notice",
				recommendation:
					"Consider extending to 60-90 days for complex projects",
			},
		],
		termination: {
			noticePeriod: "30 days",
			terminationClauses: ["Written notice by either party"],
			autoRenewal: null,
			renewalTerms: null,
		},
		intellectualProperty: {
			ownership: null,
			licenses: [],
			restrictions: [],
		},
		confidentiality: {
			hasNDA: true,
			duration: "2 years",
			scope: "All information shared",
		},
		disputeResolution: {
			method: null,
			venue: "California",
			arbitrationRules: null,
		},
		overallRiskScore: 35,
		recommendations: [
			"Add IP ownership clause",
			"Include dispute resolution mechanism",
			"Extend termination notice period",
		],
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("successfully analyzes contract", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 500, outputTokens: 1000 },
			stopReason: "end_turn",
		});

		const result = await processContractJob(mockJob);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();
		const output = result.output as typeof mockAIResponse;
		expect(output.summary.contractType).toBe("Service Agreement");
		expect(output.summary.parties).toHaveLength(2);
		expect(output.risks).toHaveLength(1);
		expect(output.overallRiskScore).toBe(35);
	});

	it("returns error when contract text is empty", async () => {
		const emptyJob = {
			...mockJob,
			input: { contractText: "" },
		};

		const result = await processContractJob(emptyJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Contract text is required");
	});

	it("handles AI response parsing errors", async () => {
		executePromptMock.mockResolvedValue({
			content: "Not valid JSON",
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 500, outputTokens: 100 },
			stopReason: "end_turn",
		});

		const result = await processContractJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("handles AI service errors", async () => {
		executePromptMock.mockRejectedValue(new Error("Service unavailable"));

		const result = await processContractJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Service unavailable");
	});

	it("provides default values for missing fields", async () => {
		const partialResponse = {
			summary: {
				contractType: "NDA",
				overview: "A simple NDA",
			},
			overallRiskScore: 20,
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(partialResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 500, outputTokens: 200 },
			stopReason: "end_turn",
		});

		const result = await processContractJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as typeof mockAIResponse;
		expect(output.summary.contractType).toBe("NDA");
		expect(output.summary.parties).toEqual([]);
		expect(output.obligations).toEqual([]);
		expect(output.risks).toEqual([]);
	});
});
