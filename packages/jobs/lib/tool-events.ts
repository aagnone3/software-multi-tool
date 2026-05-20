/**
 * Map of tool slug → Inngest event name for that tool's background processor.
 *
 * Adding a new tool: define its event name here AND register a function in
 * apps/web/inngest/functions/<tool>.ts that listens for the same event name.
 */
export const TOOL_JOB_EVENTS = {
	"news-analyzer": "jobs/news-analyzer.requested",
	"speaker-separation": "jobs/speaker-separation.requested",
	"invoice-processor": "jobs/invoice-processor.requested",
	"contract-analyzer": "jobs/contract-analyzer.requested",
	"feedback-analyzer": "jobs/feedback-analyzer.requested",
	"expense-categorizer": "jobs/expense-categorizer.requested",
	"meeting-summarizer": "jobs/meeting-summarizer.requested",
	"gdpr-exporter": "jobs/gdpr-exporter.requested",
} as const;

export type ToolSlug = keyof typeof TOOL_JOB_EVENTS;
export type ToolJobEventName = (typeof TOOL_JOB_EVENTS)[ToolSlug];

export function isKnownToolSlug(slug: string): slug is ToolSlug {
	return slug in TOOL_JOB_EVENTS;
}
