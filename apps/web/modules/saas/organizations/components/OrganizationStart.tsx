"use client";

import { CreditsOverview } from "@saas/start/components/CreditsOverview";
import { GettingStartedChecklist } from "@saas/start/components/GettingStartedChecklist";
import { RecentActivityFeed } from "@saas/start/components/RecentActivityFeed";
import { RecentlyUsedTools } from "@saas/start/components/RecentlyUsedTools";

export default function OrganizationStart() {
	return (
		<div className="space-y-6">
			{/* Getting Started - dismissible onboarding checklist */}
			<GettingStartedChecklist />

			{/* Main dashboard grid */}
			<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{/* Credits Overview */}
				<CreditsOverview className="lg:col-span-1" />

				{/* Recently Used Tools */}
				<RecentlyUsedTools className="lg:col-span-1" />

				{/* Recent Activity Feed */}
				<RecentActivityFeed className="lg:col-span-2 xl:col-span-1" />
			</div>
		</div>
	);
}
