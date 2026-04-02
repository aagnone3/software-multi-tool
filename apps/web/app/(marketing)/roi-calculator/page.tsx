"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { getBaseUrl } from "@repo/utils";
import {
	BriefcaseIcon,
	CalendarIcon,
	type ClockIcon,
	DollarSignIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useState } from "react";

const siteUrl = getBaseUrl();

interface UseCase {
	id: string;
	label: string;
	icon: typeof ClockIcon;
	hoursPerMonth: number;
	description: string;
}

const useCases: UseCase[] = [
	{
		id: "meetings",
		label: "Meeting summaries",
		icon: CalendarIcon,
		hoursPerMonth: 8,
		description: "Manual note-taking and meeting recap writing",
	},
	{
		id: "invoices",
		label: "Invoice processing",
		icon: DollarSignIcon,
		hoursPerMonth: 6,
		description: "Manually extracting data from invoices and receipts",
	},
	{
		id: "contracts",
		label: "Contract review",
		icon: BriefcaseIcon,
		hoursPerMonth: 5,
		description: "Initial contract scanning and clause identification",
	},
	{
		id: "expenses",
		label: "Expense categorization",
		icon: DollarSignIcon,
		hoursPerMonth: 4,
		description: "Sorting and categorizing expense reports",
	},
	{
		id: "feedback",
		label: "Feedback analysis",
		icon: TrendingUpIcon,
		hoursPerMonth: 3,
		description: "Reading and summarizing customer feedback",
	},
];

