import { executePrompt } from "@repo/agent-sdk";
import type { Prisma, ToolJob } from "@repo/database/prisma/generated/client";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type { MeetingSummarizerInput, MeetingSummarizerOutput } from "../types";

const MEETING_SUMMARIZATION_PROMPT = `You are an expert meeting summarizer. Analyze the following meeting notes and extract a structured summary with action items.

IMPORTANT: Return ONLY valid JSON with no additional text or explanation. The JSON must conform exactly to this schema:

{
  "summary": {
    "title": "string (descriptive meeting title)",
    "date": "string (YYYY-MM-DD) or null",
    "duration": "string or null",
    "attendees": ["array of participant names"],
    "overview": "string (2-3 sentence overview)"
  },
  "executiveSummary": "string (comprehensive 1 paragraph summary for executives)",
  "topics": [
    {
      "topic": "string",
      "summary": "string",
      "keyPoints": ["array of key points"],
      "participants": ["array of contributors"],
      "outcome": "string or null",
      "openQuestions": ["array of unresolved questions"]
    }
  ],
  "actionItems": [
    {
      "id": "string (unique identifier like AI-001)",
      "task": "string (clear, actionable task description)",
      "assignee": "string or null",
      "dueDate": "string (YYYY-MM-DD) or null",
      "priority": "low | medium | high | urgent",
      "status": "pending",
      "context": "string or null",
      "dependencies": ["array of other action item IDs if dependent"]
    }
  ],
  "decisions": [
    {
      "decision": "string",
      "rationale": "string or null",
      "madeBy": "string or null",
      "impactAreas": ["array of impacted areas"],
      "followUpRequired": "boolean"
    }
  ],
  "keyTakeaways": ["array of main takeaways"],
  "followUpMeeting": {
    "recommended": "boolean",
    "suggestedAgenda": ["array of agenda items for follow-up"],
    "suggestedDate": "string or null"
  },
  "blockers": [
    {
      "blocker": "string",
      "owner": "string or null",
      "suggestedResolution": "string or null"
    }
  ],
  "metrics": {
    "actionItemCount": "number",
    "decisionsCount": "number",
    "openQuestionsCount": "number",
    "participantEngagement": [
      {
        "participant": "string",
        "contributionLevel": "low | medium | high",
        "actionItemsAssigned": "number"
      }
    ]
  },
  "exportFormats": {
    "markdown": "string (full markdown formatted summary)",
    "plainText": "string (plain text summary)",
    "jiraReady": true,
    "slackFormatted": "string (Slack-formatted summary with emojis)"
  }
}

Guidelines:
- Extract ALL action items mentioned, even implicit ones
- Identify who is responsible for each action item
- Note any blockers or dependencies mentioned
- Capture decisions made and their context
- Identify unresolved questions that need follow-up
- Create actionable, specific task descriptions
- Estimate priorities based on urgency indicators in the discussion

Meeting notes to summarize:
`;

export async function processMeetingJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as MeetingSummarizerInput;

	if (!input.meetingNotes || input.meetingNotes.trim().length === 0) {
		return {
			success: false,
			error: "Meeting notes are required",
		};
	}

	const contextInfo = [
		input.meetingType && `Meeting Type: ${input.meetingType}`,
		input.participants?.length &&
			`Participants: ${input.participants.join(", ")}`,
		input.meetingDate && `Date: ${input.meetingDate}`,
		input.projectContext && `Project Context: ${input.projectContext}`,
	]
		.filter(Boolean)
		.join("\n");

	try {
		const result = await executePrompt(
			`${MEETING_SUMMARIZATION_PROMPT}\n\n${contextInfo ? `Context:\n${contextInfo}\n\n` : ""}${input.meetingNotes}`,
			{
				model: "claude-3-5-sonnet-20241022",
				maxTokens: 8192,
				temperature: 0.2,
				system: "You are an expert meeting summarizer. Output only valid JSON. Focus on extracting actionable items.",
			},
		);

		const summaryData = JSON.parse(
			result.content,
		) as MeetingSummarizerOutput;

		const output: MeetingSummarizerOutput = {
			summary: {
				title: summaryData.summary?.title ?? "Meeting Summary",
				date: summaryData.summary?.date ?? input.meetingDate ?? null,
				duration: summaryData.summary?.duration ?? null,
				attendees:
					summaryData.summary?.attendees ?? input.participants ?? [],
				overview: summaryData.summary?.overview ?? "",
			},
			executiveSummary: summaryData.executiveSummary ?? "",
			topics: summaryData.topics ?? [],
			actionItems: summaryData.actionItems ?? [],
			decisions: summaryData.decisions ?? [],
			keyTakeaways: summaryData.keyTakeaways ?? [],
			followUpMeeting: {
				recommended: summaryData.followUpMeeting?.recommended ?? false,
				suggestedAgenda:
					summaryData.followUpMeeting?.suggestedAgenda ?? [],
				suggestedDate:
					summaryData.followUpMeeting?.suggestedDate ?? null,
			},
			blockers: summaryData.blockers ?? [],
			metrics: {
				actionItemCount: summaryData.actionItems?.length ?? 0,
				decisionsCount: summaryData.decisions?.length ?? 0,
				openQuestionsCount:
					summaryData.topics?.reduce(
						(sum, t) => sum + (t.openQuestions?.length ?? 0),
						0,
					) ?? 0,
				participantEngagement:
					summaryData.metrics?.participantEngagement ?? [],
			},
			exportFormats: {
				markdown: summaryData.exportFormats?.markdown ?? "",
				plainText: summaryData.exportFormats?.plainText ?? "",
				jiraReady: true,
				slackFormatted: summaryData.exportFormats?.slackFormatted ?? "",
			},
		};

		return {
			success: true,
			output: output as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to summarize meeting";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
