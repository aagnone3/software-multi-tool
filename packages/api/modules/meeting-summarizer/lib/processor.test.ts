import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processMeetingJob } from "./processor";

const { mockExecutePrompt, mockParseTranscript } = vi.hoisted(() => ({
	mockExecutePrompt: vi.fn(),
	mockParseTranscript: vi.fn(),
}));

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: mockExecutePrompt,
}));

vi.mock("./transcript-parser", () => ({
	parseTranscript: mockParseTranscript,
	MAX_TRANSCRIPT_SIZE: 5 * 1024 * 1024,
	SUPPORTED_TRANSCRIPT_EXTENSIONS: [".txt", ".docx", ".vtt", ".srt"],
}));

const makeMeetingOutput = () => ({
	summary: {
		title: "Test Meeting",
		date: "2024-01-01",
		duration: "1h",
		attendees: ["Alice", "Bob"],
		overview: "A test meeting.",
	},
	executiveSummary: "Exec summary.",
	topics: [],
	actionItems: [],
	decisions: [],
	keyTakeaways: ["Key point 1"],
	followUpMeeting: {
		recommended: false,
		suggestedAgenda: [],
		suggestedDate: null,
	},
	blockers: [],
	metrics: {
		actionItemCount: 0,
		decisionsCount: 0,
		openQuestionsCount: 0,
		participantEngagement: [],
	},
	exportFormats: {
		markdown: "# Meeting",
		plainText: "Meeting",
		jiraReady: true,
		slackFormatted: ":tada: Meeting",
	},
});

const makeJob = (input: Record<string, unknown>): ToolJob =>
	({ id: "job-1", input }) as unknown as ToolJob;

describe("processMeetingJob", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns error when no meeting notes or transcript provided", async () => {
		const result = await processMeetingJob(makeJob({}));
		expect(result.success).toBe(false);
		expect(result.error).toContain("required");
	});

	it("returns error when meeting notes is empty string", async () => {
		const result = await processMeetingJob(
			makeJob({ meetingNotes: "   " }),
		);
		expect(result.success).toBe(false);
		expect(result.error).toContain("required");
	});

	it("processes plain meeting notes successfully", async () => {
		const output = makeMeetingOutput();
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(output),
		});

		const result = await processMeetingJob(
			makeJob({ meetingNotes: "Discussed project timeline." }),
		);
		expect(result.success).toBe(true);
		expect(
			(result.output as Record<string, unknown>)?.summary,
		).toBeDefined();
	});

	it("returns error when file size exceeds limit", async () => {
		const bigContent = Buffer.alloc(6 * 1024 * 1024).toString("base64");
		const result = await processMeetingJob(
			makeJob({
				transcriptFile: {
					content: bigContent,
					filename: "transcript.txt",
				},
			}),
		);
		expect(result.success).toBe(false);
		expect(result.error).toContain("size");
	});

	it("returns error for unsupported transcript extension", async () => {
		const smallContent = Buffer.from("hello").toString("base64");
		const result = await processMeetingJob(
			makeJob({
				transcriptFile: {
					content: smallContent,
					filename: "transcript.pdf",
				},
			}),
		);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Unsupported file format");
	});

	it("processes transcript file and merges speakers with participants", async () => {
		mockParseTranscript.mockResolvedValue({
			text: "Alice: Hello. Bob: Hi.",
			speakers: ["Alice", "Bob"],
		});
		const output = makeMeetingOutput();
		mockExecutePrompt.mockResolvedValue({
			content: JSON.stringify(output),
		});

		const result = await processMeetingJob(
			makeJob({
				transcriptFile: {
					content: Buffer.from("hello").toString("base64"),
					filename: "meeting.txt",
				},
				participants: ["Carol"],
			}),
		);
		expect(result.success).toBe(true);
		const callArg = mockExecutePrompt.mock.calls[0][0] as string;
		expect(callArg).toContain("Carol");
	});

	it("returns error when transcript parsing fails", async () => {
		mockParseTranscript.mockRejectedValue(new Error("Parse failed"));
		const result = await processMeetingJob(
			makeJob({
				transcriptFile: {
					content: Buffer.from("hello").toString("base64"),
					filename: "meeting.txt",
				},
			}),
		);
		expect(result.success).toBe(false);
		expect(result.error).toBe("Parse failed");
	});

	it("returns error when LLM call fails", async () => {
		mockExecutePrompt.mockRejectedValue(new Error("LLM error"));
		const result = await processMeetingJob(
			makeJob({ meetingNotes: "Test notes" }),
		);
		expect(result.success).toBe(false);
		expect(result.error).toBe("LLM error");
	});

	it("returns error when LLM returns invalid JSON", async () => {
		mockExecutePrompt.mockResolvedValue({ content: "not json" });
		const result = await processMeetingJob(
			makeJob({ meetingNotes: "Test notes" }),
		);
		expect(result.success).toBe(false);
	});
});
