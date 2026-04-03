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
			name: "integrations_page_viewed";
			props: Record<string, never>;
	  }
	| {
			name: "use_cases_page_viewed";
			props: Record<string, never>;
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
			name: "billing_settings_winback_cta_clicked";
			props: { plan_id: string; status: string };
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
	  }
	| {
			name: "onboarding_step1_completed";
			props: { has_avatar: boolean };
	  }
	| {
			name: "onboarding_step2_tool_selected";
			props: { tool_slug: string };
	  }
	| {
			name: "onboarding_step2_skipped";
			props: Record<string, never>;
	  }
	| {
			name: "onboarding_step2_completed";
			props: { tool_slug: string | null; skipped: boolean };
	  }
	| {
			name: "low_credits_modal_shown";
			props: { percent_used: number; plan: string };
	  }
	| {
			name: "low_credits_modal_dismissed";
			props: { percent_used: number; plan: string };
	  }
	| {
			name: "low_credits_modal_upgrade_clicked";
			props: { plan: string; cta: string };
	  }
	| {
			name: "daily_goal_set";
			props: { goal: number };
	  }
	| {
			name: "daily_goal_completed";
			props: { goal: number; total_completed: number };
	  }
	| {
			name: "related_tool_cta_clicked";
			props: { tool_slug: string; source_tags: string; cta_text: string };
	  }
	| {
			name: "related_tool_learn_more_clicked";
			props: { tool_slug: string; source_tags: string };
	  }
	| {
			name: "marketing_final_cta_clicked";
			props: { cta: "start_free" | "browse_tools" };
	  }
	| {
			name: "marketing_exit_intent_shown";
			props: Record<string, never>;
	  }
	| {
			name: "marketing_exit_intent_cta_clicked";
			props: Record<string, never>;
	  }
	| {
			name: "marketing_exit_intent_dismissed";
			props: Record<string, never>;
	  }
	| {
			name: "marketing_mid_post_cta_clicked";
			props: { post_slug: string };
	  }
	| {
			name: "social_share_clicked";
			props: { platform: string; post_slug: string };
	  }
	| {
			name: "command_palette_opened";
			props: Record<string, never>;
	  }
	| {
			name: "command_palette_tool_selected";
			props: {
				tool_slug: string;
				tool_name: string;
				from_recent: boolean;
			};
	  }
	| {
			name: "command_palette_page_selected";
			props: {
				page_id: string;
				page_label: string;
				from_recent: boolean;
			};
	  }
	| {
			name: "tool_page_viewed";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "tool_card_open_clicked";
			props: {
				tool_slug: string;
				tool_name: string;
				is_recently_used: boolean;
				is_favorite: boolean;
			};
	  }
	| {
			name: "tool_card_favorite_toggled";
			props: {
				tool_slug: string;
				tool_name: string;
				is_favorited: boolean;
			};
	  }
	| {
			name: "tool_card_preview_clicked";
			props: { tool_slug: string; tool_name: string };
	  }
	| {
			name: "tools_grid_searched";
			props: { query: string };
	  }
	| {
			name: "tools_grid_sorted";
			props: { sort_by: string };
	  }
	| {
			name: "tools_grid_category_filtered";
			props: { category: string };
	  }
	| {
			name: "tool_page_share_clicked";
			props: { tool_slug: string };
	  }
	| {
			name: "tools_navbar_all_tools_clicked";
			props: Record<string, never>;
	  }
	| {
			name: "tools_navbar_tool_clicked";
			props: { tool_slug: string };
	  }
	| {
			name: "user_signed_up";
			props: {
				method: "email" | "magic-link" | "oauth";
				provider?: string;
			};
	  }
	| {
			name: "user_logged_in";
			props: {
				method: "password" | "magic-link" | "passkey" | "oauth";
				provider?: string;
			};
	  }
	| {
			name: "auth_signup_failed";
			props: {
				method: "email" | "magic-link" | "oauth";
				error_code?: string;
			};
	  }
	| {
			name: "auth_login_failed";
			props: {
				method: "password" | "magic-link" | "passkey" | "oauth";
				error_code?: string;
			};
	  }
	| {
			name: "password_reset_requested";
			props: Record<string, never>;
	  }
	| {
			name: "password_reset_completed";
			props: Record<string, never>;
	  }
	| {
			name: "mfa_otp_verified";
			props: Record<string, never>;
	  }
	| { name: "settings_email_changed"; props: Record<string, never> }
	| { name: "settings_email_change_failed"; props: Record<string, never> }
	| { name: "settings_password_changed"; props: Record<string, never> }
	| { name: "settings_password_change_failed"; props: Record<string, never> }
	| { name: "settings_account_deleted"; props: Record<string, never> }
	| { name: "settings_account_delete_failed"; props: Record<string, never> }
	| { name: "settings_name_changed"; props: Record<string, never> }
	| {
			name: "settings_notification_updated";
			props: { category: string; channel: string; enabled: boolean };
	  }
	| { name: "settings_data_export_requested"; props: Record<string, never> }
	| { name: "settings_2fa_enabled"; props: Record<string, never> }
	| { name: "settings_2fa_disabled"; props: Record<string, never> }
	| { name: "settings_session_revoked"; props: Record<string, never> }
	| { name: "settings_passkey_added"; props: Record<string, never> }
	| { name: "settings_passkey_deleted"; props: Record<string, never> }
	| { name: "settings_avatar_changed"; props: Record<string, never> }
	| { name: "settings_customer_portal_opened"; props: Record<string, never> }
	| { name: "settings_set_password_clicked"; props: Record<string, never> }
	| {
			name: "settings_social_account_linked";
			props: { provider: string };
	  }
	| {
			name: "checkout_started";
			props: {
				plan_id: string;
				billing_interval: string;
				product_id: string;
				price_type: "one-time" | "subscription";
				has_trial: boolean;
				current_plan: string;
			};
	  }
	| {
			name: "checkout_failed";
			props: {
				plan_id: string;
				billing_interval: string;
				product_id: string;
				current_plan: string;
			};
	  }
	| {
			name: "user_logged_out";
			props: Record<string, never>;
	  }
	| {
			name: "streak_milestone_reached";
			props: { streak_days: number; is_best: boolean };
	  }
	| {
			name: "hero_cta_clicked";
			props: { cta: "signup" | "see_all_tools"; position: "hero" };
	  }
	| {
			name: "home_features_tool_clicked";
			props: { tool_id: string; tool_title: string };
	  }
	| {
			name: "tool_history_page_viewed";
			props: { tool_slug: string };
	  }
	| {
			name: "tool_history_job_deleted";
			props: { tool_slug: string; job_id: string };
	  }
	| {
			name: "tool_history_csv_exported";
			props: { tool_slug: string; row_count: number };
	  }
	| {
			name: "jobs_history_page_viewed";
			props: Record<string, never>;
	  }
	| {
			name: "jobs_history_job_deleted";
			props: { job_id: string };
	  }
	| {
			name: "jobs_history_csv_exported";
			props: { row_count: number };
	  }
	| {
			name: "job_detail_page_viewed";
			props: { job_id: string; tool_slug: string; status: string };
	  }
	| {
			name: "job_detail_output_downloaded";
			props: { job_id: string; tool_slug: string };
	  }
	| {
			name: "job_detail_link_shared";
			props: { job_id: string; tool_slug: string };
	  }
	| {
			name: "job_detail_pin_toggled";
			props: { job_id: string; tool_slug: string; pinned: boolean };
	  }
	| {
			name: "org_created";
			props: Record<string, never>;
	  }
	| {
			name: "org_deleted";
			props: Record<string, never>;
	  }
	| {
			name: "org_member_invited";
			props: { role: string };
	  }
	| {
			name: "tool_feedback_dialog_opened";
			props: { tool_slug: string; job_id?: string };
	  }
	| {
			name: "tool_feedback_submitted";
			props: {
				tool_slug: string;
				rating: string;
				has_comment: boolean;
				job_id?: string;
			};
	  }
	| {
			name: "new_user_welcome_banner_shown";
			props: Record<string, never>;
	  }
	| {
			name: "new_user_welcome_banner_dismissed";
			props: Record<string, never>;
	  }
	| {
			name: "new_user_welcome_cta_clicked";
			props: { cta: "try_tool" | "browse_all" };
	  }
	| { name: "tool_collection_created"; props: { tool_slug: string | null } }
	| { name: "tool_collection_deleted"; props: Record<string, never> }
	| { name: "tool_collection_tool_added"; props: { tool_slug: string } }
	| { name: "tool_collection_tool_removed"; props: { tool_slug: string } }
	| { name: "ai_chat_created"; props: Record<string, never> }
	| { name: "ai_chat_message_sent"; props: { message_length: number } }
	| { name: "tool_rated"; props: { tool_slug: string; rating: number } }
	| {
			name: "social_signin_clicked";
			props: { provider: string; has_invitation: boolean };
	  }
	| { name: "job_search_query_entered"; props: { query_length: number } }
	| {
			name: "job_search_result_clicked";
			props: { tool_slug: string; status: string };
	  }
	| {
			name: "file_uploaded";
			props: { filename: string; mime_type: string; size_bytes: number };
	  }
	| {
			name: "file_upload_failed";
			props: { filename: string; mime_type: string; size_bytes: number };
	  }
	| {
			name: "tool_schedule_set";
			props: { tool_slug: string; offset_value: number; unit: string };
	  }
	| { name: "tool_schedule_removed"; props: { tool_slug: string } }
	| {
			name: "credit_forecast_nudge_shown";
			props: {
				plan_id: string;
				forecast_30: number;
				remaining_credits: number;
			};
	  }
	| {
			name: "credit_forecast_upgrade_clicked";
			props: { plan_id: string; source: string };
	  }
	| {
			name: "credit_burn_rate_upgrade_clicked";
			props: { plan_id: string; source: string };
	  }
	| {
			name: "payment_issue_alert_cta_clicked";
			props: { status: string; source: string };
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
