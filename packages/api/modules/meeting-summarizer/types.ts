import { z } from "zod";

/**
 * Schema for uploaded transcript file metadata.
 */
export const TranscriptFileSchema = z.object({
	/** Base64-encoded file content */
	content: z.string(),
	/** Original filename with extension */
	filename: z.string(),
	/** MIME type of the file */
	mimeType: z.string().optional(),
});

export type TranscriptFile = z.infer<typeof TranscriptFileSchema>;

export const MeetingSummarizerInputSchema = z
	.object({
		/** Raw meeting notes text (required if no transcriptFile) */
		meetingNotes: z.string().optional(),
		/** Uploaded transcript file (required if no meetingNotes) */
		transcriptFile: TranscriptFileSchema.optional(),
		meetingType: z
			.enum([
				"standup",
				"planning",
				"retrospective",
				"one_on_one",
				"client",
				"general",
			])
			.optional()
			.default("general"),
		participants: z.array(z.string()).optional(),
		meetingDate: z.string().optional(),
		projectContext: z.string().optional(),
	})
	.refine((data) => data.meetingNotes || data.transcriptFile, {
		message: "Either meeting notes or a transcript file is required",
		path: ["meetingNotes"],
	});

export type MeetingSummarizerInput = z.infer<
	typeof MeetingSummarizerInputSchema
>;

export const ActionItemSchema = z.object({
	id: z.string(),
	task: z.string(),
	assignee: z.string().nullable(),
	dueDate: z.string().nullable(),
	priority: z.enum(["low", "medium", "high", "urgent"]),
	status: z.enum(["pending", "in_progress", "completed", "blocked"]),
	context: z.string().nullable(),
	dependencies: z.array(z.string()),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

export const DecisionSchema = z.object({
	decision: z.string(),
	rationale: z.string().nullable(),
	madeBy: z.string().nullable(),
	impactAreas: z.array(z.string()),
	followUpRequired: z.boolean(),
});

export type Decision = z.infer<typeof DecisionSchema>;

export const DiscussionTopicSchema = z.object({
	topic: z.string(),
	summary: z.string(),
	keyPoints: z.array(z.string()),
	participants: z.array(z.string()),
	outcome: z.string().nullable(),
	openQuestions: z.array(z.string()),
});

export type DiscussionTopic = z.infer<typeof DiscussionTopicSchema>;

export const MeetingSummarizerOutputSchema = z.object({
	summary: z.object({
		title: z.string(),
		date: z.string().nullable(),
		duration: z.string().nullable(),
		attendees: z.array(z.string()),
		overview: z.string(),
	}),
	executiveSummary: z.string(),
	topics: z.array(DiscussionTopicSchema),
	actionItems: z.array(ActionItemSchema),
	decisions: z.array(DecisionSchema),
	keyTakeaways: z.array(z.string()),
	followUpMeeting: z.object({
		recommended: z.boolean(),
		suggestedAgenda: z.array(z.string()),
		suggestedDate: z.string().nullable(),
	}),
	blockers: z.array(
		z.object({
			blocker: z.string(),
			owner: z.string().nullable(),
			suggestedResolution: z.string().nullable(),
		}),
	),
	metrics: z.object({
		actionItemCount: z.number(),
		decisionsCount: z.number(),
		openQuestionsCount: z.number(),
		participantEngagement: z.array(
			z.object({
				participant: z.string(),
				contributionLevel: z.enum(["low", "medium", "high"]),
				actionItemsAssigned: z.number(),
			}),
		),
	}),
	exportFormats: z.object({
		markdown: z.string(),
		plainText: z.string(),
		jiraReady: z.boolean(),
		slackFormatted: z.string(),
	}),
});

export type MeetingSummarizerOutput = z.infer<
	typeof MeetingSummarizerOutputSchema
>;
