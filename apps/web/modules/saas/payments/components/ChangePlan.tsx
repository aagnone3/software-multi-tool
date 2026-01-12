"use client";
import { PricingTable } from "@saas/payments/components/PricingTable";
import { SettingsItem } from "@saas/shared/components/SettingsItem";

export function ChangePlan({
	organizationId,
	userId,
	activePlanId,
}: {
	organizationId?: string;
	userId?: string;
	activePlanId?: string;
}) {
	return (
		<SettingsItem
			title="Change your plan"
			description="Choose a plan to subscribe to."
		>
			<PricingTable
				organizationId={organizationId}
				userId={userId}
				activePlanId={activePlanId}
			/>
		</SettingsItem>
	);
}
