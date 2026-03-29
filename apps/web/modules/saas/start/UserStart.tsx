"use client";

import { config } from "@repo/config";
import { CreditBurnRateWidget } from "@saas/credits/components/CreditBurnRateWidget";
import { OrganizationsGrid } from "@saas/organizations/components/OrganizationsGrid";
import { ReferralWidget } from "@saas/referrals/components/ReferralWidget";
import React from "react";
import { JobSearchWidget } from "../jobs/components/JobSearchWidget";
import { ActiveJobsWidget } from "./components/ActiveJobsWidget";
import { CreditForecastWidget } from "./components/CreditForecastWidget";
import { CreditsByToolChart } from "./components/CreditsByToolChart";
import { CreditsOverview } from "./components/CreditsOverview";
import { CreditUpgradeWidget } from "./components/CreditUpgradeWidget";
import { DailyGoalWidget } from "./components/DailyGoalWidget";
import { FailedJobsRetryWidget } from "./components/FailedJobsRetryWidget";
import { FavoriteToolsWidget } from "./components/FavoriteToolsWidget";
import { GettingStartedChecklist } from "./components/GettingStartedChecklist";
import { NotificationsWidget } from "./components/NotificationsWidget";
import { OnboardingRewardChecklist } from "./components/OnboardingRewardChecklist";
import { PinnedJobsWidget } from "./components/PinnedJobsWidget";
import { ProTrialOfferCard } from "./components/ProTrialOfferCard";
import { QuickActions } from "./components/QuickActions";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { RecentlyUsedTools } from "./components/RecentlyUsedTools";
import { RecentlyViewedToolsWidget } from "./components/RecentlyViewedToolsWidget";
import { RecommendedToolWidget } from "./components/RecommendedToolWidget";
import { StreakWidget } from "./components/StreakWidget";
import { ToolBenchmarkWidget } from "./components/ToolBenchmarkWidget";
import { TopToolsWidget } from "./components/TopToolsWidget";
import { UntriedToolsWidget } from "./components/UntriedToolsWidget";
import { UsageTrendChart } from "./components/UsageTrendChart";
import { WeeklyActivityHeatmap } from "./components/WeeklyActivityHeatmap";
import { WelcomeModal } from "./components/WelcomeModal";

export default function UserStart() {
	return (
		<div className="space-y-6">
			{/* Welcome modal — shown only on first visit */}
			<WelcomeModal />

			{config.organizations.enable && <OrganizationsGrid />}

			{/* Pro trial offer — shown once to free users, dismissible */}
			<ProTrialOfferCard />

			{/* Getting Started - dismissible onboarding checklist */}
			<OnboardingRewardChecklist />
			<GettingStartedChecklist />

			{/* Quick Actions row */}
			<QuickActions />

			{/* Active jobs — only shown when there are in-flight/recently completed jobs */}
			<ActiveJobsWidget />

			{/* Failed jobs retry — only shown when there are recent failures */}
			<FailedJobsRetryWidget />

			{/* Main dashboard grid */}
			<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{/* Credit Upgrade — shown for free/low-credit users */}
				<CreditUpgradeWidget className="lg:col-span-1" />

				{/* Credits Overview */}
				<CreditsOverview className="lg:col-span-1" />

				{/* Credit Burn Rate — only shown when there's active usage */}
				<CreditBurnRateWidget className="lg:col-span-1" />

				{/* Recently Used Tools */}
				<RecentlyUsedTools className="lg:col-span-1" />

				{/* Notifications Widget */}
				<NotificationsWidget className="lg:col-span-2 xl:col-span-1" />
			</div>

			{/* Secondary grid */}
			<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{/* Usage Trend Chart */}
				<UsageTrendChart className="lg:col-span-2 xl:col-span-2" />

				{/* Recent Activity Feed */}
				<RecentActivityFeed className="lg:col-span-2 xl:col-span-1" />
			</div>

			{/* Activity heatmap — full-width */}
			<WeeklyActivityHeatmap />

			{/* Credits breakdown by tool */}
			<CreditsByToolChart />

			{/* Bottom grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Activity Streak */}
				<StreakWidget />

				{/* Daily Goal Widget */}
				<DailyGoalWidget />

				{/* Top Tools Widget */}
				<TopToolsWidget />

				{/* Favorite Tools */}
				<FavoriteToolsWidget />

				{/* Recommended Tool */}
				<RecommendedToolWidget />

				{/* Recently Viewed Tools — localStorage-persisted quick-access */}
				<RecentlyViewedToolsWidget />

				{/* Untried Tools — discovery nudge */}
				<UntriedToolsWidget />

				{/* Pinned Job Outputs */}
				<PinnedJobsWidget />

				{/* Job Search */}
				<JobSearchWidget />

				{/* Tool Benchmark — per-tool success rate and avg duration */}

				{/* Credit Forecast — projects future credit usage */}
				<CreditForecastWidget />
				<ToolBenchmarkWidget />

				{/* Referral — earn free credits by inviting friends */}
				<ReferralWidget />
			</div>
		</div>
	);
}
