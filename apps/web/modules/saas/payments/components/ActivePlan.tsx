"use client";

import { usePlanData } from "@saas/payments/hooks/plan-data";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { BadgeCheckIcon, CheckIcon } from "lucide-react";
import { CustomerPortalButton } from "../../settings/components/CustomerPortalButton";
import { SubscriptionStatusBadge } from "../../settings/components/SubscriptionStatusBadge";

export function ActivePlan({ organizationId }: { organizationId?: string }) {
	const { planData } = usePlanData();
	const { activePlan } = usePurchases(organizationId);

	if (!activePlan) {
		return null;
	}

	const activePlanData = planData[activePlan.id as keyof typeof planData];

	if (!activePlanData) {
		return null;
	}

	const price = "price" in activePlan ? activePlan.price : null;

	const formatMonth = (count: number) =>
		count === 1 ? "month" : `${count} months`;
	const formatYear = (count: number) =>
		count === 1 ? "year" : `${count} years`;

	return (
		<SettingsItem title="Your plan">
			<div className="rounded-lg border p-4">
				<div className="">
					<div className="flex items-center gap-2">
						<BadgeCheckIcon className="size-6 text-primary" />
						<h4 className="font-bold text-lg text-primary">
							<span>{activePlanData.title}</span>
						</h4>
						{activePlan.status && (
							<SubscriptionStatusBadge
								status={activePlan.status}
							/>
						)}
					</div>

					{!!activePlanData.features?.length && (
						<ul className="mt-2 grid list-none gap-2 text-sm">
							{activePlanData.features.map((feature, key) => (
								<li
									key={key}
									className="flex items-center justify-start"
								>
									<CheckIcon className="mr-2 size-4 text-primary" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					)}

					{price && (
						<strong
							className="mt-2 block font-medium text-2xl lg:text-3xl"
							data-test="price-table-plan-price"
						>
							{new Intl.NumberFormat("en", {
								style: "currency",
								currency: price.currency,
							}).format(price.amount)}
							{"interval" in price && (
								<span className="font-normal text-xs opacity-60">
									{" / "}
									{price.interval === "month"
										? formatMonth(price.intervalCount ?? 1)
										: formatYear(price.intervalCount ?? 1)}
								</span>
							)}
						</strong>
					)}
				</div>

				{"purchaseId" in activePlan && activePlan.purchaseId && (
					<div className="mt-4 flex justify-end">
						<div className="flex w-full flex-col flex-wrap gap-2 md:flex-row">
							<CustomerPortalButton
								purchaseId={activePlan.purchaseId}
							/>
						</div>
					</div>
				)}
			</div>
		</SettingsItem>
	);
}
