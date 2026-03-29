"use client";

import { type Config, config } from "@repo/config";
import { usePlanData } from "@saas/payments/hooks/plan-data";
import type { PlanId } from "@saas/payments/types";
import { useLocaleCurrency } from "@shared/hooks/locale-currency";
import { useRouter } from "@shared/hooks/router";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/tabs";
import { cn } from "@ui/lib";
import {
	ArrowRightIcon,
	BadgePercentIcon,
	CheckIcon,
	CoinsIcon,
	PhoneIcon,
	StarIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

const plans = config.payments.plans as Config["payments"]["plans"];

export function PricingTable({
	className,
	userId,
	organizationId,
	activePlanId,
}: {
	className?: string;
	userId?: string;
	organizationId?: string;
	activePlanId?: string;
}) {
	const router = useRouter();
	const localeCurrency = useLocaleCurrency();
	const [loading, setLoading] = useState<PlanId | false>(false);
	const [interval, setInterval] = useState<"month" | "year">("month");

	const { planData } = usePlanData();

	const createCheckoutLinkMutation = useMutation(
		orpc.payments.createCheckoutLink.mutationOptions(),
	);

	const onSelectPlan = async (planId: PlanId, productId?: string) => {
		if (!(userId || organizationId)) {
			router.push("/auth/signup");
			return;
		}

		const plan = plans[planId];
		const price = plan.prices?.find(
			(price) => price.productId === productId,
		);

		if (!price) {
			return;
		}

		setLoading(planId);

		try {
			const { checkoutLink } =
				await createCheckoutLinkMutation.mutateAsync({
					type:
						price.type === "one-time" ? "one-time" : "subscription",
					productId: price.productId,
					organizationId,
					redirectUrl: window.location.href,
				});

			window.location.href = checkoutLink;
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const filteredPlans = Object.entries(plans).filter(
		([planId]) =>
			planId !== activePlanId && (!activePlanId || planId !== "free"),
	);

	const hasSubscriptions = filteredPlans.some(([_, plan]) =>
		plan.prices?.some((price) => price.type === "recurring"),
	);

	const formatMonth = (count: number) =>
		count === 1 ? "month" : `${count} months`;
	const formatYear = (count: number) =>
		count === 1 ? "year" : `${count} years`;
	const formatTrialDays = (days: number) =>
		`${days} ${days === 1 ? "day" : "days"} free trial`;

	/** Calculate annual savings % for a given plan (returns null if no both intervals exist) */
	const getAnnualSavingsPct = (planId: string): number | null => {
		const plan = plans[planId as keyof typeof plans];
		const prices = plan?.prices;
		if (!prices) return null;
		const monthly = prices.find(
			(p) =>
				p.type === "recurring" && p.interval === "month" && !p.hidden,
		);
		const yearly = prices.find(
			(p) => p.type === "recurring" && p.interval === "year" && !p.hidden,
		);
		if (!monthly || !yearly || monthly.amount === 0) return null;
		const annualizedMonthly = monthly.amount * 12;
		const savings = Math.round(
			((annualizedMonthly - yearly.amount) / annualizedMonthly) * 100,
		);
		return savings > 0 ? savings : null;
	};

	const maxAnnualSavingsPct = Object.keys(plans).reduce<number>(
		(max, planId) => {
			const pct = getAnnualSavingsPct(planId);
			return pct !== null && pct > max ? pct : max;
		},
		0,
	);

	return (
		<div className={cn("@container", className)}>
			{hasSubscriptions && (
				<div className="mb-6 flex @xl:justify-center">
					<Tabs
						value={interval}
						onValueChange={(value) =>
							setInterval(value as typeof interval)
						}
						data-test="price-table-interval-tabs"
					>
						<TabsList className="border-foreground/10">
							<TabsTrigger value="month">Monthly</TabsTrigger>
							<TabsTrigger value="year" className="relative">
								Yearly
								{maxAnnualSavingsPct > 0 && (
									<span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 font-semibold text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
										Save {maxAnnualSavingsPct}%
									</span>
								)}
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			)}
			<div
				className={cn("grid grid-cols-1 gap-4", {
					"@xl:grid-cols-2": filteredPlans.length >= 2,
					"@3xl:grid-cols-3": filteredPlans.length >= 3,
					"@4xl:grid-cols-4": filteredPlans.length >= 4,
				})}
			>
				{filteredPlans
					.filter(([planId]) => planId !== activePlanId)
					.map(([planId, plan]) => {
						const {
							isFree,
							isEnterprise,
							prices,
							recommended,
							credits,
						} = plan;
						const { title, description, features } =
							planData[planId as keyof typeof planData];

						let price = prices?.find(
							(price) =>
								!price.hidden &&
								(price.type === "one-time" ||
									price.interval === interval) &&
								price.currency === localeCurrency,
						);

						if (isFree) {
							price = {
								amount: 0,
								currency: localeCurrency,
								interval,
								productId: "",
								type: "recurring",
							};
						}

						if (!(price || isEnterprise)) {
							return null;
						}

						return (
							<div
								key={planId}
								className={cn("rounded-3xl border p-6", {
									"border-2 border-primary": recommended,
								})}
								data-test="price-table-plan"
							>
								<div className="flex h-full flex-col justify-between gap-4">
									<div>
										{recommended && (
											<div className="-mt-9 flex justify-center">
												<div className="mb-2 flex h-6 w-auto items-center gap-1.5 rounded-full bg-primary px-2 py-1 font-semibold text-primary-foreground text-xs">
													<StarIcon className="size-3" />
													Recommended
												</div>
											</div>
										)}
										<h3
											className={cn(
												"my-0 font-semibold text-2xl",
												{
													"font-bold text-primary":
														recommended,
												},
											)}
										>
											{title}
										</h3>
										{description && (
											<div className="prose mt-2 text-foreground/60 text-sm">
												{description}
											</div>
										)}

										{credits?.included !== undefined &&
											credits.included > 0 && (
												<div className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
													<CoinsIcon className="size-4" />
													<span>
														{credits.included}{" "}
														credits/month included
													</span>
												</div>
											)}

										{!!features?.length && (
											<ul className="mt-4 grid list-none gap-2 text-sm">
												{features.map(
													(feature, key) => (
														<li
															key={key}
															className="flex items-center justify-start"
														>
															<CheckIcon className="mr-2 size-4 text-primary" />
															<span>
																{feature}
															</span>
														</li>
													),
												)}
											</ul>
										)}

										{price &&
											"trialPeriodDays" in price &&
											price.trialPeriodDays && (
												<div className="mt-4 flex items-center justify-start font-medium text-primary text-sm opacity-80">
													<BadgePercentIcon className="mr-2 size-4" />
													{formatTrialDays(
														price.trialPeriodDays,
													)}
												</div>
											)}
									</div>

									<div>
										{price && (
											<strong
												className="block font-medium text-2xl lg:text-3xl"
												data-test="price-table-plan-price"
											>
												{new Intl.NumberFormat("en", {
													style: "currency",
													currency: price.currency,
												}).format(price.amount)}
												{"interval" in price && (
													<span className="font-normal text-xs opacity-60">
														{" / "}
														{interval === "month"
															? formatMonth(
																	price.intervalCount ??
																		1,
																)
															: formatYear(
																	price.intervalCount ??
																		1,
																)}
													</span>
												)}
											</strong>
										)}
										{interval === "year" &&
											!isFree &&
											!isEnterprise &&
											(() => {
												const savingsPct =
													getAnnualSavingsPct(planId);
												if (!savingsPct) return null;
												const monthlyPrice = plans[
													planId as keyof typeof plans
												]?.prices?.find(
													(p) =>
														p.type ===
															"recurring" &&
														p.interval ===
															"month" &&
														!p.hidden,
												);
												if (!monthlyPrice) return null;
												const savedAmount =
													monthlyPrice.amount * 12 -
													(price?.amount ?? 0);
												return (
													<p className="mt-1 text-green-600 text-xs dark:text-green-400">
														You save{" "}
														{new Intl.NumberFormat(
															"en",
															{
																style: "currency",
																currency:
																	monthlyPrice.currency,
																maximumFractionDigits: 0,
															},
														).format(savedAmount)}
														/year ({savingsPct}%
														off)
													</p>
												);
											})()}

										{isEnterprise ? (
											<Button
												className="mt-4 w-full"
												variant="light"
												asChild
											>
												<Link href="/contact">
													<PhoneIcon className="mr-2 size-4" />
													Contact sales
												</Link>
											</Button>
										) : (
											<Button
												className="mt-4 w-full"
												variant={
													recommended
														? "primary"
														: "secondary"
												}
												onClick={() =>
													onSelectPlan(
														planId as PlanId,
														price?.productId,
													)
												}
												loading={loading === planId}
											>
												{userId || organizationId
													? "Choose plan"
													: "Get started"}
												<ArrowRightIcon className="ml-2 size-4" />
											</Button>
										)}
									</div>
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
}
