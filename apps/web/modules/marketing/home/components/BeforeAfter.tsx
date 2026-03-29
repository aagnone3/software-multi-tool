"use client";

import { CheckIcon, XIcon } from "lucide-react";
import React from "react";

const comparisons = [
	{
		task: "Summarize a 1-hour meeting",
		before: "45–60 min manually reviewing notes",
		after: "Under 30 seconds",
	},
	{
		task: "Process 20 invoices",
		before: "2–3 hours of manual data entry",
		after: "Under 5 minutes",
	},
	{
		task: "Review a contract for risks",
		before: "1–2 hours + lawyer fees",
		after: "Under 60 seconds",
	},
	{
		task: "Categorize a month of expenses",
		before: "1–2 hours with a spreadsheet",
		after: "Under 2 minutes",
	},
];

export function BeforeAfter() {
	return (
		<section className="py-12 lg:py-16">
			<div className="container max-w-4xl">
				<div className="mb-8 text-center">
					<p className="mb-2 font-semibold text-primary text-sm uppercase tracking-wider">
						The difference
					</p>
					<h2 className="font-bold text-4xl lg:text-5xl">
						Hours of work,{" "}
						<span className="text-primary">done in seconds</span>
					</h2>
					<p className="mx-auto mt-3 max-w-xl text-foreground/60 text-lg">
						See exactly how much time AI tools save on your most
						repetitive business tasks.
					</p>
				</div>

				<div className="overflow-hidden rounded-xl border border-border">
					{/* Header row */}
					<div className="grid grid-cols-3 bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground/70">
						<div>Task</div>
						<div className="flex items-center gap-1.5">
							<XIcon className="size-4 text-destructive" />
							Without AI
						</div>
						<div className="flex items-center gap-1.5">
							<CheckIcon className="size-4 text-primary" />
							With AI
						</div>
					</div>

					{/* Data rows */}
					{comparisons.map((row, i) => (
						<div
							key={row.task}
							className={`grid grid-cols-3 gap-4 px-4 py-4 text-sm ${
								i < comparisons.length - 1
									? "border-b border-border"
									: ""
							}`}
						>
							<div className="font-medium">{row.task}</div>
							<div className="text-foreground/60 line-through">
								{row.before}
							</div>
							<div className="font-semibold text-primary">
								{row.after}
							</div>
						</div>
					))}
				</div>

				<p className="mt-6 text-center text-foreground/50 text-sm">
					Based on typical small business workflows. Results may vary
					by document complexity.
				</p>
			</div>
		</section>
	);
}
