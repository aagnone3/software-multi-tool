import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreditBalanceSection } from "@saas/credits/components/CreditBalanceSection";
import { CreditPacksSection } from "@saas/credits/components/CreditPacksSection";
import { ActivePlan } from "@saas/payments/components/ActivePlan";
import { ChangePlan } from "@saas/payments/components/ChangePlan";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { attemptAsync } from "es-toolkit";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "Billing",
	};
}

export default async function BillingSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	const [error, purchasesData] = await attemptAsync(() =>
		orpcClient.payments.listPurchases({
			organizationId: organization.id,
		}),
	);

	if (error) {
		throw new Error("Failed to fetch purchases");
	}

	const purchases = purchasesData?.purchases ?? [];
	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: orpc.payments.listPurchases.queryKey({
			input: {
				organizationId: organization.id,
			},
		}),
		queryFn: () => purchasesData,
	});

	const { activePlan } = createPurchasesHelper(purchases);

	return (
		<SettingsList>
			<CreditBalanceSection />
			<CreditPacksSection />
			{activePlan && <ActivePlan organizationId={organization.id} />}
			<ChangePlan
				organizationId={organization.id}
				activePlanId={activePlan?.id}
			/>
		</SettingsList>
	);
}
