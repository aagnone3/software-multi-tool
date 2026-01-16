"use client";

import { config } from "@repo/config";
import { OrganizationsGrid } from "@saas/organizations/components/OrganizationsGrid";
import { CreditsOverview } from "./components/CreditsOverview";
import { GettingStartedChecklist } from "./components/GettingStartedChecklist";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { RecentlyUsedTools } from "./components/RecentlyUsedTools";

export default function UserStart() {
	return (
		<div className="space-y-6">
			{config.organizations.enable && <OrganizationsGrid />}

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
