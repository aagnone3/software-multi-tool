import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getSession } from "@saas/auth/lib/server";
import { CreditBalanceSection } from "@saas/credits/components/CreditBalanceSection";
import { ActivePlan } from "@saas/payments/components/ActivePlan";
import { ChangePlan } from "@saas/payments/components/ChangePlan";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { attemptAsync } from "es-toolkit";

export async function generateMetadata() {
	return {
		title: "Billing",
	};
}

export default async function BillingSettingsPage() {
	const session = await getSession();
	const [error, data] = await attemptAsync(() =>
		orpcClient.payments.listPurchases({}),
	);

	if (error) {
		throw new Error("Failed to fetch purchases");
	}

	const purchases = data?.purchases ?? [];

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: orpc.payments.listPurchases.queryKey({
			input: {},
		}),
		queryFn: () => purchases,
	});

	const { activePlan } = createPurchasesHelper(purchases);

	return (
		<SettingsList>
			<CreditBalanceSection />
			{activePlan && <ActivePlan />}
			<ChangePlan
				userId={session?.user.id}
				activePlanId={activePlan?.id}
			/>
		</SettingsList>
	);
}
