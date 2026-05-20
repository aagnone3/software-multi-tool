import { EventSchemas, Inngest } from "inngest";

/**
 * Inngest client for background job processing.
 *
 * Events follow the pattern: "jobs/<tool-slug>.requested".
 * The receiving function is wired up in apps/web/inngest/functions/<tool>.ts.
 *
 * Dispatch is centralized in `dispatchToolJob` — callers should not call
 * `inngest.send` directly. See lib/dispatch.ts.
 */
export const inngest = new Inngest({
	id: "software-multi-tool",
	schemas: new EventSchemas().fromRecord<{
		// News analysis job
		"jobs/news-analyzer.requested": {
			data: {
				toolJobId: string;
				input: {
					url?: string;
					text?: string;
				};
			};
		};
		// Speaker separation job (long-running)
		"jobs/speaker-separation.requested": {
			data: {
				toolJobId: string;
				input: {
					audioFileUrl: string;
				};
			};
		};
		// Invoice processing job
		"jobs/invoice-processor.requested": {
			data: {
				toolJobId: string;
				input: {
					fileUrl: string;
				};
			};
		};
		// Contract analysis job
		"jobs/contract-analyzer.requested": {
			data: {
				toolJobId: string;
				input: {
					fileUrl?: string;
					text?: string;
				};
			};
		};
		// Feedback analysis job
		"jobs/feedback-analyzer.requested": {
			data: {
				toolJobId: string;
				input: {
					text: string;
				};
			};
		};
		// Expense categorization job
		"jobs/expense-categorizer.requested": {
			data: {
				toolJobId: string;
				input: {
					expenses: string;
					businessType?: string;
					taxYear?: number;
				};
			};
		};
		// Meeting summarization job
		"jobs/meeting-summarizer.requested": {
			data: {
				toolJobId: string;
				input: {
					fileUrl?: string;
					text?: string;
				};
			};
		};
		// GDPR data export job
		"jobs/gdpr-exporter.requested": {
			data: {
				toolJobId: string;
				input: {
					userId: string;
				};
			};
		};
	}>(),
});