export default function RoiCalculatorPage() {
	const [hourlyRate, setHourlyRate] = useState(75);
	const [selectedUseCases, setSelectedUseCases] = useState<Set<string>>(
		new Set(["meetings", "invoices"]),
	);
	const [teamSize, setTeamSize] = useState(3);
	const { track } = useProductAnalytics();

	const toggleUseCase = useCallback(
		(id: string) => {
			setSelectedUseCases((prev) => {
				const next = new Set(prev);
				const nowSelected = !next.has(id);
				if (nowSelected) {
					next.add(id);
				} else {
					next.delete(id);
				}
				track({
					name: "roi_calculator_use_case_toggled",
					props: {
						use_case_id: id,
						selected: nowSelected,
						total_selected: next.size,
					},
				});
				return next;
			});
		},
		[track],
	);

	const selectedCases = useCases.filter((uc) => selectedUseCases.has(uc.id));
	const totalHoursPerMonth = selectedCases.reduce(
		(sum, uc) => sum + uc.hoursPerMonth,
		0,
	);
	// AI handles ~80% of the work, leaving 20% for review
	const hoursSavedPerPerson = totalHoursPerMonth * 0.8;
	const totalHoursSaved = hoursSavedPerPerson * teamSize;
	const monthlySavings = totalHoursSaved * hourlyRate;
	const annualSavings = monthlySavings * 12;

	// Rough platform cost (Pro plan is ~$49/month, Team seats $29/user)
	const platformCost =
		teamSize <= 1 ? 29 : 49 + Math.max(0, teamSize - 1) * 29;
	const netAnnualSavings = annualSavings - platformCost * 12;
	const roi =
		platformCost > 0 ? (netAnnualSavings / (platformCost * 12)) * 100 : 0;

	return (
		<div className="min-h-screen bg-background">
			{/* Hero */}
			<section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
				<div className="container max-w-4xl text-center">
					<p className="mb-3 font-semibold text-primary text-sm uppercase tracking-wider">
						ROI Calculator
					</p>
					<h1 className="font-bold text-4xl md:text-5xl">
						How much time are you leaving on the table?
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-foreground/70 text-lg">
						See exactly how much time and money your team could save
						by automating repetitive document and analysis tasks
						with AI.
					</p>
				</div>
			</section>

			{/* Calculator */}
			<section className="py-12 md:py-16">
				<div className="container max-w-5xl">
					<div className="grid gap-8 lg:grid-cols-2">
						{/* Inputs */}
						<div className="space-y-8">
							{/* Team Size */}
							<div className="rounded-xl border border-border bg-card p-6">
								<h2 className="mb-4 font-semibold text-lg">
									Your team
								</h2>
								<div className="space-y-4">
									<div>
										<label
											htmlFor="team-size"
											className="mb-2 block text-foreground/70 text-sm"
										>
											Number of people doing manual work
										</label>
										<div className="flex items-center gap-4">
											<input
												id="team-size"
												type="range"
												min={1}
												max={20}
												value={teamSize}
												onChange={(e) =>
													setTeamSize(
														Number(e.target.value),
													)
												}
												className="h-2 flex-1 cursor-pointer accent-primary"
											/>
											<span className="w-16 rounded-lg border border-border bg-muted px-3 py-1 text-center font-semibold">
												{teamSize}
											</span>
										</div>
									</div>
									<div>
										<label
											htmlFor="hourly-rate"
											className="mb-2 block text-foreground/70 text-sm"
										>
											Average hourly rate (USD)
										</label>
										<div className="flex items-center gap-4">
											<input
												id="hourly-rate"
												type="range"
												min={25}
												max={250}
												step={5}
												value={hourlyRate}
												onChange={(e) =>
													setHourlyRate(
														Number(e.target.value),
													)
												}
												className="h-2 flex-1 cursor-pointer accent-primary"
											/>
											<span className="w-16 rounded-lg border border-border bg-muted px-3 py-1 text-center font-semibold">
												${hourlyRate}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Use Cases */}
							<div className="rounded-xl border border-border bg-card p-6">
								<h2 className="mb-2 font-semibold text-lg">
									Which tasks do you do manually?
								</h2>
								<p className="mb-4 text-foreground/60 text-sm">
									Select all that apply. Estimates based on
									industry averages for small teams.
								</p>
								<div className="space-y-3">
									{useCases.map((uc) => {
										const isSelected = selectedUseCases.has(
											uc.id,
										);
										return (
											<button
												key={uc.id}
												type="button"
												onClick={() =>
													toggleUseCase(uc.id)
												}
												className={`w-full rounded-lg border p-4 text-left transition-colors ${
													isSelected
														? "border-primary bg-primary/5"
														: "border-border hover:border-primary/50"
												}`}
											>
												<div className="flex items-start justify-between gap-3">
													<div className="flex items-start gap-3">
														<uc.icon
															className={`mt-0.5 size-5 shrink-0 ${isSelected ? "text-primary" : "text-foreground/40"}`}
														/>
														<div>
															<p
																className={`font-medium text-sm ${isSelected ? "text-foreground" : "text-foreground/70"}`}
															>
																{uc.label}
															</p>
															<p className="text-foreground/50 text-xs">
																{uc.description}
															</p>
														</div>
													</div>
													<div className="shrink-0 text-right">
														<span
															className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground/40"}`}
														>
															~{uc.hoursPerMonth}
															h/mo
														</span>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{/* Results */}
						<div className="space-y-6">
							<div className="sticky top-8 space-y-4">
								{/* Summary Card */}
								<div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
									<h2 className="mb-6 font-bold text-xl">
										Your estimated savings
									</h2>

									<div className="space-y-4">
										<div className="flex items-center justify-between border-border/50 border-b pb-4">
											<div>
												<p className="font-medium text-sm">
													Hours saved / month
												</p>
												<p className="text-foreground/60 text-xs">
													Per team member
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold text-2xl text-primary">
													{totalHoursSaved.toFixed(0)}
													h
												</p>
												<p className="text-foreground/60 text-xs">
													{hoursSavedPerPerson.toFixed(
														1,
													)}
													h × {teamSize} people
												</p>
											</div>
										</div>

										<div className="flex items-center justify-between border-border/50 border-b pb-4">
											<div>
												<p className="font-medium text-sm">
													Monthly value recovered
												</p>
												<p className="text-foreground/60 text-xs">
													At ${hourlyRate}/hr
												</p>
											</div>
											<p className="font-bold text-2xl text-primary">
												$
												{monthlySavings.toLocaleString(
													"en-US",
													{
														maximumFractionDigits: 0,
													},
												)}
											</p>
										</div>

										<div className="flex items-center justify-between border-border/50 border-b pb-4">
											<div>
												<p className="font-medium text-sm">
													Annual value recovered
												</p>
											</div>
											<p className="font-bold text-3xl text-green-600 dark:text-green-400">
												$
												{annualSavings.toLocaleString(
													"en-US",
													{
														maximumFractionDigits: 0,
													},
												)}
											</p>
										</div>

										<div className="flex items-center justify-between border-border/50 border-b pb-4">
											<div>
												<p className="font-medium text-sm">
													Platform cost
												</p>
												<p className="text-foreground/60 text-xs">
													~${platformCost}/month
												</p>
											</div>
											<p className="text-foreground/60 text-sm">
												$
												{(
													platformCost * 12
												).toLocaleString("en-US")}
												/yr
											</p>
										</div>

										<div className="flex items-center justify-between">
											<div>
												<p className="font-bold text-sm">
													Net annual ROI
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold text-2xl text-green-600 dark:text-green-400">
													{roi.toFixed(0)}%
												</p>
												<p className="text-foreground/50 text-xs">
													$
													{netAnnualSavings.toLocaleString(
														"en-US",
														{
															maximumFractionDigits: 0,
														},
													)}{" "}
													net
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* CTA */}
								<div className="rounded-xl border border-border bg-card p-6 text-center">
									<p className="mb-1 font-semibold text-lg">
										Ready to reclaim those hours?
									</p>
									<p className="mb-4 text-foreground/60 text-sm">
										Start free — no credit card required.
									</p>
									<Link
										href="/auth/signup"
										className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
										onClick={() =>
											track({
												name: "roi_calculator_cta_clicked",
												props: {
													use_cases:
														Array.from(
															selectedUseCases,
														),
													team_size: teamSize,
													hourly_rate: hourlyRate,
													roi_pct: Math.round(roi),
													annual_savings:
														Math.round(
															annualSavings,
														),
												},
											})
										}
									>
										Start saving time today
									</Link>
									<p className="mt-3 text-foreground/40 text-xs">
										Includes free credits to try every tool
									</p>
								</div>

								{/* Assumptions */}
								<div className="rounded-xl bg-muted/50 p-4 text-xs text-foreground/50">
									<p className="mb-1 font-medium">
										Assumptions
									</p>
									<ul className="space-y-1">
										<li>
											• AI reduces manual time by ~80% on
											selected tasks
										</li>
										<li>
											• Monthly hours based on industry
											averages for small teams
										</li>
										<li>
											• Platform pricing is illustrative;
											see{" "}
											<Link
												href="/pricing"
												className="underline"
											>
												pricing page
											</Link>{" "}
											for current rates
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Social proof under calculator */}
			<section className="border-t border-border py-12">
				<div className="container max-w-4xl text-center">
					<p className="mb-8 text-foreground/60 text-sm uppercase tracking-wider">
						What customers say about their savings
					</p>
					<div className="grid gap-6 sm:grid-cols-3">
						{[
							{
								quote: "I reclaimed 10 hours per month just on invoices. It paid for itself in the first week.",
								name: "Marcus R.",
								role: "Freelance Accountant",
							},
							{
								quote: "Our team saves 2 hours per meeting on note-taking. That's 8+ hours a week back.",
								name: "Sarah C.",
								role: "Operations Manager",
							},
							{
								quote: "Contract review that used to take a day now takes 20 minutes for the initial pass.",
								name: "David K.",
								role: "Legal Assistant",
							},
						].map((t) => (
							<blockquote
								key={t.name}
								className="rounded-xl border border-border bg-card p-5 text-left"
							>
								<p className="mb-4 text-foreground/80 text-sm leading-relaxed">
									"{t.quote}"
								</p>
								<footer>
									<p className="font-semibold text-sm">
										{t.name}
									</p>
									<p className="text-foreground/50 text-xs">
										{t.role}
									</p>
								</footer>
							</blockquote>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
