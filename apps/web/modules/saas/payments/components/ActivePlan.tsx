"use client";

import { usePlanData } from "@saas/payments/hooks/plan-data";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { BadgeCheckIcon, CheckIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { CustomerPortalButton } from "../../settings/components/CustomerPortalButton";
import { SubscriptionStatusBadge } from "../../settings/components/SubscriptionStatusBadge";

const PRO_EXCLUSIVE_FEATURES = [
	"500 credits/month (5× more than Starter)",
	"Tool scheduler — automate recurring runs",
	"Bulk actions on job history",
	"Custom input templates",
	"Usage data export",
];

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
	const isStarterPlan = activePlan.id === "starter";

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

			{isStarterPlan && (
				<div
					className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4"
					data-test="starter-pro-upgrade-nudge"
				>
					<div className="mb-3 flex items-center gap-2">
						<ZapIcon className="size-4 text-primary" />
						<p className="font-semibold text-sm">
							Unlock more with Pro
						</p>
					</div>
					<ul className="mb-4 grid list-none gap-1.5 text-sm text-foreground/70">
						{PRO_EXCLUSIVE_FEATURES.map((feature) => (
							<li
								key={feature}
								className="flex items-start gap-2"
							>
								<CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
								<span>{feature}</span>
							</li>
						))}
					</ul>
					<div className="flex flex-wrap gap-2">
						<Link
							href="/app/billing?upgrade=pro"
							className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
							data-test="starter-upgrade-to-pro-cta"
						>
							<ZapIcon className="size-3.5" />
							Upgrade to Pro — $29/mo
						</Link>
						<Link
							href="/pricing#pricing-plan-pro"
							className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
							data-test="starter-compare-plans-cta"
						>
							Compare plans
						</Link>
					</div>
				</div>
			)}
		</SettingsItem>
	);
}
