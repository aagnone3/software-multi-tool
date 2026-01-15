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
			description: "Start for free",
			features: [
				"10 credits/month",
				"Basic tools access",
				"Community support",
			],
		},
		starter: {
			title: "Starter",
			description: "Great for individuals",
			features: [
				"100 credits/month",
				"All tools access",
				"Email support",
				"7-day free trial",
			],
		},
		pro: {
			title: "Pro",
			description: "Best for teams",
			features: [
				"500 credits/month",
				"All tools access",
				"Priority support",
				"7-day free trial",
			],
		},
	};

	return { planData };
}
