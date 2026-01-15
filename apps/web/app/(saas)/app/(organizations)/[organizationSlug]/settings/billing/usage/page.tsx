import { getActiveOrganization } from "@saas/auth/lib/server";
import { TransactionHistory } from "@saas/credits/components/TransactionHistory";
import { UsageByToolChart } from "@saas/credits/components/UsageByToolChart";
import { UsageChart } from "@saas/credits/components/UsageChart";
import { UsageSummaryCards } from "@saas/credits/components/UsageSummaryCards";
import { Button } from "@ui/components/button";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "Usage History",
	};
}

export default async function UsageHistoryPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={`/app/${organizationSlug}/settings/billing`}>
						<ChevronLeftIcon className="size-4" />
						<span className="sr-only">Back to billing</span>
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Usage History</h1>
					<p className="text-muted-foreground">
						Track your credit consumption across all tools
					</p>
				</div>
			</div>

			<UsageSummaryCards />

			<div className="grid gap-6 lg:grid-cols-2">
				<UsageChart />
				<UsageByToolChart />
			</div>

			<TransactionHistory />
		</div>
	);
}
