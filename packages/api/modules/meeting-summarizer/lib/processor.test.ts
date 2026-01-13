import type { ToolJob } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processMeetingJob } from "./processor";

const executePromptMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/agent-sdk", () => ({
	executePrompt: executePromptMock,
}));

describe("Meeting Summarizer", () => {
	const mockJob: ToolJob = {
		id: "job-123",
		toolSlug: "meeting-summarizer",
		status: "PROCESSING",
		priority: 0,
		input: {
			meetingNotes: `
				Sprint Planning Meeting
				Date: January 15, 2024
				Attendees: John, Sarah, Mike, Lisa

				Discussion:
				- John presented the new feature requirements for the dashboard
				- Sarah raised concerns about the timeline, suggested we need 2 more sprints
				- Mike volunteered to lead the backend implementation
				- Lisa will handle the UI/UX design

				Decisions:
				- We will use React for the frontend
				- Backend will be in Python
				- Timeline extended to 3 sprints

				Action Items:
				- John to create detailed specs by Friday
				- Mike to set up the dev environment by Monday
				- Sarah to schedule follow-up meeting
				- Lisa to prepare wireframes by end of week

				Blockers:
				- Need access to production database for Mike
			`,
			meetingType: "planning",
			participants: ["John", "Sarah", "Mike", "Lisa"],
			meetingDate: "2024-01-15",
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
			title: "Sprint Planning Meeting - Dashboard Feature",
			date: "2024-01-15",
			duration: null,
			attendees: ["John", "Sarah", "Mike", "Lisa"],
			overview:
				"Planning meeting for new dashboard feature with timeline discussion and role assignments.",
		},
		executiveSummary:
			"The team met to plan the new dashboard feature. Timeline was extended from 1 to 3 sprints based on complexity concerns. Clear ownership assigned for backend (Mike), frontend/UX (Lisa), and specs (John).",
		topics: [
			{
				topic: "Feature Requirements",
				summary: "John presented dashboard requirements",
				keyPoints: [
					"New dashboard feature",
					"Multiple components needed",
				],
				participants: ["John"],
				outcome: "Requirements understood by team",
				openQuestions: [],
			},
			{
				topic: "Timeline Discussion",
				summary: "Sarah raised concerns about original timeline",
				keyPoints: [
					"Original timeline insufficient",
					"Extended to 3 sprints",
				],
				participants: ["Sarah"],
				outcome: "Timeline extended",
				openQuestions: [],
			},
		],
		actionItems: [
			{
				id: "AI-001",
				task: "Create detailed specifications",
				assignee: "John",
				dueDate: "2024-01-19",
				priority: "high",
				status: "pending",
				context: "Foundation for development work",
				dependencies: [],
			},
			{
				id: "AI-002",
				task: "Set up development environment",
				assignee: "Mike",
				dueDate: "2024-01-22",
				priority: "high",
				status: "pending",
				context: null,
				dependencies: [],
			},
			{
				id: "AI-003",
				task: "Schedule follow-up meeting",
				assignee: "Sarah",
				dueDate: null,
				priority: "medium",
				status: "pending",
				context: null,
				dependencies: [],
			},
			{
				id: "AI-004",
				task: "Prepare wireframes",
				assignee: "Lisa",
				dueDate: "2024-01-19",
				priority: "high",
				status: "pending",
				context: null,
				dependencies: [],
			},
		],
		decisions: [
			{
				decision: "Use React for frontend",
				rationale: null,
				madeBy: null,
				impactAreas: ["Frontend Development"],
				followUpRequired: false,
			},
			{
				decision: "Use Python for backend",
				rationale: null,
				madeBy: null,
				impactAreas: ["Backend Development"],
				followUpRequired: false,
			},
			{
				decision: "Extend timeline to 3 sprints",
				rationale: "Complexity concerns raised by Sarah",
				madeBy: null,
				impactAreas: ["Project Timeline"],
				followUpRequired: false,
			},
		],
		keyTakeaways: [
			"Dashboard feature approved for development",
			"3 sprint timeline agreed upon",
			"Clear role assignments made",
			"Database access blocker needs resolution",
		],
		followUpMeeting: {
			recommended: true,
			suggestedAgenda: [
				"Review specs progress",
				"Wireframe feedback",
				"Resolve database access",
			],
			suggestedDate: null,
		},
		blockers: [
			{
				blocker: "Production database access for Mike",
				owner: "Mike",
				suggestedResolution: "Request access through IT support",
			},
		],
		metrics: {
			actionItemCount: 4,
			decisionsCount: 3,
			openQuestionsCount: 0,
			participantEngagement: [
				{
					participant: "John",
					contributionLevel: "high",
					actionItemsAssigned: 1,
				},
				{
					participant: "Sarah",
					contributionLevel: "medium",
					actionItemsAssigned: 1,
				},
				{
					participant: "Mike",
					contributionLevel: "medium",
					actionItemsAssigned: 1,
				},
				{
					participant: "Lisa",
					contributionLevel: "medium",
					actionItemsAssigned: 1,
				},
			],
		},
		exportFormats: {
			markdown: "# Sprint Planning Meeting\n...",
			plainText: "Sprint Planning Meeting...",
			jiraReady: true,
			slackFormatted: ":memo: *Sprint Planning Meeting*\n...",
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("successfully summarizes meeting notes", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 600, outputTokens: 1500 },
			stopReason: "end_turn",
		});

		const result = await processMeetingJob(mockJob);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();
		const output = result.output as typeof mockAIResponse;
		expect(output.summary.title).toBe(
			"Sprint Planning Meeting - Dashboard Feature",
		);
		expect(output.actionItems).toHaveLength(4);
		expect(output.decisions).toHaveLength(3);
		expect(output.blockers).toHaveLength(1);
	});

	it("returns error when meeting notes are empty", async () => {
		const emptyJob = {
			...mockJob,
			input: { meetingNotes: "" },
		};

		const result = await processMeetingJob(emptyJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe(
			"Either meeting notes or a transcript file is required",
		);
	});

	it("returns error when meeting notes are whitespace only", async () => {
		const whitespaceJob = {
			...mockJob,
			input: { meetingNotes: "   " },
		};

		const result = await processMeetingJob(whitespaceJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe(
			"Either meeting notes or a transcript file is required",
		);
	});

	it("includes context info in prompt", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 600, outputTokens: 1500 },
			stopReason: "end_turn",
		});

		await processMeetingJob(mockJob);

		expect(executePromptMock).toHaveBeenCalledWith(
			expect.stringContaining("planning"),
			expect.any(Object),
		);
		expect(executePromptMock).toHaveBeenCalledWith(
			expect.stringContaining("John, Sarah, Mike, Lisa"),
			expect.any(Object),
		);
	});

	it("handles AI response parsing errors", async () => {
		executePromptMock.mockResolvedValue({
			content: "Not valid JSON",
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 600, outputTokens: 100 },
			stopReason: "end_turn",
		});

		const result = await processMeetingJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("handles AI service errors", async () => {
		executePromptMock.mockRejectedValue(new Error("Rate limit exceeded"));

		const result = await processMeetingJob(mockJob);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Rate limit exceeded");
	});

	it("provides default values for missing fields", async () => {
		const partialResponse = {
			summary: {
				title: "Quick Sync",
				overview: "Brief sync meeting",
			},
			executiveSummary: "Quick sync",
			actionItems: [],
		};

		executePromptMock.mockResolvedValue({
			content: JSON.stringify(partialResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 600, outputTokens: 300 },
			stopReason: "end_turn",
		});

		const result = await processMeetingJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as typeof mockAIResponse;
		expect(output.summary.title).toBe("Quick Sync");
		expect(output.summary.attendees).toEqual([
			"John",
			"Sarah",
			"Mike",
			"Lisa",
		]);
		expect(output.decisions).toEqual([]);
		expect(output.metrics.actionItemCount).toBe(0);
	});

	it("calculates metrics correctly from response", async () => {
		executePromptMock.mockResolvedValue({
			content: JSON.stringify(mockAIResponse),
			model: "claude-3-5-sonnet-20241022",
			usage: { inputTokens: 600, outputTokens: 1500 },
			stopReason: "end_turn",
		});

		const result = await processMeetingJob(mockJob);

		expect(result.success).toBe(true);
		const output = result.output as typeof mockAIResponse;
		expect(output.metrics.actionItemCount).toBe(4);
		expect(output.metrics.decisionsCount).toBe(3);
	});
});
