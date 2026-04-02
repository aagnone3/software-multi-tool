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
	  }
	| {
			name: "upgrade_nudge_shown";
			props: { source: string; plan_id: string; context?: string };
	  }
	| {
			name: "upgrade_nudge_cta_clicked";
			props: {
				source: string;
				plan_id: string;
				cta_label: string;
				context?: string;
			};
	  }
	| {
			name: "credits_banner_shown";
			props: { source: string; plan_id: string; pct_used: number };
	  }
	| {
			name: "credits_banner_cta_clicked";
			props: { source: string; plan_id: string; cta_label: string };
	  }
	| {
			name: "credits_banner_dismissed";
			props: { source: string; plan_id: string; pct_used: number };
	  }
	| {
			name: "roi_calculator_cta_clicked";
			props: {
				use_cases: string[];
				team_size: number;
				hourly_rate: number;
				roi_pct: number;
				annual_savings: number;
			};
	  }
	| {
			name: "roi_calculator_use_case_toggled";
			props: {
				use_case_id: string;
				selected: boolean;
				total_selected: number;
			};
	  }
	| {
			name: "competitor_page_viewed";
			props: { competitor_slug: string; competitor_name: string };
	  }
	| {
			name: "competitor_page_cta_clicked";
			props: {
				competitor_slug: string;
				cta_type: "signup" | "pricing";
				position: "hero" | "footer";
			};
	  }
	| {
			name: "case_studies_page_cta_clicked";
			props: { cta_type: "signup" | "pricing" };
	  }
	| {
			name: "credit_pack_purchase_started";
			props: {
				pack_id: string;
				pack_name: string;
				credits: number;
				amount: number;
				currency: string;
				plan_id: string;
			};
	  }
	| {
			name: "credit_pack_purchase_failed";
			props: { pack_id: string; error_message: string; plan_id: string };
	  }
	| {
			name: "billing_settings_starter_upgrade_clicked";
			props: { plan_id: string };
	  }
	| {
			name: "billing_settings_compare_plans_clicked";
			props: { plan_id: string };
	  }
	| {
			name: "billing_settings_annual_upsell_clicked";
			props: { plan_id: string; savings_pct: number };
	  }
	| {
			name: "dashboard_recently_viewed_tool_clicked";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "dashboard_notification_clicked";
			props: {
				notification_id: string;
				notification_type: string;
				was_unread: boolean;
			};
	  }
	| {
			name: "tool_feedback_submitted";
			props: {
				tool_slug: string;
				rating: "POSITIVE" | "NEGATIVE";
				job_id?: string;
			};
	  }
	| {
			name: "tool_feedback_updated";
			props: {
				tool_slug: string;
				rating: "POSITIVE" | "NEGATIVE";
				job_id?: string;
			};
	  }
	| {
			name: "newsletter_subscribe_submitted";
			props: { source: string };
	  }
	| {
			name: "newsletter_subscribe_succeeded";
			props: { source: string };
	  }
	| {
			name: "dashboard_quick_action_clicked";
			props: { action_label: string; href: string };
	  }
	| {
			name: "dashboard_favorite_tool_clicked";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "dashboard_pinned_job_clicked";
			props: { job_id: string; tool_name: string };
	  }
	| {
			name: "dashboard_recently_used_tool_clicked";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "dashboard_recent_chat_clicked";
			props: { chat_id: string; source: string };
	  }
	| {
			name: "dashboard_getting_started_step_clicked";
			props: { step_id: string; is_complete: boolean };
	  }
	| {
			name: "dashboard_top_tool_clicked";
			props: { tool_slug: string; tool_name: string; rank: number };
	  }
	| {
			name: "dashboard_recommended_tool_clicked";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "dashboard_active_job_view_clicked";
			props: { job_id: string; tool_slug: string; job_status: string };
	  }
	| {
			name: "first_job_celebration_shown";
			props: Record<string, never>;
	  }
	| {
			name: "first_job_celebration_cta_clicked";
			props: { cta: "upgrade" | "dismiss" };
	  }
	| {
			name: "milestone_reached";
			props: { milestone_count: number; total_completed: number };
	  }
	| {
			name: "untried_tool_clicked";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "failed_job_retry_clicked";
			props: { tool_slug: string };
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
