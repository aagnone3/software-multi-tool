"use client";

import { config } from "@repo/config";
import { CreditBurnRateWidget } from "@saas/credits/components/CreditBurnRateWidget";
import { OrganizationsGrid } from "@saas/organizations/components/OrganizationsGrid";
import { PaymentIssueAlert } from "@saas/payments/components/PaymentIssueAlert";
import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
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

			{/* Payment issue alert — shown when subscription is past_due/unpaid/incomplete/paused */}
			<PaymentIssueAlert />

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
				{/* Usage Trend Chart — gated for pro users */}
				<UpgradeGate
					featureName="Usage Trend"
					description="View your tool usage trends over time. Available on Pro and above."
					className="lg:col-span-2 xl:col-span-2"
				>
					<UsageTrendChart className="lg:col-span-2 xl:col-span-2" />
				</UpgradeGate>

				{/* Recent Activity Feed — gated for pro users */}
				<UpgradeGate
					featureName="Recent Activity"
					description="See a live feed of your recent credit transactions and tool activity. Pro feature."
					className="lg:col-span-2 xl:col-span-1"
				>
					<RecentActivityFeed className="lg:col-span-2 xl:col-span-1" />
				</UpgradeGate>
			</div>

			{/* Activity heatmap — full-width; gated for pro users */}
			<UpgradeGate
				featureName="Activity Heatmap"
				description="See your daily usage patterns over time. Available on Pro and above."
			>
				<WeeklyActivityHeatmap />
			</UpgradeGate>

			{/* Credits breakdown by tool — gated for pro users */}
			<UpgradeGate
				featureName="Credits by Tool"
				description="See a breakdown of your credit usage by tool. Available on Pro and above."
			>
				<CreditsByToolChart />
			</UpgradeGate>

			{/* Bottom grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Activity Streak — gated for pro users */}
				<UpgradeGate
					featureName="Activity Streak"
					description="Track your daily usage streak and stay consistent. Available on Pro and above."
				>
					<StreakWidget />
				</UpgradeGate>

				{/* Daily Goal Widget — gated for pro users */}
				<UpgradeGate
					featureName="Daily Goal"
					description="Set and track a daily credit usage goal. Available on Pro and above."
				>
					<DailyGoalWidget />
				</UpgradeGate>

				{/* Top Tools Widget — gated for pro users */}
				<UpgradeGate
					featureName="Top Tools"
					description="See which tools you use the most, ranked by run count. Pro feature."
				>
					<TopToolsWidget />
				</UpgradeGate>

				{/* Favorite Tools — gated for pro users */}
				<UpgradeGate
					featureName="Favorite Tools"
					description="Pin your most-used tools for quick access. Available on Pro and above."
				>
					<FavoriteToolsWidget />
				</UpgradeGate>

				{/* Recommended Tool */}
				<RecommendedToolWidget />

				{/* Recently Viewed Tools — gated for pro users */}
				<UpgradeGate
					featureName="Recently Viewed Tools"
					description="See your recently visited tools for quick access. Available on Pro and above."
				>
					<RecentlyViewedToolsWidget />
				</UpgradeGate>

				{/* Untried Tools — gated for pro users */}
				<UpgradeGate
					featureName="Untried Tools"
					description="Discover tools you haven't tried yet. Available on Pro and above."
				>
					<UntriedToolsWidget />
				</UpgradeGate>

				{/* Pinned Job Outputs — gated for pro users */}
				<UpgradeGate
					featureName="Pinned Outputs"
					description="Pin and revisit your most important job outputs. Available on Pro and above."
				>
					<PinnedJobsWidget />
				</UpgradeGate>

				{/* Job Search — gated for pro users */}
				<UpgradeGate
					featureName="Job Search"
					description="Search through your job history by tool, status, or job ID. Available on Pro and above."
				>
					<JobSearchWidget />
				</UpgradeGate>

				{/* Tool Benchmark — per-tool success rate and avg duration */}

				{/* Credit Forecast — projects future credit usage; gated for pro */}
				<UpgradeGate
					featureName="Credit Forecast"
					description="Project your future credit usage based on recent activity. Pro feature."
				>
					<CreditForecastWidget />
				</UpgradeGate>

				{/* Tool Benchmark — per-tool success rate; gated for pro */}
				<UpgradeGate
					featureName="Tool Benchmark"
					description="Compare success rates and processing times across all your tools. Pro feature."
				>
					<ToolBenchmarkWidget />
				</UpgradeGate>

				{/* Referral — earn free credits by inviting friends */}
				<ReferralWidget />
			</div>
		</div>
	);
}
