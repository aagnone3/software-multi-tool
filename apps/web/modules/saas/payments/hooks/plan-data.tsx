import type { config } from "@repo/config";
import type { ReactNode } from "react";

type ProductReferenceId = keyof (typeof config)["payments"]["plans"];

export function usePlanData() {
	const planData: Record<
		ProductReferenceId,
		{
			title: string;
			description: ReactNode;
			features: ReactNode[];
		}
	> = {
		free: {
			title: "Free",
			description: "Try all the tools — no credit card required",
			features: [
				"10 credits/month",
				"All tools included",
				"No credit card required",
				"Community support",
			],
		},
		starter: {
			title: "Starter",
			description:
				"For freelancers and professionals who run AI workflows weekly",
			features: [
				"100 credits/month",
				"All tools included",
				"Rollover unused credits",
				"Email support",
				"7-day free trial",
			],
		},
		pro: {
			title: "Pro",
			description:
				"For teams that rely on AI tools as part of their daily workflow",
			features: [
				"500 credits/month",
				"All tools included",
				"Rollover unused credits",
				"Priority support",
				"Team seats included",
				"7-day free trial",
				"Export reports (invoices, expenses, contracts, feedback)",
				"Download speaker transcripts & diagrams",
				"Job comparison & side-by-side diffs",
				"Tool scheduler — automate recurring runs",
				"Tool notes & collections",
				"Custom input templates",
				"Bulk actions on job history",
				"Usage data export",
			],
		},
	};

	return { planData };
}
