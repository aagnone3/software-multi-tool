"use client";

import posthog from "posthog-js";
import { useCallback } from "react";

type ProductEvent =
	| {
			name: "tool_run_started";
			props: { tool_slug: string; plan_id: string };
	  }
	| {
			name: "tool_run_completed";
			props: {
				tool_slug: string;
				plan_id: string;
				duration_ms: number;
				success: boolean;
			};
	  }
	| {
			name: "tool_run_failed";
			props: { tool_slug: string; plan_id: string; error_code?: string };
	  }
	| {
			name: "upgrade_gate_viewed";
			props: {
				feature_name: string;
				tool_slug?: string;
				plan_id: string;
			};
	  }
	| {
			name: "upgrade_cta_clicked";
			props: { source: string; plan_id: string; target_plan?: string };
	  }
	| {
			name: "credits_exhausted";
			props: { plan_id: string; credits_purchased: number };
	  }
	| {
			name: "plan_upgrade_started";
			props: { from_plan: string; to_plan: string };
	  }
	| { name: "onboarding_completed"; props: { plan_id: string } }
	| { name: "first_tool_run"; props: { tool_slug: string } }
	| {
			name: "pricing_plan_selected";
			props: {
				plan_id: string;
				billing_interval: string;
				source: string;
				current_plan: string;
				authenticated: boolean;
			};
	  }
	| {
			name: "pricing_contact_sales_clicked";
			props: { source: string; current_plan: string };
	  }
	| {
			name: "exit_intent_modal_shown";
			props: { plan_id: string; source: string };
	  }
	| {
			name: "exit_intent_modal_dismissed";
			props: { plan_id: string; source: string };
	  }
	| {
			name: "pro_trial_offer_dismissed";
			props: { plan_id: string; source: string };
	  }
	| {
			name: "referral_link_copied";
			props: { source: string };
	  }
	| {
			name: "referral_widget_viewed";
			props: { source: string };
	  }
	| {
			name: "invite_nudge_shown";
			props: { completed_job_count: number; source: string };
	  }
	| {
			name: "invite_cta_clicked";
			props: { completed_job_count: number; source: string };
	  }
	| {
			name: "welcome_modal_shown";
			props: { source: string };
	  }
	| {
			name: "welcome_modal_step_viewed";
			props: { step_index: number; step_title: string; source: string };
	  }
	| {
			name: "welcome_modal_skipped";
			props: { step_index: number; source: string };
	  }
	| {
			name: "welcome_modal_completed";
			props: { first_tool_slug?: string; source: string };
	  }
	| {
			name: "onboarding_checklist_step_clicked";
			props: { step_id: string; is_complete: boolean; source: string };
	  }
	| {
			name: "onboarding_checklist_dismissed";
			props: {
				completed_count: number;
				total_count: number;
				source: string;
			};
	  };

export type { ProductEvent };

export function useProductAnalytics() {
	const track = useCallback((event: ProductEvent) => {
		if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
			return;
		}
		posthog.capture(event.name, event.props);
	}, []);

	return { track };
}
