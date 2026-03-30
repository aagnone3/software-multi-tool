"use client";

import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { ToolInsightsDashboard } from "@saas/tools/components/ToolInsightsDashboard";
import { Button } from "@ui/components/button";
import { WrenchIcon } from "lucide-react";
import Link from "next/link";

export default function ToolInsightsPage() {
	return (
		<div>
			<PageHeader
				title="Tool Insights"
				subtitle="Per-tool usage stats, success rates, and credit consumption"
				actions={
					<Button asChild variant="outline" size="sm">
						<Link href="/app/tools">
							<WrenchIcon className="size-4 mr-1" />
							All Tools
						</Link>
					</Button>
				}
			/>
			<UpgradeGate
				featureName="Tool Insights"
				description="Detailed per-tool stats, success rates, and credit consumption breakdowns are available on Pro and above."
			>
				<ToolInsightsDashboard />
			</UpgradeGate>
		</div>
	);
}
