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
			title: "Free Starter",
			description:
				"Evaluate locally with full source code and community support. Perfect for trying before you buy.",
			features: [
				"10 credits/month",
				"All tools included",
				"No credit card required",
				"Community support",
			],
		},
		starter: {
			title: "Pro License",
			description:
				"Priority updates, verified compatibility, and direct support. Ready for production use.",
			features: [
				"100 credits/month",
				"All tools included",
				"Rollover unused credits",
				"Email support",
				"7-day free trial",
				"Export reports (invoices, expenses, contracts, feedback)",
				"Download speaker transcripts & diagrams",
				"Job comparison & side-by-side diffs",
				"Usage trend & credit analytics dashboard",
				"Recent activity feed & top tools insights",
				"Streak tracker & daily goal widget",
				"Favorite tools & recently viewed shortcuts",
				"Pinned jobs & advanced job search",
			],
		},
		pro: {
			title: "Enterprise",
			description:
				"Premium modules, dedicated setup, and customization guidance. Built for teams.",
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
				"Usage trend & credit analytics dashboard",
				"Recent activity feed & top tools insights",
				"Streak tracker & daily goal widget",
				"Favorite tools & recently viewed shortcuts",
				"Pinned jobs & advanced job search",
			],
		},
	};

	return { planData };
}
