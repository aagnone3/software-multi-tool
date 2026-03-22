"use client";

import { config } from "@repo/config";
import { OrganizationsGrid } from "@saas/organizations/components/OrganizationsGrid";
import React from "react";
import { CreditsOverview } from "./components/CreditsOverview";
import { FavoriteToolsWidget } from "./components/FavoriteToolsWidget";
import { GettingStartedChecklist } from "./components/GettingStartedChecklist";
import { NotificationsWidget } from "./components/NotificationsWidget";
import { QuickActions } from "./components/QuickActions";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { RecentlyUsedTools } from "./components/RecentlyUsedTools";
import { RecommendedToolWidget } from "./components/RecommendedToolWidget";
import { TopToolsWidget } from "./components/TopToolsWidget";
import { UsageTrendChart } from "./components/UsageTrendChart";

export default function UserStart() {
	return (
		<div className="space-y-6">
			{config.organizations.enable && <OrganizationsGrid />}

			{/* Getting Started - dismissible onboarding checklist */}
			<GettingStartedChecklist />

			{/* Quick Actions row */}
			<QuickActions />

			{/* Main dashboard grid */}
			<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{/* Credits Overview */}
				<CreditsOverview className="lg:col-span-1" />

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

			{/* Bottom grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Top Tools Widget */}
				<TopToolsWidget />

				{/* Favorite Tools */}
				<FavoriteToolsWidget />

				{/* Recommended Tool */}
				<RecommendedToolWidget />
			</div>
		</div>
	);
}
