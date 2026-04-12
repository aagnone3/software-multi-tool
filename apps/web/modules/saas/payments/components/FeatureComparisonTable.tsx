"use client";

import { config } from "@repo/config";
import { usePlanData } from "@saas/payments/hooks/plan-data";
import { Check, Minus } from "lucide-react";
import React from "react";

const planIds = Object.keys(config.payments.plans) as Array<
	keyof typeof config.payments.plans
>;

export function FeatureComparisonTable() {
	const { planData } = usePlanData();

	// Collect all unique features across all plans
	const allFeatures = Array.from(
		new Set(
			planIds.flatMap(
				(planId) =>
					planData[planId]?.features?.map((feature) =>
						typeof feature === "string" ? feature : String(feature),
					) ?? [],
			),
		),
	);

	return (
		<div className="mt-12">
			<h2 className="mb-6 text-center font-bold text-2xl md:text-3xl">
				Compare plan features
			</h2>
			<p className="mx-auto mb-8 max-w-2xl text-center text-foreground/60">
				See exactly what’s included in each plan so you can choose the
				right fit.
			</p>

			<div className="overflow-x-auto rounded-2xl border bg-background">
				{/* Header row */}
				<div className="grid grid-cols-4 gap-0 border-b">
					<div className="p-4 font-semibold text-sm uppercase tracking-wider text-foreground/70">
						Feature
					</div>
					{planIds.map((planId) => (
						<div key={planId} className="p-4 text-center">
							<div className="font-bold text-lg">
								{planData[planId]?.title}
							</div>
							<div className="text-foreground/60 text-sm">
								{planData[planId]?.description}
							</div>
						</div>
					))}
				</div>

				{/* Feature rows */}
				{allFeatures.map((feature) => (
					<div
						key={feature}
						className="grid grid-cols-4 gap-0 border-b last:border-b-0"
					>
						<div className="p-4 font-medium text-sm">{feature}</div>
						{planIds.map((planId) => {
							const includes = planData[planId]?.features?.some(
								(f) =>
									typeof f === "string"
										? f === feature
										: String(f) === feature,
							);
							return (
								<div key={planId} className="p-4 text-center">
									{includes ? (
										<Check className="mx-auto size-5 text-green-600" />
									) : (
										<Minus className="mx-auto size-5 text-foreground/30" />
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
