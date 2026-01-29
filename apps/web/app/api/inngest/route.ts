import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { newsAnalyzer } from "../../../inngest/functions/news-analyzer";

/**
 * Inngest serve endpoint for handling background jobs.
 *
 * This endpoint is called by Inngest to invoke functions when events are received.
 * Functions will be registered here as they are migrated from pg-boss.
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
		newsAnalyzer,
		// Functions will be added here as they are migrated:
		// - speakerSeparation (US-008)
		// - invoiceProcessor (US-009)
		// - contractAnalyzer (US-009)
		// - feedbackAnalyzer (US-009)
		// - expenseCategorizer (US-009)
		// - meetingSummarizer (US-009)
		// - gdprExporter (US-009)
	],
});
