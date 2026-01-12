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
			features: ["Another amazing feature", "Limited support"],
		},
		pro: {
			title: "Pro",
			description: "Best for teams",
			features: ["Another amazing feature", "Full support"],
		},
		enterprise: {
			title: "Enterprise",
			description: "Custom plan tailored to your requirements",
			features: ["Unlimited projects", "Enterprise support"],
		},
		lifetime: {
			title: "Lifetime",
			description: "Buy once. Use forever.",
			features: ["No recurring costs", "Extended support"],
		},
	};

	return { planData };
}
