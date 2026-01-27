import type { RouterClient } from "@orpc/server";
import { adminRouter } from "../modules/admin/router";
import { aiRouter } from "../modules/ai/router";
import { contactRouter } from "../modules/contact/router";
import { creditsRouter } from "../modules/credits/router";
import { filesRouter } from "../modules/files/router";
import { gdprRouter } from "../modules/gdpr-exporter/router";
import { invoiceProcessorRouter } from "../modules/invoice-processor/router";
import { jobsRouter } from "../modules/jobs/router";
import { newsletterRouter } from "../modules/newsletter/router";
import { notificationsRouter } from "../modules/notifications/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { shareRouter } from "../modules/share/router";
import { usersRouter } from "../modules/users/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure
	// Prefix for openapi
	.prefix("/api")
	.router({
		admin: adminRouter,
		newsletter: newsletterRouter,
		contact: contactRouter,
		credits: creditsRouter,
		files: filesRouter,
		notifications: notificationsRouter,
		organizations: organizationsRouter,
		users: usersRouter,
		payments: paymentsRouter,
		ai: aiRouter,
		jobs: jobsRouter,
		gdpr: gdprRouter,
		invoiceProcessor: invoiceProcessorRouter,
		share: shareRouter,
	});

export type ApiRouterClient = RouterClient<typeof router>;
