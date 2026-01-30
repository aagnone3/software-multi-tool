import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { contractAnalyzer } from "../../../inngest/functions/contract-analyzer";
import { expenseCategorizer } from "../../../inngest/functions/expense-categorizer";
import { feedbackAnalyzer } from "../../../inngest/functions/feedback-analyzer";
import { gdprExporter } from "../../../inngest/functions/gdpr-exporter";
import { invoiceProcessor } from "../../../inngest/functions/invoice-processor";
import { meetingSummarizer } from "../../../inngest/functions/meeting-summarizer";
import { newsAnalyzer } from "../../../inngest/functions/news-analyzer";
import { speakerSeparation } from "../../../inngest/functions/speaker-separation";

/**
 * Inngest serve endpoint for handling background jobs.
 *
 * This endpoint is called by Inngest to invoke functions when events are received.
 * All 8 job processors are registered here.
 *
 * Local development:
 *   npx inngest-cli@latest dev
 *
 * This starts a local dashboard at http://localhost:8288 that shows:
 * - Registered functions
 * - Event history
 * - Function run traces
 */
export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [
		// AI-powered analysis jobs
		newsAnalyzer,
		contractAnalyzer,
		feedbackAnalyzer,
		invoiceProcessor,
		expenseCategorizer,
		meetingSummarizer,
		// Long-running audio processing
		speakerSeparation,
		// GDPR compliance
		gdprExporter,
	],
});
