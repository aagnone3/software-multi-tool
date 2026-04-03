"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import {
	ArrowRightIcon,
	CalendarClockIcon,
	CheckCircleIcon,
	CheckIcon,
	CopyIcon,
	LayersIcon,
	RocketIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect } from "react";

const PRO_EXCLUSIVE = [
	{
		icon: CalendarClockIcon,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		title: "Scheduler",
		desc: "Schedule tool runs to execute automatically on your timetable — daily, weekly, or custom intervals.",
		cta: { label: "Try Scheduler", href: "/app/tools" },
	},
	{
		icon: LayersIcon,
		color: "text-violet-500",
		bg: "bg-violet-500/10",
		title: "Bulk Actions",
		desc: "Process multiple files or inputs in a single run. No more repeating the same steps one by one.",
		cta: { label: "Run Bulk", href: "/app/tools" },
	},
	{
		icon: CopyIcon,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
		title: "Input Templates",
		desc: "Save your most-used configurations as templates and launch jobs in one click.",
		cta: { label: "Create Template", href: "/app/tools" },
	},
];

const INCLUDED = [
	"500 credits/month with rollover",
	"Priority processing — faster queues",
	"All tools unlocked",
	"Pro-only exports and dashboard widgets",
];

const NEXT_STEPS = [
	{
		step: 1,
		label: "Run a tool",
		desc: "Pick any tool and submit a job to use your new Pro credits.",
		href: "/app/tools",
	},
	{
		step: 2,
		label: "Schedule a recurring run",
		desc: "Set a tool to run on autopilot — great for weekly reports or recurring analysis.",
		href: "/app/tools",
	},
	{
		step: 3,
		label: "Save a template",
		desc: "Configure a job once, save it as a template, and reuse it in seconds.",
		href: "/app/tools",
	},
];

export function PostUpgradeWelcome() {
	const { enabledTools } = useTools();
	const { track } = useProductAnalytics();
	const firstTool = enabledTools[0];
	const firstToolHref = firstTool
		? `/app/tools/${firstTool.slug}`
		: "/app/tools";

	useEffect(() => {
		track({ name: "post_upgrade_welcome_viewed", props: {} });
	}, [track]);

	const handleFeatureCta = useCallback(
		(feature: string, href: string) => {
			track({
				name: "post_upgrade_feature_cta_clicked",
				props: { feature, href },
			});
		},
		[track],
	);

	const handleNextStep = useCallback(
		(step: number, label: string) => {
			track({
				name: "post_upgrade_next_step_clicked",
				props: { step, label },
			});
		},
		[track],
	);

	const handlePrimaryCta = useCallback(() => {
		track({
			name: "post_upgrade_primary_cta_clicked",
			props: { tool_slug: firstTool?.slug ?? "" },
		});
	}, [track, firstTool]);

	const handleSecondaryCta = useCallback(() => {
		track({ name: "post_upgrade_secondary_cta_clicked", props: {} });
	}, [track]);

	return (
		<main className="container flex min-h-[80vh] flex-col items-center py-20 text-center">
			{/* Header */}
			<div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
				<CheckCircleIcon className="size-10 text-primary" />
			</div>

			<h1 className="font-bold text-3xl md:text-4xl">
				You're now on Pro 🎉
			</h1>
			<p className="mx-auto mt-3 max-w-md text-foreground/70 text-lg">
				Everything is ready. Here's what you unlocked and how to get the
				most out of it.
			</p>

			{/* What's included */}
			<div className="mt-10 w-full max-w-lg rounded-xl border bg-background p-6 text-left">
				<h2 className="mb-4 font-semibold text-base">
					What's included with Pro
				</h2>
				<ul className="space-y-2">
					{INCLUDED.map((item) => (
						<li
							key={item}
							className="flex items-center gap-2 text-sm"
						>
							<CheckIcon className="size-4 shrink-0 text-primary" />
							{item}
						</li>
					))}
				</ul>
			</div>

			{/* Pro-exclusive features */}
			<div className="mt-10 w-full max-w-3xl">
				<h2 className="mb-6 font-semibold text-base">
					Pro-exclusive features — try them now
				</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					{PRO_EXCLUSIVE.map(
						({ icon: Icon, color, bg, title, desc, cta }) => (
							<div
								key={title}
								className="flex flex-col items-center gap-3 rounded-xl border bg-background p-5 text-center"
							>
								<div
									className={`flex size-10 items-center justify-center rounded-full ${bg}`}
								>
									<Icon className={`size-5 ${color}`} />
								</div>
								<p className="font-semibold text-sm">{title}</p>
								<p className="text-foreground/60 text-xs leading-relaxed">
									{desc}
								</p>
								<Button
									asChild
									size="sm"
									variant="outline"
									className="mt-auto w-full"
									onClick={() =>
										handleFeatureCta(title, cta.href)
									}
								>
									<Link href={cta.href}>{cta.label}</Link>
								</Button>
							</div>
						),
					)}
				</div>
			</div>

			{/* Next steps checklist */}
			<div className="mt-10 w-full max-w-lg rounded-xl border bg-background p-6 text-left">
				<h2 className="mb-4 font-semibold text-base">
					Suggested first steps
				</h2>
				<ol className="space-y-4">
					{NEXT_STEPS.map(({ step, label, desc, href }) => (
						<li key={step} className="flex items-start gap-3">
							<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
								{step}
							</div>
							<div className="flex flex-col gap-0.5">
								<Link
									href={href}
									className="font-semibold text-sm hover:underline"
									onClick={() => handleNextStep(step, label)}
								>
									{label}
								</Link>
								<p className="text-foreground/60 text-xs">
									{desc}
								</p>
							</div>
						</li>
					))}
				</ol>
			</div>

			{/* Primary CTA */}
			<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
				<Button asChild size="lg" onClick={handlePrimaryCta}>
					<Link href={firstToolHref}>
						<RocketIcon className="mr-2 size-4" />
						Run your first Pro tool
					</Link>
				</Button>
				<Button
					asChild
					size="lg"
					variant="outline"
					onClick={handleSecondaryCta}
				>
					<Link href="/app/tools">
						Browse all tools
						<ArrowRightIcon className="ml-2 size-4" />
					</Link>
				</Button>
			</div>

			<p className="mt-8 text-foreground/50 text-xs">
				Questions?{" "}
				<Link
					href="/app/settings/billing"
					className="underline hover:text-foreground"
				>
					Manage billing
				</Link>
				.
			</p>
		</main>
	);
}
