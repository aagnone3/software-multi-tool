import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processContractJob } from "./processor";

const { mockExecutePrompt, mockExtractTextFromDocument } = vi.hoisted(() => ({
	mockExecutePrompt: vi.fn(),
	mockExtractTextFromDocument: vi.fn(),
}));

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: mockExecutePrompt,
}));

vi.mock("./document-extractor", () => ({
	extractTextFromDocument: mockExtractTextFromDocument,
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const makeJob = (input: unknown): ToolJob =>
	({
		id: "job-1",
		input,
	}) as ToolJob;

const makeAnalysisOutput = () => ({
	summary: {
		contractType: "Service Agreement",
		parties: [{ name: "ACME", role: "Provider" }],
		effectiveDate: "2024-01-01",
		expirationDate: "2025-01-01",
		governingLaw: "California",
		overview: "A service agreement.",
	},
	keyTerms: [],
	financialTerms: {
		totalValue: 10000,
		currency: "USD",
		paymentSchedule: "Monthly",
		penalties: [],
	},
	obligations: [],
	risks: [],
	termination: {
		noticePeriod: "30 days",
		terminationClauses: [],
		autoRenewal: false,
		renewalTerms: null,
	},
	intellectualProperty: {
		ownership: "Client",
		licenses: [],
		restrictions: [],
	},
	confidentiality: {
		hasNDA: true,
		duration: "2 years",
		scope: "All information",
	},
	disputeResolution: {
		method: "Arbitration",
		venue: "San Francisco",
		arbitrationRules: "AAA",
	},
	overallRiskScore: 30,
	recommendations: ["Review IP clause"],
});

describe("processContractJob", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns error when no input provided", async () => {
		const job = makeJob({});
		const result = await processContractJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("required");
	});

	it("returns error when contractText is empty/whitespace", async () => {
		const job = makeJob({ contractText: "   " });
		const result = await processContractJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("required");
	});

	it("processes direct contractText successfully", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeAnalysisOutput()),
		});
		const job = makeJob({ contractText: "This is a contract." });
		const result = await processContractJob(job);
		expect(result.success).toBe(true);
		expect(result.output).toBeTruthy();
	});

	it("returns error when file extraction fails", async () => {
		mockExtractTextFromDocument.mockResolvedValue({
			success: false,
			error: { message: "Could not extract text" },
		});
		const job = makeJob({
			fileData: {
				content: Buffer.from("fake").toString("base64"),
				mimeType: "application/pdf",
				filename: "contract.pdf",
			},
		});
		const result = await processContractJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toBe("Could not extract text");
	});

	it("processes file upload successfully", async () => {
		mockExtractTextFromDocument.mockResolvedValue({
			success: true,
			text: "Contract content here.",
		});
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(makeAnalysisOutput()),
		});
		const job = makeJob({
			fileData: {
				content: Buffer.from("fake").toString("base64"),
				mimeType: "application/pdf",
				filename: "contract.pdf",
			},
		});
		const result = await processContractJob(job);
		expect(result.success).toBe(true);
	});

	it("returns error when LLM call fails", async () => {
		mockExecutePrompt.mockRejectedValue(new Error("LLM unavailable"));
		const job = makeJob({ contractText: "This is a contract." });
		const result = await processContractJob(job);
		expect(result.success).toBe(false);
		expect(result.error).toContain("LLM unavailable");
	});

	it("returns error when LLM returns invalid JSON", async () => {
		mockExecutePrompt.mockResolvedValue({ content: "not json" });
		const job = makeJob({ contractText: "This is a contract." });
		const result = await processContractJob(job);
		expect(result.success).toBe(false);
	});

	it("fills in null defaults for missing fields in output", async () => {
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify({}),
		});
		const job = makeJob({ contractText: "Minimal contract." });
		const result = await processContractJob(job);
		expect(result.success).toBe(true);
		const out = result.output as { overallRiskScore: number };
		expect(out.overallRiskScore).toBe(50);
	});
});
